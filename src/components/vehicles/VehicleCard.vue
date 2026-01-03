<script>
export default {
  name: 'VehicleCard',
  props: {
    vehicle: {
      type: Object,
      required: true
    }
  },
  methods: {
    editVehicle() {
      alert(`Редактировать ${this.vehicle.name}`);
    },
    
    removeVehicle() {
      if (confirm(`Удалить "${this.vehicle.name}"?`)) {
        this.$emit('remove', this.vehicle.id);
      }
    }
  }
};
</script>

<template>
  <div class="vehicle-card">
    <div class="vehicle-header">
      <div class="vehicle-title">
        <h3>{{ vehicle.name }}</h3>
        <span class="vehicle-status" :class="{ 'active': vehicle.is_active, 'inactive': !vehicle.is_active }">
          {{ vehicle.is_active ? 'Активный' : 'Неактивный' }}
        </span>
      </div>
      
      <div class="vehicle-badge" v-if="!vehicle.brand && !vehicle.model">
        Без марки/модели
      </div>
    </div>
    
    <div class="vehicle-details">
      <!-- Показываем марку/модель только если они есть -->
      <div class="detail-row" v-if="vehicle.brand || vehicle.model">
        <div class="detail-label">Марка/Модель:</div>
        <div class="detail-value">{{ vehicle.brand || '—' }} {{ vehicle.model || '—' }}</div>
      </div>
      
      <!-- Показываем госномер если есть -->
      <div class="detail-row" v-if="vehicle.license_plate">
        <div class="detail-label">Госномер:</div>
        <div class="detail-value">{{ vehicle.license_plate }}</div>
      </div>
      
      <!-- Показываем год если есть -->
      <div class="detail-row" v-if="vehicle.year">
        <div class="detail-label">Год выпуска:</div>
        <div class="detail-value">{{ vehicle.year }}</div>
      </div>
      
      <!-- Показываем пробег -->
      <div class="detail-row">
        <div class="detail-label">Пробег:</div>
        <div class="detail-value">{{ vehicle.initial_odometer.toLocaleString() }} км</div>
      </div>
    </div>
    
    <div class="vehicle-actions">
      <button @click="editVehicle" class="edit-btn" title="Редактировать транспортное средство">
        ✏️ Редактировать
      </button>
      <button @click="removeVehicle" class="remove-btn" title="Удалить транспортное средство">
        🗑️ Удалить
      </button>
    </div>
  </div>
</template>