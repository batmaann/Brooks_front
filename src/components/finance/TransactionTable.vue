<script setup lang="ts">
import { ChevronDown, ChevronUp } from '@lucide/vue'
import { computed, inject, ref } from 'vue'
import { interfaceHelpKey } from '@/components/navigation/interfaceHelp'
import TransactionCreateRow from '@/components/finance/TransactionCreateRow.vue'
import TransactionEditRow from '@/components/finance/TransactionEditRow.vue'
import TransactionRow from '@/components/finance/TransactionRow.vue'
import type { SortDirection } from '@/types/common'
import type { BankLabel, Category, Section, Transaction, TransactionDraft, TransactionType } from '@/types/finance'
import type { TransactionSortKey } from '@/types/table'

interface Props {
  addingTransaction: boolean
  allVisibleSelected: boolean
  bankLabels: BankLabel[]
  categories: Category[]
  draggedColumn: TransactionSortKey | null
  editingTransactionId: number | null
  hasTransactions: boolean
  isSelected: (id: number) => boolean
  saving: boolean
  sectionName: (id: number | null) => string
  sections: Section[]
  sort: { key: TransactionSortKey | null, direction: SortDirection }
  transactionColumnLabels: Record<TransactionSortKey, string>
  transactionEditForm: TransactionDraft
  transactionForm: TransactionDraft
  transactionSign: (type: TransactionType) => string
  transactionTitle: (item: Transaction) => string
  transactionTypeLabels: Record<TransactionType, string>
  transactions: Transaction[]
  visibleColumnIds: number[]
  visibleColumns: TransactionSortKey[]
}

const props = defineProps<Props>()
const helpOpen = inject(interfaceHelpKey, ref(false))
const columnHelp: Record<TransactionSortKey, string> = {
  date: 'Дата — укажите день операции, например день покупки или поступления зарплаты. По этой дате операция попадёт в статистику нужного месяца.',
  transaction_type: 'Тип операции — выберите «Доход» для поступления денег, «Трата» для расходов или «Накопление» для отложенных средств.',
  section: 'Раздел — выберите, к какому разделу в меню слева относится операция. От этого выбора зависит, в каком разделе она будет учитываться и на какие данные повлияет.',
  category: 'Категория — уточните, на что потрачены или откуда получены деньги: например «Продукты» или «Зарплата». Свои категории можно создать кнопкой «Добавить категории».',
  amount: 'Сумма — введите положительную сумму в рублях, например 1500,50. Доход это или расход, определяется типом операции.',
  bank_label: 'Банк — выберите банк, через который прошла операция. Если нужного банка нет в списке, создайте его кнопкой «Добавить банк».',
  description: 'Описание — добавьте понятную заметку, например «Покупка продуктов на неделю». Она поможет вспомнить детали и найти операцию через поиск.',
}
const helpColumns = computed(() => helpOpen.value ? Object.keys(columnHelp) as TransactionSortKey[] : props.visibleColumns)

const emit = defineEmits<{
  cancelCreate: []
  cancelEdit: []
  create: []
  dropColumn: [key: TransactionSortKey]
  finishColumnDrag: []
  remove: [id: number, label: string]
  startColumnDrag: [key: TransactionSortKey]
  startEdit: [item: Transaction]
  toggleAll: [checked: boolean]
  toggleSelection: [id: number, checked: boolean]
  toggleSort: [key: TransactionSortKey]
  update: [id: number]
  'update:transactionForm': [form: TransactionDraft]
  'update:transactionEditForm': [form: TransactionDraft]
}>()
</script>

<template>
  <div v-if="hasTransactions || addingTransaction || helpOpen" class="table-panel transaction-table" :class="{ 'transaction-table-help': helpOpen }">
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="selection-column" data-help="Выбрать все видимые — отметьте все операции в текущем списке или снимите выделение. Чтобы выбрать только нужные операции, поставьте галочки напротив отдельных строк ниже. Для выбранных операций можно изменить раздел или категорию либо удалить их вместе."><input type="checkbox" :checked="allVisibleSelected" :disabled="!visibleColumnIds.length" title="Выбрать все видимые" @change="emit('toggleAll', ($event.target as HTMLInputElement).checked)"></th>
            <th
              v-for="columnKey in helpColumns"
              :key="columnKey"
              class="draggable-column"
              :data-help="columnHelp[columnKey]"
              :data-help-related="columnKey === 'section' ? 'app-sections' : undefined"
              :class="{ dragging: draggedColumn === columnKey }"
              draggable="true"
              @dragstart="emit('startColumnDrag', columnKey)"
              @dragover.prevent
              @drop.prevent="emit('dropColumn', columnKey)"
              @dragend="emit('finishColumnDrag')"
            >
              <button class="sort-header" :class="{ active: sort.key === columnKey }" type="button" @click="emit('toggleSort', columnKey)">
                <span>{{ transactionColumnLabels[columnKey] }}</span>
                <ChevronUp v-if="sort.key === columnKey && sort.direction === 'asc'" :size="14" />
                <ChevronDown v-else-if="sort.key === columnKey && sort.direction === 'desc'" :size="14" />
              </button>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <TransactionCreateRow
            v-if="addingTransaction"
            :bank-labels="bankLabels"
            :categories="categories"
            :form="transactionForm"
            :saving="saving"
            :sections="sections"
            :visible-columns="helpColumns"
            @cancel="emit('cancelCreate')"
            @create="emit('create')"
            @update:form="emit('update:transactionForm', $event)"
          />
          <template v-for="item in transactions" :key="item.id">
            <TransactionRow
              v-if="editingTransactionId !== item.id"
              :item="item"
              :section-name="sectionName"
              :selected="isSelected(item.id)"
              :transaction-sign="transactionSign"
              :transaction-title="transactionTitle"
              :transaction-type-labels="transactionTypeLabels"
              :visible-columns="helpColumns"
              @remove="(id, label) => emit('remove', id, label)"
              @start-edit="emit('startEdit', $event)"
              @toggle-selection="(id, checked) => emit('toggleSelection', id, checked)"
            />
            <TransactionEditRow
              v-else
              :bank-labels="bankLabels"
              :categories="categories"
              :form="transactionEditForm"
              :is-selected="isSelected(item.id)"
              :item-id="item.id"
              :saving="saving"
              :sections="sections"
              :visible-columns="helpColumns"
              @cancel="emit('cancelEdit')"
              @toggle-selection="(id, checked) => emit('toggleSelection', id, checked)"
              @update="emit('update', $event)"
              @update:form="emit('update:transactionEditForm', $event)"
            />
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.transaction-table-help table { min-width: 0; width: 100%; table-layout: fixed; }
.transaction-table-help th { padding: 12px 6px; white-space: normal; overflow-wrap: anywhere; }
.transaction-table-help th:first-child, .transaction-table-help th:last-child { width: 30px; }
.transaction-table-help td { overflow: hidden; }
.transaction-table-help .sort-header { white-space: normal; font-size: 11px; }
</style>
