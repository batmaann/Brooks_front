<script setup lang="ts">
import { Building2, Tag } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { getMonthlyBankSummary, getMonthlyCategorySummary } from '@/services/transactionService'
import { useFormatters } from '@/composables/useFormatters'
import type {
  MonthlyBankBreakdown,
  MonthlyBankBreakdownItem,
  MonthlyCategoryBreakdown,
  MonthlyCategoryBreakdownItem,
} from '@/types/finance'

type BreakdownItem = MonthlyCategoryBreakdownItem | MonthlyBankBreakdownItem
type ExpenseSlice = {
  name: string
  amount: number
  count: number
  percent: number
  color: string
}

type ChartMetric = 'income' | 'expense' | 'saving'
type ChartGrouping = 'category' | 'bank'

const chartMetricOptions: { id: ChartMetric, label: string }[] = [
  { id: 'expense', label: 'Траты' },
  { id: 'income', label: 'Доходы' },
  { id: 'saving', label: 'Накопления' },
]
const chartMetricLabels: Record<ChartMetric, { genitive: string, empty: string }> = {
  expense: { genitive: 'трат', empty: 'трат' },
  income: { genitive: 'доходов', empty: 'доходов' },
  saving: { genitive: 'накоплений', empty: 'накоплений' },
}
const chartPalettes: Record<ChartMetric, string[]> = {
  expense: ['#ff515b', '#ff7b22', '#f4b713', '#e7468f', '#9850e8', '#438cf4'],
  income: ['#24c974', '#38b98b', '#42a96c', '#7bbf42', '#38a6c8', '#438cf4'],
  saving: ['#438cf4', '#5b70e8', '#7860e8', '#9850e8', '#38a6c8', '#42b8a5'],
}

const props = defineProps<{ initialMetric: ChartMetric, month: Date, refreshKey: number }>()
const { currency } = useFormatters()
const chartMode = ref<'donut' | 'radar' | 'bar'>('donut')
const chartMetric = ref<ChartMetric>(props.initialMetric)
const chartGrouping = ref<ChartGrouping>('category')
const hoveredDonutSlice = ref<ExpenseSlice | null>(null)
const categoryData = ref<MonthlyCategoryBreakdown | null>(null)
const bankData = ref<MonthlyBankBreakdown | null>(null)
const loading = ref(false)
const error = ref('')

const monthLabel = computed(() => new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
}).format(props.month).replace(/^./, (letter) => letter.toUpperCase()))

function itemName(item: BreakdownItem) {
  return 'category_name' in item ? item.category_name : item.bank_label_name
}

function itemKey(item: BreakdownItem) {
  const id = 'category_id' in item ? item.category_id : item.bank_label_id
  return `${id ?? 'none'}:${itemName(item)}`
}

function total(item: BreakdownItem) {
  return Number(item.income.amount) - Number(item.expense.amount) - Number(item.saving.amount)
}

function count(item: BreakdownItem) {
  return item.income.count + item.expense.count + item.saving.count
}

function sorted<T extends BreakdownItem>(items: T[]): T[] {
  return [...items].sort((first, second) => Math.abs(total(second)) - Math.abs(total(first)))
}

const categories = computed(() => sorted(categoryData.value?.categories ?? []))
const banks = computed(() => sorted(bankData.value?.banks ?? []))
const categoryMaximum = computed(() => Math.max(1, ...categories.value.map((item) => Math.abs(total(item)))))
const bankMaximum = computed(() => Math.max(1, ...banks.value.map((item) => Math.abs(total(item)))))
const chartItems = computed<BreakdownItem[]>(() => chartGrouping.value === 'category' ? categories.value : banks.value)
const expenseTotal = computed(() => chartItems.value.reduce(
  (sum, item) => sum + Number(item[chartMetric.value].amount),
  0,
))
const expenseSlices = computed<ExpenseSlice[]>(() => {
  const items = chartItems.value
    .map((item) => ({
      name: itemName(item),
      amount: Number(item[chartMetric.value].amount),
      count: item[chartMetric.value].count,
    }))
    .filter((item) => item.amount > 0)
    .sort((first, second) => second.amount - first.amount)

  const visible = items.length <= 6
    ? items
    : [
        ...items.slice(0, 5),
        items.slice(5).reduce(
          (other, item) => ({
            name: 'Остальное',
            amount: other.amount + item.amount,
            count: other.count + item.count,
          }),
          { name: 'Остальное', amount: 0, count: 0 },
        ),
      ]

  return visible.map((item, index) => ({
    ...item,
    percent: expenseTotal.value ? item.amount / expenseTotal.value * 100 : 0,
    color: chartPalettes[chartMetric.value][index] ?? chartPalettes[chartMetric.value][0] ?? '#9951e8',
  }))
})
const interactiveDonutSlices = computed(() => {
  let start = 0
  return expenseSlices.value.map((slice) => {
    const result = { ...slice, offset: -start }
    start += slice.percent
    return result
  })
})
const radarCenter = 150
const radarRadius = 88
const radarLabelRadius = 118
const radarMaximum = computed(() => Math.max(1, ...expenseSlices.value.map((slice) => slice.amount)))

