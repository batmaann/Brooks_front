<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { VehiclePayload } from '@/types/vehicle'

defineProps<{
  form: VehiclePayload
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <form id="vehicle-form" @submit.prevent="emit('submit')">
    <label class="full">Название<input v-model.trim="form.name" required placeholder="Например, Рабочая Toyota"></label>
    <label>Марка<input v-model.trim="form.brand" placeholder="Toyota"></label>
    <label>Модель<input v-model.trim="form.model" placeholder="Camry"></label>
    <label>Год<input v-model.number="form.year" type="number" min="1900" max="2100"></label>
    <label>Начальный пробег<input v-model.number="form.initial_odometer" required type="number" min="0"></label>
    <label class="check-field full"><input v-model="form.is_active" type="checkbox"><span><Check :size="16" />Активный транспорт</span></label>
  </form>
</template>

