<script setup lang="ts">
import { LogOut, X } from '@lucide/vue'
import { navItems } from '@/constants/navigation'
import type { AppView, NavItem } from '@/types/navigation'

defineProps<{
  activeView: AppView
  open: boolean
}>()

const emit = defineEmits<{
  about: []
  close: []
  logout: []
  select: [view: AppView]
}>()

function selectItem(item: NavItem) {
  if (item.disabled) return
  emit('select', item.id as AppView)
}
</script>

<template>
  <aside class="sidebar" :class="{ open }">
    <div class="sidebar-brand">
      <div class="brand-mark small"><span class="brand-ruble">₽</span></div>
      <strong>Brooks</strong>
      <button class="icon-button mobile-close" title="Закрыть меню" @click="emit('close')"><X :size="20" /></button>
    </div>
    <nav data-help="Разделы приложения — выберите нужный раздел в этом меню">
      <button
        v-for="item in navItems"
        :key="item.id"
        :class="{ active: activeView === item.id, disabled: item.disabled }"
        :disabled="item.disabled"
        :title="item.disabled ? 'В разработке' : item.label"
        @click="selectItem(item)"
      >
        <component :is="item.icon" :size="19" />
        <span>{{ item.label }}</span>
      </button>
    </nav>
    <div class="sidebar-footer">
      <button @click="emit('logout')"><LogOut :size="19" /><span>Выйти</span></button>
      <button class="about-link" type="button" data-help="О нас — узнайте больше о Brooks. Здесь также есть ссылки на канал с новостями и бот обратной связи для вопросов и предложений." @click="emit('about')">О нас</button>
    </div>
  </aside>
</template>
