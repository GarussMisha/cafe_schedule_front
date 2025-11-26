<template>
  <main>
    <h1>ProfileView</h1>
    <button type="button" @click="goBack">Назад</button>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.push('/')
}

</script>
