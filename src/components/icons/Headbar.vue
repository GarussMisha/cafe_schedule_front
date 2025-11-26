<template>
    <main>
        <button v-if="!isHomePage" @click="goHome">Главная</button>
        <button v-if="userStore.isAdmin && !isAdminPage" @click="goAdminPanel">Админка</button>
        <button v-if="!isHomePage" @click="goBack">Назад</button>
        <button @click="logout">Выход</button>
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

