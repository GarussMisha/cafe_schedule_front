<template>
  <Headbar v-if="!isLoginPage" :key="route.path" />
  <RouterView />
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Headbar from '@/components/Headbar.vue'

const userStore = useUserStore()
const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')

onMounted(() => {
  userStore.init()
})
</script>

<style>

body {
  background: linear-gradient(135deg, #fff4c4, #fff3c0, #fcefb9);
  background-attachment: fixed;
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  overflow-x: hidden;
}

* {
  box-sizing: border-box;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

p {
  margin: 0;
}

</style>
