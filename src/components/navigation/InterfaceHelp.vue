<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { HelpTarget } from './interfaceHelp'

const props = defineProps<{
  targets: HelpTarget[]
}>()
const contentTargets = computed(() => props.targets.filter((target) => target.content))
const navigationTargets = computed(() => props.targets.filter((target) => !target.content))
const columnTargets = computed(() => contentTargets.value.filter((target) => target.placement !== 'left'))
const emit = defineEmits<{ close: [] }>()
const overlay = ref<HTMLElement>()
const arrows = ref<{ path: string; targetIndex: number }[]>([])
const activeTarget = ref<number | null>(null)

function highlightTarget(target: HelpTarget) {
  activeTarget.value = props.targets.indexOf(target)
  const label = overlay.value?.querySelector<HTMLElement>(`.help-cards [data-help-label="${activeTarget.value}"]`)
  const guide = label?.closest<HTMLElement>('.help-guide')
  if (!label || !guide) return
  const rect = label.getBoundingClientRect()
  const bounds = guide.getBoundingClientRect()
  if (rect.top < bounds.top) guide.scrollTop += rect.top - bounds.top - 4
  else if (rect.bottom > bounds.bottom) guide.scrollTop += rect.bottom - bounds.bottom + 4
}

function measureArrows() {
  arrows.value = Array.from(overlay.value?.querySelectorAll<HTMLElement>('[data-help-label]') ?? []).flatMap((label) => {
    const target = props.targets[Number(label.dataset.helpLabel)]
    if (!target) return []
    const arrow = (path: string) => [{ path, targetIndex: Number(label.dataset.helpLabel) }]
    const rect = label.getBoundingClientRect()
    const guide = label.closest('.help-guide')?.getBoundingClientRect()
    if (guide && (rect.top < guide.top || rect.bottom > guide.bottom)) return []
    const endX = target.left + target.width / 2
    const endY = target.top + target.height
    if (endX < 0 || endX > window.innerWidth || endY < 0 || target.top > window.innerHeight) return []
    if (target.side && rect.left > target.left + target.width) {
      const y = target.top + target.height / 2
      return arrow(`M ${rect.left} ${rect.top + rect.height / 2} L ${target.left + target.width + 3} ${y}`)
    }
    if (target.placement === 'left' && rect.right < target.left) {
      return arrow(`M ${rect.right} ${rect.top + rect.height / 2} L ${target.left - 4} ${target.top + target.height / 2}`)
    }
    const startX = rect.left + rect.width / 2
    const above = rect.bottom < target.top
    const startY = above ? rect.bottom : rect.top
    const arrowY = above ? target.top - 4 : endY + 4
    const bendY = (startY + arrowY) / 2
    return arrow(`M ${startX} ${startY} C ${startX} ${bendY}, ${endX} ${bendY}, ${endX} ${arrowY}`)
  })
}

watch(() => props.targets, async () => { await nextTick(); measureArrows() }, { flush: 'post' })
onMounted(async () => {
  overlay.value?.focus()
  await nextTick()
  measureArrows()
  window.addEventListener('resize', measureArrows)
})
onBeforeUnmount(() => window.removeEventListener('resize', measureArrows))
</script>

