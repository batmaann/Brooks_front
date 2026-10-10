<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { HelpTarget } from './interfaceHelp'

const props = defineProps<{
  targets: HelpTarget[]
}>()
const emit = defineEmits<{ close: [] }>()
const overlay = ref<HTMLElement>()
const tooltip = ref<HTMLElement>()
const activeTarget = ref<number | null>(null)
const activeHelp = computed(() => activeTarget.value === null ? undefined : props.targets[activeTarget.value])
const tooltipPosition = ref({ left: '0px', top: '0px' })
const tooltipReady = ref(false)

function moveFocus(event: KeyboardEvent) {
  const elements = Array.from(overlay.value?.querySelectorAll<HTMLElement>('[tabindex="0"], button') ?? [])
  if (!elements.length) return
  const index = elements.indexOf(document.activeElement as HTMLElement)
  const nextIndex = event.shiftKey
    ? (index <= 0 ? elements.length - 1 : index - 1)
    : (index + 1) % elements.length
  elements[nextIndex]?.focus()
}

async function positionTooltip() {
  tooltipReady.value = false
  await nextTick()
  const target = activeHelp.value
  const label = tooltip.value
  if (!target || !label) return

  const margin = 12
  const gap = 12
  const { width, height } = label.getBoundingClientRect()
  let left = target.left + (target.width - width) / 2
  let top = target.top + target.height + gap

  if (target.side && target.left + target.width + gap + width <= window.innerWidth - margin) {
    left = target.left + target.width + gap
    top = target.top + (target.height - height) / 2
  } else if (target.placement === 'left' && target.left - gap - width >= margin) {
    left = target.left - gap - width
    top = target.top + (target.height - height) / 2
  } else if (top + height > window.innerHeight - margin) {
    top = target.top - height - gap
  }

  tooltipPosition.value = {
    left: `${Math.max(margin, Math.min(left, window.innerWidth - width - margin))}px`,
    top: `${Math.max(margin, Math.min(top, window.innerHeight - height - margin))}px`,
  }
  tooltipReady.value = true
}

watch([activeHelp, () => props.targets], positionTooltip, { flush: 'post' })
onMounted(() => overlay.value?.focus())
</script>

<template>
  <Teleport to="body">
    <div ref="overlay" class="interface-help" role="dialog" aria-modal="true" aria-label="Подсказки по интерфейсу" tabindex="-1" @click.self="emit('close')" @keydown.esc.stop.prevent="emit('close')" @keydown.tab.prevent="moveFocus">
      <div
        v-for="(target, index) in targets"
        :key="index"
        class="help-highlight"
        :class="{ 'help-active': activeTarget === index || (!!target.id && activeHelp?.related === target.id) }"
        :style="{ left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px`, height: `${target.height}px` }"
        tabindex="0"
        :aria-label="target.text.split(' — ')[0]"
        :aria-describedby="activeTarget === index ? 'interface-help-tooltip' : undefined"
        @mouseenter="activeTarget = index"
        @mouseleave="activeTarget = null"
        @focus="activeTarget = index"
        @blur="activeTarget = null"
        @click.stop="activeTarget = index"
      />
      <div
        v-if="activeHelp"
        id="interface-help-tooltip"
        ref="tooltip"
        class="help-label"
        role="tooltip"
        :style="{ ...tooltipPosition, visibility: tooltipReady ? 'visible' : 'hidden' }"
      >{{ activeHelp.text }}</div>
      <div class="help-dismiss">
        <span>Наведите на выделенный элемент, чтобы увидеть подсказку.</span>
        <button type="button" @click="emit('close')">Закрыть подсказки</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.interface-help { position: fixed; inset: 0; z-index: 1000; background: rgb(9 24 18 / 60%); outline: none; }
.help-highlight { position: absolute; border: 2px solid #d5ed52; border-radius: 8px; cursor: help; transition: background .15s, box-shadow .15s; }
.help-highlight.help-active, .help-highlight:focus-visible { background: rgb(213 237 82 / 18%); box-shadow: 0 0 14px rgb(213 237 82 / 45%); outline: none; }
.help-label { position: fixed; z-index: 1; width: max-content; max-width: min(320px, calc(100vw - 24px)); max-height: calc(100vh - 24px); padding: 12px 14px; border-radius: 8px; color: #173a2f; background: #eff9ca; box-shadow: 0 4px 18px rgb(0 0 0 / 20%); font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; pointer-events: none; }
.help-dismiss { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; width: max-content; max-width: calc(100vw - 32px); padding: 12px 18px; border-radius: 10px; color: white; background: #153f31; text-align: center; font-size: 14px; }
.help-dismiss button { flex-shrink: 0; padding: 6px 10px; border: 1px solid #d5ed52; border-radius: 6px; color: #eff9ca; background: transparent; cursor: pointer; font: inherit; }
.help-dismiss button:focus-visible { outline: 2px solid #d5ed52; outline-offset: 3px; }
@media (max-width: 760px) { .help-dismiss { flex-direction: column; gap: 8px; } }
</style>
