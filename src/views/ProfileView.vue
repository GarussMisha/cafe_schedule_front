<template>
  <main>
    <div class="profile-container">
      <h1>Профиль пользователя</h1>
      
      <!-- Информация о пользователе -->
      <details class="user-info" v-if="userStore.currentUser">
        <summary>Информация о пользователе</summary>
        <div class="user-info-content">

            <div class="info-item">
              <strong>Имя:</strong> {{ userStore.currentUser.firstName || 'Не указано' }}
            </div>
            <div class="info-item">
              <strong>Фамилия:</strong> {{ userStore.currentUser.lastName || 'Не указано' }}
            </div>
            <div class="info-item">
              <strong>Логин:</strong> {{ userStore.currentUser.username }}
            </div>
            <div class="info-item">
              <strong>Email:</strong> {{ userStore.currentUser.email || 'Не указано' }}
            </div>
            <div class="info-item">
              <strong>Должность:</strong> {{ userStore.currentUser.position || 'Не указано' }}
            </div>
            <div class="info-item">
              <strong>Роли:</strong> {{ userStore.currentUser.roles?.join(', ') || 'Не указано' }}
            </div>
        </div>
      </details>

      <!-- Управление месяцем -->
      <div class="month-controls-compact">
        <button @click="previousMonth" class="month-btn">‹</button>
        <h2 class="month-title">{{ formatMonth(currentMonth) }}</h2>
        <button @click="nextMonth" class="month-btn">›</button>
      </div>

      <!-- Таблица расписания на весь экран -->
      <div class="fullscreen-schedule" v-if="scheduleStore.mySchedule?.userSchedules?.[0]?.days">
        <table class="compact-table">
          <!-- Заголовки дат -->
          <thead>
            <tr>
              <th v-for="day in scheduleStore.mySchedule.userSchedules[0].days" 
                  :key="day.date"
                  :class="{
                    'weekend': isWeekend(day.date), 
                    'today': isToday(day.date),
                    'compact': true
                  }">
                <div class="compact-date">
                  <div class="compact-day">{{ getDayOfWeekShort(day.date) }}</div>
                  <div class="compact-number">{{ new Date(day.date).getDate() }}</div>
                </div>
              </th>
            </tr>
          </thead>
          
          <!-- Статусы -->
          <tbody>
            <tr>
              <td v-for="day in scheduleStore.mySchedule.userSchedules[0].days"
                  :key="day.date"
                  :class="{
                    'weekend': isWeekend(day.date),
                    'today': isToday(day.date),
                    'compact': true
                  }">
               <!-- Прямой доступ к данным -->
               <div class="compact-status"
                    :style="{ backgroundColor: getStatusColor(day.status) }">
                 {{ getStatusShortName(day.status) }}
               </div>
             </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Легенда статусов из store -->
        <div class="status-legend" v-if="scheduleStatusesFromStore">
          <div class="legend-item" v-for="status in scheduleStatusesFromStore" :key="status.id">
            <span class="legend-color" :style="{ backgroundColor: status.color }"></span>
            <span class="legend-text">{{ status.short_name }} - {{ status.name_rus }}</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useScheduleStore } from '@/stores/schedule'
import { getDayOfWeekShort, isWeekend, isToday, formatMonth, getPreviousMonth, getNextMonth } from '@/utils/schedule'

const userStore = useUserStore()
const scheduleStore = useScheduleStore()

const currentMonth = ref(scheduleStore.currentMonth)

// 1. Получение статусов из store
const scheduleStatusesFromStore = computed(() => {
  console.log('Computed statuses:', scheduleStore.statusesSchedule)
  return scheduleStore.statusesSchedule
})

// Функции для работы со статусами
function getStatusColor(statusId) {
    const status = scheduleStatusesFromStore.value?.find(s => s.id === statusId)
    return status?.color || '#f1f1f1ff'
}

function getStatusShortName(statusId) {
    const status = scheduleStatusesFromStore.value?.find(s => s.id === statusId)
    return status?.short_name || statusId
}

// Загрузка расписания
async function loadSchedule() {
  await scheduleStore.fetchMySchedule(currentMonth.value)
}

// Переключение месяцев
// Предыдущий месяц
async function previousMonth() {
  currentMonth.value = getPreviousMonth(currentMonth.value)
  scheduleStore.currentMonth = currentMonth.value
  await loadSchedule()
}
// Следующий месяц
async function nextMonth() {
  currentMonth.value = getNextMonth(currentMonth.value)
  scheduleStore.currentMonth = currentMonth.value
  await loadSchedule()
}

// Загрузка данных при монтировании
onMounted(async () => {
  await userStore.init()
  await loadSchedule()
  await scheduleStore.fetchStatusesSchedule()
})
</script>

<style scoped>
/* Сброс отступов для всего экрана */
body {
  margin: 0;
  padding: 0;
}

.profile-container {
  max-width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 10px;
  box-sizing: border-box;
  background: #f5f5f5;
}

/* Сворачиваемый блок информации */
.user-info-collapsible {
  background: white;
  border-radius: 6px;
  margin-bottom: 10px;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.user-info-collapsible summary {
  font-weight: 600;
  cursor: pointer;
  padding: 5px;
  color: #007bff;
}

.user-info-content {
  padding-top: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  font-size: 13px;
}

.info-item {
  padding: 3px 0;
}

/* Компактные контролы месяца */
.month-controls-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.month-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-btn:hover {
  background: #0056b3;
}

.month-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  min-width: 150px;
  text-align: center;
}

/* Полноэкранная таблица */
.fullscreen-schedule {
  width: 100%;
  overflow: hidden;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* Динамический расчет ширины колонок */
.compact-table th,
.compact-table td {
  width: calc(100vw / 35);
  max-width: 40px;
  min-width: 30px;
  height: 40px;
  padding: 0;
  text-align: center;
  vertical-align: middle;
  border: 1px solid #e0e0e0;
  font-size: 11px;
}

.compact-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.compact-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 2px;
}

.compact-day {
  font-size: 9px;
  color: #666;
  text-transform: uppercase;
}

.compact-number {
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.compact-status {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 1px rgba(0,0,0,0.3);
}

/* Стили выходных */
.weekend .compact-number {
  color: #ff6b6b;
}

/* Стиль сегодняшнего дня */
.today {
  border: 2px solid #ffc107 !important;
  background-color: #fff9e6 !important;
}

/* Легенда статусов */
.status-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  margin-top: 10px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
  border: 1px solid rgba(0,0,0,0.1);
}

.legend-text {
  color: #333;
  font-weight: 500;
}

h1 {
  font-size: 18px;
  margin: 5px 0 15px 0;
  text-align: center;
  color: #333;
}

/* Адаптивность */
@media (min-width: 1600px) {
  .compact-table th,
  .compact-table td {
    max-width: 45px;
    height: 45px;
  }
  
  .compact-number {
    font-size: 14px;
  }
  
  .compact-status {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .month-title {
    font-size: 14px;
    min-width: 120px;
  }
  
  .compact-table th,
  .compact-table td {
    height: 35px;
    font-size: 10px;
  }
  
  .compact-day {
    font-size: 8px;
  }
  
  .compact-number {
    font-size: 11px;
  }
  
  .compact-status {
    font-size: 12px;
  }
  
  .status-legend {
    gap: 8px;
    font-size: 11px;
  }
}
</style>
