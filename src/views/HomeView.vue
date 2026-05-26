<template>
  <main class="home">
    <div class="greeting-section" style="animation-delay: 0.05s">
      <span class="greeting-emoji">{{ greetingEmoji }}</span>
      <div class="greeting-text">
        <h1 class="greeting-title">{{ greetingText }}, <span class="greeting-name">{{ userName }}</span></h1>
        <p class="greeting-sub">{{ currentDateStr }}</p>
      </div>
    </div>

    <div class="stats-row" style="animation-delay: 0.15s">
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-users"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.employees }}</span>
          <span class="stat-label">Сотрудников</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-calendar"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.scheduleStatus }}</span>
          <span class="stat-label">Расписание</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-clock"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.upcoming }}</span>
          <span class="stat-label">Ближайшая смена</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-star"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.role }}</span>
          <span class="stat-label">Должность</span>
        </div>
      </div>
    </div>

    <div class="welcome-card" style="animation-delay: 0.25s">
      <div class="card-accent"></div>
      <div class="card-body">
        <div class="card-header">
          <div class="card-icon-wrapper">
            <i class="pi pi-home"></i>
          </div>
          <h1 class="card-title">Главная</h1>
        </div>
        <p class="welcome-text">
          Добро пожаловать в систему управления расписанием сотрудников!
        </p>
        <p class="card-desc">
          Здесь будет отображаться статистика и персональные данные пользователя
        </p>
        <div class="btn-container" v-if="!userStore.isAdmin">
          <button class="action-btn pulse-btn" @click="goSchedule" type="button">
            <i class="pi pi-calendar"></i> Таблица расписания
          </button>
          <button class="action-btn pulse-btn" @click="goProfile" type="button">
            <i class="pi pi-user"></i> Профиль
          </button>
        </div>
      </div>
    </div>

    <div class="feed-container" style="animation-delay: 0.35s">
      <section class="feed-card">
        <div class="card-accent"></div>
        <div class="card-body">
          <h2 class="feed-title">
            <i class="pi pi-bell feed-icon"></i>
            Новости предприятия
          </h2>
          <div class="news-item" v-for="news in newsList" :key="news.id">
            <h3 class="news-title">{{ news.title }}</h3>
            <p class="news-date">{{ news.date }}</p>
            <p class="news-content">{{ news.content }}</p>
          </div>
        </div>
      </section>

      <section class="feed-card">
        <div class="card-accent"></div>
        <div class="card-body">
          <h2 class="feed-title">
            <i class="pi pi-exclamation-circle feed-icon"></i>
            Уведомления
          </h2>
          <div class="notification-item">
            <p class="notification-hint">Здесь будут отображаться уведомления.</p>
            <div class="news-item" v-for="notification in notificationsList" :key="notification.id">
              <h3 class="news-title">{{ notification.title }}</h3>
              <p class="news-date">{{ notification.date }}</p>
              <p class="news-content">{{ notification.content }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="instructions-card" style="animation-delay: 0.45s">
      <div class="card-accent"></div>
      <div class="card-body">
        <h2 class="instructions-title">
          <i class="pi pi-info-circle feed-icon"></i>
          Инструкция по пользованию
        </h2>
        <details>
          <summary>Как пользоваться системой</summary>
          <ol>
            <li>Для составления расписания перейдите в Профиль.</li>
            <li>Что бы посмотреть общее расписание перейдите в "Таблица расписания".</li>
          </ol>
        </details>
      </div>
    </section>

    <div class="footer-decoration" style="animation-delay: 0.55s">
      <span class="deco-dot"></span>
      <span class="deco-dot"></span>
      <span class="deco-dot"></span>
    </div>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'
import { ref, computed, onMounted } from 'vue'

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

const roleLabel = computed(() => {
  if (userStore.isAdmin) return 'Админ'
  if (userStore.isManager) return 'Менеджер'
  if (userStore.isEmployee) return 'Сотрудник'
  return '—'
})

const stats = computed(() => {
  const employees = userStore.allUsers?.length || 0
  return {
    employees,
    scheduleStatus: employees > 0 ? 'Активно' : '—',
    upcoming: '—',
    role: roleLabel.value
  }
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
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 16px 20px 20px;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
  animation: pageEnter 0.6s ease-out both;
}

@keyframes pageEnter {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* --- GREETING --- */
.greeting-section {
  width: 100%;
  max-width: 1120px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  animation: fadeInUp 0.6s ease-out both;
}

.greeting-emoji {
  font-size: 2rem;
  line-height: 1;
  animation: gentleBob 3s ease-in-out infinite;
}

@keyframes gentleBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.greeting-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.greeting-name {
  background: linear-gradient(135deg, #ff9800, #e68900);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.greeting-sub {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #888;
}

/* --- STATS ROW --- */
.stats-row {
  width: 100%;
  max-width: 1120px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  animation: fadeInUp 0.6s ease-out both;
}

.stat-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  cursor: default;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(255, 152, 0, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.12), rgba(255, 152, 0, 0.06));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #ff9800;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1));
  transform: scale(1.05);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.7rem;
  color: #999;
  font-weight: 400;
}

/* --- CARDS (unified card look) --- */
.welcome-card,
.feed-card,
.instructions-card {
  width: 100%;
  max-width: 1120px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: fadeInUp 0.6s ease-out both;
}

.welcome-card:hover,
.feed-card:hover,
.instructions-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.card-accent {
  height: 3px;
  background: linear-gradient(90deg, #ff9800, #ffb74d, #ff9800);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.card-body {
  padding: 18px 24px;
}

.card-header {
  text-align: center;
  margin-bottom: 0.6rem;
}

.card-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.12), rgba(255, 152, 0, 0.06));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #ff9800;
  margin-bottom: 6px;
  transition: all 0.3s ease;
}

