<script setup lang="ts">
import AboutContent from '@/components/modals/AboutContent.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <BaseModal close-danger eyebrow="Информация" :show-footer="false" title="О нас" @close="emit('close')">
    <AboutContent />
  </BaseModal>
</template>
