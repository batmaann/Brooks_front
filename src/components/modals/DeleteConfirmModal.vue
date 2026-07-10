<script setup lang="ts">
import { RefreshCw, Trash2 } from '@lucide/vue'
import DeleteConfirmContent from '@/components/modals/DeleteConfirmContent.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

interface Props {
  error?: string
  label?: string
  saving: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BaseModal eyebrow="Подтверждение" title="Удалить запись" show-footer @close="emit('close')">
    <DeleteConfirmContent :label="label" />
    <p v-if="error" class="form-error modal-error">{{ error }}</p>

    <template #footer>
      <button class="secondary-button" type="button" :disabled="saving" @click="emit('close')">Отмена</button>
      <button class="danger-button" type="button" :disabled="saving" @click="emit('confirm')">
        <RefreshCw v-if="saving" class="spin" :size="17" />
        <Trash2 v-else :size="17" />
        Удалить
      </button>
    </template>
  </BaseModal>
</template>
