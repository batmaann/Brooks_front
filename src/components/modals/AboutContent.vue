<script setup lang="ts">
import { Bot, Send } from '@lucide/vue'
</script>

<template>
  <div class="about-content">
    <p><span class="about-brand">Brooks</span> — финансовый некоммерческий продукт для личного учета доходов, расходов, накоплений и связанных повседневных операций.</p>
    <p>Проект создается как доступный инструмент для всех пользователей, которым важно видеть понятную картину своих финансов, анализировать движение средств и принимать более взвешенные решения.</p>
    <p>Проект не передает персональные данные третьим лицам и не использует их для внешней обработки. Работа с данными организована изолированно: информация каждого пользователя хранится и обрабатывается отдельно от данных других пользователей.</p>
    <p>Мы развиваем Brooks постепенно: улучшаем интерфейс, расширяем возможности учета, повышаем надежность работы с данными и добавляем функции, которые делают продукт удобнее в ежедневном использовании.</p>
    <p>Теперь вы также можете сообщить о проблемах в работе сервиса, поделиться предложениями или обсудить сотрудничество через нашего Telegram-бота.</p>

    <div class="about-telegram-links">
      <a
        class="about-telegram-link"
        href="https://t.me/brooks_news"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Send :size="20" aria-hidden="true" />
        <span>
          <strong>Информационный канал</strong>
          <small>Новости и обновления Brooks</small>
        </span>
      </a>

      <a
        class="about-telegram-link"
        href="https://t.me/finance_brooks_bot"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Bot :size="20" aria-hidden="true" />
        <span>
          <strong>Бот обратной связи</strong>
          <small>Вопросы и предложения</small>
        </span>
      </a>
    </div>
  </div>
</template>