function radarPoint(index: number, radius: number) {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / expenseSlices.value.length
  return {
    x: radarCenter + Math.cos(angle) * radius,
    y: radarCenter + Math.sin(angle) * radius,
  }
}

function radarPoints(radius: number) {
  return expenseSlices.value
    .map((_, index) => {
      const point = radarPoint(index, radius)
      return `${point.x},${point.y}`
    })
    .join(' ')
}

function barHeight(slice: ExpenseSlice) {
  return `${Math.max(4, slice.amount / radarMaximum.value * 100)}%`
}

const radarValuePoints = computed(() => expenseSlices.value
  .map((slice, index) => {
    const point = radarPoint(index, radarRadius * slice.amount / radarMaximum.value)
    return `${point.x},${point.y}`
  })
  .join(' '))

const radarAxes = computed(() => expenseSlices.value.map((slice, index) => {
  const outer = radarPoint(index, radarRadius)
  const label = radarPoint(index, radarLabelRadius)
  const anchor = Math.abs(label.x - radarCenter) < 8 ? 'middle' : label.x < radarCenter ? 'end' : 'start'
  return { slice, outer, label, anchor }
}))

function barWidth(item: BreakdownItem, maximum: number) {
  return `${Math.max(4, Math.abs(total(item)) / maximum * 100)}%`
}

async function load() {
  loading.value = true
  error.value = ''
  const year = props.month.getFullYear()
  const month = props.month.getMonth() + 1
  try {
    const [categoriesResponse, banksResponse] = await Promise.all([
      getMonthlyCategorySummary(year, month),
      getMonthlyBankSummary(year, month),
    ])
    categoryData.value = categoriesResponse
    bankData.value = banksResponse
  } catch (requestError) {
    categoryData.value = null
    bankData.value = null
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось загрузить статистику'
  } finally {
    loading.value = false
  }
}

watch(() => [props.month, props.refreshKey], load, { immediate: true })
watch(expenseSlices, (slices) => {
  if (slices.length < 3 && chartMode.value === 'radar') chartMode.value = 'donut'
})
watch([chartMetric, chartGrouping], () => {
  hoveredDonutSlice.value = null
})
</script>

