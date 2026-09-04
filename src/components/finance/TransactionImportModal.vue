<script setup lang="ts">
import { Check, ClipboardPaste, FileClock, FileUp, Info, LoaderCircle, Paperclip, Upload, X } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useFormatters } from '@/composables/useFormatters'
import { confirmTransactionImport, getTransactionImport, getTransactionImportItems, getTransactionImports, updateTransactionImportItem, uploadTransactionImport } from '@/services/transactionService'
import type { BankLabel, Category, TransactionImport, TransactionImportItem, TransactionType } from '@/types/finance'

defineProps<{
  bankLabels: BankLabel[]
  categories: Category[]
}>()

const emit = defineEmits<{
  close: []
  imported: []
}>()

const { formatDate } = useFormatters()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const showInfo = ref(false)
const showAiCategoryInfo = ref(false)
const stage = ref<'select' | 'processing' | 'review' | 'confirming' | 'done'>('select')
const transactionImport = ref<TransactionImport | null>(null)
const items = ref<TransactionImportItem[]>([])
const error = ref('')
const selectedRowIds = ref<string[]>([])
const bulkCategory = ref('')
const bulkBank = ref('')
const bulkSaving = ref(false)
const readyImports = ref<TransactionImport[]>([])
const readyImportsLoading = ref(true)
const openingImportId = ref<string | null>(null)
const categorySavingItemId = ref<string | null>(null)
const typeSavingItemId = ref<string | null>(null)
const bankSavingItemId = ref<string | null>(null)
let pollTimer: ReturnType<typeof setTimeout> | null = null

const allowedFileExtensions = new Set(['csv', 'doc', 'docx', 'jpeg', 'jpg', 'ofd', 'ofx', 'pdf', 'png', 'webp', 'xls', 'xlsx'])
const allowedFileFormatsLabel = 'CSV, DOC, DOCX, JPEG, JPG, OFD, OFX, PDF, PNG, WEBP, XLS или XLSX'
const maxFileSize = 10 * 1024 * 1024
const clipboardMimeExtensions: Record<string, string> = {
  'application/msword': 'doc',
  'application/ofx': 'ofx',
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/csv': 'csv',
}

const modalTitle = computed(() => ({
  select: 'Прикрепить файл',
  processing: 'Обработка файла',
  review: 'Проверка операций',
  confirming: 'Импорт операций',
  done: 'Импорт завершён',
})[stage.value])

const selectedItems = computed(() => items.value.filter((item) => selectedRowIds.value.includes(item.id)))
const allRowsSelected = computed(() => Boolean(items.value.length) && selectedRowIds.value.length === items.value.length)
function selectFile(file: File | undefined, fromClipboard = false) {
  if (!file) {
    if (fromClipboard) error.value = 'В буфере обмена нет файла. Текст и другие данные импортировать нельзя.'
    return false
  }
  let normalizedFile = file
  let extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : ''
  const clipboardExtension = clipboardMimeExtensions[file.type]
  if (!allowedFileExtensions.has(extension) && clipboardExtension) {
    extension = clipboardExtension
    normalizedFile = new File([file], `файл-из-буфера.${extension}`, {
      type: file.type,
      lastModified: file.lastModified,
    })
  }
  if (!allowedFileExtensions.has(extension)) {
    error.value = `${fromClipboard ? 'Этот объект из буфера' : 'Этот файл'} нельзя импортировать. Допустимые форматы: ${allowedFileFormatsLabel}.`
    return false
  }
  if (!file.size) {
    error.value = 'Нельзя импортировать пустой файл.'
    return false
  }
  if (file.size > maxFileSize) {
    error.value = 'Размер файла превышает допустимые 10 МБ.'
    return false
  }
  selectedFile.value = normalizedFile
  error.value = ''
  return true
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (!selectFile(input.files?.[0])) input.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  selectFile(event.dataTransfer?.files[0])
}

function onPaste(event: ClipboardEvent) {
  if (stage.value !== 'select') return
  const file = event.clipboardData?.files[0] || Array.from(event.clipboardData?.items || [])
    .find((item) => item.kind === 'file')
    ?.getAsFile()
  event.preventDefault()
  selectFile(file || undefined, true)
}

