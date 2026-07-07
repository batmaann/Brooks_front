<script setup lang="ts">
import { Check, Gauge, Route, Wand2 } from '@lucide/vue'
import type { Category } from '@/types/finance'
import type { GasStation, RefuelingDraft } from '@/types/refueling'
import type { Vehicle } from '@/types/vehicle'

const props = defineProps<{
  categories: Category[]
  form: RefuelingDraft
  stations: GasStation[]
  vehicles: Vehicle[]
}>()

const emit = defineEmits<{
  submit: []
  'update:form': [form: RefuelingDraft]
}>()

function updateField<K extends keyof RefuelingDraft>(field: K, value: RefuelingDraft[K]) {
  emit('update:form', { ...props.form, [field]: value })
}

function numberOrNull(value: string) {
  return value === '' ? null : Number(value)
}

function updateOdometerMode(value: RefuelingDraft['odometer_value_type']) {
  updateField('odometer_value_type', value)
}
</script>

<template>
  <form id="refueling-form" @submit.prevent="emit('submit')">
    <label class="full">Транспорт<select :value="form.vehicle ?? ''" required @change="updateField('vehicle', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="" disabled>Выберите транспорт</option><option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.name }}</option></select></label>
    <label>Дата<input :value="form.date" required type="date" @input="updateField('date', ($event.target as HTMLInputElement).value)"></label>
    <div class="odometer-field full">
      <label>Пробег / одометр<input :value="form.odometer_value" required type="number" min="1" @input="updateField('odometer_value', Number(($event.target as HTMLInputElement).value))"></label>
      <div class="segmented-control" role="radiogroup" aria-label="Тип значения пробега">
        <button type="button" :class="{ active: form.odometer_value_type === 'auto' }" title="Авто" role="radio" :aria-checked="form.odometer_value_type === 'auto'" @click="updateOdometerMode('auto')"><Wand2 :size="15" />Авто</button>
        <button type="button" :class="{ active: form.odometer_value_type === 'mileage' }" title="Пробег" role="radio" :aria-checked="form.odometer_value_type === 'mileage'" @click="updateOdometerMode('mileage')"><Route :size="15" />Пробег</button>
        <button type="button" :class="{ active: form.odometer_value_type === 'odometer_reading' }" title="Одометр" role="radio" :aria-checked="form.odometer_value_type === 'odometer_reading'" @click="updateOdometerMode('odometer_reading')"><Gauge :size="15" />Одометр</button>
      </div>
    </div>
    <label>Количество, л<input :value="form.fuel_quantity" required type="number" min="0.01" step="0.01" @input="updateField('fuel_quantity', Number(($event.target as HTMLInputElement).value))"></label>
    <label>Цена за литр<input :value="form.price_per_liter" required type="number" min="0.01" step="0.01" @input="updateField('price_per_liter', Number(($event.target as HTMLInputElement).value))"></label>
    <label>Тип топлива<select :value="form.fuel_type || ''" @change="updateField('fuel_type', ($event.target as HTMLSelectElement).value)"><option v-for="fuelType in ['АИ-92', 'АИ-95', 'АИ-98', 'ДТ', 'ГАЗ']" :key="fuelType">{{ fuelType }}</option></select></label>
    <label>АЗС<select :value="form.gas_station ?? ''" @change="updateField('gas_station', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="">Не выбрана</option><option v-for="station in stations" :key="station.id" :value="station.id">{{ station.company }} {{ station.name }}</option></select></label>
    <label>Категория<select :value="form.category ?? ''" @change="updateField('category', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="">Не выбрана</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></label>
    <label>Работа сервиса<input :value="form.service_operation" type="number" min="0" step="0.01" @input="updateField('service_operation', Number(($event.target as HTMLInputElement).value))"></label>
    <label>Кэшбек<input :value="form.cashback" type="number" min="0" step="0.01" @input="updateField('cashback', Number(($event.target as HTMLInputElement).value))"></label>
    <label class="full">Описание<textarea :value="form.description" rows="3" placeholder="Необязательное описание" @input="updateField('description', ($event.target as HTMLTextAreaElement).value.trim())"></textarea></label>
    <label class="check-field full"><input :checked="form.is_full_tank" type="checkbox" @change="updateField('is_full_tank', ($event.target as HTMLInputElement).checked)"><span><Check :size="16" />Полный бак</span></label>
  </form>
</template>