<template>
  <section class="statistics-view">
    <div v-if="error" class="statistics-message error">{{ error }}</div>
    <div v-else-if="loading" class="statistics-message">Загружаем статистику…</div>
    <template v-else>
      <article class="expense-chart-card">
        <div class="expense-chart-copy">
          <div class="expense-chart-heading">
            <div class="expense-chart-switch" role="group" aria-label="Вид диаграммы">
              <button type="button" :class="{ active: chartMode === 'donut' }" @click="chartMode = 'donut'">Кольцевая</button>
              <button type="button" :class="{ active: chartMode === 'radar' }" :disabled="expenseSlices.length < 3" :title="expenseSlices.length < 3 ? 'Нужно не меньше трёх групп' : ''" @click="chartMode = 'radar'">Лепестковая</button>
              <button type="button" :class="{ active: chartMode === 'bar' }" @click="chartMode = 'bar'">Столбчатая</button>
            </div>
            <div class="expense-metric-switch" role="group" aria-label="Финансовый показатель">
              <button v-for="option in chartMetricOptions" :key="option.id" type="button" :class="[{ active: chartMetric === option.id }, option.id]" @click="chartMetric = option.id">{{ option.label }}</button>
            </div>
            <div class="expense-grouping-switch" role="group" aria-label="Группировка статистики">
              <button type="button" :class="{ active: chartGrouping === 'category' }" @click="chartGrouping = 'category'">По категориям</button>
              <button type="button" :class="{ active: chartGrouping === 'bank' }" @click="chartGrouping = 'bank'">По банкам</button>
            </div>
          </div>
        </div>
        <div v-if="expenseSlices.length" class="expense-chart-content">
          <div v-if="chartMode === 'donut'" class="expense-donut" role="img" :aria-label="`Кольцевая диаграмма ${chartMetricLabels[chartMetric].genitive} по ${chartGrouping === 'category' ? 'категориям' : 'банкам'}`">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="donut-base" cx="60" cy="60" r="46" pathLength="100" />
              <circle
                v-for="slice in interactiveDonutSlices"
                :key="slice.name"
                class="donut-segment"
                cx="60"
                cy="60"
                r="46"
                pathLength="100"
                :stroke="slice.color"
                :stroke-dasharray="`${slice.percent} ${100 - slice.percent}`"
                :stroke-dashoffset="slice.offset"
                @mouseenter="hoveredDonutSlice = slice"
                @mouseleave="hoveredDonutSlice = null"
              >
                <title>{{ slice.name }}: {{ currency(slice.amount, 'RUB') }} ({{ slice.percent.toFixed(2) }}%)</title>
              </circle>
            </svg>
            <div>
              <strong>{{ currency(hoveredDonutSlice?.amount ?? expenseTotal, 'RUB') }}</strong>
              <span>{{ hoveredDonutSlice?.name ?? `всего ${chartMetricLabels[chartMetric].genitive}` }}</span>
            </div>
          </div>
          <svg v-else-if="chartMode === 'radar'" class="expense-radar" :class="chartMetric" viewBox="0 0 300 300" role="img" :aria-label="`Лепестковая диаграмма ${chartMetricLabels[chartMetric].genitive} по ${chartGrouping === 'category' ? 'категориям' : 'банкам'}`">
            <polygon v-for="level in [0.25, 0.5, 0.75, 1]" :key="level" class="radar-grid" :points="radarPoints(radarRadius * level)" />
            <g v-for="axis in radarAxes" :key="axis.slice.name">
              <line class="radar-axis" :x1="radarCenter" :y1="radarCenter" :x2="axis.outer.x" :y2="axis.outer.y" />
              <text class="radar-label" :x="axis.label.x" :y="axis.label.y" :text-anchor="axis.anchor">{{ axis.slice.name.length > 12 ? `${axis.slice.name.slice(0, 11)}…` : axis.slice.name }}</text>
            </g>
            <polygon class="radar-value" :points="radarValuePoints" />
            <circle v-for="axis in radarAxes" :key="`point-${axis.slice.name}`" class="radar-point" :cx="radarCenter + (axis.outer.x - radarCenter) * axis.slice.amount / radarMaximum" :cy="radarCenter + (axis.outer.y - radarCenter) * axis.slice.amount / radarMaximum" r="4">
              <title>{{ axis.slice.name }}: {{ currency(axis.slice.amount, 'RUB') }}</title>
            </circle>
          </svg>
          <div v-else class="expense-bars" :style="{ gridTemplateColumns: `repeat(${expenseSlices.length}, minmax(28px, 1fr))` }" role="img" :aria-label="`Столбчатая диаграмма ${chartMetricLabels[chartMetric].genitive} по ${chartGrouping === 'category' ? 'категориям' : 'банкам'}`">
            <div v-for="slice in expenseSlices" :key="slice.name" class="expense-bar-column">
              <div class="expense-bar-area">
                <span :style="{ height: barHeight(slice), background: slice.color }" :title="`${slice.name}: ${currency(slice.amount, 'RUB')} (${slice.percent.toFixed(2)}%)`"></span>
              </div>
              <strong :title="slice.name">{{ slice.name }}</strong>
            </div>
          </div>
          <div class="expense-legend">
            <div v-for="slice in expenseSlices" :key="slice.name" class="expense-legend-row" :title="`${slice.name}: ${currency(slice.amount, 'RUB')} (${slice.percent.toFixed(2)}%)`">
              <i :style="{ background: slice.color }"></i>
              <strong>{{ slice.name }}</strong>
              <span>×{{ slice.count }}</span>
              <b>{{ slice.percent.toFixed(2) }}%</b>
              <em>{{ currency(slice.amount, 'RUB') }}</em>
            </div>
          </div>
        </div>
        <div v-else class="expense-chart-empty">В этом месяце {{ chartMetricLabels[chartMetric].empty }} не было</div>
      </article>

      <div class="statistics-grid">
        <article class="statistics-card">
        <h3><Tag :size="20" />По категориям</h3>
        <div v-if="categories.length" class="statistics-list">
          <div v-for="(item, index) in categories" :key="itemKey(item)" class="statistics-row">
            <div class="statistics-row-main">
              <i :class="`tone-${index % 6}`"></i>
              <strong>{{ itemName(item) }}</strong>
              <span>×{{ count(item) }}</span>
              <b :class="{ negative: total(item) < 0 }">{{ currency(total(item), 'RUB') }}</b>
            </div>
            <div class="statistics-track"><span :class="[`tone-${index % 6}`, { negative: total(item) < 0 }]" :style="{ width: barWidth(item, categoryMaximum) }"></span></div>
          </div>
        </div>
        <div v-else class="statistics-empty">За этот месяц нет операций</div>
        </article>

        <article class="statistics-card">
        <h3><Building2 :size="20" />По банкам</h3>
        <div v-if="banks.length" class="statistics-list">
          <div v-for="(item, index) in banks" :key="itemKey(item)" class="statistics-row">
            <div class="statistics-row-main">
              <i :class="`tone-${(index + 2) % 6}`"></i>
              <strong>{{ itemName(item) }}</strong>
              <span>×{{ count(item) }}</span>
              <b :class="{ negative: total(item) < 0 }">{{ currency(total(item), 'RUB') }}</b>
            </div>
            <div class="statistics-track"><span :class="[`tone-${(index + 2) % 6}`, { negative: total(item) < 0 }]" :style="{ width: barWidth(item, bankMaximum) }"></span></div>
          </div>
        </div>
        <div v-else class="statistics-empty">За этот месяц нет операций</div>
        </article>
      </div>
    </template>
  </section>
</template>
