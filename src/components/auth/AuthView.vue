<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ChevronRight, Eye, EyeOff, RefreshCw, WalletCards } from '@lucide/vue'
import { formatPhone, phoneCaret, phoneDigits } from '@/utils/phone'
import { ApiError } from '@/api'
import AboutModal from '@/components/modals/AboutModal.vue'
import { useAuthStore } from '@/stores/auth'
import { requestPasswordReset } from '@/services/authService'

const authStore = useAuthStore()
type AuthMode = 'login' | 'register' | 'reset'
const authMode = ref<AuthMode>('login')
const resetMessage = ref('')
const authForm = reactive({ username: '', password: '', phone: '', email: '' })
const authError = ref('')
const authLoading = ref(false)
const aboutOpen = ref(false)
const formElement = ref<HTMLFormElement>()
const showPassword = ref(false)
const credentialsInvalid = ref(false)
type Field = keyof typeof authForm
const fieldErrors = reactive<Record<Field, string>>({ username: '', password: '', email: '', phone: '' })
const touched = reactive<Record<Field, boolean>>({ username: false, password: false, email: false, phone: false })
const fields = computed(() => authMode.value === 'reset'
  ? ['email'] as Field[]
  : authMode.value === 'login' ? ['username', 'password'] as Field[] : ['username', 'password', 'email', 'phone'] as Field[])
const submitReady = computed(() => fields.value.every((field) => field === 'phone' ? phoneDigits(authForm.phone).length === 10 : !!authForm[field].trim()))
const labels: Record<Field, string> = { username: 'Имя пользователя', password: 'Пароль', email: 'Почта', phone: 'Телефон' }
const loadingLabel = computed(() => authMode.value === 'login' ? 'Входим…' : authMode.value === 'register' ? 'Создаём аккаунт…' : 'Отправляем ссылку…')

function validateField(field: Field) {
  const value = authForm[field]
  let error = ''
  if (!value.trim()) error = field === 'username' ? 'Введите логин' : field === 'password' ? 'Введите пароль' : field === 'email' ? 'Введите почту' : 'Введите телефон'
  else if (field === 'username' && authMode.value === 'register' && /\p{Script_Extensions=Cyrillic}/u.test(value)) error = 'Кириллица недопустима в имени пользователя'
  else if (field === 'password' && authMode.value === 'register' && value.length < 8) error = 'Пароль должен содержать не менее 8 символов'
  else if (field === 'password' && authMode.value === 'register' && (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value) || /[^\x20-\x7E]/.test(value))) error = 'Используйте латинские буквы и хотя бы одну цифру; кириллица недопустима'
  else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Введите почту в формате name@example.com'
  else if (field === 'phone' && phoneDigits(value).length !== 10) error = 'Введите номер полностью'
  fieldErrors[field] = error
  return !error
}

function onBlur(field: Field) {
  touched[field] = true
  validateField(field)
}

function onInput(field: Field, event: Event) {
  const input = event.target as HTMLInputElement
  if (field === 'phone') {
    const position = input.selectionStart ?? input.value.length
    const digitsBefore = phoneDigits(input.value.slice(0, position)).length
    authForm.phone = formatPhone(phoneDigits(input.value))
    input.value = authForm.phone
    input.setSelectionRange(phoneCaret(input.value, digitsBefore), phoneCaret(input.value, digitsBefore))
  } else {
    authForm[field] = input.value
  }
  authError.value = ''
  credentialsInvalid.value = false
  resetMessage.value = ''
  if (touched[field]) validateField(field)
}

function onPhoneBeforeInput(field: Field, event: Event) {
  if (field !== 'phone' || authLoading.value) return
  const inputEvent = event as InputEvent
  if (!['deleteContentBackward', 'deleteContentForward'].includes(inputEvent.inputType)) return
  const input = event.target as HTMLInputElement
  const start = input.selectionStart ?? 0
  const end = input.selectionEnd ?? start
  const digits = phoneDigits(input.value)
  const before = (position: number) => input.value.slice(4, Math.max(4, position)).replace(/\D/g, '').length
  let from = before(start)
  let to = before(end)
  if (start === end) {
    if (inputEvent.inputType === 'deleteContentBackward') from = Math.max(0, from - 1)
    else to = Math.min(digits.length, to + 1)
  }
  event.preventDefault()
  authForm.phone = formatPhone(digits.slice(0, from) + digits.slice(to))
  input.value = authForm.phone
  const caret = phoneCaret(input.value, from)
  input.setSelectionRange(caret, caret)
  onInput(field, event)
}

