<script setup lang="ts">
import { CarFront, Trash2 } from '@lucide/vue'
import { useFormatters } from '@/composables/useFormatters'
import type { Vehicle } from '@/types/vehicle'

interface Props {
  vehicles: Vehicle[]
}

defineProps<Props>()

const emit = defineEmits<{
  removeVehicle: [id: number, label: string]
}>()

const { number } = useFormatters()
</script>

<template>
  <section class="management-panel">
    <div class="section-heading compact-heading">
      <div>
        <p class="eyebrow">Транспорт</p>
        <h2>{{ vehicles.length }} записей</h2>
      </div>
    </div>
    <div class="vehicle-grid compact-grid">
      <article v-for="vehicle in vehicles" :key="vehicle.id" class="vehicle-card">
        <div class="vehicle-card-head">
          <div class="vehicle-symbol"><CarFront :size="24" /></div>
          <span class="status" :class="{ inactive: !vehicle.is_active }"><i></i>{{ vehicle.is_active ? 'Активен' : 'Неактивен' }}</span>
          <button class="icon-button danger" title="Удалить транспорт" @click="emit('removeVehicle', vehicle.id, vehicle.name)"><Trash2 :size="17" /></button>
        </div>
        <div>
          <h2>{{ vehicle.name }}</h2>
          <p>{{ [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' · ') || 'Без дополнительных данных' }}</p>
        </div>
        <dl>
          <div><dt>Текущий пробег</dt><dd>{{ number(vehicle.current_odometer || vehicle.initial_odometer) }} км</dd></div>
          <div><dt>Начальный</dt><dd>{{ number(vehicle.initial_odometer) }} км</dd></div>
        </dl>
      </article>
    </div>
  </section>
</template>
