<script setup lang="ts">
import { Check, RefreshCw } from '@lucide/vue'
import type { Category, CategoryPayload } from '@/types/finance'

defineProps<{
  categories: Category[]
  createForm: CategoryPayload
  editForm: CategoryPayload
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
    <form class="bank-label-pane" id="category-create-form" @submit.prevent="emit('create')">
      <div><p class="eyebrow">Новая категория</p><h3>Добавление</h3></div>
      <label>Название<input v-model.trim="createForm.name" required placeholder="Например, Продукты"></label>
      <label>Описание<textarea v-model.trim="createForm.description" rows="4" placeholder="Например, Ежедневные покупки"></textarea></label>
      <button class="primary-button" type="submit" :disabled="saving"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Добавить</button>
    </form>

    <form class="bank-label-pane" id="category-edit-form" @submit.prevent="emit('update')">
      <div><p class="eyebrow">Существующая категория</p><h3>Редактирование</h3></div>
      <label>Категория<select :value="selectedId" @change="emit('select', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"><option :value="null">Выберите категорию</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></label>
      <label>Название<input v-model.trim="editForm.name" :disabled="!selectedId" required placeholder="Название категории"></label>
      <label>Описание<textarea v-model.trim="editForm.description" :disabled="!selectedId" rows="4" placeholder="Описание категории"></textarea></label>
      <button class="secondary-button" type="submit" :disabled="saving || !selectedId"><RefreshCw v-if="saving" class="spin" :size="17" /><Check v-else :size="17" />Сохранить</button>
    </form>
  </div>
</template>