async function pasteFileFromClipboard() {
  error.value = ''
  try {
    if (!navigator.clipboard?.read) throw new Error('Вставьте файл сочетанием Ctrl+V или Cmd+V.')
    const clipboardItems = await navigator.clipboard.read()
    for (const clipboardItem of clipboardItems) {
      const mimeType = clipboardItem.types.find((type) => Boolean(clipboardMimeExtensions[type]))
      if (!mimeType) continue
      const blob = await clipboardItem.getType(mimeType)
      const extension = clipboardMimeExtensions[mimeType]
      selectFile(new File([blob], `файл-из-буфера.${extension}`, { type: mimeType }), true)
      return
    }
    throw new Error('В буфере обмена нет поддерживаемого файла. Текст, архивы и другие данные импортировать нельзя.')
  } catch (clipboardError) {
    error.value = clipboardError instanceof Error ? clipboardError.message : 'Не удалось прочитать буфер обмена.'
  }
}

function close() {
  if (pollTimer) clearTimeout(pollTimer)
  selectedFile.value = null
  emit('close')
}

function formatAmount(item: TransactionImportItem) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: item.currency || 'RUB' }).format(Number(item.amount))
}

function openSelectOnFirstClick(event: MouseEvent) {
  const select = event.currentTarget as HTMLSelectElement
  if (typeof select.showPicker !== 'function') return
  event.preventDefault()
  select.focus()
  select.showPicker()
}

function toggleRow(id: string) {
  selectedRowIds.value = selectedRowIds.value.includes(id)
    ? selectedRowIds.value.filter((itemId) => itemId !== id)
    : [...selectedRowIds.value, id]
}

function toggleAllRows() {
  selectedRowIds.value = allRowsSelected.value ? [] : items.value.map((item) => item.id)
}

async function applyBulkChange(field: 'category_id' | 'bank_label_id', rawValue: string) {
  if (!rawValue || !selectedRowIds.value.length) return
  bulkSaving.value = true
  error.value = ''
  const value = rawValue === '__clear__' ? null : Number(rawValue)
  try {
    const updates = await Promise.all(selectedRowIds.value.map((id) => updateTransactionImportItem(id, { [field]: value })))
    const updatesById = new Map(updates.map((item) => [item.id, item]))
    items.value = items.value.map((item) => updatesById.get(item.id) || item)
    if (field === 'category_id') bulkCategory.value = ''
    else bulkBank.value = ''
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось изменить выбранные операции.'
  } finally {
    bulkSaving.value = false
  }
}

async function updateItemCategory(item: TransactionImportItem, rawValue: string) {
  categorySavingItemId.value = item.id
  error.value = ''
  try {
    const updated = await updateTransactionImportItem(item.id, {
      category_id: rawValue === '__clear__' ? null : Number(rawValue),
    })
    const index = items.value.findIndex((current) => current.id === updated.id)
    if (index !== -1) items.value[index] = updated
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось изменить категорию.'
  } finally {
    categorySavingItemId.value = null
  }
}

async function updateItemType(item: TransactionImportItem, transactionType: TransactionType) {
  typeSavingItemId.value = item.id
  error.value = ''
  try {
    const updated = await updateTransactionImportItem(item.id, { transaction_type: transactionType })
    const index = items.value.findIndex((current) => current.id === updated.id)
    if (index !== -1) items.value[index] = updated
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось изменить тип операции.'
  } finally {
    typeSavingItemId.value = null
  }
}

async function updateItemBank(item: TransactionImportItem, rawValue: string) {
  bankSavingItemId.value = item.id
  error.value = ''
  try {
    const updated = await updateTransactionImportItem(item.id, {
      bank_label_id: rawValue === '__clear__' ? null : Number(rawValue),
    })
    const index = items.value.findIndex((current) => current.id === updated.id)
    if (index !== -1) items.value[index] = updated
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось изменить банк.'
  } finally {
    bankSavingItemId.value = null
  }
}

async function pollImport() {
  if (!transactionImport.value) return
  try {
    transactionImport.value = await getTransactionImport(transactionImport.value.id)
    if (transactionImport.value.status === 'ready') {
      items.value = await getTransactionImportItems(transactionImport.value.id)
      stage.value = 'review'
      return
    }
    if (transactionImport.value.status === 'failed' || transactionImport.value.status === 'cancelled') {
      error.value = transactionImport.value.error || 'Не удалось обработать файл.'
      stage.value = 'select'
      return
    }
    pollTimer = setTimeout(pollImport, 2000)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось получить статус импорта.'
    stage.value = 'select'
  }
}

