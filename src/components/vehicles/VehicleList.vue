<script>
import VehicleCard from './VehicleCard.vue';

export default {
  name: 'VehicleList',
  components: {
    VehicleCard
  },
  props: {
    vehicles: {
      type: Array,
      required: true
    }
  },
  methods: {
    removeVehicle(vehicleId) {
      // Передаем событие удаления родителю
      this.$emit('remove-vehicle', vehicleId);
    }
  }
};
</script>

<template>
  <div class="vehicle-list">
    <h2>Список транспортных средств ({{ vehicles.length }})</h2>
    
    <div v-if="vehicles.length === 0" class="empty-list">
      Нет транспортных средств. Добавьте первое!
    </div>
    
    <div v-else class="vehicles-container">
      <VehicleCard 
        v-for="vehicle in vehicles" 
        :key="vehicle.id"
        :vehicle="vehicle"
        @remove="removeVehicle"
      />
    </div>
  </div>
</template>