<script>
import VehicleList from '@/components/vehicles/VehicleList.vue';
import VehicleForm from '@/components/vehicles/VehicleForm.vue';

export default {
  name: 'App',
  components: {
    VehicleList,
    VehicleForm
  },
  data() {
    return {
      showVehicles: false,
      vehicles: [
        {
          id: 1,
          name: 'Служебная Toyota',
          brand: 'Toyota',
          model: 'Camry',
          year: 2020,
          license_plate: 'А123БВ77',
          initial_odometer: 15000,
          is_active: true
        },
        
      ]
    };
  },
  methods: {
    toggleShowVehicles() {
      this.showVehicles = !this.showVehicles;
    },
    
    addVehicle(newVehicle) {
      // Добавляем транспортное средство с новой структурой
      this.vehicles.push({
        id: Date.now(),
        name: newVehicle.name,
        brand: newVehicle.brand || 'Не указано',
        model: newVehicle.model || 'Не указано',
        year: newVehicle.year || new Date().getFullYear(),
        license_plate: newVehicle.license_plate || 'Не указан',
        initial_odometer: newVehicle.initial_odometer || 0,
        is_active: newVehicle.is_active !== false // По умолчанию true
      });
    },
    
    removeVehicle(vehicleId) {
      // Удаляем транспортное средство по ID
      this.vehicles = this.vehicles.filter(vehicle => vehicle.id !== vehicleId);
    }
  }
};
</script>

<template>
  <div id="app">
    <h1>Заправки</h1>
    <h2>Возможность добавить заправку, транспотрное средство и АЗС</h2>
    
    <button @click="toggleShowVehicles">
      {{ showVehicles ? 'Скрыть транспортные средства' : 'Показать транспортные средства' }}
    </button>
    
    <!-- Передаем vehicles и слушаем событие удаления -->
    <VehicleList 
      v-if="showVehicles" 
      :vehicles="vehicles"
      @remove-vehicle="removeVehicle"
    />
    
    <!-- Форма для добавления -->
    <VehicleForm @add-vehicle="addVehicle" />
  </div>
</template>
