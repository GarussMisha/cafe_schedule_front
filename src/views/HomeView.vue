<template>
  <main class="home">
    <section class="welcome-card">
      <div class="card-header">
        <i class="pi pi-home" style="font-size: 2.5rem; color: #ff9800;"></i>
        <h1 class="card-title">Главная</h1>
      </div>
      
      <p class="welcome-text">
        Добро пожаловать в систему управления расписанием сотрудников!
      </p>

      <p class="card-desc">
        Здесь будет отображаться статистика и персональные данные пользователя
      </p>

      <div class="btn-container" v-if="!userStore.isAdmin">
        <button class="action-btn" @click="goSchedule" type="button">
          <i class="pi pi-calendar"></i> Таблица расписания
        </button>
        <button class="action-btn" @click="goProfile" type="button">
          <i class="pi pi-user"></i> Профиль
        </button>
      </div>
    </section>

    <div class="feed-container">
      <section class="feed-card news-feed">
        <h2 class="feed-title">
          <i class="pi pi-bell" style="color: #ff9800;"></i>
          Новости предприятия
        </h2>
        <div class="news-item" v-for="news in newsList" :key="news.id">
          <h3 class="news-title">{{ news.title }}</h3>
          <p class="news-date">{{ news.date }}</p>
          <p class="news-content">{{ news.content }}</p>
        </div>
      </section>

      <section class="feed-card notifications-feed">
        <h2 class="feed-title">
          <i class="pi pi-exclamation-circle" style="color: #ff9800;"></i>
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
      </section>
    </div>

    <section class="instructions-card">
      <h2 class="instructions-title">
        <i class="pi pi-info-circle" style="color: #ff9800;"></i>
        Инструкция по пользованию
      </h2>
      <details>
        <summary>Как пользоваться системой</summary>
        <ol>
          <li>Для составления расписания перейдите в Профиль.</li>
          <li>Что бы посмотреть общее расписание перейдите в "Таблица расписания".</li>
        </ol>
      </details>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'
import { ref } from 'vue'

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
  gap: 24px;
  padding-top: 32px;
}

.welcome-card {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  background: #ffffff;
  backdrop-filter: blur(30px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 36px;
}

.card-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0.5rem 0 0 0;
}

.welcome-text {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
  text-align: center;
}

.card-desc {
  color: #666666;
  margin-bottom: 24px;
  text-align: center;
}

.feed-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  gap: 24px;
  justify-content: space-between;
}

.feed-card {
  flex: 1;
  min-width: 300px;
  min-height: 200px;
  background: #ffffff;
  backdrop-filter: blur(30px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 36px;
}

.feed-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 15px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.instructions-card {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  background: #ffffff;
  backdrop-filter: blur(30px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 36px;
}

.instructions-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 15px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.instructions summary {
  color: #ff9800;
  font-weight: 600;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 152, 0, 0.05);
  margin-bottom: 10px;
}

.instructions summary:hover {
  background: rgba(255, 152, 0, 0.1);
}

.instructions ol {
  padding-left: 20px;
  margin-top: 10px;
}

.instructions li {
  margin-bottom: 8px;
  color: #555;
}

.notification-hint {
  margin: 5px 0;
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.notification-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.news-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.news-title {
  margin-bottom: 5px;
  font-size: 14px;
  color: #ff9800;
  font-weight: 600;
}

.news-date {
  margin: 5px 0;
  font-size: 12px;
  color: #999;
}

.news-content {
  margin: 5px 0;
  font-size: 12px;
  color: #555;
}

.btn-container {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  min-width: 180px;
  border-radius: 20px !important;
  font-weight: 400 !important;
  font-size: 0.95rem !important;
  padding: 12px 28px !important;
  background: transparent !important;
  color: #ff9800 !important;
  border: 1.5px solid #ff9800 !important;
  transition: all 0.3s ease !important;
  letter-spacing: 0.02em;
}

.action-btn:hover {
  background: rgba(255, 152, 0, 0.1) !important;
  color: #e68900 !important;
  border-color: #e68900 !important;
  transform: translateY(-1px);
}

@media (max-width: 800px) {
  .feed-container {
    flex-direction: column;
  }

  .feed-card {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .welcome-card {
    padding: 22px;
  }

  .feed-card, .instructions-card {
    padding: 15px;
  }

  .card-title {
    font-size: 1.5rem;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
