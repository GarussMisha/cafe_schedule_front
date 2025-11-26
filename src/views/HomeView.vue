<template>
  <main>
    <button @click="goSchedule">Таблица расписания</button>
    <h1>HomePage</h1>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter()


function goSchedule(){
  router.push('/schedule')
}


</script>
