<script setup lang="ts">
import { computed } from 'vue'
import { Trash2 } from '@lucide/vue'
import type { Category, Section } from '@/types/finance'

interface Props {
  bulkCategoryValue: string
  bulkSectionValue: string
  categories: Category[]
  saving: boolean
  sections: Section[]
  selectedCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  applyCategory: []
  applySection: []
  clear: []
  delete: []
  updateBulkCategoryValue: [value: string]
  updateBulkSectionValue: [value: string]
}>()

const bulkCategoryModel = computed({
  get: () => props.bulkCategoryValue,
  set: (value: string) => emit('updateBulkCategoryValue', value),
})

const bulkSectionModel = computed({
  get: () => props.bulkSectionValue,
  set: (value: string) => emit('updateBulkSectionValue', value),
})
</script>

<template>
  <div v-if="selectedCount" class="bulk-actions">
    <strong>{{ selectedCount }} выбрано</strong>
    <select v-model="bulkCategoryModel">
      <option value="">Категория</option>
      <option value="__clear__">Без категории</option>
      <option v-for="category in categories" :key="category.id" :value="String(category.id)">{{ category.name }}</option>
    </select>
    <button class="secondary-button" type="button" :disabled="saving || !bulkCategoryValue" @click="emit('applyCategory')">Проставить категорию</button>
    <select v-model="bulkSectionModel">
      <option value="">Раздел</option>
      <option value="__clear__">Без раздела</option>
      <option v-for="section in sections" :key="section.id" :value="String(section.id)">{{ section.name }}</option>
    </select>
    <button class="secondary-button" type="button" :disabled="saving || !bulkSectionValue" @click="emit('applySection')">Проставить раздел</button>
    <button class="danger-button" type="button" :disabled="saving" @click="emit('delete')"><Trash2 :size="17" />Удалить</button>
    <button class="text-button" type="button" :disabled="saving" @click="emit('clear')">Сбросить</button>
  </div>
</template>