async function startImport() {
  if (!selectedFile.value) return
  error.value = ''
  stage.value = 'processing'
  try {
    transactionImport.value = await uploadTransactionImport(selectedFile.value)
    await pollImport()
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось загрузить файл.'
    stage.value = 'select'
  }
}

async function loadReadyImports() {
  readyImportsLoading.value = true
  try {
    readyImports.value = (await getTransactionImports()).filter((item) => item.status === 'ready')
  } catch {
    readyImports.value = []
  } finally {
    readyImportsLoading.value = false
  }
}

async function openReadyImport(item: TransactionImport) {
  error.value = ''
  openingImportId.value = item.id
  try {
    transactionImport.value = await getTransactionImport(item.id)
    items.value = await getTransactionImportItems(item.id)
    selectedRowIds.value = []
    bulkCategory.value = ''
    bulkBank.value = ''
    stage.value = 'review'
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось открыть черновик импорта.'
  } finally {
    openingImportId.value = null
  }
}

async function acceptImport() {
  if (!transactionImport.value || !selectedItems.value.length) return
  error.value = ''
  stage.value = 'confirming'
  try {
    transactionImport.value = await confirmTransactionImport(transactionImport.value.id, selectedItems.value.map((item) => item.id))
    await pollConfirmation()
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось импортировать операции.'
    stage.value = 'review'
  }
}

async function pollConfirmation() {
  if (!transactionImport.value) return
  try {
    transactionImport.value = await getTransactionImport(transactionImport.value.id)
    if (transactionImport.value.status === 'confirmed') {
      stage.value = 'done'
      emit('imported')
      return
    }
    if (transactionImport.value.status === 'failed') {
      error.value = transactionImport.value.error || 'Не удалось импортировать операции.'
      stage.value = 'review'
      return
    }
    pollTimer = setTimeout(pollConfirmation, 2000)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось получить статус импорта.'
    stage.value = 'review'
  }
}

onMounted(() => {
  loadReadyImports()
  window.addEventListener('paste', onPaste)
})
onBeforeUnmount(() => {
  if (pollTimer) clearTimeout(pollTimer)
  window.removeEventListener('paste', onPaste)
})

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}
</script>