function animateErrors() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const elements = formElement.value?.querySelectorAll<HTMLElement>('.auth-input-wrap.has-error, .field-hint.form-error, .auth-feedback .form-error')
  elements?.forEach((element) => {
    element.getAnimations().forEach((animation) => animation.cancel())
    if (element.classList.contains('auth-input-wrap')) {
      element.animate([
        { transform: 'translateX(0)' }, { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' }, { transform: 'translateX(-2px)' },
        { transform: 'translateX(2px)' }, { transform: 'translateX(0)' },
      ], { duration: 280, easing: 'ease-out' })
    } else {
      element.animate([{ opacity: .3, transform: 'translateY(-3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 200, easing: 'ease-out' })
    }
  })
}

watch(() => [authError.value, ...fields.value.map((field) => fieldErrors[field])], (errors, previous) => {
  if (errors.some((error, index) => error && error !== previous[index])) animateErrors()
}, { flush: 'post' })

async function focusFirstError() {
  await nextTick()
  animateErrors()
  const field = fields.value.find((name) => fieldErrors[name])
  if (field) formElement.value?.querySelector<HTMLInputElement>(`#auth-${field}`)?.focus()
  else if (credentialsInvalid.value) formElement.value?.querySelector<HTMLInputElement>('#auth-username')?.focus()
}


function changeMode(mode: AuthMode) {
  if (authLoading.value) return
  authMode.value = mode
  authError.value = ''
  resetMessage.value = ''
  authForm.password = ''
  showPassword.value = false
  credentialsInvalid.value = false
  for (const field of Object.keys(fieldErrors) as Field[]) {
    fieldErrors[field] = ''
    touched[field] = false
  }

}

async function authenticate() {
  if (authLoading.value) return
  authForm.username = authForm.username.trim()
  authForm.email = authForm.email.trim()
  authForm.phone = authForm.phone.trim()
  let valid = true
  for (const field of fields.value) {
    touched[field] = true
    if (!validateField(field)) valid = false
  }
  if (!valid) {
    await focusFirstError()
    return
  }
  credentialsInvalid.value = false
  authLoading.value = true
  authError.value = ''
  resetMessage.value = ''
  try {
    if (authMode.value === 'reset') {
      const response = await requestPasswordReset(authForm.email)
      resetMessage.value = response.detail + ' Проверьте также папку «Спам».'
    } else if (authMode.value === 'login') {
      await authStore.login({ username: authForm.username, password: authForm.password })
    } else {
      await authStore.register({
        username: authForm.username,
        password: authForm.password,
        phone: `+7${phoneDigits(authForm.phone)}`,
        email: authForm.email,
      })
    }
  } catch (requestError) {
    authError.value = requestError instanceof ApiError ? requestError.message : 'Сервис временно недоступен. Попробуйте ещё раз.'
    if (requestError instanceof ApiError) {
      for (const field of fields.value) {
        const detail = requestError.details[field]
        if (detail) fieldErrors[field] = Array.isArray(detail) ? detail.join(' ') : detail
      }
      // Only credential errors should mark both login fields, never network failures.
      const credentialMessage = /(?:неверн|неправильн).*?(?:логин|парол|данн)|(?:invalid|incorrect).*?(?:credentials|password|username)|unable to log in|не уда[её]тся войти|не удалось войти/i
      if (authMode.value === 'login' && !fields.value.some((field) => fieldErrors[field]) && credentialMessage.test(authError.value)) {
        credentialsInvalid.value = true
        authError.value = 'Неверный логин или пароль. Проверьте введённые данные.'
      }
    }
    await focusFirstError()
  } finally {
    authLoading.value = false
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
        <p>Все финансы в одном месте: доходы, расходы, накопления и повседневные операции под вашим контролем.</p>
      </div>
      <div class="auth-brand-footer">
        <div class="auth-feature">
          <WalletCards :size="26" />
          <div>
            <strong>Полная картина</strong>
            <span>Доходы, расходы, накопления и регулярные платежи</span>
          </div>
        </div>
        <button class="auth-about-link" type="button" @click="aboutOpen = true">О нас</button>
      </div>
    </section>

    <main class="auth-panel">
      <form ref="formElement" class="auth-form" novalidate :aria-busy="authLoading" @submit.prevent="authenticate">
        <Transition name="auth-mode" mode="out-in" @after-enter="formElement?.querySelector('input')?.focus()">
          <div :key="authMode" class="auth-fields">
          <div>
            <p class="eyebrow">{{ authMode === 'reset' ? 'Восстановление доступа' : authMode === 'login' ? 'С возвращением' : 'Новый аккаунт' }}</p>
            <h2>{{ authMode === 'reset' ? 'Восстановить пароль' : authMode === 'login' ? 'Войти в Brooks' : 'Создать аккаунт' }}</h2>
          </div>
          <p v-if="authMode === 'reset'">Введите почту вашего аккаунта. Мы отправим ссылку для установки нового пароля.</p>
          <div v-for="field in fields" :key="field" class="auth-field">
            <label :for="`auth-${field}`">{{ labels[field] }}</label>
            <div class="auth-input-wrap" :class="{ 'has-error': fieldErrors[field] || (credentialsInvalid && (field === 'username' || field === 'password')) }">
              <input
                :id="`auth-${field}`"
                :value="authForm[field]"
                :name="field"
                :inputmode="field === 'phone' ? 'tel' : undefined"
                required
                :readonly="authLoading"
                :type="field === 'password' ? (showPassword ? 'text' : 'password') : field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'"
                :autocomplete="field === 'password' ? (authMode === 'register' ? 'new-password' : 'current-password') : field === 'phone' ? 'tel' : field"
                :maxlength="field === 'email' ? 254 : undefined"
                :placeholder="field === 'password' ? (authMode === 'register' ? 'Не менее 8 символов' : 'Введите пароль') : field === 'phone' ? '+7 (999) 123-45-67' : field === 'email' ? 'name@example.com' : ''"
                :class="{ 'has-error': fieldErrors[field] || (credentialsInvalid && (field === 'username' || field === 'password')), 'password-input': field === 'password' }"
                :aria-invalid="!!fieldErrors[field] || (credentialsInvalid && (field === 'username' || field === 'password'))"
                :aria-describedby="`auth-${field}-hint${credentialsInvalid && (field === 'username' || field === 'password') ? ' auth-feedback' : ''}`"
                @blur="onBlur(field)"
                @input="onInput(field, $event)"
                @beforeinput="onPhoneBeforeInput(field, $event)"
              >
              <button v-if="field === 'password'" class="password-toggle" type="button" :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'" :aria-pressed="showPassword" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" :size="19" />
                <Eye v-else :size="19" />
              </button>
            </div>
            <p :id="`auth-${field}-hint`" class="field-hint" :class="{ 'form-error': fieldErrors[field] }" aria-live="polite">{{ fieldErrors[field] || (authMode === 'register' ? (field === 'password' ? 'Не менее 8 символов, латинские буквы и хотя бы одна цифра' : field === 'username' ? 'Без кириллицы' : '') : '') }}</p>
          </div>
          </div>
        </Transition>
        <div id="auth-feedback" class="auth-feedback">
          <p v-if="resetMessage" class="reset-message" role="status">{{ resetMessage }}</p>
          <p v-else-if="authError" class="form-error" role="alert">{{ authError }}</p>
        </div>
        <button class="primary-button wide" :class="{ 'submit-ready': authMode !== 'reset' && submitReady, 'submit-empty': authMode !== 'reset' && !submitReady }" type="submit" :disabled="authLoading">
          <RefreshCw v-if="authLoading" class="spin" :size="18" />
          <span>{{ authLoading ? loadingLabel : authMode === 'reset' ? 'Отправить ссылку' : authMode === 'login' ? 'Войти' : 'Зарегистрироваться' }}</span>
          <ChevronRight v-if="!authLoading" :size="18" />
        </button>
        <button v-if="authMode === 'login'" class="text-button" type="button" :disabled="authLoading" @click="changeMode('reset')">Забыли пароль?</button>
        <button v-if="authMode === 'reset'" class="text-button" type="button" :disabled="authLoading" @click="changeMode('login')">Вернуться ко входу</button>
        <button v-else class="text-button" type="button" :disabled="authLoading" @click="changeMode(authMode === 'login' ? 'register' : 'login')">
          {{ authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' }}
        </button>
      </form>
    </main>
    <AboutModal v-if="aboutOpen" @close="aboutOpen = false" />
  </div>
</template>

<style scoped>
.auth-form { gap: 14px; animation: auth-appear .3s ease-out; }
.auth-fields { display: grid; gap: 14px; }
.auth-field { display: grid; gap: 8px; }
.auth-input-wrap { position: relative; }
.password-input { padding-right: 50px; }
.password-toggle { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 5px; background: transparent; color: var(--ink); }
.password-toggle:hover { background: rgba(127, 127, 127, .1); }
.auth-form button { transition: background-color .18s, opacity .18s, box-shadow .18s; }
.auth-form .primary-button.submit-empty {
  color: var(--ink);
  background: color-mix(in srgb, var(--ink) 10%, var(--surface));
  box-shadow: none;
}
.auth-form .primary-button.submit-empty:hover {
  background: color-mix(in srgb, var(--ink) 15%, var(--surface));
}
.auth-form .primary-button.submit-ready {
  background: var(--green-dark);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 20%, transparent), 0 5px 16px color-mix(in srgb, var(--green) 25%, transparent);
}
.auth-form .primary-button.submit-ready:hover {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--green) 25%, transparent), 0 6px 20px color-mix(in srgb, var(--green) 30%, transparent);
}
.auth-form button:focus-visible { outline: 2px solid var(--green); outline-offset: 3px; }
.auth-form input.has-error { border-color: var(--danger); }
.auth-form input.has-error:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 16%, transparent); }
.field-hint { min-height: 17px; font-size: 12px; line-height: 17px; color: var(--muted, #77817d); }
.field-hint.form-error { color: var(--danger); }
.auth-feedback { min-height: 40px; font-size: 12px; line-height: 20px; }
.auth-mode-enter-active, .auth-mode-leave-active { transition: opacity .15s ease, transform .15s ease; }
.auth-mode-enter-from { opacity: 0; transform: translateY(5px); }
.auth-mode-leave-to { opacity: 0; transform: translateY(-5px); }
@keyframes auth-appear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  .auth-form, .auth-form .spin { animation: none; }
  .auth-form button, .auth-form input, .auth-mode-enter-active, .auth-mode-leave-active { transition: none; }
}

.reset-message {
  color: var(--green);
  font-size: 14px;
}
</style>
