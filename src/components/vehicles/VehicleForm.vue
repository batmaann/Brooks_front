<script>
export default {
  name: 'VehicleForm',
  data() {
    return {
      showModal: false, // Показывать/скрыть модальное окно
      newVehicle: {
        name: '',
        brand: '',
        model: '',
        year: null, 
        license_plate: '',
        initial_odometer: 0,
        is_active: true
      }
    };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
      this.resetForm();
    },
    
    submitForm() {
      // Валидация года
      const currentYear = new Date().getFullYear();
      if (this.newVehicle.year < 1900 || this.newVehicle.year > 2100) {
        alert('Год должен быть между 1900 и 2100');
        return;
      }
      
      // Валидация пробега
      if (this.newVehicle.initial_odometer < 0) {
        alert('Пробег не может быть отрицательным');
        return;
      }
      
      // Отправляем данные родителю
      this.$emit('add-vehicle', { ...this.newVehicle });
      
      // Закрываем окно и сбрасываем форму
      this.closeModal();
    },
    
    resetForm() {
      this.newVehicle = {
        name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        initial_odometer: 0,
        is_active: true
      };
    }
  }
};
</script>

<template>
  <div class="vehicle-form">
    <!-- Кнопка для открытия формы -->
    <button @click="openModal" class="add-button">
      Добавить новое транспортное средство
    </button>
    
    <!-- Модальное окно -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Добавить новое транспортное средство</h3>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        
        <form @submit.prevent="submitForm" class="modal-body">
          <!-- Обязательное поле -->
          <div class="form-group">
            <label for="name">Название *</label>
            <input 
              id="name"
              v-model="newVehicle.name" 
              required
              placeholder="Например: Ласточка моя"
            >
          </div>
          
          <!-- Необязательные поля в две колонки -->
          <div class="form-row">
            <div class="form-group">
              <label for="brand">Марка</label>
              <input 
                id="brand"
                v-model="newVehicle.brand" 
                placeholder="Например: Toyota"
              >
            </div>
            
            <div class="form-group">
              <label for="model">Модель</label>
              <input 
                id="model"
                v-model="newVehicle.model" 
                placeholder="Например: Camry"
              >
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="year">Год выпуска</label>
              <input 
                id="year"
                v-model.number="newVehicle.year" 
                type="number"
                min="1900"
                max="2100"
                placeholder="2024"
              >
              <small>От 1900 до 2100</small>
            </div>
            
            <div class="form-group">
              <label for="license_plate">Госномер</label>
              <input 
                id="license_plate"
                v-model="newVehicle.license_plate" 
                placeholder="у123хм456"
              >

            </div>
          </div>
          
          <div class="form-group">
            <label for="initial_odometer">Начальный пробег (км)</label>
            <input 
              id="initial_odometer"
              v-model.number="newVehicle.initial_odometer" 
              type="number"
              min="0"
              placeholder="0"
            >
          </div>
          
          <div class="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                v-model="newVehicle.is_active"
              >
              Активный
            </label>
            <small>Если не отмечено, транспортное средство будет неактивным</small>
          </div>
        </form>
        
        <div class="modal-footer">
          <button type="button" @click="closeModal" class="cancel-button">
            Отмена
          </button>
          <button type="submit" @click="submitForm" class="submit-button">
            Добавить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>