<template>
  <BaseModal eyebrow="Импорт операций" :title="modalTitle" :extra-wide="stage === 'review'" @close="close">
    <template #header-actions>
      <button
        class="icon-button transaction-import-info-button"
        :aria-expanded="showInfo"
        aria-controls="transaction-import-info"
        title="Информация об импорте"
        type="button"
        @click="showInfo = !showInfo"
      ><Info :size="16" /></button>
    </template>
    <aside v-if="showInfo" id="transaction-import-info" class="transaction-import-info" role="note">
      <p>Вы можете загрузить файл с операциями для добавления транзакций. Для наиболее точного анализа рекомендуем использовать понятный структурированный формат, в котором указаны дата, категория, сумма и тип операции — доход или расход.</p>
      <p>Сервис не принимает архивы и не предназначен для обработки файлов большого объёма: такие документы могут быть обработаны неточно или с ошибкой. Искусственный интеллект предложит категории на основе категорий, созданных в вашем аккаунте.</p>
      <p>Мы не сохраняем реквизиты банковских карт и CVV-коды. Пожалуйста, перед загрузкой убедитесь, что файл не содержит избыточных персональных или платёжных данных. Мы принимаем меры для защиты информации и снижения риска её раскрытия.</p>
    </aside>
    <div v-if="showAiCategoryInfo" class="transaction-import-ai-dialog-backdrop" @mousedown.self="showAiCategoryInfo = false">
      <section class="transaction-import-ai-dialog" role="dialog" aria-modal="true" aria-labelledby="transaction-import-ai-dialog-title">
        <div><Info :size="20" /><strong id="transaction-import-ai-dialog-title">Категория Brooks</strong></div>
        <p>Категорию назначает AI на основе категорий, которые вы уже создали в Brooks. AI может ошибиться с назначением, поэтому внимательно проверьте значения в этой колонке перед принятием импорта.</p>
        <button class="primary-button" type="button" @click="showAiCategoryInfo = false">Понятно</button>
      </section>
    </div>
    <div v-if="stage === 'select'" class="transaction-import-content">
      <div
        class="transaction-import-dropzone"
        :class="{ dragging: isDragging, selected: selectedFile }"
        role="button"
        tabindex="0"
        @click="fileInput?.click()"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
        @keydown.enter.prevent="fileInput?.click()"
        @keydown.space.prevent="fileInput?.click()"
      >
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept=".csv,.doc,.docx,.jpeg,.jpg,.ofd,.ofx,.pdf,.png,.webp,.xls,.xlsx"
          @change="onFileInput"
        >
        <template v-if="selectedFile">
          <div class="transaction-import-file-icon"><FileUp :size="24" /></div>
          <strong>{{ selectedFile.name }}</strong>
          <span>{{ formatFileSize(selectedFile.size) }}</span>
          <button class="text-button" type="button" @click.stop="selectedFile = null"><X :size="14" />Удалить файл</button>
        </template>
        <template v-else>
          <div class="transaction-import-file-icon"><Upload :size="24" /></div>
          <strong>Перетащите файл сюда</strong>
          <span>или выберите его на устройстве</span>
          <div class="transaction-import-file-actions"><button class="secondary-button" type="button" @click.stop="fileInput?.click()"><Paperclip :size="17" />Выбрать файл</button><button class="secondary-button" type="button" @click.stop="pasteFileFromClipboard"><ClipboardPaste :size="17" />Вставить из буфера</button></div>
        </template>
      </div>
      <p v-if="error" class="transaction-import-error">{{ error }}</p>
      <p class="transaction-import-hint">Поддерживаются выписки и документы: CSV, XLSX, OFX, PDF, изображения и DOCX. Файл также можно вставить сочетанием Ctrl+V или Cmd+V.</p>
      <button class="primary-button" type="button" :disabled="!selectedFile" @click="startImport"><Upload :size="17" />Импортировать файл</button>
      <section class="transaction-import-drafts">
        <div class="transaction-import-drafts-heading"><strong>Готовые импорты</strong><span>Можно вернуться к черновику без повторной загрузки файла</span></div>
        <p v-if="readyImportsLoading" class="transaction-import-drafts-empty">Загружаем список…</p>
        <p v-else-if="!readyImports.length" class="transaction-import-drafts-empty">Готовых черновиков пока нет.</p>
        <div v-else class="transaction-import-draft-list">
          <button v-for="item in readyImports" :key="item.id" class="transaction-import-draft-button" type="button" :disabled="openingImportId !== null" @click="openReadyImport(item)">
            <FileClock :size="18" /><span><strong>{{ item.original_filename }}</strong><small>{{ formatDate(item.created_at.slice(0, 10)) }} · {{ item.total_rows }} операций<span v-if="item.detected_bank"> · {{ item.detected_bank }}</span></small></span><LoaderCircle v-if="openingImportId === item.id" class="transaction-import-spinner" :size="17" />
          </button>
        </div>
      </section>
    </div>
    <div v-else-if="stage === 'processing' || stage === 'confirming'" class="transaction-import-processing">
      <LoaderCircle class="transaction-import-spinner" :size="42" />
      <strong>{{ stage === 'processing' ? 'Brooks AI обрабатывает файл' : 'Операции добавляются' }}</strong>
      <span>{{ selectedFile?.name }}</span>
      <p>{{ stage === 'processing' ? 'Определяем даты, типы, категории, суммы и банк. Это может занять несколько минут.' : 'Пожалуйста, не закрывайте окно до завершения импорта.' }}</p>
    </div>
    <div v-else-if="stage === 'review'" class="transaction-import-review">
      <p v-if="error" class="transaction-import-error">{{ error }}</p>
      <div class="transaction-import-review-summary"><strong>Найдено операций: {{ items.length }}</strong><span>Проверьте результат распознавания перед импортом.</span></div>
      <div class="transaction-import-actions transaction-import-actions-top"><button class="secondary-button transaction-import-cancel-button" type="button" title="Отменить импорт" @click="close">Отмена</button><span class="transaction-import-accept-wrap" :title="selectedItems.length ? '' : 'Для принятия импорта надо выбрать транзакции'"><button class="primary-button" type="button" :disabled="!selectedItems.length" @click="acceptImport"><Check :size="17" />Принять импорт ({{ selectedItems.length }})</button></span></div>
      <div v-if="selectedRowIds.length" class="transaction-import-bulk-actions">
        <strong>Выбрано: {{ selectedRowIds.length }}</strong>
        <select v-model="bulkCategory" :disabled="bulkSaving" @change="applyBulkChange('category_id', bulkCategory)">
          <option value="">Изменить категорию</option><option value="__clear__">Без категории</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
        <select v-model="bulkBank" :disabled="bulkSaving" @change="applyBulkChange('bank_label_id', bulkBank)">
          <option value="">Изменить банк</option><option value="__clear__">Без банка</option><option v-for="bank in bankLabels" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
        </select>
        <span v-if="bulkSaving">Сохраняем…</span>
        <button class="text-button" type="button" :disabled="bulkSaving" @click="selectedRowIds = []">Снять выделение</button>
      </div>
      <div class="transaction-import-table-wrap">
        <table class="transaction-import-table">
          <thead><tr><th class="transaction-import-select"><input type="checkbox" :checked="allRowsSelected" aria-label="Выбрать все строки" @change="toggleAllRows"></th><th>№</th><th>Дата</th><th>Тип операции</th><th>Категория из файла</th><th><span class="transaction-import-ai-heading">Категория Brooks<button type="button" title="Как AI назначает категорию" aria-label="Информация о категории Brooks" @click="showAiCategoryInfo = true"><Info :size="12" /></button></span></th><th>Описание</th><th>Сумма</th><th>Банк</th></tr></thead>
          <tbody><tr v-for="item in items" :key="item.id" :class="{ selected: selectedRowIds.includes(item.id) }"><td class="transaction-import-select"><input type="checkbox" :checked="selectedRowIds.includes(item.id)" :aria-label="`Выбрать строку ${item.row_number}`" @change="toggleRow(item.id)"></td><td>{{ item.row_number }}</td><td>{{ formatDate(item.date) }}</td><td class="transaction-import-type-cell"><select class="transaction-import-type-select" :class="item.transaction_type" :value="item.transaction_type" :disabled="typeSavingItemId === item.id" title="Изменить тип операции" @mousedown="openSelectOnFirstClick" @change="updateItemType(item, ($event.target as HTMLSelectElement).value as TransactionType)"><option value="expense">Трата</option><option value="income">Доход</option><option value="saving">Накопление</option></select></td><td>{{ item.bank_category || '—' }}</td><td class="transaction-import-category-cell" :title="item.category_reason"><select class="transaction-import-category-select" :class="{ empty: item.category_id === null }" :value="item.category_id ?? '__clear__'" :disabled="categorySavingItemId === item.id" title="Изменить категорию Brooks" @mousedown="openSelectOnFirstClick" @change="updateItemCategory(item, ($event.target as HTMLSelectElement).value)"><option value="__clear__">Без категории</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></td><td class="transaction-import-description" :title="item.description">{{ item.description || '—' }}</td><td class="transaction-import-amount">{{ formatAmount(item) }}</td><td class="transaction-import-bank-cell"><select class="transaction-import-bank-select" :class="{ empty: item.bank_label_id === null }" :value="item.bank_label_id ?? '__clear__'" :disabled="bankSavingItemId === item.id" title="Изменить банк" @mousedown="openSelectOnFirstClick" @change="updateItemBank(item, ($event.target as HTMLSelectElement).value)"><option value="__clear__">Без банка</option><option v-for="bank in bankLabels" :key="bank.id" :value="bank.id">{{ bank.name }}</option></select></td></tr></tbody>
        </table>
      </div>
    </div>
    <div v-else class="transaction-import-processing transaction-import-success">
      <Check :size="42" />
      <strong>Импорт завершён</strong>
      <p>Добавлено операций: {{ transactionImport?.created_rows || 0 }}.</p>
      <button class="primary-button" type="button" @click="close">Готово</button>
    </div>
  </BaseModal>
</template>
