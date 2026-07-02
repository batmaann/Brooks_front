<script setup lang="ts">
import type { GasStationPayload } from '@/types/refueling'

defineProps<{
  form: GasStationPayload
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <form id="station-form" @submit.prevent="emit('submit')">
    <label>Компания<input v-model.trim="form.company" placeholder="Лукойл"></label>
    <label>Название<input v-model.trim="form.name" required placeholder="АЗС"></label>
    <label>Номер<input v-model.trim="form.number" placeholder="154"></label>
    <label class="full">Адрес<input v-model.trim="form.address" placeholder="Город, улица, дом"></label>
  </form>
</template>