.welcome-card:hover .card-icon-wrapper {
  transform: scale(1.08) rotate(-4deg);
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.18), rgba(255, 152, 0, 0.08));
}

.card-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.welcome-text {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
  text-align: center;
}

.card-desc {
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
  text-align: center;
}

/* --- BUTTONS (unchanged style, just animation added) --- */
.btn-container {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  min-width: 150px;
  border-radius: 20px !important;
  font-weight: 400 !important;
  font-size: 0.85rem !important;
  padding: 8px 22px !important;
  background: transparent !important;
  color: #ff9800 !important;
  border: 1.5px solid #ff9800 !important;
  transition: all 0.3s ease !important;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.action-btn:hover {
  background: rgba(255, 152, 0, 0.1) !important;
  color: #e68900 !important;
  border-color: #e68900 !important;
  transform: translateY(-1px);
}

.pulse-btn:active {
  transform: scale(0.97);
}

/* --- FEED CARDS --- */
.feed-container {
  display: flex;
  width: 100%;
  max-width: 1120px;
  gap: 12px;
  justify-content: space-between;
  animation: fadeInUp 0.6s ease-out both;
}

.feed-card {
  flex: 1;
  min-width: 0;
}

.feed-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.feed-icon {
  color: #ff9800;
  font-size: 1rem;
  transition: transform 0.3s ease;
}

.feed-card:hover .feed-icon {
  animation: iconPulse 0.6s ease;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* --- INSTRUCTIONS --- */
.instructions-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 6px;
}

details summary {
  color: #ff9800;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(255, 152, 0, 0.06);
  font-size: 13px;
  transition: all 0.3s ease;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

details summary::before {
  content: '▶';
  font-size: 0.6rem;
  transition: transform 0.3s ease;
}

details[open] summary::before {
  transform: rotate(90deg);
}

details summary:hover {
  background: rgba(255, 152, 0, 0.12);
}

details ol {
  padding-left: 18px;
  margin: 6px 0 0;
}

details li {
  margin-bottom: 4px;
  color: #555;
  font-size: 13px;
  line-height: 1.4;
}

/* --- NEWS / NOTIFICATIONS --- */
.notification-hint {
  margin: 3px 0;
  font-size: 11px;
  color: #999;
  font-style: italic;
}

.notification-item {
  margin-bottom: 6px;
  padding-bottom: 6px;
}

.news-item {
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  padding: 6px 8px;
  border-radius: 8px;
  margin-left: -8px;
  margin-right: -8px;
  cursor: default;
}

.news-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.news-item:hover {
  background: rgba(255, 152, 0, 0.04);
  padding-left: 12px;
  border-left: 3px solid #ff9800;
}

.news-title {
  margin-bottom: 2px;
  font-size: 12px;
  color: #ff9800;
  font-weight: 600;
}

.news-date {
  margin: 2px 0;
  font-size: 10px;
  color: #bbb;
}

.news-content {
  margin: 2px 0;
  font-size: 11px;
  color: #555;
  line-height: 1.4;
}

/* --- FOOTER DECORATION --- */
.footer-decoration {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  animation: fadeInUp 0.6s ease-out both;
}

.deco-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 152, 0, 0.3);
  transition: all 0.3s ease;
  cursor: default;
}

.deco-dot:nth-child(2) {
  width: 6px;
  height: 6px;
  background: rgba(255, 152, 0, 0.2);
}

/* --- ENTRANCE ANIMATION --- */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- RESPONSIVE --- */
@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 800px) {
  .feed-container {
    flex-direction: column;
  }

  .feed-card {
    width: 100%;
    min-width: 0;
  }

  .greeting-section {
    flex-direction: column;
    text-align: center;
    padding: 14px;
  }
}

@media (max-width: 600px) {
  .home {
    padding: 12px 10px 12px;
    gap: 8px;
  }

  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .stat-card {
    padding: 10px 12px;
  }

  .stat-value {
    font-size: 0.95rem;
  }

  .card-body {
    padding: 12px 14px;
  }

  .card-title {
    font-size: 1.2rem;
  }

  .action-btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
