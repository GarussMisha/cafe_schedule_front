<template>
  <main>
    <div>
      <h1>Расписание сотрудников</h1>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'

const schedule = useScheduleStore()
const userStore = useUserStore()


</script>

<style scoped>

</style>