<template>
  <main class="home">
    <section class="hero-tile">
      <div class="tile-content">
        <span class="hero-emoji">{{ greetingEmoji }}</span>
        <h1 class="hero-title">{{ greetingText }}, <span class="hero-name">{{ userName }}</span></h1>
        <p class="hero-sub">{{ currentDateStr }}</p>
      </div>
    </section>

    <section class="stats-tile">
      <div class="tile-content">
        <div class="stats-grid">
          <div class="stat-item" v-for="s in statList" :key="s.label">
            <span class="stat-value">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="action-tile" v-if="!userStore.isAdmin">
      <div class="tile-content tile-content-compact">
        <h2 class="tile-heading">Расписание</h2>
        <p class="tile-text">Просмотр и редактирование графика работы</p>
        <div class="cta-group">
          <button @click="goSchedule" class="btn-primary-pill" type="button">
            Таблица расписания
          </button>
          <button @click="goProfile" class="btn-secondary-pill" type="button">
            Мой профиль
          </button>
        </div>
      </div>
    </section>

    <section class="feed-tile">
      <div class="tile-content">
        <div class="feed-grid">
          <div class="feed-section">
            <h2 class="tile-heading">Новости</h2>
            <div class="feed-list">
              <div class="feed-item" v-for="news in newsList" :key="news.id">
                <div class="feed-meta">
                  <span class="feed-item-title">{{ news.title }}</span>
                  <span class="feed-date">{{ news.date }}</span>
                </div>
                <p class="feed-text">{{ news.content }}</p>
              </div>
            </div>
          </div>
          <div class="feed-section">
            <h2 class="tile-heading">Уведомления</h2>
            <div class="feed-list">
              <div class="feed-item" v-for="notif in notificationsList" :key="notif.id">
                <div class="feed-meta">
                  <span class="feed-item-title">{{ notif.title }}</span>
                  <span class="feed-date">{{ notif.date }}</span>
                </div>
                <p class="feed-text">{{ notif.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="instructions-tile">
      <div class="tile-content tile-content-compact">
        <h2 class="tile-heading">Инструкция</h2>
        <details class="instruction-details">
          <summary>Как пользоваться системой</summary>
          <ol>
            <li>Для составления расписания перейдите в Профиль.</li>
            <li>Чтобы посмотреть общее расписание перейдите в "Таблица расписания".</li>
          </ol>
        </details>
      </div>
    </section>

    <div v-if="!userStore.currentUser" class="login-prompt-tile">
      <div class="tile-content tile-content-compact">
        <p class="prompt-title">Пользователь не авторизован</p>
        <p class="prompt-desc">Для просмотра расписания необходимо войти в систему.</p>
        <button @click="router.push('/login')" class="btn-primary-pill" type="button">
          Войти
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'
import { ref, computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()

const newsList = ref([
  { id: 1, title: 'Новый функционал', date: '01.12.2025', content: 'Добавлена возможность просмотра расписания на месяц вперед.' },
  { id: 2, title: 'Обновление системы', date: '15.12.2025', content: 'Улучшена производительность и исправлены мелкие ошибки.' },
  { id: 3, title: 'Обновление системы', date: '15.12.2025', content: 'Улучшена производительность и исправлены мелкие ошибки.' }
])

const notificationsList = ref([
  { id: 1, title: 'Отпуск', date: '12.01.2026', content: 'Напоминаем, что у вас через 3 дня начинается отпуск.' },
  { id: 2, title: 'Смена', date: '04.01.2026', content: 'Требуется сотрудник на кухню на 05.01.' },
  { id: 3, title: 'Поздравляем', date: '31.12.2025', content: 'Всех сотрудников с наступающим, после смены пройдите на кухню, будет тортик.' }
])

const userName = computed(() => {
  return userStore.currentUser?.firstName || userStore.currentUser?.username || 'Пользователь'
})

const greetingEmoji = computed(() => {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return '☕'
  if (h >= 12 && h < 18) return '🥐'
  if (h >= 18 && h < 23) return '🌙'
  return '🌟'
})

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return 'Доброе утро'
  if (h >= 12 && h < 18) return 'Добрый день'
  if (h >= 18 && h < 23) return 'Добрый вечер'
  return 'Доброй ночи'
})

const currentDateStr = computed(() => {
  const d = new Date()
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
  return `${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`
})

const statList = computed(() => [
  { value: userStore.allUsers?.length || 0, label: 'Сотрудников' },
  { value: userStore.allUsers?.length > 0 ? 'Активно' : '—', label: 'Расписание' },
  { value: '—', label: 'Ближайшая смена' },
  { value: roleLabel.value, label: 'Должность' }
])

const roleLabel = computed(() => {
  if (userStore.isAdmin) return 'Админ'
  if (userStore.isManager) return 'Менеджер'
  if (userStore.isEmployee) return 'Сотрудник'
  return '—'
})

function goSchedule(){
  router.push('/schedule')
}

function goProfile(){
  router.push('/profile')
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
}

.hero-tile {
  background: var(--color-surface-black);
  padding: 32px 20px 24px;
  text-align: center;
}

.hero-emoji {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: 0;
  color: var(--color-body-on-dark);
}

.hero-name {
  color: var(--color-primary-on-dark);
}

.hero-sub {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.19;
  letter-spacing: 0.231px;
  color: var(--color-body-muted);
  margin-top: 4px;
}

.stats-tile {
  background: var(--color-canvas);
  padding: 20px 20px 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  max-width: 980px;
  margin: 0 auto;
  background: var(--color-hairline);
}

.stat-item {
  background: var(--color-canvas);
  padding: 12px 16px;
  text-align: center;
}

.stat-value {
  display: block;
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--color-ink);
  margin-bottom: 2px;
}

