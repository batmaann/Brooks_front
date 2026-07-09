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
import { useFinanceWorkspaceContext, useFleetWorkspaceContext, useWorkspaceModalsContext, useWorkspaceUiContext } from '@/composables/useWorkspaceContext'

const finance = useFinanceWorkspaceContext()
const fleet = useFleetWorkspaceContext()
const modals = useWorkspaceModalsContext()
const ui = useWorkspaceUiContext()

const {
  bankLabelEditForm,
  bankLabelForm,
  bankLabels,
  categories,
  categoryEditForm,
  categoryForm,
  createBankLabel,
  createCategory,
  selectedBankLabelId,
  selectedCategoryId,
  selectBankLabelForEdit,
  selectCategoryForEdit,
  updateBankLabel,
  updateCategory,
} = finance
const {
  createStation,
  createVehicle,
  editingRefuelingId,
  refuelingForm,
  refuelings,
  saveRefueling,
  stationForm,
  stations,
  vehicleForm,
  vehicles,
} = fleet
const {
  closeModal,
  confirmRemove,
  modal,
  modalEyebrow,
  modalTitle,
  pendingDelete,
} = modals
const { error, saving } = ui
</script>

<template>
  <AboutModal v-if="modal === 'about'" @close="closeModal" />
  <DeleteConfirmModal
    v-else-if="modal === 'delete'"
    :error="error"
    :label="pendingDelete?.label"
    :saving="saving"
    @close="closeModal"
    @confirm="confirmRemove"
  />

  <BaseModal
    v-else-if="modal"
    :eyebrow="modalEyebrow"
    :show-footer="modal !== 'bankLabel' && modal !== 'category'"
    :title="modalTitle"
    :wide="modal === 'bankLabel' || modal === 'category'"
    @close="closeModal"
  >
    <VehicleFormModal v-if="modal === 'vehicle'" :form="vehicleForm" @submit="createVehicle" @update:form="Object.assign(vehicleForm, $event)" />
    <RefuelingFormModal
      v-if="modal === 'refueling'"
      :categories="categories"
      :editing-refueling-id="editingRefuelingId"
      :form="refuelingForm"
      :refuelings="refuelings"
      :stations="stations"
      :vehicles="vehicles"
      @submit="saveRefueling"
      @update:form="Object.assign(refuelingForm, $event)"
    />
    <GasStationFormModal v-if="modal === 'station'" :form="stationForm" @submit="createStation" @update:form="Object.assign(stationForm, $event)" />
    <BankLabelModal
      v-if="modal === 'bankLabel'"
      :bank-labels="bankLabels"
      :create-form="bankLabelForm"
      :edit-form="bankLabelEditForm"
      :saving="saving"
      :selected-id="selectedBankLabelId"
      @create="createBankLabel"
      @select="selectBankLabelForEdit"
      @update="updateBankLabel"
      @update:create-form="Object.assign(bankLabelForm, $event)"
      @update:edit-form="Object.assign(bankLabelEditForm, $event)"
    />
    <CategoryModal
      v-if="modal === 'category'"
      :categories="categories"
      :create-form="categoryForm"
      :edit-form="categoryEditForm"
      :saving="saving"
      :selected-id="selectedCategoryId"
      @create="createCategory"
      @select="selectCategoryForEdit"
      @update="updateCategory"
      @update:create-form="Object.assign(categoryForm, $event)"
      @update:edit-form="Object.assign(categoryEditForm, $event)"
    />

    <p v-if="error" class="form-error modal-error">{{ error }}</p>

    <template #footer>
      <button class="secondary-button" type="button" @click="closeModal">Отмена</button>
      <button class="primary-button" type="submit" :form="`${modal}-form`" :disabled="saving">
        <RefreshCw v-if="saving" class="spin" :size="17" />
        <Check v-else :size="17" />
        Сохранить
      </button>
    </template>
  </BaseModal>
</template>
