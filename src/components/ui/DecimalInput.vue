<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  min?: number
  modelValue: number
  required?: boolean
}>(), {
  min: undefined,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const input = ref<HTMLInputElement | null>(null)
const focused = ref(false)
const displayValue = ref(String(props.modelValue))
const decimalPattern = /^-?\d*(?:[.,]\d{0,2})?$/

function parsedValue(value: string) {
  const normalized = value.replace(',', '.')
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
  if (!decimalPattern.test(element.value)) {
    element.value = displayValue.value
    return
  }

  displayValue.value = element.value
  updateValidity(element.value)
  const parsed = parsedValue(element.value)
  if (parsed !== null) emit('update:modelValue', parsed)
}

function handleFocus() {
  focused.value = true
}

function handleBlur() {
  focused.value = false
  const parsed = parsedValue(displayValue.value)
  if (parsed !== null) {
    displayValue.value = parsed.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
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
  >
</template>
