<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import DecimalInput from '@/components/ui/DecimalInput.vue'
import type { BankLabel, Category, Section, TransactionDraft, TransactionType } from '@/types/finance'

const props = defineProps<{
  form: TransactionDraft
  bankLabels: BankLabel[]
  categories: Category[]
  sections: Section[]
  saving: boolean
  error: string
  notice: string
  editing?: boolean
}>()
const emit = defineEmits<{
  cancel: []
  create: [addAnother: boolean]
  'update:form': [form: TransactionDraft]
}>()
const dialog = ref<HTMLElement>()
const amountField = ref<HTMLElement>()
const viewportHeight = ref(window.visualViewport?.height ?? window.innerHeight)
const viewportTop = ref(window.visualViewport?.offsetTop ?? 0)
const addAnother = ref(false)
const types: { value: TransactionType, label: string }[] = [
  { value: 'expense', label: 'Расход' },
  { value: 'income', label: 'Доход' },
  { value: 'saving', label: 'Накопление' },
]
const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
const previousOverflow = document.body.style.overflow
const appShell = document.querySelector<HTMLElement>('.app-shell')
const previousInert = appShell?.inert ?? false

function update<K extends keyof TransactionDraft>(field: K, value: TransactionDraft[K]) {
  emit('update:form', { ...props.form, [field]: value })
}
function selection(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  return value ? Number(value) : null
}
function measureViewport() {
  viewportHeight.value = window.visualViewport?.height ?? window.innerHeight
  viewportTop.value = window.visualViewport?.offsetTop ?? 0
}
function handleKeys(event: KeyboardEvent) {
  if (event.key === 'Escape' && !props.saving) emit('cancel')
  if (event.key !== 'Tab') return
  const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button, input, select, textarea') ?? [])
    .filter(element => !element.matches(':disabled') && element.getClientRects().length > 0)
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
function submit() {
  if (props.saving) return
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  emit('create', addAnother.value)
}
watch(() => props.notice, async (notice) => {
  if (!notice) return
  await nextTick()
  amountField.value?.querySelector('input')?.focus()
})
onMounted(async () => {
  document.body.style.overflow = 'hidden'
  if (appShell) appShell.inert = true
  window.visualViewport?.addEventListener('resize', measureViewport)
  window.visualViewport?.addEventListener('scroll', measureViewport)
  window.addEventListener('resize', measureViewport)
  await nextTick()
  amountField.value?.querySelector('input')?.focus()
})
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow
  if (appShell) appShell.inert = previousInert
  window.visualViewport?.removeEventListener('resize', measureViewport)
  window.visualViewport?.removeEventListener('scroll', measureViewport)
  window.removeEventListener('resize', measureViewport)
  previousFocus?.focus()
})
</script>

<template>
  <Teleport to="body">
    <div class="mobile-transaction-backdrop" :style="{ height: `${viewportHeight}px`, top: `${viewportTop}px` }">
      <section ref="dialog" class="mobile-transaction-dialog" role="dialog" aria-modal="true" aria-labelledby="mobile-transaction-title" @keydown="handleKeys">
        <header>
          <h2 id="mobile-transaction-title">{{ editing ? 'Изменить операцию' : 'Новая операция' }}</h2>
          <button class="icon-button" type="button" aria-label="Закрыть" :disabled="saving" @click="emit('cancel')"><X :size="20" /></button>
        </header>
        <form @submit.prevent="submit">
          <div class="mobile-transaction-fields">
            <p v-if="notice" role="status">{{ notice }}</p>
            <fieldset :disabled="saving">
              <legend class="visually-hidden">Тип операции</legend>
              <div class="segmented-control">
                <button v-for="type in types" :key="type.value" type="button" :class="{ active: form.transaction_type === type.value }" :aria-pressed="form.transaction_type === type.value" @click="update('transaction_type', type.value)">{{ type.label }}</button>
              </div>
              <label ref="amountField" class="mobile-transaction-amount">Сумма, {{ form.currency }}
                <DecimalInput :model-value="form.amount" required :min="0.01" select-on-focus group-thousands enter-next @update:model-value="update('amount', $event)" />
              </label>
              <label>Категория<select :value="form.category ?? ''" @change="update('category', selection($event))"><option value="">Без категории</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></label>
              <label>Банк<select :value="form.bank_label ?? ''" @change="update('bank_label', selection($event))"><option value="">Без банка</option><option v-for="bank in bankLabels" :key="bank.id" :value="bank.id">{{ bank.name }}</option></select></label>
              <label>Дата<input type="date" required :value="form.date" @input="update('date', ($event.target as HTMLInputElement).value)"></label>
              <label v-if="sections.length">Раздел<select :value="form.section ?? ''" @change="update('section', selection($event))"><option value="">Без раздела</option><option v-for="section in sections" :key="section.id" :value="section.id">{{ section.name }}</option></select></label>
              <label>Описание <span class="optional">необязательно</span><textarea rows="2" placeholder="Например, продукты на неделю" :value="form.description" @input="update('description', ($event.target as HTMLTextAreaElement).value)"></textarea></label>
            </fieldset>
            <p v-if="error" class="error-banner" role="alert">{{ error }}</p>
          </div>
          <footer>
            <label v-if="!editing" class="mobile-add-another"><input v-model="addAnother" type="checkbox" :disabled="saving">Добавить ещё после сохранения</label>
            <button class="primary-button" type="submit" :disabled="saving">{{ saving ? 'Сохраняем…' : editing ? 'Сохранить изменения' : 'Добавить операцию' }}</button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.mobile-transaction-backdrop { position: fixed; inset-inline: 0; z-index: 60; background: var(--surface); }
.mobile-transaction-dialog { height: 100%; display: flex; flex-direction: column; color: var(--ink); background: var(--surface); }
header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--line); }
h2 { font-size: 20px; }
form { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.mobile-transaction-fields { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 16px; }
fieldset { min-width: 0; margin: 0; padding: 0; border: 0; display: grid; gap: 16px; }
label { min-width: 0; display: grid; gap: 7px; }
input, select, textarea { width: 100%; min-width: 0; min-height: 46px; font-size: 16px; }
.mobile-transaction-amount :deep(input) { min-height: 64px; font-size: 30px; font-weight: 800; }
.optional { color: var(--muted); font-size: 12px; }
footer { flex-shrink: 0; padding: 12px 16px max(12px, env(safe-area-inset-bottom)); border-top: 1px solid var(--line); display: grid; gap: 10px; background: var(--surface); }
footer .primary-button { width: 100%; min-height: 48px; }
.mobile-add-another { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.mobile-add-another input { width: 20px; min-height: 20px; height: 20px; }
.error-banner { margin-top: 16px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
