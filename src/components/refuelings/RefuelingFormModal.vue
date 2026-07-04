<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { GasStation, RefuelingDraft } from '@/types/refueling'
import type { Vehicle } from '@/types/vehicle'

const props = defineProps<{
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
</script>

<template>
  <form id="refueling-form" @submit.prevent="emit('submit')">
    <label class="full">Транспорт<select :value="form.vehicle ?? ''" required @change="updateField('vehicle', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="" disabled>Выберите транспорт</option><option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.name }}</option></select></label>
    <label>Дата<input :value="form.date" required type="date" @input="updateField('date', ($event.target as HTMLInputElement).value)"></label>
    <label>Пробег с прошлой заправки<input :value="form.mileage" required type="number" min="1" max="5000" @input="updateField('mileage', Number(($event.target as HTMLInputElement).value))"></label>
    <label>Количество, л<input :value="form.fuel_quantity" required type="number" min="0.01" step="0.01" @input="updateField('fuel_quantity', Number(($event.target as HTMLInputElement).value))"></label>
    <label>Цена за литр<input :value="form.price_per_liter" required type="number" min="0.01" step="0.01" @input="updateField('price_per_liter', Number(($event.target as HTMLInputElement).value))"></label>
    <label>Тип топлива<select :value="form.fuel_type || ''" @change="updateField('fuel_type', ($event.target as HTMLSelectElement).value)"><option v-for="fuelType in ['АИ-92', 'АИ-95', 'АИ-98', 'ДТ', 'ГАЗ']" :key="fuelType">{{ fuelType }}</option></select></label>
    <label>АЗС<select :value="form.gas_station ?? ''" @change="updateField('gas_station', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="">Не выбрана</option><option v-for="station in stations" :key="station.id" :value="station.id">{{ station.company }} {{ station.name }}</option></select></label>
    <label>Работа сервиса<input :value="form.service_operation" type="number" min="0" step="0.01" @input="updateField('service_operation', Number(($event.target as HTMLInputElement).value))"></label>
    <label>Кэшбек<input :value="form.cashback" type="number" min="0" step="0.01" @input="updateField('cashback', Number(($event.target as HTMLInputElement).value))"></label>
    <label class="full">Комментарий<textarea :value="form.comment" rows="3" placeholder="Необязательная заметка" @input="updateField('comment', ($event.target as HTMLTextAreaElement).value.trim())"></textarea></label>
    <label class="check-field full"><input :checked="form.is_full_tank" type="checkbox" @change="updateField('is_full_tank', ($event.target as HTMLInputElement).checked)"><span><Check :size="16" />Полный бак</span></label>
  </form>
</template>
