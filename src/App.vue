<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AuthView from '@/components/auth/AuthView.vue'
import AppWorkspace from '@/components/AppWorkspace.vue'
import ServiceUnavailableView from '@/components/ServiceUnavailableView.vue'
import { useServiceAvailability } from '@/composables/useServiceAvailability'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const { applyTheme } = useTheme()
const { retry, statusCode, unavailable } = useServiceAvailability()

onMounted(() => {
  applyTheme()
})
</script>

<template>
  <ServiceUnavailableView v-if="unavailable" :status-code="statusCode" @retry="retry" />
  <AuthView v-else-if="!isAuthenticated" />
  <AppWorkspace v-else />
</template>
