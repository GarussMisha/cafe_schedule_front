<template>
  <main>
    <div class="profile-container">
      <h1>Профиль пользователя</h1>
      
      <!-- Информация о пользователе -->
      <!--Новая-->
      <div class="user-info" v-if="userStore.currentUser">
        <div class="user-info-content">
          <div class="info-item-name">
            <p>{{ userStore.currentUser.firstName + " " + userStore.currentUser.lastName || 'Не указано' }}</p>
          </div>
          <div class="user-info-content-detail">
            <details class="user-info-summary">
              <summary>Больше информации</summary>
              <div class="user-info-content">
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
          </div>
        </div>
      </div>

      
      <!-- Управление месяцем -->
      <div class="month-controls-compact">
        <button @click="previousMonth" class="month-btn">‹</button>
        <h2 class="month-title">{{ formatMonth(currentMonth) }}</h2>
        <button @click="nextMonth" class="month-btn">›</button>
      </div>

      <div class="approve-section">
        <p>Статус вашего расписания: <strong>{{ scheduleStore.mySchedule?.approved ? 'Закрыто' : 'Открыто' }}</strong></p>
        
        <!-- Кнопка редактирования (видна только если не утверждено) -->
        <div class="action-buttons" v-if="!scheduleStore.mySchedule?.approved || userStore.isManager">
          <template v-if="!isEditingSchedule">
            <button @click="startEditing" class="edit-btn">
              ✏️ Редактировать расписание
            </button>
          </template>
          <template v-else>
            <button @click="saveSchedule" class="save-btn">
              ✓ Сохранить
            </button>
            <button @click="cancelEditing" class="cancel-btn">
              ✕ Отменить
            </button>
          </template>
        </div>
      </div>

      <!-- Таблица расписания на весь экран -->
      <div class="schedule-title">
        <strong>Расписание на {{ formatMonth(currentMonth) }}</strong>
      </div>

      <div class="fullscreen-schedule" v-if="scheduleStore.mySchedule?.userSchedules?.[0]?.days">
        <div class="schedule-grid">
          <!-- Ячейки для каждого дня -->
          <div v-for="day in scheduleStore.mySchedule.userSchedules[0].days"
               :key="day.date"
               :class="{
                 'day-card': true,
                 'weekend': isWeekend(day.date),
                 'today': isToday(day.date),
                 'editing': isEditingSchedule
               }"
               @click.stop="isEditingSchedule && openStatusDropdown(day.date, $event)">
            
            <!-- Дата (день недели + число) -->
            <div class="day-header">
              <div class="day-name">{{ getDayOfWeekShort(day.date) }}</div>
              <div class="day-number">{{ new Date(day.date).getDate() }}</div>
            </div>
            
            <!-- Статус -->
            <div class="day-status" :style="{ backgroundColor: getStatusColor(getEditedDayStatus(day.date)) }">
              <div class="status-text">{{ getStatusShortName(getEditedDayStatus(day.date)) }}</div>
              <span v-if="isEditingSchedule && isDateEdited(day.date)" class="edited-marker">*</span>
            </div>
          </div>
        </div>

        <!-- Dropdown с выбором статуса (вне контейнера) -->
        <div v-if="isEditingSchedule && selectedDate" 
             class="status-dropdown-portal"
             :style="{
               top: dropdownPosition.top + 'px',
               left: dropdownPosition.left + 'px'
             }"
             @click.stop>
          <div v-for="status in scheduleStatusesFromStore"
               :key="status.id"
               class="dropdown-item"
               @click="selectStatus(selectedDate, status.id)">
            <span class="status-color" :style="{ backgroundColor: status.color }"></span>
            <span class="dropdown-text">{{ status.short_name }}</span>
          </div>
        </div>
        
        <!-- Легенда статусов из store -->
        <div class="status-legend" v-if="scheduleStatusesFromStore">
          <div class="legend-item" v-for="status in scheduleStatusesFromStore" :key="status.id">
            <span class="legend-color" :style="{ backgroundColor: status.color }"></span>
            <span class="legend-text">{{ status.short_name }} - {{ status.name_rus }}</span>
          </div>
        </div>

        <!-- Статистика по расписанию -->
        <div class="schedule-statistics" v-if="scheduleStatistics">
          <h3>Статистика за месяц</h3>
          <div class="statistics-grid">
            <div class="stat-card" v-for="(count, statusName) in scheduleStatistics" :key="statusName">
              <div class="stat-value">{{ count }}</div>
              <div class="stat-label">{{ getStatisticLabel(statusName) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { useScheduleStore } from '@/stores/schedule'
import { getDayOfWeekShort, isWeekend, isToday, formatMonth, getPreviousMonth, getNextMonth } from '@/utils/schedule'

const userStore = useUserStore()
const scheduleStore = useScheduleStore()

const currentMonth = ref(scheduleStore.currentMonth)
const isEditingSchedule = ref(false)
const selectedDate = ref(null)
const editedDays = ref({})
const dropdownPosition = ref({ top: 0, left: 0 })
const initialApprovedStatus = ref(false)

// 1. Получение статусов из store
const scheduleStatusesFromStore = computed(() => {
  console.log('Computed statuses:', scheduleStore.statusesSchedule)
  return scheduleStore.statusesSchedule
})

// Вычисление статистики по расписанию
const scheduleStatistics = computed(() => {
  if (!scheduleStore.mySchedule?.userSchedules?.[0]?.days) {
    return null
  }

  const days = scheduleStore.mySchedule.userSchedules[0].days
  const stats = {
    worked: 0,
    weekends: 0,
    vacation: 0,
    sick: 0
  }

  days.forEach(day => {
    const status = scheduleStatusesFromStore.value?.find(s => s.id === getEditedDayStatus(day.date))
    
    if (!status) return

    const statusName = status.name_rus.toLowerCase()
    
    // Определяем категорию по названию статуса
    if (statusName.includes('отпуск') || statusName.includes('отпускной')) {
      stats.vacation++
    } else if (statusName.includes('больниц') || statusName.includes('болезн')) {
      stats.sick++
    } else if (statusName.includes('выходной') || statusName.includes('выход')) {
      stats.weekends++
    } else if (statusName.includes('рабоч') || statusName.includes('работ') || statusName.includes('смена')) {
      stats.worked++
    } else {
      stats.other++
    }
  })

  return stats
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

function getStatisticLabel(statusName) {
  const labels = {
    worked: 'Рабочих дней',
    weekends: 'Выходных дней',
    vacation: 'Отпускных дней',
    sick: 'Больничных дней'
  }
  return labels[statusName] || statusName
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

// Функции редактирования расписания
function startEditing() {
  isEditingSchedule.value = true
  editedDays.value = {}
  // Сохраняем исходный статус расписания
  initialApprovedStatus.value = scheduleStore.mySchedule.approved
}

function cancelEditing() {
  isEditingSchedule.value = false
  selectedDate.value = null
  editedDays.value = {}
}

function openStatusDropdown(date, event) {
  selectedDate.value = selectedDate.value === date ? null : date
  
  if (selectedDate.value === date && event) {
    // Вычисляем позицию dropdown относительно кликнутой карточки
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const scheduleBox = document.querySelector('.fullscreen-schedule')
    const scheduleRect = scheduleBox.getBoundingClientRect()
    
    dropdownPosition.value = {
      top: rect.bottom - scheduleRect.top + 8,
      left: rect.left - scheduleRect.left + rect.width / 2
    }
  }
}

function selectStatus(date, statusId) {
  editedDays.value[date] = statusId
  selectedDate.value = null
}

// Закрытие dropdown при клике вне
function handleClickOutside(event) {
  const dropdown = document.querySelector('.status-dropdown-portal')
  const dayCard = event.target.closest('.day-card')
  
  // Если клик на dropdown, ничего не делаем
  if (dropdown && dropdown.contains(event.target)) return
  
  // Если клик на день-карточку, ничего не делаем (обработает openStatusDropdown)
  if (dayCard) return
  
  // Если клик не на dropdown и не на день, закрываем
  selectedDate.value = null
}

function isDateEdited(date) {
  return editedDays.value.hasOwnProperty(date)
}

function getEditedDayStatus(date) {
  if (editedDays.value.hasOwnProperty(date)) {
    return editedDays.value[date]
  }
  const originalDay = scheduleStore.mySchedule.userSchedules[0].days.find(d => d.date === date)
  return originalDay?.status
}

// Изменение статуса утверждения расписания
async function toggleApproveStatus() {
  const newStatus = !scheduleStore.mySchedule.approved
  try {
    await scheduleStore.changeApproveStatus(currentMonth.value, newStatus)
  } catch (error) {
    console.error('Ошибка при изменении статуса:', error)
  }
}

async function saveSchedule() {
  try {
    // Если менеджер редактирует закрытое расписание - открываем для редактирования
    if (userStore.isManager && initialApprovedStatus.value) {
      await toggleApproveStatus()
    }
    
    const originalDays = scheduleStore.mySchedule.userSchedules[0].days
    const daysToSend = originalDays.map(day => ({
      date: day.date,
      status: getEditedDayStatus(day.date)
    }))

    await scheduleStore.updateMySchedule(currentMonth.value, daysToSend)
    
    isEditingSchedule.value = false
    selectedDate.value = null
    editedDays.value = {}

    // Если менеджер редактировал закрытое расписание - закрываем его обратно
    if (userStore.isManager && initialApprovedStatus.value) {
      await toggleApproveStatus()
    }
    
    await loadSchedule()
  } catch (error) {
    console.error('Ошибка при сохранении расписания:', error)
  }
}




// Загрузка данных при монтировании
onMounted(async () => {
  await userStore.init()
  await loadSchedule()
  await scheduleStore.fetchStatusesSchedule()
  
  // Добавляем обработчик клика вне dropdown
  document.addEventListener('click', handleClickOutside)
})

// Очистка обработчика при размонтировании
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Общий контейнер */
.profile-container {
  padding-top: 80px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Заголовок */
.profile-container h1 {
  font-size: 28px;
  margin-bottom: 18px;
}

/* ---- БЛОК ПОЛЬЗОВАТЕЛЯ ---- */

.user-info {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 22px;
}

.user-info-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item-name p {
  font-size: 22px;
  font-weight: 700;
}

/* summary */
.user-info-summary summary {
  cursor: pointer;
  font-weight: 600;
  padding: 6px 0;
}

.info-item {
  padding: 6px 0;
}

/* ---- УПРАВЛЕНИЕ МЕСЯЦЕМ ---- */

.month-controls-compact {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin: 22px 0;
}

.month-title {
  font-size: 22px;
  font-weight: 700;
}

.month-btn {
  background-color: #ffffff; /* Green */
  color: rgb(0, 0, 0);
  border: 1px solid rgba(0, 0, 0, 0.3);
  width: 34px;
  height: 34px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
}
.month-btn:hover {
  background-color: #ececec;     /* чуть темнее */
  transform: translateY(-1px);   /* лёгкий подъём — опционально */
  box-shadow: 0 0 12px #d8d8d8d0;
}

/* ---- СТАТУС + КНОПКИ ---- */

.approve-section {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 20px;
}

.action-buttons {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.edit-btn,
.save-btn,
.cancel-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: .25s;
}

/* редактирование */
.edit-btn {
  background: #ffb547;
}
.edit-btn:hover {
  background: #e69a2e;
}

/* сохранить */
.save-btn {
  background: #4CAF50;
}
.save-btn:hover {
  background: #3b9a41;
}

/* отменить */
.cancel-btn {
  background: #ff4444;
}

.cancel-btn:hover {
  background: #ff3c3c;
}

/* ---- ТАБЛИЦА ---- */

.schedule-title {
  margin-top: 24px;
  margin-bottom: 10px;
  font-size: 18px;
}

.fullscreen-schedule {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  padding: 20px;
  border-radius: 18px;
  position: relative;
}

/* Сетка дней */
.schedule-grid {
  display: flex;
  gap: 4px;
  padding-bottom: 8px;
  margin-bottom: 24px;
}

.day-card {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 8px 4px;
  text-align: center;
  transition: all 0.25s ease;
  position: relative;
  cursor: default;
  flex: 1;
  min-width: 0;
}

.day-card.editing {
  cursor: pointer;
}

.day-card.editing:hover {
  border-color: #4c88ff;
  box-shadow: 0 4px 12px rgba(76, 136, 255, 0.2);
  transform: translateY(-2px);
}

/* Выходные */
.day-card.weekend {
  background: rgba(255, 107, 107, 0.06);
  border-color: #ff6b6b;
}

.day-card.weekend .day-header {
  color: #ff6b6b;
}

/* Сегодня */
.day-card.today {
  border: 2px solid #4c88ff;
  background: rgba(76, 136, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(76, 136, 255, 0.1);
}

.day-card.today .day-header {
  color: #4c88ff;
}

/* Заголовок дня (день недели + число) */
.day-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
  font-weight: 600;
}

.day-name {
  font-size: 9px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0px;
}

.day-number {
  font-size: 12px;
  font-weight: 700;
  color: #2c3e50;
}

/* Статус */
.day-status {
  padding: 6px 2px;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-height: 26px;
}

.status-text {
  line-height: 1.2;
}

.edited-marker {
  color: #ffb547;
  font-size: 16px;
  font-weight: 900;
  margin-left: 2px;
}

/* Dropdown выбора статуса */
.status-dropdown-portal {
  position: absolute;
  background: white;
  border-radius: 12px;
  border: 1px solid #ddd;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  padding: 8px;
  z-index: 1000;
  width: auto;
  white-space: nowrap;
  transform: translateX(-50%);
  animation: dropdownAppear 0.2s ease-out;
}

@keyframes dropdownAppear {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.dropdown-item {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: rgba(76, 136, 255, 0.1);
  color: #4c88ff;
}

.status-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.dropdown-text {
  font-weight: 500;
}

/* Легенда */
.status-legend {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  flex-shrink: 0;
}

/* ---- СТАТИСТИКА ---- */

.schedule-statistics {
  margin-top: 28px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  border-radius: 16px;
}

.schedule-statistics h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #2c3e50;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.7);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: transform 0.25s, box-shadow 0.25s;
  border-top: 2px solid #4c88ff;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(76, 136, 255, 0.15);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #4c88ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  line-height: 1.3;
}

/* ---- АДАПТИВНОСТЬ ---- */

@media (max-width: 768px) {
  .schedule-grid {
    gap: 3px;
  }

  .day-card {
    padding: 6px 3px;
    flex: 1;
    min-width: 0;
  }

  .day-name {
    font-size: 8px;
  }

  .day-number {
    font-size: 11px;
  }

  .day-status {
    font-size: 8px;
    padding: 5px 2px;
    min-height: 24px;
  }

  .status-legend {
    gap: 8px;
  }

  .legend-item {
    font-size: 11px;
    padding: 6px 8px;
  }

  .statistics-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-icon {
    font-size: 28px;
  }
}

</style>

