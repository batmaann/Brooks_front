<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { VehiclePayload } from '@/types/vehicle'

const props = defineProps<{
  form: VehiclePayload
}>()

const emit = defineEmits<{
  submit: []
  'update:form': [form: VehiclePayload]
}>()

function updateField<K extends keyof VehiclePayload>(field: K, value: VehiclePayload[K]) {
  emit('update:form', { ...props.form, [field]: value })
}
</script>

<template>
  <form id="vehicle-form" @submit.prevent="emit('submit')">
    <label class="full">Название<input :value="form.name" required placeholder="Например, Рабочая Toyota" @input="updateField('name', ($event.target as HTMLInputElement).value.trim())"></label>
    <label>Марка<input :value="form.brand" placeholder="Toyota" @input="updateField('brand', ($event.target as HTMLInputElement).value.trim())"></label>
    <label>Модель<input :value="form.model" placeholder="Camry" @input="updateField('model', ($event.target as HTMLInputElement).value.trim())"></label>
    <label>Год<input :value="form.year ?? ''" type="number" min="1900" max="2100" @input="updateField('year', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"></label>
    <label>Начальный пробег<input :value="form.initial_odometer" required type="number" min="0" @input="updateField('initial_odometer', Number(($event.target as HTMLInputElement).value))"></label>
    <label class="check-field full"><input :checked="form.is_active" type="checkbox" @change="updateField('is_active', ($event.target as HTMLInputElement).checked)"><span><Check :size="16" />Активный транспорт</span></label>
  </form>
</template>
