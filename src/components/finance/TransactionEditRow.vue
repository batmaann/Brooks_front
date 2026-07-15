<script setup lang="ts">
import { Check, X } from '@lucide/vue'
import DecimalInput from '@/components/ui/DecimalInput.vue'
import type { BankLabel, Category, Section, TransactionDraft, TransactionType } from '@/types/finance'
import type { TransactionSortKey } from '@/types/table'

interface Props {
  bankLabels: BankLabel[]
  categories: Category[]
  form: TransactionDraft
  isSelected: boolean
  itemId: number
  saving: boolean
  sections: Section[]
  visibleColumns: TransactionSortKey[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  toggleSelection: [id: number, checked: boolean]
  update: [id: number]
  'update:form': [form: TransactionDraft]
}>()

function updateForm<K extends keyof TransactionDraft>(field: K, value: TransactionDraft[K]) {
  emit('update:form', { ...props.form, [field]: value })
}

function numberOrNull(value: string) {
  return value === '' ? null : Number(value)
}
</script>

<template>
  <tr class="transaction-edit-row">
    <td class="selection-column"><input type="checkbox" :checked="isSelected" title="Выбрать операцию" @change="emit('toggleSelection', itemId, ($event.target as HTMLInputElement).checked)"></td>
    <template v-for="columnKey in visibleColumns" :key="`edit-${itemId}-${columnKey}`">
      <td v-if="columnKey === 'date'"><input :value="form.date" required type="date" @input="updateForm('date', ($event.target as HTMLInputElement).value)"></td>
      <td v-else-if="columnKey === 'transaction_type'"><select :value="form.transaction_type" @change="updateForm('transaction_type', ($event.target as HTMLSelectElement).value as TransactionType)"><option value="income">Доход</option><option value="expense">Трата</option><option value="saving">Накопление</option></select></td>
      <td v-else-if="columnKey === 'section'"><select :value="form.section ?? ''" @change="updateForm('section', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="">Не выбран</option><option v-for="section in sections" :key="section.id" :value="section.id">{{ section.name }}</option></select></td>
      <td v-else-if="columnKey === 'category'"><select :value="form.category ?? ''" @change="updateForm('category', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="">Не выбрана</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></td>
      <td v-else-if="columnKey === 'amount'"><DecimalInput :model-value="form.amount" required :min="0.01" @update:model-value="updateForm('amount', $event)" /></td>
      <td v-else-if="columnKey === 'bank_label'"><select :value="form.bank_label ?? ''" @change="updateForm('bank_label', numberOrNull(($event.target as HTMLSelectElement).value))"><option value="">Не указан</option><option v-for="bankLabel in bankLabels" :key="bankLabel.id" :value="bankLabel.id">{{ bankLabel.name }}</option></select></td>
      <td v-else><input :value="form.description" placeholder="Описание" @input="updateForm('description', ($event.target as HTMLInputElement).value.trim())"></td>
    </template>
    <td>
      <div class="transaction-actions editing">
        <button class="icon-button" title="Сохранить" :disabled="saving" @click="emit('update', itemId)"><Check :size="16" /></button>
        <button class="icon-button" title="Отмена" :disabled="saving" @click="emit('cancel')"><X :size="16" /></button>
      </div>
    </td>
  </tr>
</template>
