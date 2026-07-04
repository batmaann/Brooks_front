<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AuthView from '@/components/auth/AuthView.vue'
import AppWorkspace from '@/components/AppWorkspace.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const { applyTheme } = useTheme()

onMounted(() => {
  applyTheme()
})
</script>

<template>
  <AuthView v-if="!isAuthenticated" />
  <AppWorkspace v-else />
</template>
