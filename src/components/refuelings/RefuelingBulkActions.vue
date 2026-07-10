<script setup lang="ts">
import { computed } from 'vue'
import { Trash2 } from '@lucide/vue'
import type { GasStation } from '@/types/refueling'
import type { Vehicle } from '@/types/vehicle'

interface Props {
  bulkStationValue: string
  bulkVehicleValue: string
  saving: boolean
  selectedCount: number
  stations: GasStation[]
  vehicles: Vehicle[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  applyStation: []
  applyVehicle: []
  clear: []
  delete: []
  updateBulkStationValue: [value: string]
  updateBulkVehicleValue: [value: string]
}>()

const bulkVehicleModel = computed({
  get: () => props.bulkVehicleValue,
  set: (value: string) => emit('updateBulkVehicleValue', value),
})

const bulkStationModel = computed({
  get: () => props.bulkStationValue,
  set: (value: string) => emit('updateBulkStationValue', value),
})
</script>

<template>
  <div v-if="selectedCount" class="bulk-actions">
    <strong>{{ selectedCount }} выбрано</strong>
    <select v-model="bulkVehicleModel">
      <option value="">Транспорт</option>
      <option v-for="vehicle in vehicles" :key="vehicle.id" :value="String(vehicle.id)">{{ vehicle.name }}</option>
    </select>
    <button class="secondary-button" type="button" :disabled="saving || !bulkVehicleValue" @click="emit('applyVehicle')">Поменять транспорт</button>
    <select v-model="bulkStationModel">
      <option value="">АЗС</option>
      <option value="__clear__">Без АЗС</option>
      <option v-for="station in stations" :key="station.id" :value="String(station.id)">{{ station.company || station.name }}</option>
    </select>
    <button class="secondary-button" type="button" :disabled="saving || !bulkStationValue" @click="emit('applyStation')">Поменять АЗС</button>
    <button class="danger-button" type="button" :disabled="saving" @click="emit('delete')"><Trash2 :size="17" />Удалить</button>
    <button class="text-button" type="button" :disabled="saving" @click="emit('clear')">Сбросить</button>
  </div>
</template>
