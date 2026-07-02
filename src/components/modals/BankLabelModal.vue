<script setup lang="ts">
import { Check, RefreshCw } from '@lucide/vue'
import type { BankLabel, BankLabelPayload } from '@/types/finance'

defineProps<{
  bankLabels: BankLabel[]
  createForm: BankLabelPayload
  editForm: BankLabelPayload
  saving: boolean
  selectedId: number | null
}>()

const emit = defineEmits<{
  create: []
  select: [id: number | null]
  update: []
}>()
</script>

<template>
  <div class="bank-label-editor">
    <form class="bank-label-pane" id="bankLabel-create-form" @submit.prevent="emit('create')">
      <div><p class="eyebrow">Новый банк</p><h3>Добавление</h3></div>
      <label>Название<input v-model.trim="createForm.name" required placeholder="Например, Т-Банк *2726"></label>
      <label>Описание<textarea v-model.trim="createForm.description" rows="4" placeholder="Например, Основная карта"></textarea></label>
      <button class="primary-button" type="submit" :disabled="saving"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Добавить</button>
    </form>

    <form class="bank-label-pane" id="bankLabel-edit-form" @submit.prevent="emit('update')">
      <div><p class="eyebrow">Существующий банк</p><h3>Редактирование</h3></div>
      <label>Банк<select :value="selectedId" @change="emit('select', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"><option :value="null">Выберите банк</option><option v-for="bankLabel in bankLabels" :key="bankLabel.id" :value="bankLabel.id">{{ bankLabel.name }}</option></select></label>
      <label>Название<input v-model.trim="editForm.name" :disabled="!selectedId" required placeholder="Название банка"></label>
      <label>Описание<textarea v-model.trim="editForm.description" :disabled="!selectedId" rows="4" placeholder="Описание банка"></textarea></label>
      <button class="secondary-button" type="submit" :disabled="saving || !selectedId"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Сохранить</button>
    </form>
  </div>
</template>

