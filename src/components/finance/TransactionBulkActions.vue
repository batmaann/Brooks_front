<script setup lang="ts">
import { computed, ref } from 'vue'
import { Trash2 } from '@lucide/vue'
import type { Category, Section } from '@/types/finance'

interface Props {
  bulkCategoryValue: string
  bulkSectionValue: string
  categories: Category[]
  saving: boolean
  sections: Section[]
  selectedCount: number
  mobile?: boolean
}

const props = defineProps<Props>()
const mobileAction = ref<'category' | 'section' | null>(null)

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
  <div v-if="selectedCount && mobile" class="mobile-bulk-actions" aria-label="Действия с выбранными операциями">
    <div class="mobile-bulk-heading"><strong>{{ selectedCount }} выбрано</strong><button class="text-button" type="button" :disabled="saving" @click="emit('clear'); mobileAction = null">Сбросить</button></div>
    <div class="mobile-bulk-buttons">
      <button class="secondary-button" type="button" :disabled="saving" :aria-expanded="mobileAction === 'category'" @click="mobileAction = mobileAction === 'category' ? null : 'category'">Категория</button>
      <button class="secondary-button" type="button" :disabled="saving" :aria-expanded="mobileAction === 'section'" @click="mobileAction = mobileAction === 'section' ? null : 'section'">Раздел</button>
      <button class="danger-button" type="button" :disabled="saving" @click="emit('delete')"><Trash2 :size="16" />Удалить</button>
    </div>
    <div v-if="mobileAction === 'category'" class="mobile-bulk-editor">
      <label>Категория для выбранных<select v-model="bulkCategoryModel" :disabled="saving"><option value="">Выберите категорию</option><option value="__clear__">Без категории</option><option v-for="category in categories" :key="category.id" :value="String(category.id)">{{ category.name }}</option></select></label>
      <button class="primary-button" type="button" :disabled="saving || !bulkCategoryValue" @click="emit('applyCategory')">Применить</button>
    </div>
    <div v-if="mobileAction === 'section'" class="mobile-bulk-editor">
      <label>Раздел для выбранных<select v-model="bulkSectionModel" :disabled="saving"><option value="">Выберите раздел</option><option value="__clear__">Без раздела</option><option v-for="section in sections" :key="section.id" :value="String(section.id)">{{ section.name }}</option></select></label>
      <button class="primary-button" type="button" :disabled="saving || !bulkSectionValue" @click="emit('applySection')">Применить</button>
    </div>
  </div>
  <div v-else-if="selectedCount" class="bulk-actions">
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

<style scoped>
.mobile-bulk-actions { position: fixed; z-index: 25; bottom: 0; left: 0; right: 0; padding: 10px 16px max(12px, env(safe-area-inset-bottom)); max-height: 55dvh; overflow-y: auto; border-top: 1px solid var(--line); background: var(--surface); box-shadow: 0 -8px 24px rgb(0 0 0 / 8%); display: grid; gap: 10px; }
.mobile-bulk-heading { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.mobile-bulk-heading button { min-height: 36px; }
.mobile-bulk-buttons { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.mobile-bulk-buttons button { min-width: 0; min-height: 44px; padding: 0 8px; font-size: 12px; }
.mobile-bulk-editor { display: grid; gap: 10px; }
.mobile-bulk-editor label { display: grid; gap: 6px; font-size: 13px; }
.mobile-bulk-editor select { width: 100%; min-height: 44px; font-size: 16px; }
.mobile-bulk-editor button { min-height: 44px; }
</style>
