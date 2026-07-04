<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ChevronRight, CircleGauge, RefreshCw } from '@lucide/vue'
import { ApiError } from '@/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const authMode = ref<'login' | 'register'>('login')
const authForm = reactive({ username: '', password: '', phone: '' })
const authError = ref('')
const authLoading = ref(false)

async function authenticate() {
  authLoading.value = true
  authError.value = ''
  try {
    if (authMode.value === 'login') {
      await authStore.login({ username: authForm.username, password: authForm.password })
    } else {
      await authStore.register({ username: authForm.username, password: authForm.password, phone: authForm.phone })
    }
  } catch (requestError) {
    authError.value = requestError instanceof ApiError ? requestError.message : 'Сервис временно недоступен'
  } finally {
    authLoading.value = false
  }
}
</script>

<template>
  <div class="auth-layout">
    <section class="auth-brand">
      <div class="brand-mark"><svg class="gold-bag-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="bag-body" d="M10.4 12.2h11.2c2.9 2.8 5.2 6.4 5.2 10.3 0 4.3-3.3 6.9-10.8 6.9S5.2 26.8 5.2 22.5c0-3.9 2.3-7.5 5.2-10.3Z"/><path class="bag-neck" d="M11.1 4.4c1.6 1.1 3.1 1.4 4.9 1.4s3.3-.3 4.9-1.4l-2.1 6.1h-5.6l-2.1-6.1Z"/><path class="bag-tie" d="M10.2 12.1c1.7-1.2 3.7-1.8 5.8-1.8s4.1.6 5.8 1.8"/><circle class="bag-coin" cx="16" cy="21" r="4.2"/><path class="bag-dollar" d="M16 18.5v5M14.7 19.5h2c.8 0 1.3.4 1.3 1s-.5 1-1.3 1h-1.4c-.8 0-1.3.4-1.3 1s.5 1 1.3 1h2"/></svg></div>
      <div class="auth-copy">
        <p class="eyebrow">Учет без лишнего шума</p>
        <h1>Brooks</h1>
        <p>Транспорт, заправки и расходы в одной рабочей системе.</p>
      </div>
      <div class="auth-feature">
        <CircleGauge :size="26" />
        <div>
          <strong>Контроль расхода</strong>
          <span>Пробег, стоимость и потребление топлива</span>
        </div>
      </div>
    </section>

    <main class="auth-panel">
      <form class="auth-form" @submit.prevent="authenticate">
        <div>
          <p class="eyebrow">{{ authMode === 'login' ? 'С возвращением' : 'Новый аккаунт' }}</p>
          <h2>{{ authMode === 'login' ? 'Войти в Brooks' : 'Создать аккаунт' }}</h2>
        </div>
        <label>
          Имя пользователя
          <input v-model.trim="authForm.username" required autocomplete="username" placeholder="Введите логин">
        </label>
        <label>
          Пароль
          <input v-model="authForm.password" required minlength="8" type="password" autocomplete="current-password" placeholder="Не менее 8 символов">
        </label>
        <label v-if="authMode === 'register'">
          Телефон
          <input v-model.trim="authForm.phone" required type="tel" autocomplete="tel" placeholder="+7 999 000-00-00">
        </label>
        <p v-if="authError" class="form-error">{{ authError }}</p>
        <button class="primary-button wide" type="submit" :disabled="authLoading">
          <RefreshCw v-if="authLoading" class="spin" :size="18" />
          <span>{{ authMode === 'login' ? 'Войти' : 'Зарегистрироваться' }}</span>
          <ChevronRight v-if="!authLoading" :size="18" />
        </button>
        <button class="text-button" type="button" @click="authMode = authMode === 'login' ? 'register' : 'login'">
          {{ authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' }}
        </button>
      </form>
    </main>
  </div>
</template>

