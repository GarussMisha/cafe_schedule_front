<template>
    <header class="headbar">
        <div class="headbar-container">
            <div class="headbar-left">
                <button v-if="!isHomePage" @click="goHome" class="headbar-logo" type="button" title="Главная">
                    <i class="pi pi-calendar"></i>
                </button>
            </div>
            <div class="headbar-center">
                <span class="headbar-title">Cafe Schedule</span>
            </div>
            <div class="headbar-right">
                <button v-if="!isHomePage && !isAdminPage" @click="goBack" class="headbar-btn" type="button">
                    <i class="pi pi-chevron-left"></i> Назад
                </button>
                <button v-if="userStore.isAdmin && !isAdminPage" @click="goAdminPanel" class="headbar-btn" type="button">
                    <i class="pi pi-cog"></i>
                </button>
                <button @click="toggleDarkMode" class="headbar-btn headbar-icon-btn" type="button" :title="isDark ? 'Светлая тема' : 'Тёмная тема'">
                    <i :class="['pi', isDark ? 'pi-sun' : 'pi-moon']"></i>
                </button>
                <button @click="logout" class="headbar-btn headbar-btn-logout" type="button">
                    Выход
                </button>
            </div>
        </div>
    </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user';
import { useRouter, useRoute } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const isHomePage = computed(() => route.name === 'home')
const isAdminPage = computed(() => route.name === 'adminPanel')

const isDark = ref(document.documentElement.classList.contains('my-app-dark'))

function toggleDarkMode() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('my-app-dark')
  localStorage.setItem('darkMode', isDark.value ? 'true' : 'false')
}

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
  height: 44px;
  background: var(--color-surface-black);
  backdrop-filter: saturate(180%) blur(20px);
}

.headbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  position: relative;
}

.headbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.headbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.headbar-title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: -0.12px;
  color: var(--color-body-on-dark);
  opacity: 0.8;
}

.headbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.headbar-btn {
  padding: 4px 10px;
  border: none;
  border-radius: var(--rounded-sm);
  background: transparent;
  color: var(--color-body-on-dark);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: -0.12px;
  cursor: pointer;
  transition: opacity 0.2s;
  opacity: 0.65;
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}

.headbar-btn:hover {
  opacity: 1;
}

.headbar-btn:active {
  transform: scale(0.95);
}

.headbar-icon-btn {
  padding: 4px;
  font-size: 14px;
}

.headbar-logo {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--color-body-on-dark);
  font-size: 16px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.headbar-logo:hover {
  opacity: 1;
}

.headbar-btn-logout {
  color: var(--color-primary-on-dark);
  opacity: 0.85;
}

.headbar-btn-logout:hover {
  opacity: 1;
}
</style>
