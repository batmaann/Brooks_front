<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { GasStation, RefuelingDraft } from '@/types/refueling'
import type { Vehicle } from '@/types/vehicle'

defineProps<{
  form: RefuelingDraft
  stations: GasStation[]
  vehicles: Vehicle[]
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <form id="refueling-form" @submit.prevent="emit('submit')">
    <label class="full">Транспорт<select v-model.number="form.vehicle" required><option :value="null" disabled>Выберите транспорт</option><option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.name }}</option></select></label>
    <label>Дата<input v-model="form.date" required type="date"></label>
    <label>Пробег с прошлой заправки<input v-model.number="form.mileage" required type="number" min="1" max="5000"></label>
    <label>Количество, л<input v-model.number="form.fuel_quantity" required type="number" min="0.01" step="0.01"></label>
    <label>Цена за литр<input v-model.number="form.price_per_liter" required type="number" min="0.01" step="0.01"></label>
    <label>Тип топлива<select v-model="form.fuel_type"><option v-for="fuelType in ['АИ-92', 'АИ-95', 'АИ-98', 'ДТ', 'ГАЗ']" :key="fuelType">{{ fuelType }}</option></select></label>
    <label>АЗС<select v-model="form.gas_station"><option :value="null">Не выбрана</option><option v-for="station in stations" :key="station.id" :value="station.id">{{ station.company }} {{ station.name }}</option></select></label>
    <label>Работа сервиса<input v-model.number="form.service_operation" type="number" min="0" step="0.01"></label>
    <label>Кэшбек<input v-model.number="form.cashback" type="number" min="0" step="0.01"></label>
    <label class="full">Комментарий<textarea v-model.trim="form.comment" rows="3" placeholder="Необязательная заметка"></textarea></label>
    <label class="check-field full"><input v-model="form.is_full_tank" type="checkbox"><span><Check :size="16" />Полный бак</span></label>
  </form>
</template>

