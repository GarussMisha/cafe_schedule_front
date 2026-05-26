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
  position: relative;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 152, 0, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 152, 0, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(255, 193, 7, 0.03) 0%, transparent 50%);
}

body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff9800' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

#app {
  position: relative;
  z-index: 1;
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
