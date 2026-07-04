<script setup lang="ts">
import { Check, RefreshCw } from '@lucide/vue'
import type { BankLabel, BankLabelPayload } from '@/types/finance'

const props = defineProps<{
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
  'update:createForm': [form: BankLabelPayload]
  'update:editForm': [form: BankLabelPayload]
}>()

function updateCreateField<K extends keyof BankLabelPayload>(field: K, value: BankLabelPayload[K]) {
  emit('update:createForm', { ...props.createForm, [field]: value })
}

function updateEditField<K extends keyof BankLabelPayload>(field: K, value: BankLabelPayload[K]) {
  emit('update:editForm', { ...props.editForm, [field]: value })
}
</script>

<template>
  <div class="bank-label-editor">
    <form class="bank-label-pane" id="bankLabel-create-form" @submit.prevent="emit('create')">
      <div><p class="eyebrow">Новый банк</p><h3>Добавление</h3></div>
      <label>Название<input :value="createForm.name" required placeholder="Например, Т-Банк *2726" @input="updateCreateField('name', ($event.target as HTMLInputElement).value.trim())"></label>
      <label>Описание<textarea :value="createForm.description" rows="4" placeholder="Например, Основная карта" @input="updateCreateField('description', ($event.target as HTMLTextAreaElement).value.trim())"></textarea></label>
      <button class="primary-button" type="submit" :disabled="saving"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Добавить</button>
    </form>

    <form class="bank-label-pane" id="bankLabel-edit-form" @submit.prevent="emit('update')">
      <div><p class="eyebrow">Существующий банк</p><h3>Редактирование</h3></div>
      <label>Банк<select :value="selectedId ?? ''" @change="emit('select', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"><option value="">Выберите банк</option><option v-for="item in bankLabels" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
      <label>Название<input :value="editForm.name" :disabled="!selectedId" required placeholder="Название банка" @input="updateEditField('name', ($event.target as HTMLInputElement).value.trim())"></label>
      <label>Описание<textarea :value="editForm.description" :disabled="!selectedId" rows="4" placeholder="Описание банка" @input="updateEditField('description', ($event.target as HTMLTextAreaElement).value.trim())"></textarea></label>
      <button class="secondary-button" type="submit" :disabled="saving || !selectedId"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Сохранить</button>
    </form>
  </div>
</template>
