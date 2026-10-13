<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RefreshCw, ChevronRight, WalletCards } from '@lucide/vue'
import { ApiError } from '@/api'
import { confirmPasswordReset } from '@/services/authService'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const params = new URLSearchParams(window.location.search)
const uid = params.get('uid') || ''
const token = params.get('token') || ''
const invalidLink = ref(!uid || !token || uid.length > 128 || token.length > 256)
const form = reactive({ password: '', confirmation: '' })
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function savePassword() {
  if (loading.value || success.value || invalidLink.value) return
  error.value = ''
  if (form.password !== form.confirmation) {
    error.value = 'Пароли не совпадают.'
    return
  }
  loading.value = true
  try {
    await confirmPasswordReset({ uid, token, new_password: form.password })
    authStore.logout()
    success.value = true
    form.password = ''
    form.confirmation = ''
    window.location.replace('/')
  } catch (requestError) {
    if (requestError instanceof ApiError) {
      if (requestError.details.token || requestError.details.uid) invalidLink.value = true
      error.value = requestError.message
    } else {
      error.value = 'Не удалось связаться с сервером. Попробуйте ещё раз.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-layout">
    <section class="auth-brand">
      <div class="brand-mark"><span class="brand-ruble">₽</span></div>
      <div class="auth-copy">
        <p class="eyebrow">Учет без лишнего шума</p>
        <h1 class="auth-logo-title">Brooks</h1>
        <p>Восстановите доступ к вашим финансам.</p>
      </div>
      <div class="auth-brand-footer">
        <div class="auth-feature">
          <WalletCards :size="26" />
          <div><strong>Все финансы в одном месте</strong><span>Доходы, расходы и накопления</span></div>
        </div>
      </div>
    </section>
    <main class="auth-panel">
      <form class="auth-form" @submit.prevent="savePassword">
        <div>
          <p class="eyebrow">Восстановление доступа</p>
          <h2>{{ success ? 'Пароль изменён' : 'Новый пароль' }}</h2>
        </div>
        <p v-if="success" role="status">Теперь вы можете войти с новым паролем.</p>
        <template v-else-if="invalidLink">
          <p class="form-error" role="alert">{{ error || 'В ссылке отсутствуют необходимые данные.' }}</p>
          <p>Вернитесь на страницу входа и нажмите «Забыли пароль?», чтобы получить новую ссылку.</p>
        </template>
        <template v-else>
          <label>
            Новый пароль
            <input v-model="form.password" type="password" autocomplete="new-password" required minlength="8" maxlength="4096" :disabled="loading" placeholder="Не менее 8 символов">
          </label>
          <label>
            Повторите пароль
            <input v-model="form.confirmation" type="password" autocomplete="new-password" required minlength="8" maxlength="4096" :disabled="loading" placeholder="Введите пароль ещё раз">
          </label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="primary-button wide" type="submit" :disabled="loading">
            <RefreshCw v-if="loading" class="spin" :size="18" />
            <span>{{ loading ? 'Сохраняем…' : 'Сохранить пароль' }}</span>
            <ChevronRight v-if="!loading" :size="18" />
          </button>
        </template>
        <a v-if="!loading" class="text-button reset-login-link" href="/">Вернуться ко входу</a>
      </form>
    </main>
  </div>
</template>

<style scoped>
.reset-login-link {
  text-align: center;
  text-decoration: none;
}
</style>
