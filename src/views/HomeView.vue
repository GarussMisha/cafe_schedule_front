<template>
  <main>
    <h1>HomePage</h1>
    <button type="button" @click="logout">Выход</button>
  </main>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

function logout() {
  userStore.logout()
}
</script>
