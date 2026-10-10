<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown, Pencil, PiggyBank, Trash2 } from '@lucide/vue'
import { useFormatters } from '@/composables/useFormatters'
import type { Transaction, TransactionType } from '@/types/finance'

const props = defineProps<{
  transactions: Transaction[]
  selectedCount: number
  allVisibleSelected: boolean
  isSelected: (id: number) => boolean
  saving: boolean
  sectionName: (id: number | null) => string
  transactionTitle: (item: Transaction) => string
  transactionSign: (type: TransactionType) => string
  transactionTypeLabels: Record<TransactionType, string>
}>()
const emit = defineEmits<{
  startEdit: [item: Transaction]
  remove: [id: number, label: string]
  toggleSelection: [id: number, checked: boolean]
  toggleAll: [checked: boolean]
  clear: []
}>()
const { currency, formatDate } = useFormatters()
const selectionMode = ref(props.selectedCount > 0)
const expandedId = ref<number | null>(null)
const oldestFirst = ref(false)
const groups = computed(() => {
  const byDate = new Map<string, Transaction[]>()
  for (const item of props.transactions) {
    const items = byDate.get(item.date) ?? []
    items.push(item)
    byDate.set(item.date, items)
  }
  return [...byDate.entries()]
    .sort(([left], [right]) => oldestFirst.value ? left.localeCompare(right) : right.localeCompare(left))
    .map(([date, items]) => ({ date, items }))
})
watch(() => props.selectedCount, count => { if (count) selectionMode.value = true })
watch(() => props.transactions, items => {
  if (!items.some(item => item.id === expandedId.value)) expandedId.value = null
})
function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value
  expandedId.value = null
  if (!selectionMode.value) emit('clear')
}
function dayLabel(date: string) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const localDate = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  const prefix = date === localDate(today) ? 'Сегодня, ' : date === localDate(yesterday) ? 'Вчера, ' : ''
  return prefix + formatDate(date)
}
function title(item: Transaction) {
  return item.category_name_snapshot || item.description || props.transactionTypeLabels[item.transaction_type]
}
function subtitle(item: Transaction) {
  return [item.category_name_snapshot ? item.description : '', item.bank_label_name_snapshot, item.section ? props.sectionName(item.section) : ''].filter(Boolean).join(' · ')
}
function activate(item: Transaction) {
  if (selectionMode.value) emit('toggleSelection', item.id, !props.isSelected(item.id))
  else expandedId.value = expandedId.value === item.id ? null : item.id
}
</script>

