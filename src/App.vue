<template>
  <Toast position="top-right" />
  <Headbar v-if="!isLoginPage" :key="route.path" />
  <RouterView />
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from 'primevue/usetoast'
import { onToast } from '@/utils/toast'
import Headbar from '@/components/Headbar.vue'

const toast = useToast()
const userStore = useUserStore()
const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')

onMounted(() => {
  userStore.init()
  onToast((options) => {
    toast.add(options)
  })
  const saved = localStorage.getItem('darkMode')
  if (saved === 'true') {
    document.documentElement.classList.add('my-app-dark')
  }
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

.my-app-dark body {
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460) !important;
}

.my-app-dark .headbar {
  background: #1e1e2f !important;
  border-bottom-color: rgba(255,255,255,0.1) !important;
}

.my-app-dark .headbar-btn {
  color: #ccc !important;
  border-color: #444 !important;
}

.my-app-dark .headbar-btn:hover {
  border-color: #ff9800 !important;
  color: #ff9800 !important;
}

.my-app-dark .headbar-btn-logout {
  border-color: #ff9800 !important;
  color: #ff9800 !important;
}

@media print {
  .headbar, .view-controls, .approve-section, .status-legend, .month-controls-compact,
  .action-buttons, .edit-popover, .cafe-id-controls, .footer-decoration, .user-info,
  .schedule-statistics, .instructions-card, .feed-container, .welcome-card, .stats-row,
  .greeting-section, .btn-container, .login-prompt {
    display: none !important;
  }
  .schedule-grid-container, .schedule-table, .profile-container {
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
  }
  body {
    background: white !important;
  }
  .schedule-table-wrapper {
    overflow: visible !important;
  }
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

p {
  margin: 0;
}

</style>
