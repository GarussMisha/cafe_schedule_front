<template>
    <header class="headbar">
        <div class="headbar-container">
            <div class="headbar-buttons">
                <button v-if="!isHomePage" @click="goHome" class="headbar-btn" type="button">
                    <i class="pi pi-home"></i> Главная
                </button>
                <button v-if="userStore.isAdmin && !isAdminPage" @click="goAdminPanel" class="headbar-btn" type="button">
                    <i class="pi pi-cog"></i> Админка
                </button>
                <button v-if="!isHomePage" @click="goBack" class="headbar-btn" type="button">
                    <i class="pi pi-arrow-left"></i> Назад
                </button>
            </div>
            <button @click="logout" class="headbar-btn headbar-btn-logout" type="button">
                <i class="pi pi-sign-out"></i> Выход
            </button>
        </div>
    </header>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user';
import { useRouter, useRoute } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const isHomePage = computed(() => route.name === 'home')
const isAdminPage = computed(() => route.name === 'adminPanel')

function logout() {
  userStore.logout()
}

function goBack() {
    router.go(-1)
}

function goAdminPanel () {
    router.push('/admin')
}

function goHome () {
    router.push('/')
}

</script>

<style scoped>

.headbar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 20px;
  background: #ffffff;
  backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.headbar-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  max-width: 1400px;
  margin: 0 auto;
}

.headbar-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.headbar-btn {
  border-radius: 20px !important;
  font-weight: 400 !important;
  font-size: 0.9rem !important;
  padding: 8px 20px !important;
  background: transparent !important;
  color: #1a1a1a !important;
  border: 1.5px solid #e0e0e0 !important;
  transition: all 0.3s ease !important;
  letter-spacing: 0.02em;
}

.headbar-btn:hover {
  border-color: #ff9800 !important;
  color: #ff9800 !important;
  background: rgba(255, 152, 0, 0.05) !important;
  transform: translateY(-1px);
}

.headbar-btn-logout {
  background: transparent !important;
  color: #ff9800 !important;
  border: 1.5px solid #ff9800 !important;
  font-weight: 400 !important;
  font-size: 0.9rem !important;
  padding: 8px 20px !important;
  border-radius: 20px !important;
  letter-spacing: 0.02em;
}

.headbar-btn-logout:hover {
  background: rgba(255, 152, 0, 0.1) !important;
  color: #e68900 !important;
  border-color: #e68900 !important;
}

@media (max-width: 768px) {
  .headbar {
    padding: 10px 15px;
  }
  
  .headbar-container {
    gap: 6px;
  }
  
  .headbar-buttons {
    gap: 6px;
  }
}

</style>
