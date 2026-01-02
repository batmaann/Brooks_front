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
    <div class="vehicle-info">
      <!-- Изменено: brand + model на name -->
      <h3>{{ vehicle.name }}</h3>
      <p><strong>Марка/Модель:</strong> {{ vehicle.brand }} {{ vehicle.model }}</p>
      <!-- Изменено: licensePlate на license_plate -->
      <p><strong>Госномер:</strong> {{ vehicle.license_plate }}</p>
      <p><strong>Год выпуска:</strong> {{ vehicle.year }}</p>
      <p><strong>Пробег:</strong> {{ vehicle.initial_odometer }} км</p>
      <p><strong>Статус:</strong> {{ vehicle.is_active ? 'Активный' : 'Неактивный' }}</p>
    </div>
    
    <div class="vehicle-actions">
      <button @click="editVehicle" class="edit-btn">✏️ Редактировать</button>
      <button @click="removeVehicle" class="remove-btn">🗑️ Удалить</button>
    </div>
  </div>
</template>