<template>
  <div class="mobile-transaction-list" :class="{ 'has-selection': selectedCount }">
    <div class="list-tools">
      <label v-if="selectionMode" class="select-all"><input type="checkbox" :checked="allVisibleSelected" :disabled="saving || !transactions.length" @change="emit('toggleAll', ($event.target as HTMLInputElement).checked)">Все в списке</label>
      <button v-else class="text-button" type="button" :aria-label="oldestFirst ? 'Показать сначала новые операции' : 'Показать сначала старые операции'" @click="oldestFirst = !oldestFirst">{{ oldestFirst ? 'Сначала старые' : 'Сначала новые' }}</button>
      <button class="text-button" type="button" :disabled="saving" @click="toggleSelectionMode">{{ selectionMode ? 'Готово' : 'Выбрать' }}</button>
    </div>
    <p v-if="!transactions.length" class="list-empty">Операции не найдены. Попробуйте изменить поиск.</p>
    <section v-for="group in groups" :key="group.date" class="day-group">
      <h3>{{ dayLabel(group.date) }}</h3>
      <ul>
        <li v-for="item in group.items" :key="item.id" :class="{ selected: isSelected(item.id) }">
          <div class="operation-line">
            <input v-if="selectionMode" class="operation-checkbox" type="checkbox" :checked="isSelected(item.id)" :aria-label="`Выбрать: ${transactionTitle(item)}`" :disabled="saving" @change="emit('toggleSelection', item.id, ($event.target as HTMLInputElement).checked)">
            <button class="operation-button" type="button" :disabled="saving" :aria-expanded="selectionMode ? undefined : expandedId === item.id" :aria-controls="selectionMode ? undefined : `transaction-details-${item.id}`" @click="activate(item)">
              <span class="operation-main"><strong>{{ title(item) }}</strong><span v-if="subtitle(item)">{{ subtitle(item) }}</span></span>
              <span class="operation-value" :class="item.transaction_type"><strong>{{ transactionSign(item.transaction_type) }}{{ currency(item.amount, item.currency) }}</strong><span><PiggyBank v-if="item.transaction_type === 'saving'" :size="13" />{{ transactionTypeLabels[item.transaction_type] }}<ChevronDown v-if="!selectionMode" :size="13" :class="{ expanded: expandedId === item.id }" /></span></span>
            </button>
          </div>
          <div v-if="!selectionMode && expandedId === item.id" :id="`transaction-details-${item.id}`" class="operation-details">
            <dl>
              <div><dt>Дата</dt><dd>{{ formatDate(item.date) }}</dd></div>
              <div><dt>Тип</dt><dd>{{ transactionTypeLabels[item.transaction_type] }}</dd></div>
              <div><dt>Сумма</dt><dd>{{ transactionSign(item.transaction_type) }}{{ currency(item.amount, item.currency) }}</dd></div>
              <div><dt>Категория</dt><dd>{{ item.category_name_snapshot || 'Без категории' }}</dd></div>
              <div><dt>Банк</dt><dd>{{ item.bank_label_name_snapshot || 'Без банка' }}</dd></div>
              <div><dt>Раздел</dt><dd>{{ item.section ? sectionName(item.section) : 'Без раздела' }}</dd></div>
              <div><dt>Описание</dt><dd>{{ item.description || 'Без описания' }}</dd></div>
            </dl>
            <div class="detail-actions">
              <button class="secondary-button" type="button" :disabled="saving" @click="emit('startEdit', item)"><Pencil :size="16" />Изменить</button>
              <button class="danger-button" type="button" :disabled="saving" @click="emit('remove', item.id, transactionTitle(item))"><Trash2 :size="16" />Удалить</button>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.mobile-transaction-list { margin-top: 16px; min-width: 0; }
.mobile-transaction-list.has-selection { padding-bottom: 240px; }
.list-tools { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.list-tools button { min-height: 44px; }
.select-all { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.select-all input, .operation-checkbox { width: 20px; height: 20px; flex: 0 0 20px; }
.day-group h3 { margin: 16px 0 4px; padding: 8px 0; color: var(--muted); font-size: 12px; font-weight: 800; }
ul { margin: 0; padding: 0; list-style: none; }
li { border-bottom: 1px solid var(--line); }
li.selected { background: color-mix(in srgb, var(--green) 8%, transparent); }
.operation-line { display: flex; align-items: center; gap: 8px; }
.operation-button { width: 100%; min-width: 0; min-height: 70px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 0; border: 0; color: var(--ink); background: transparent; text-align: left; }
.operation-main { flex: 1; min-width: 0; display: grid; gap: 5px; }
.operation-main strong, .operation-main > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.operation-main strong { font-size: 14px; }
.operation-main > span { color: var(--muted); font-size: 11px; }
.operation-value { max-width: 60%; min-width: 0; flex-shrink: 0; display: grid; justify-items: end; gap: 5px; }
.operation-value strong { font-size: 14px; overflow-wrap: anywhere; text-align: right; }
.operation-value > span { display: flex; align-items: center; gap: 4px; color: var(--muted); font-size: 10px; }
.operation-value.income { color: var(--green); }
.operation-value.saving { color: #a67a21; }
.expanded { transform: rotate(180deg); }
.operation-details { padding: 4px 0 16px; }
dl { display: grid; gap: 10px; margin: 0 0 16px; font-size: 13px; }
dl > div { display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 10px; }
dt { color: var(--muted); }
dd { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
.detail-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.detail-actions button { flex: 1; min-height: 44px; }
.list-empty { padding: 24px 0; color: var(--muted); font-size: 14px; }
</style>
