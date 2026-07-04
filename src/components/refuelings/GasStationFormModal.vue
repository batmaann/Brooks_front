<script setup lang="ts">
import type { GasStationPayload } from '@/types/refueling'

const props = defineProps<{
  form: GasStationPayload
}>()

const emit = defineEmits<{
  submit: []
  'update:form': [form: GasStationPayload]
}>()

function updateField<K extends keyof GasStationPayload>(field: K, value: GasStationPayload[K]) {
  emit('update:form', { ...props.form, [field]: value })
}
</script>

<template>
  <form id="station-form" @submit.prevent="emit('submit')">
    <label>Компания<input :value="form.company" placeholder="Лукойл" @input="updateField('company', ($event.target as HTMLInputElement).value.trim())"></label>
    <label>Название<input :value="form.name" required placeholder="АЗС" @input="updateField('name', ($event.target as HTMLInputElement).value.trim())"></label>
    <label>Номер<input :value="form.number" placeholder="154" @input="updateField('number', ($event.target as HTMLInputElement).value.trim())"></label>
    <label class="full">Адрес<input :value="form.address" placeholder="Город, улица, дом" @input="updateField('address', ($event.target as HTMLInputElement).value.trim())"></label>
  </form>
</template>
