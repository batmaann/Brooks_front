<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  min?: number
  modelValue: number
  required?: boolean
  selectOnFocus?: boolean
  groupThousands?: boolean
  enterNext?: boolean
}>(), {
  min: undefined,
  required: false,
  selectOnFocus: false,
  groupThousands: false,
  enterNext: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const input = ref<HTMLInputElement | null>(null)
const focused = ref(false)
const displayValue = ref(String(props.modelValue))
const decimalPattern = /^-?\d*(?:[.,]\d{0,2})?$/

function parsedValue(value: string) {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function updateValidity(value: string) {
  const parsed = parsedValue(value)
  const missing = props.required && parsed === null
  const belowMinimum = parsed !== null && props.min !== undefined && parsed < props.min
  input.value?.setCustomValidity(missing || belowMinimum ? 'Введите корректное число' : '')
}

function handleInput(event: Event) {
  const element = event.target as HTMLInputElement
  const normalized = element.value.replace(/\s/g, '')
  if (!decimalPattern.test(normalized)) {
    element.value = displayValue.value
    return
  }

  if (element.value !== normalized) element.value = normalized
  displayValue.value = normalized
  updateValidity(element.value)
  const parsed = parsedValue(element.value)
  if (parsed !== null) emit('update:modelValue', parsed)
}

function handleFocus() {
  focused.value = true
  displayValue.value = displayValue.value.replace(/\s/g, '')
  if (input.value) {
    input.value.value = displayValue.value
    if (props.selectOnFocus) input.value.select()
  }
}

function handleMouseDown(event: MouseEvent) {
  if (!props.selectOnFocus || focused.value) return
  event.preventDefault()
  input.value?.focus()
}

function handleEnter(event: KeyboardEvent) {
  if (!props.enterNext || event.isComposing) return
  event.preventDefault()
  const container = input.value?.closest('tr, form')
  const controls = Array.from(container?.querySelectorAll<HTMLElement>('input, select, textarea, button') ?? [])
    .filter((element) => !element.matches(':disabled, [type="hidden"]') && element.tabIndex >= 0 && element.getClientRects().length > 0)
  const index = controls.indexOf(input.value!)
  controls[index + 1]?.focus()
}

function handleBlur() {
  focused.value = false
  const parsed = parsedValue(displayValue.value)
  if (parsed !== null) {
    displayValue.value = parsed.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: props.groupThousands,
    })
  }
  updateValidity(displayValue.value)
}

watch(() => props.modelValue, (value) => {
  if (!focused.value && parsedValue(displayValue.value) !== value) displayValue.value = String(value)
})

onMounted(() => updateValidity(displayValue.value))
</script>

<template>
  <input
    ref="input"
    :value="displayValue"
    autocomplete="off"
    inputmode="decimal"
    type="text"
    @blur="handleBlur"
    @focus="handleFocus"
    @input="handleInput"
    @mousedown="handleMouseDown"
    @keydown.enter="handleEnter"
  >
</template>
