<template>
    <main>
        <div class="header-conteiner">
            <button class="btn-main-view button" v-if="!isHomePage" @click="goHome">Главная</button>
            <button class="btn-admin-view button" v-if="userStore.isAdmin && !isAdminPage" @click="goAdminPanel">Админка</button>
            <button class="btn-back button" v-if="!isHomePage" @click="goBack">Назад</button>
            <button class="btn-logout button" @click="logout">Выход</button>
        </div>
    </main>
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

.header-conteiner {
  display: flex;
  justify-content: right;
  margin: 10;
  padding: 10px 20px;
  background-color: #161616;
  border-radius: 15px;
}

.button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
}

.btn-main-view,
.btn-admin-view {
  background-color: #4caf50; /* Green */
  color: white;
  margin-right: 10px;
}

.btn-back {
  background-color: #f44336; /* Red */
  color: white;
  margin-right: 10px;
}

.btn-logout {
  background-color: #2196F3; /* Blue */
  color: white;
}
</style>