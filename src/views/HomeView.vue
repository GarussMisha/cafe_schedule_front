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
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()

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
  justify-content: center;
  width: 100%;
}

/* Заголовок страницы */
.page-title {
  position: absolute;
  top: 80px;
  left: 40px;
  font-size: 28px;
  font-weight: 700;
}

/* Карточка контента */
.home-card {
  max-width: 900px;
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  padding: 30px 36px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
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
  background: #7c7c7c;
  color: white;
}

.btn-profile:hover {
  background: #5e5e5e;
  transform: translateY(-1px);
}

/* Немного адаптива */
@media (max-width: 600px) {
  .home-card {
    padding: 22px;
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
