<template>
  <Headbar v-if="showHeadbar" />
  <RouterView />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Headbar from '@/components/icons/Headbar.vue'

const userStore = useUserStore()
const route = useRoute()

onMounted(() => {
  userStore.init()
})

const showHeadbar = computed(() => {
  // Более безопасная проверка - показываем если не false
  return route.meta.showHeadbar ?? true
})
</script>

<style scoped>

</style>