<template>
  <Teleport to="body">
    <div ref="overlay" class="interface-help" role="dialog" aria-modal="true" aria-label="Подсказки по интерфейсу. Нажмите в любом месте, чтобы закрыть" tabindex="-1" @click.stop.prevent="emit('close')" @keydown.esc.stop.prevent="emit('close')" @keydown.tab.prevent @keydown.enter.prevent="emit('close')" @keydown.space.prevent="emit('close')">
      <svg class="help-arrows" aria-hidden="true">
        <defs><marker id="interface-help-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#d5ed52" /></marker></defs>
        <path v-for="(arrow, index) in arrows" :key="index" :d="arrow.path" :class="{ 'help-arrow-active': activeTarget === arrow.targetIndex }" fill="none" stroke="#d5ed52" stroke-width="2" marker-end="url(#interface-help-arrow)" />
      </svg>
      <div v-for="(target, index) in navigationTargets" :key="index" class="help-highlight" :class="{ 'help-active': activeTarget === targets.indexOf(target) }" :style="{ left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px`, height: `${target.height}px` }" @mouseenter="highlightTarget(target)" @mouseleave="activeTarget = null">
        <span class="help-label" :data-help-label="targets.indexOf(target)" :class="target.side ? 'help-label-side' : 'help-label-top'" :style="target.side ? undefined : { top: `${12 + (navigationTargets.length - index - 1) * 56 + target.height}px` }">{{ target.text }}</span>
      </div>
      <div v-for="(target, index) in contentTargets" :key="`content-${index}`" class="help-highlight" :class="{ 'help-active': activeTarget === targets.indexOf(target) }" :style="{ left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px`, height: `${target.height}px` }" @mouseenter="highlightTarget(target)" @mouseleave="activeTarget = null">
        <span v-if="target.placement === 'left'" class="help-label help-label-add" :data-help-label="targets.indexOf(target)" :style="target.left >= 180 ? { width: `${Math.min(300, target.left - 40)}px` } : { left: `${16 - target.left}px`, right: 'auto', top: 'auto', bottom: 'calc(100% + 24px)', transform: 'none', width: '260px', maxWidth: 'calc(100vw - 32px)' }">{{ target.text }}</span>
      </div>
      <section v-if="columnTargets.length" class="help-guide" @scroll="measureArrows">
        <strong>Поля таблицы операций</strong>
        <div class="help-cards"><article v-for="(target, index) in columnTargets" :key="index" :data-help-label="targets.indexOf(target)" :class="{ 'help-active': activeTarget === targets.indexOf(target) }" @mouseenter="highlightTarget(target)" @mouseleave="activeTarget = null">
          <strong>{{ target.text.split(' — ')[0] }}</strong>
          <p>{{ target.text.split(' — ').slice(1).join(' — ') }}</p>
        </article></div>
      </section>
      <p class="help-dismiss">Наведите на элемент, чтобы выделить пояснение. Нажмите в любом месте, чтобы закрыть.</p>
    </div>
  </Teleport>
</template>

<style scoped>
.interface-help { position: fixed; inset: 0; z-index: 1000; background: rgb(9 24 18 / 60%); cursor: pointer; outline: none; }
.help-arrows { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }
.help-highlight { position: absolute; border: 2px solid #d5ed52; border-radius: 8px; background: rgb(213 237 82 / 12%); box-shadow: 0 0 14px rgb(213 237 82 / 35%); pointer-events: auto; transition: background .15s, box-shadow .15s; }
.help-highlight.help-active { background: rgb(213 237 82 / 30%); box-shadow: 0 0 22px rgb(213 237 82 / 75%); }
.help-arrow-active { stroke-width: 4; filter: drop-shadow(0 0 4px #d5ed52); }
.help-active > .help-label { background: #d5ed52; box-shadow: 0 0 18px rgb(213 237 82 / 65%); }
.help-label { position: absolute; padding: 7px 10px; border-radius: 6px; color: #173a2f; background: #eff9ca; font-size: 12px; font-weight: 700; line-height: 1.4; width: max-content; max-width: min(260px, calc(100vw - 250px)); }
.help-label-side { left: calc(100% + 12px); top: 50%; transform: translateY(-50%); }
.help-label-top { right: 0; top: calc(100% + 12px); max-width: 180px; }
.help-label-add { right: calc(100% + 24px); top: 50%; transform: translateY(-50%); max-width: none; }
.help-guide { position: absolute; right: 20px; left: 248px; bottom: 90px; max-height: 36vh; overflow-y: auto; padding: 4px; color: #eff9ca; font-size: 12px; line-height: 1.5; }
.help-guide > strong { display: block; margin-bottom: 12px; font-size: 15px; }
.help-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.help-cards article { padding: 12px; border: 1px solid #d5ed52; border-radius: 10px; background: #eff9ca; color: #173a2f; }
.help-cards article.help-active { background: #d5ed52; box-shadow: inset 0 0 0 2px #173a2f, 0 0 14px rgb(213 237 82 / 60%); }
.help-cards strong { font-size: 13px; }
.help-cards p { margin: 5px 0 0; }
@media (max-width: 1000px) { .help-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) { .help-guide { left: 16px; right: 16px; max-height: 32vh; } }
.help-dismiss { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: max-content; max-width: calc(100vw - 32px); padding: 12px 18px; border-radius: 10px; color: white; background: #153f31; text-align: center; font-size: 14px; pointer-events: none; }
@media (max-width: 520px) {
  .help-label-side { left: 8px; top: calc(100% + 12px); transform: none; max-width: 200px; }
  .help-label-top { max-width: 140px; font-size: 11px; }
}
</style>
