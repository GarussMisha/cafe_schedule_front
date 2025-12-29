<template>
  <main>
    <h1>HomePage</h1>
    <p>Добро пожаловать в систему управления расписанием сотрудников!</p>
    <p>Здесь будет отображатся статистика и данные по пользоателю</p>
    <button @click="goSchedule">Таблица расписания</button>
    <button @click="goProfile">Профиль</button>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter()


function goSchedule(){
  router.push('/schedule')
}

function goProfile(){
  router.push('/profile')
}


</script>
