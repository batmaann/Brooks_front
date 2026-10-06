<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
  targets: { text: string; side: boolean; left: number; top: number; width: number; height: number }[]
}>()
const emit = defineEmits<{ close: [] }>()
const overlay = ref<HTMLElement>()
onMounted(() => overlay.value?.focus())
</script>

<template>
  <Teleport to="body">
    <div ref="overlay" class="interface-help" role="dialog" aria-modal="true" aria-label="Подсказки по интерфейсу. Нажмите в любом месте, чтобы закрыть" tabindex="-1" @click.stop.prevent="emit('close')" @keydown.esc.stop.prevent="emit('close')" @keydown.tab.prevent @keydown.enter.prevent="emit('close')" @keydown.space.prevent="emit('close')">
      <div v-for="(target, index) in targets" :key="index" class="help-highlight" :style="{ left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px`, height: `${target.height}px` }">
        <span class="help-label" :class="target.side ? 'help-label-side' : 'help-label-top'">{{ target.text }}</span>
      </div>
      <p class="help-dismiss">Нажмите в любом месте, чтобы закрыть подсказки</p>
    </div>
  </Teleport>
</template>

<style scoped>
.interface-help { position: fixed; inset: 0; z-index: 1000; background: rgb(9 24 18 / 60%); cursor: pointer; outline: none; }
.help-highlight { position: absolute; border: 2px solid #d5ed52; border-radius: 8px; background: rgb(213 237 82 / 12%); box-shadow: 0 0 14px rgb(213 237 82 / 35%); pointer-events: none; }
.help-label { position: absolute; padding: 7px 10px; border-radius: 6px; color: #173a2f; background: #eff9ca; font-size: 12px; font-weight: 700; line-height: 1.4; width: max-content; max-width: min(260px, calc(100vw - 250px)); }
.help-label-side { left: calc(100% + 12px); top: 50%; transform: translateY(-50%); }
.help-label-top { right: 0; top: calc(100% + 12px); max-width: 180px; }
.help-highlight:nth-last-child(3) .help-label-top { top: calc(100% + 100px); }
.help-highlight:nth-last-child(2) .help-label-top { top: calc(100% + 56px); }
.help-dismiss { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: max-content; max-width: calc(100vw - 32px); padding: 12px 18px; border-radius: 10px; color: white; background: #153f31; text-align: center; font-size: 14px; pointer-events: none; }
@media (max-width: 520px) {
  .help-label-side { left: 8px; top: calc(100% + 12px); transform: none; max-width: 200px; }
  .help-label-top { max-width: 140px; font-size: 11px; }
}
</style>
