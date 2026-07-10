<script setup lang="ts">
import { useFormatters } from '@/composables/useFormatters'

interface Props {
  refuelingCount: number
  stationCount: number
  totalCost: number
  totalFuel: number
  vehicleCount: number
}

defineProps<Props>()

const {
  currency,
  optionalNumber,
} = useFormatters()
</script>

<template>
  <div class="finance-summary refueling-summary">
    <div class="finance-summary-item income">
      <span>Заправки</span>
      <strong>{{ refuelingCount }}</strong>
    </div>
    <div class="finance-summary-item balance">
      <span>Транспорт</span>
      <strong>{{ vehicleCount }}</strong>
    </div>
    <div class="finance-summary-item saving">
      <span>АЗС</span>
      <strong>{{ stationCount }}</strong>
    </div>
    <div class="finance-summary-item expense">
      <span>Итог</span>
      <strong>{{ currency(totalCost) }}</strong>
      <small>{{ optionalNumber(totalFuel, ' л', 2) }}</small>
    </div>
  </div>
</template>
