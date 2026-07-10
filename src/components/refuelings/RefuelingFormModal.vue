<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed } from 'vue'
import type { Category } from '@/types/finance'
import type { GasStation, Refueling, RefuelingDraft } from '@/types/refueling'
import type { Vehicle } from '@/types/vehicle'

const props = defineProps<{
  categories: Category[]
  editingRefuelingId: number | null
  form: RefuelingDraft
  refuelings: Refueling[]
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

const calculatedDistance = computed(() => {
  const odometer = Number(props.form.odometer_reading || 0)
  if (!props.form.vehicle || !odometer) return 0

  const selectedVehicle = props.vehicles.find((vehicle) => vehicle.id === props.form.vehicle)
  const previousRefueling = props.refuelings
    .filter((item) => {
      const itemDate = item.date || ''
      const formDate = props.form.date || ''
      return item.vehicle === props.form.vehicle
        && item.id !== props.editingRefuelingId
        && (!formDate || !itemDate || itemDate <= formDate)
    })
    .sort((left, right) => {
      const dateDiff = new Date(`${right.date}T00:00:00`).getTime() - new Date(`${left.date}T00:00:00`).getTime()
      return dateDiff || right.id - left.id
    })[0]

  const previousOdometer = Number(previousRefueling?.odometer_reading ?? previousRefueling?.odometer ?? selectedVehicle?.initial_odometer ?? 0)
  return odometer - previousOdometer
})

</script>

<template>
  <form id="refueling-form" @submit.prevent="emit('submit')">
    <label class="full">Транспорт<select :value="form.vehicle ?? ''" required @change="updateField('vehicle', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="" disabled>Выберите транспорт</option><option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.name }}</option></select></label>
    <label>Дата<input :value="form.date" required type="date" @input="updateField('date', ($event.target as HTMLInputElement).value)"></label>
    <div class="odometer-field full">
      <label>Текущий одометр<input :value="form.odometer_reading" required type="number" min="1" @input="updateField('odometer_reading', Number(($event.target as HTMLInputElement).value))"></label>
      <label>Дистанция<input class="readonly-input" :class="{ invalid: calculatedDistance < 0 }" :value="calculatedDistance" readonly type="number" tabindex="-1"></label>
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
