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
  background: #fff0ab;
  backdrop-filter: blur(30px);
  border-radius: 12px;
  margin: 10px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}

.button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}

.button:hover {
  background-color: #ececec;     /* чуть темнее */
  transform: translateY(-1px);   /* лёгкий подъём — опционально */
  box-shadow: 0 0 24px #adadadd0;
}

.btn-main-view,
.btn-admin-view {
  background-color: #ffffff; /* Green */
  color: rgb(0, 0, 0);
  margin-right: 10px;
}

.btn-back {
  background-color: #ffffff; /* Red */
  color: rgb(0, 0, 0);
  margin-right: 10px;
}

.btn-logout {
  background-color: #ffffff; /* Blue */
  color: rgb(0, 0, 0);
}
</style>