.stat-label {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.43;
  letter-spacing: -0.224px;
  color: var(--color-ink-muted-48);
}

.action-tile {
  background: var(--color-canvas-parchment);
  padding: 20px 20px 24px;
  text-align: center;
}

.feed-tile {
  background: var(--color-canvas);
  padding: 20px 20px 12px;
}

.feed-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 980px;
  margin: 0 auto;
}

.feed-section {
  min-width: 0;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.feed-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-divider-soft);
}

.feed-item:last-child {
  border-bottom: none;
}

.feed-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.feed-item-title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.29;
  letter-spacing: -0.224px;
  color: var(--color-primary);
}

.feed-date {
  font-size: 12px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.12px;
  color: var(--color-ink-muted-48);
}

.feed-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.43;
  letter-spacing: -0.224px;
  color: var(--color-ink-muted-80);
}

.instructions-tile {
  background: var(--color-canvas-parchment);
  padding: 16px 20px 20px;
}

.tile-content {
  max-width: 980px;
  margin: 0 auto;
}

.tile-content-compact {
  text-align: center;
}

.tile-heading {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  line-height: 1.14;
  letter-spacing: 0.196px;
  color: var(--color-ink);
}

.tile-text {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.374px;
  color: var(--color-ink-muted-48);
  margin-top: 4px;
}

.cta-group {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}

.btn-primary-pill {
  padding: 11px 22px;
  border: none;
  border-radius: var(--rounded-pill);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.374px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary-pill:hover {
  opacity: 0.85;
}

.btn-primary-pill:active {
  transform: scale(0.95);
}

.btn-secondary-pill {
  padding: 11px 22px;
  border: 1px solid var(--color-primary);
  border-radius: var(--rounded-pill);
  background: transparent;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.374px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-secondary-pill:hover {
  opacity: 0.7;
}

.btn-secondary-pill:active {
  transform: scale(0.95);
}

.instruction-details {
  margin-top: 8px;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.instruction-details summary {
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.24;
  letter-spacing: -0.374px;
  color: var(--color-primary);
  cursor: pointer;
  padding: 8px 0;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.instruction-details summary::before {
  content: '▶';
  font-size: 10px;
  transition: transform 0.2s;
}

.instruction-details[open] summary::before {
  transform: rotate(90deg);
}

.instruction-details ol {
  padding-left: 20px;
  margin-top: 8px;
}

.instruction-details li {
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-ink-muted-80);
  margin-bottom: 4px;
}

.login-prompt-tile {
  background: var(--color-canvas);
  padding: 64px 20px;
  text-align: center;
}

.prompt-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  line-height: 1.14;
  letter-spacing: 0.196px;
  color: var(--color-ink);
  margin-bottom: 8px;
}

.prompt-desc {
  font-size: 17px;
  line-height: 1.47;
  color: var(--color-ink-muted-48);
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 28px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .feed-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .cta-group {
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-size: 24px;
  }

  .hero-tile {
    padding: 20px 16px 16px;
  }
}
</style>
