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
      <div class="brand-mark small"><svg class="gold-bag-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="bag-body" d="M10.4 12.2h11.2c2.9 2.8 5.2 6.4 5.2 10.3 0 4.3-3.3 6.9-10.8 6.9S5.2 26.8 5.2 22.5c0-3.9 2.3-7.5 5.2-10.3Z"/><path class="bag-neck" d="M11.1 4.4c1.6 1.1 3.1 1.4 4.9 1.4s3.3-.3 4.9-1.4l-2.1 6.1h-5.6l-2.1-6.1Z"/><path class="bag-tie" d="M10.2 12.1c1.7-1.2 3.7-1.8 5.8-1.8s4.1.6 5.8 1.8"/><circle class="bag-coin" cx="16" cy="21" r="4.2"/><path class="bag-dollar" d="M16 18.5v5M14.7 19.5h2c.8 0 1.3.4 1.3 1s-.5 1-1.3 1h-1.4c-.8 0-1.3.4-1.3 1s.5 1 1.3 1h2"/></svg></div>
      <strong>Brooks</strong>
      <button class="icon-button mobile-close" title="Закрыть меню" @click="emit('close')"><X :size="20" /></button>
    </div>
    <nav>
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
      <button class="about-link" type="button" @click="emit('about')">О нас</button>
    </div>
  </aside>
</template>

