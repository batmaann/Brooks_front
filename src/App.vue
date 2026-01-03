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
      // Добавляем транспортное средство как есть (поля могут быть пустыми)
      this.vehicles.push({
        id: Date.now(), // Уникальный ID
        name: newVehicle.name || 'Без названия',
        brand: newVehicle.brand || '', // Может быть пустым
        model: newVehicle.model || '', // Может быть пустым
        year: newVehicle.year || null, // Может быть null
        license_plate: newVehicle.license_plate || '', // Может быть пустым
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
    <div class="app-container">
      <!-- Левая часть: основной контент -->
      <div class="main-content">
        <header class="app-header">
          <h1>Forge</h1>
          <h2>Возможность добавить заправку, транспортное средство и АЗС</h2>
        </header>
        
        <div class="content-section">
          <button @click="toggleShowVehicles" class="toggle-button">
            {{ showVehicles ? 'Скрыть транспортные средства' : 'Показать транспортные средства' }}
          </button>
          
          <!-- Список транспортных средств -->
          <VehicleList 
            v-if="showVehicles" 
            :vehicles="vehicles"
            @remove-vehicle="removeVehicle"
          />
          
          <!-- Сообщение если список пуст -->
          <div v-if="showVehicles && vehicles.length === 0" class="empty-state">
            <p>Нет транспортных средств. Добавьте первое!</p>
          </div>
        </div>
      </div>
      
      <!-- Правая часть: форма добавления -->
      <div class="sidebar">
        <VehicleForm @add-vehicle="addVehicle" />
      </div>
    </div>
  </div>
</template>