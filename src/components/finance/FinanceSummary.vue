<script setup lang="ts">
import { Minus, Sparkles, TrendingDown, TrendingUp } from '@lucide/vue'
import { useFormatters } from '@/composables/useFormatters'
import type { MonthlySummary, MonthlySummaryMetric } from '@/types/finance'

interface Props {
  summary: MonthlySummary | null
}

defineProps<Props>()

const { currency, number } = useFormatters()

function comparisonText(metric: MonthlySummaryMetric) {
  if (metric.direction === 'new') return 'Новое значение'
  return `${number(Math.abs(Number(metric.change_percent)), 2)}%`
}
</script>

<template>
  <div class="finance-summary">
    <div class="finance-summary-item income">
      <span>Доходы</span>
      <strong>{{ currency(summary?.income.current, summary?.currency) }}</strong>
      <small v-if="summary" :class="summary.income.direction"><i class="trend-icon"><TrendingUp v-if="summary.income.direction === 'up'" :size="14" /><TrendingDown v-else-if="summary.income.direction === 'down'" :size="14" /><Minus v-else-if="summary.income.direction === 'same'" :size="14" /><Sparkles v-else :size="13" /></i>Было {{ currency(summary.income.previous, summary.currency) }} · {{ comparisonText(summary.income) }}</small>
    </div>
    <div class="finance-summary-item expense">
      <span>Траты</span>
      <strong>{{ currency(summary?.expense.current, summary?.currency) }}</strong>
      <small v-if="summary" :class="summary.expense.direction"><i class="trend-icon"><TrendingUp v-if="summary.expense.direction === 'up'" :size="14" /><TrendingDown v-else-if="summary.expense.direction === 'down'" :size="14" /><Minus v-else-if="summary.expense.direction === 'same'" :size="14" /><Sparkles v-else :size="13" /></i>Было {{ currency(summary.expense.previous, summary.currency) }} · {{ comparisonText(summary.expense) }}</small>
    </div>
    <div class="finance-summary-item saving">
      <span>Накопления</span>
      <strong>{{ currency(summary?.saving.current, summary?.currency) }}</strong>
      <small v-if="summary" :class="summary.saving.direction"><i class="trend-icon"><TrendingUp v-if="summary.saving.direction === 'up'" :size="14" /><TrendingDown v-else-if="summary.saving.direction === 'down'" :size="14" /><Minus v-else-if="summary.saving.direction === 'same'" :size="14" /><Sparkles v-else :size="13" /></i>Было {{ currency(summary.saving.previous, summary.currency) }} · {{ comparisonText(summary.saving) }}</small>
    </div>
    <div class="finance-summary-item balance">
      <span>Итог</span>
      <strong>{{ currency(summary?.total.current, summary?.currency) }}</strong>
      <small v-if="summary" :class="summary.total.direction"><i class="trend-icon"><TrendingUp v-if="summary.total.direction === 'up'" :size="14" /><TrendingDown v-else-if="summary.total.direction === 'down'" :size="14" /><Minus v-else-if="summary.total.direction === 'same'" :size="14" /><Sparkles v-else :size="13" /></i>Было {{ currency(summary.total.previous, summary.currency) }} · {{ comparisonText(summary.total) }}</small>
    </div>
  </div>
</template>
