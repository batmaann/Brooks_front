<script setup lang="ts">
import { Check, RefreshCw } from '@lucide/vue'
import BankLabelModal from '@/components/finance/BankLabelModal.vue'
import CategoryModal from '@/components/finance/CategoryModal.vue'
import AboutModal from '@/components/modals/AboutModal.vue'
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal.vue'
import GasStationFormModal from '@/components/refuelings/GasStationFormModal.vue'
import RefuelingFormModal from '@/components/refuelings/RefuelingFormModal.vue'
import VehicleFormModal from '@/components/refuelings/VehicleFormModal.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { BankLabel, BankLabelPayload, Category, CategoryPayload } from '@/types/finance'
import type { GasStation, GasStationPayload, RefuelingDraft } from '@/types/refueling'
import type { Vehicle, VehiclePayload } from '@/types/vehicle'

type ModalName = 'vehicle' | 'refueling' | 'station' | 'bankLabel' | 'category' | 'about' | 'delete'

interface Props {
  bankLabelCreateForm: BankLabelPayload
  bankLabelEditForm: BankLabelPayload
  bankLabels: BankLabel[]
  categories: Category[]
  categoryCreateForm: CategoryPayload
  categoryEditForm: CategoryPayload
  deleteLabel?: string
  error: string
  modal: ModalName | null
  modalEyebrow: string
  modalTitle: string
  refuelingForm: RefuelingDraft
  saving: boolean
  selectedBankLabelId: number | null
  selectedCategoryId: number | null
  stationForm: GasStationPayload
  stations: GasStation[]
  vehicleForm: VehiclePayload
  vehicles: Vehicle[]
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirmDelete: []
  createBankLabel: []
  createCategory: []
  createStation: []
  createVehicle: []
  saveRefueling: []
  selectBankLabel: [id: number | null]
  selectCategory: [id: number | null]
  updateBankLabel: []
  updateBankLabelCreateForm: [form: BankLabelPayload]
  updateBankLabelEditForm: [form: BankLabelPayload]
  updateCategory: []
  updateCategoryCreateForm: [form: CategoryPayload]
  updateCategoryEditForm: [form: CategoryPayload]
  updateRefuelingForm: [form: RefuelingDraft]
  updateStationForm: [form: GasStationPayload]
  updateVehicleForm: [form: VehiclePayload]
}>()
</script>

<template>
  <AboutModal v-if="modal === 'about'" @close="emit('close')" />
  <DeleteConfirmModal
    v-else-if="modal === 'delete'"
    :error="error"
    :label="deleteLabel"
    :saving="saving"
    @close="emit('close')"
    @confirm="emit('confirmDelete')"
  />

  <BaseModal
    v-else-if="modal"
    :eyebrow="modalEyebrow"
    :show-footer="modal !== 'bankLabel' && modal !== 'category'"
    :title="modalTitle"
    :wide="modal === 'bankLabel' || modal === 'category'"
    @close="emit('close')"
  >
    <VehicleFormModal v-if="modal === 'vehicle'" :form="vehicleForm" @submit="emit('createVehicle')" @update:form="emit('updateVehicleForm', $event)" />
    <RefuelingFormModal v-if="modal === 'refueling'" :form="refuelingForm" :stations="stations" :vehicles="vehicles" @submit="emit('saveRefueling')" @update:form="emit('updateRefuelingForm', $event)" />
    <GasStationFormModal v-if="modal === 'station'" :form="stationForm" @submit="emit('createStation')" @update:form="emit('updateStationForm', $event)" />
    <BankLabelModal
      v-if="modal === 'bankLabel'"
      :bank-labels="bankLabels"
      :create-form="bankLabelCreateForm"
      :edit-form="bankLabelEditForm"
      :saving="saving"
      :selected-id="selectedBankLabelId"
      @create="emit('createBankLabel')"
      @select="emit('selectBankLabel', $event)"
      @update="emit('updateBankLabel')"
      @update:create-form="emit('updateBankLabelCreateForm', $event)"
      @update:edit-form="emit('updateBankLabelEditForm', $event)"
    />
    <CategoryModal
      v-if="modal === 'category'"
      :categories="categories"
      :create-form="categoryCreateForm"
      :edit-form="categoryEditForm"
      :saving="saving"
      :selected-id="selectedCategoryId"
      @create="emit('createCategory')"
      @select="emit('selectCategory', $event)"
      @update="emit('updateCategory')"
      @update:create-form="emit('updateCategoryCreateForm', $event)"
      @update:edit-form="emit('updateCategoryEditForm', $event)"
    />

    <p v-if="error" class="form-error modal-error">{{ error }}</p>

    <template #footer>
      <button class="secondary-button" type="button" @click="emit('close')">Отмена</button>
      <button class="primary-button" type="submit" :form="`${modal}-form`" :disabled="saving">
        <RefreshCw v-if="saving" class="spin" :size="17" />
        <Check v-else :size="17" />
        Сохранить
      </button>
    </template>
  </BaseModal>
</template>
