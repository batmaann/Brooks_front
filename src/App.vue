<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { hasToken } from '@/api'
import AuthView from '@/components/auth/AuthView.vue'
import AppWorkspace from '@/components/AppWorkspace.vue'
import { useTheme } from '@/composables/useTheme'

const authenticated = ref(hasToken())
const { applyTheme } = useTheme()

function handleAuthenticated() {
  authenticated.value = true
}

function handleLogout() {
  authenticated.value = false
}

onMounted(() => {
  applyTheme()
})
</script>

<template>
  <AuthView v-if="!authenticated" @authenticated="handleAuthenticated" />
  <AppWorkspace v-else @logout="handleLogout" />
</template>
