<script setup lang="ts">
import { useFormatters } from '@/composables/useFormatters'

interface Props {
  balance: number
  expense: number
  income: number
  saving: number
}

defineProps<Props>()

const { currency } = useFormatters()
</script>

<template>
  <div class="finance-summary">
    <div class="finance-summary-item income">
      <span>Доходы</span>
      <strong>{{ currency(income) }}</strong>
    </div>
    <div class="finance-summary-item expense">
      <span>Траты</span>
      <strong>{{ currency(expense) }}</strong>
    </div>
    <div class="finance-summary-item saving">
      <span>Накопления</span>
      <strong>{{ currency(saving) }}</strong>
    </div>
    <div class="finance-summary-item balance">
      <span>Итог</span>
      <strong>{{ currency(balance) }}</strong>
    </div>
  </div>
</template>
