<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw } from '@lucide/vue'
import AboutModal from '@/components/modals/AboutModal.vue'

const aboutOpen = ref(false)

defineProps<{
  statusCode: number | null
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <main class="service-error">
    <header class="service-error__header">
      <div class="brand-mark small"><span class="brand-ruble">₽</span></div>
      <strong>Brooks</strong>
    </header>

    <section class="service-error__content">
      <div class="service-error__copy">
        <p class="service-error__eyebrow">Ошибка {{ statusCode ?? 'связи' }}</p>
        <h1>Хоспаде мы куда-то жмав и всё сломалось</h1>
        <p class="service-error__description">
          Ведутся ремонтные работы. Мы очень стараемся всё починить и вернуться как можно скорее.
        </p>
        <button class="service-error__button" type="button" @click="emit('retry')">
          <RefreshCw :size="19" />
          Попробовать снова
        </button>
      </div>

      <div class="currency-illustration" aria-label="Иллюстрация символов мировых валют" role="img">
        <span class="currency currency--ruble">₽</span>
        <span class="currency currency--dollar">$</span>
        <span class="currency currency--euro">€</span>
        <span class="currency currency--lira">₺</span>
        <span class="currency currency--yen">¥</span>
        <span class="currency currency--pound">£</span>
        <span class="currency currency--won">₩</span>
        <div class="currency-illustration__card">
          <span>BROOKS</span>
          <strong>₽</strong>
          <i></i>
        </div>
      </div>
    </section>

    <footer class="service-error__footer">
      <button type="button" @click="aboutOpen = true">О нас</button>
      <div>
        <span>Ваши данные в безопасности</span>
        <span>Мы уже работаем над проблемой</span>
      </div>
    </footer>

    <AboutModal v-if="aboutOpen" @close="aboutOpen = false" />
  </main>
</template>

<style scoped>
.service-error { min-height: 100vh; padding: 30px clamp(24px, 5vw, 76px); display: flex; flex-direction: column; color: white; background: #153f31; overflow: hidden; }
.service-error__header { display: flex; align-items: center; gap: 12px; position: relative; z-index: 2; }
.service-error__header strong { font-family: 'Anton', 'Manrope', Arial, sans-serif; font-size: 24px; font-weight: 400; }
.service-error__content { width: min(1320px, 100%); margin: auto; display: grid; grid-template-columns: minmax(320px, .85fr) minmax(480px, 1.15fr); align-items: center; gap: clamp(35px, 6vw, 100px); }
.service-error__copy { position: relative; z-index: 2; }
.service-error__eyebrow { color: #d5ed52; font-size: 12px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; }
.service-error h1 { max-width: 690px; margin-top: 18px; font-family: 'Anton', 'Manrope', Arial, sans-serif; font-size: clamp(62px, 7.2vw, 112px); font-weight: 400; line-height: .96; }
.service-error__description { max-width: 590px; margin-top: 28px; color: #c6d8d1; font-size: clamp(16px, 1.35vw, 20px); line-height: 1.65; }
.service-error__button { min-height: 50px; margin-top: 34px; padding: 0 22px; display: inline-flex; align-items: center; gap: 10px; border: 0; border-radius: 7px; color: #173a2f; background: #d5ed52; font-size: 14px; font-weight: 800; transform: translateY(-12px); }
.service-error__button:hover { background: #e2f66d; transform: translateY(-13px); }
.currency-illustration { height: min(62vw, 640px); max-height: 640px; min-height: 470px; position: relative; isolation: isolate; }
.currency-illustration::before { content: ''; position: absolute; inset: 9% 5% 4% 10%; border-radius: 50%; background: rgba(255,255,255,.045); transform: rotate(-8deg); }
.currency-illustration__card { position: absolute; z-index: 2; inset: 25% 10% 20% 12%; padding: 9% 10%; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255,255,255,.22); border-radius: 24px; background: linear-gradient(145deg, #d5ed52 0%, #b9da3e 100%); color: #173a2f; box-shadow: 0 34px 70px rgba(4,20,14,.34); transform: rotate(-7deg); }
.currency-illustration__card span { font-size: 12px; font-weight: 900; letter-spacing: 2px; }
.currency-illustration__card strong { align-self: center; font-size: clamp(100px, 14vw, 190px); line-height: .8; }
.currency-illustration__card i { width: 43%; height: 9px; border-radius: 10px; background: rgba(23,58,47,.2); }
.currency { width: clamp(78px, 8vw, 118px); aspect-ratio: 1; position: absolute; z-index: 3; display: grid; place-items: center; border-radius: 50%; font-size: clamp(40px, 4.5vw, 66px); font-weight: 900; font-style: normal; box-shadow: 0 18px 38px rgba(4,20,14,.28); }
.currency--ruble { top: 4%; left: 35%; color: #173a2f; background: #fff; transform: rotate(8deg); }
.currency--dollar { top: 15%; right: 0; color: #173a2f; background: #d5ed52; transform: rotate(12deg); }
.currency--euro { top: 48%; right: -2%; color: white; background: #287b5c; transform: rotate(-9deg); }
.currency--lira { right: 20%; bottom: 0; color: #173a2f; background: #f0c96a; transform: rotate(9deg); }
.currency--yen { bottom: 4%; left: 15%; color: white; background: #d16d5b; transform: rotate(-12deg); }
.currency--pound { top: 32%; left: 0; color: #173a2f; background: #83c9b0; transform: rotate(8deg); }
.currency--won { bottom: 22%; left: -2%; color: #173a2f; background: #f6f1df; transform: rotate(-7deg); }
.service-error__footer { padding-top: 22px; display: flex; justify-content: space-between; gap: 20px; border-top: 1px solid rgba(255,255,255,.14); color: #92ada2; font-size: 11px; font-weight: 700; }
.service-error__footer button { padding: 0; border: 0; color: #c6d8d1; background: transparent; font-size: 11px; font-weight: 800; }
.service-error__footer button:hover { color: #d5ed52; }
.service-error__footer div { display: flex; justify-content: flex-end; gap: clamp(18px, 4vw, 54px); text-align: right; }
@media (max-width: 900px) {
  .service-error { padding: 24px; }
  .service-error__content { padding: 48px 0; grid-template-columns: 1fr; }
  .service-error h1 { font-size: clamp(54px, 14vw, 88px); }
  .currency-illustration { width: min(680px, 100%); height: 520px; min-height: 0; margin: -10px auto 0; }
}
@media (max-width: 520px) {
  .service-error__content { padding: 42px 0 30px; gap: 18px; }
  .service-error h1 { font-size: 51px; }
  .service-error__description { margin-top: 20px; font-size: 15px; }
  .currency-illustration { height: 340px; }
  .currency { width: 64px; font-size: 35px; }
  .currency-illustration__card { border-radius: 16px; }
  .currency-illustration__card strong { font-size: 100px; }
  .service-error__footer { align-items: flex-start; }
  .service-error__footer div { flex-direction: column; gap: 7px; }
}
</style>
