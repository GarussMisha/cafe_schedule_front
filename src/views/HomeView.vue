<template>
  <main class="home">
    <h1 class="page-title">Главная</h1>
    <section class="home-card">
      <p class="welcome">
        Добро пожаловать в систему управления расписанием сотрудников!
      </p>

      <p class="desc">
        Здесь будет отображаться статистика и персональные данные пользователя
      </p>


      <div class="btn-container" v-if="!userStore.isAdmin">
        <button class="button btn-schedule" @click="goSchedule">
          Таблица расписания
        </button>

        <button class="button btn-profile" @click="goProfile">
          Профиль
        </button>
      </div>
    </section>

    <div class="feed-container">
      <section class="news-feed">
        <h2>Новости предприятия</h2>
        <div class="news-item" v-for="news in newsList" :key="news.id">
          <h3>{{ news.title }}</h3>
          <p>{{ news.date }}</p>
          <p>{{ news.content }}</p>
        </div>
      </section>

      <section class="notifications-feed">
        <h2>Уведомления</h2>
        <div class="notification-item">
          <p>Здесь будут отображаться уведомления.</p>
          <div class="news-item" v-for="notification in notificationsList" :key="notification.id">
            <h3>{{ notification.title }}</h3>
            <p>{{ notification.date }}</p>
            <p>{{ notification.content }}</p>
          </div>
        </div>
      </section>
    </div>

    <section class="instructions">
      <h2>Инструкция по пользованию</h2>
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
/* Общая обертка страницы */
.home {
  padding-top: 80px;     /* отступ от Header */
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 20px;
}

/* Контейнер для новостей и уведомлений */
.feed-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  gap: 20px;
  justify-content: space-between;
}

.home-card,
.instructions {
  width: 100%;
  max-width: 1120px;               /* ← единое значение */
  margin-left: auto;
  margin-right: auto;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(30px);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

.news-feed,
.notifications-feed {
  flex: 1;
  min-width: 300px;
  min-height: 200px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(30px);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

/* Уточняем padding отдельно, если он разный */
.home-card {
  padding: 30px 36px;
}

.news-feed,
.notifications-feed,
.instructions {
  padding: 36px;
}

.instructions summary {
  color: #2d6cfa;
}
/* Заголовок страницы */
.page-title {
  position: absolute;
  top: 80px;
  left: 40px;
  font-size: 28px;
  font-weight: 700;
}

/* Заголовки блоков новостей и уведомлений */
.news-feed h2,
.notifications-feed h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
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

.news-item h3 {
  margin-bottom: 5px;
  font-size: 14px;
  color: #4c88ff;
}

.notification-item p {
  margin: 5px 0;
  font-size: 12px;
  color: #555;
}

.news-item p {
  margin: 5px 0;
  font-size: 12px;
  color: #555;
}

.instructions summary {
  font-weight: 600;
  cursor: pointer;
  padding: 10px;

  border-radius: 5px;
}

.instructions ol {
  padding-left: 20px;
  margin-top: 10px;
}

.instructions li {
  margin-bottom: 8px;
  color: #555;
}



/* Текст */
.welcome {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.desc {
  color: #777;
  margin-bottom: 24px;
}

/* Контейнер кнопок */
.btn-container {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

/* Базовый стиль кнопок */
.button {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  min-width: 180px;
  transition: .25s ease;
}

/* Вариант кнопки — расписание */
.btn-schedule {
  background: #4c88ff;
  color: white;
}

.btn-schedule:hover {
  background: #2d6cfa;
  transform: translateY(-1px);
}

/* Вариант кнопки — профиль */
.btn-profile {
  background: #18cc00;
  color: white;
}

.btn-profile:hover {
  background: #118f00d7;
  transform: translateY(-1px);
}

/* Немного адаптива */
@media (max-width: 800px) {
  .feed-container {
    flex-direction: column;
  }

  .news-feed, .notifications-feed {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .home-card {
    padding: 22px;
  }

  .news-feed, .notifications-feed, .instructions {
    padding: 15px;
  }

  .page-title {
    left: 16px;
    font-size: 22px;
  }

  .button {
    width: 100%;
  }
}
</style>
