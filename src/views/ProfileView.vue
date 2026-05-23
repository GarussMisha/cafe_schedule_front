<template>
  <main>
    <div class="profile-container">
      <h1>Профиль пользователя</h1>
      
      <!-- Информация о пользователе -->
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

      <!-- Таблица расписания со смёнами -->
      <div class="schedule-title">
        <strong>Расписание на {{ formatMonth(currentMonth) }}</strong>
      </div>

      <div class="fullscreen-schedule" v-if="scheduleStore.mySchedule?.userSchedules?.[0]?.shifts">
        <div class="schedule-table">
          <!-- Заголовок таблицы -->
          <div class="schedule-header">
            <div class="header-date">Дата</div>
            <div class="header-day">День</div>
            <div class="header-time">Время работы</div>
            <div class="header-status">Статус</div>
          </div>

          <!-- Строки со сменами -->
          <div v-for="shift in scheduleStore.mySchedule.userSchedules[0].shifts"
               :key="shift.date"
               :class="{
                 'schedule-row': true,
                 'weekend': isWeekend(shift.date),
                 'today': isToday(shift.date)
               }">
            
            <!-- Дата -->
            <div class="cell-date">{{ new Date(shift.date).getDate() }}</div>

            <!-- День недели -->
            <div class="cell-day">{{ getDayOfWeekShort(shift.date) }}</div>

            <!-- Время смены -->
            <div class="cell-time">
              <template v-if="!isEditingSchedule">
                <span v-if="getEditedShift(shift.date).startTime" class="time-display">
                  {{ getEditedShift(shift.date).startTime }} - {{ getEditedShift(shift.date).endTime }}
                </span>
                <span v-else class="empty-time">—</span>
              </template>
              <template v-else>
                <input 
                  type="time" 
                  :value="getEditedShift(shift.date).startTime"
                  @input="updateShiftTime(shift.date, 'startTime', $event.target.value)"
                  class="time-input"
                />
                <span class="time-sep">—</span>
                <input 
                  type="time"
                  :value="getEditedShift(shift.date).endTime"
                  @input="updateShiftTime(shift.date, 'endTime', $event.target.value)"
                  class="time-input"
                />
              </template>
            </div>

            <!-- Статус смены -->
            <div class="cell-status">
              <div 
                v-if="!isEditingSchedule"
                class="status-box"
                :style="{ backgroundColor: getStatusColor(getEditedShift(shift.date).status) }">
                {{ getStatusShortName(getEditedShift(shift.date).status) }}
                <span v-if="isShiftEdited(shift.date)" class="edited-marker">*</span>
              </div>
              <button
                v-else
                class="status-selector"
                :style="{ backgroundColor: getStatusColor(getEditedShift(shift.date).status) }"
                @click="openStatusDropdown(shift.date, $event)">
                {{ getStatusShortName(getEditedShift(shift.date).status) }}
                <span v-if="isShiftEdited(shift.date)" class="edited-marker">*</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Dropdown с выбором статуса -->
        <div v-if="isEditingSchedule && selectedShiftDate"
             class="status-dropdown-portal"
             :style="{
               top: dropdownPosition.top + 'px',
               left: dropdownPosition.left + 'px'
             }"
             @click.stop>
          <div v-for="status in scheduleStatusesFromStore"
               :key="status.id"
               class="dropdown-item"
               @click="selectStatus(selectedShiftDate, status.id)">
            <span class="status-color" :style="{ backgroundColor: status.color }"></span>
            <span class="dropdown-text">{{ status.short_name }} - {{ status.name_rus }}</span>
          </div>
        </div>
      </div>

      <!-- Легенда статусов -->
      <div class="status-legend" v-if="scheduleStatusesFromStore">
        <div class="legend-item" v-for="status in scheduleStatusesFromStore" :key="status.id">
          <span class="legend-color" :style="{ backgroundColor: status.color }"></span>
          <span class="legend-text">{{ status.short_name }} - {{ status.name_rus }}</span>
        </div>
      </div>

      <!-- Статистика -->
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
const selectedShiftDate = ref(null)
const editedShifts = ref({})
const dropdownPosition = ref({ top: 0, left: 0 })
const initialApprovedStatus = ref(false)

const scheduleStatusesFromStore = computed(() => scheduleStore.statusesSchedule)

const scheduleStatistics = computed(() => {
  if (!scheduleStore.mySchedule?.userSchedules?.[0]?.shifts) return null
  
  const shifts = scheduleStore.mySchedule.userSchedules[0].shifts
  const stats = { worked: 0, weekends: 0, vacation: 0, sick: 0 }
  
  shifts.forEach(shift => {
    const status = scheduleStatusesFromStore.value?.find(s => s.id === getEditedShift(shift.date).status)
    if (!status) return
    
    const name = status.name_rus.toLowerCase()
    if (name.includes('отпуск')) stats.vacation++
    else if (name.includes('больниц')) stats.sick++
    else if (name.includes('выходной') || name.includes('выход')) stats.weekends++
    else if (name.includes('рабоч') || name.includes('смена')) stats.worked++
  })
  
  return stats
})

function getStatusColor(statusId) {
  return scheduleStatusesFromStore.value?.find(s => s.id === statusId)?.color || '#f1f1f1ff'
}

function getStatusShortName(statusId) {
  return scheduleStatusesFromStore.value?.find(s => s.id === statusId)?.short_name || statusId
}

function getStatisticLabel(name) {
  const labels = {
    worked: 'Рабочих дней',
    weekends: 'Выходных дней',
    vacation: 'Отпускных дней',
    sick: 'Больничных дней'
  }
  return labels[name] || name
}

async function loadSchedule() {
  await scheduleStore.fetchMySchedule(currentMonth.value)
}

async function previousMonth() {
  currentMonth.value = getPreviousMonth(currentMonth.value)
  scheduleStore.currentMonth = currentMonth.value
  await loadSchedule()
}

async function nextMonth() {
  currentMonth.value = getNextMonth(currentMonth.value)
  scheduleStore.currentMonth = currentMonth.value
  await loadSchedule()
}

function startEditing() {
  isEditingSchedule.value = true
  editedShifts.value = {}
  initialApprovedStatus.value = scheduleStore.mySchedule.approved
}

function cancelEditing() {
  isEditingSchedule.value = false
  selectedShiftDate.value = null
  editedShifts.value = {}
}

function getEditedShift(date) {
  if (editedShifts.value.hasOwnProperty(date)) {
    return editedShifts.value[date]
  }
  const original = scheduleStore.mySchedule.userSchedules[0].shifts.find(s => s.date === date)
  return original || { date, startTime: '', endTime: '', status: 'OFF' }
}

function isShiftEdited(date) {
  return editedShifts.value.hasOwnProperty(date)
}

function updateShiftTime(date, field, value) {
  if (!editedShifts.value[date]) {
    editedShifts.value[date] = { ...getEditedShift(date) }
  }
  editedShifts.value[date][field] = value
}

function openStatusDropdown(date, event) {
  selectedShiftDate.value = selectedShiftDate.value === date ? null : date
  
  if (selectedShiftDate.value === date && event) {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const box = document.querySelector('.fullscreen-schedule')
    const boxRect = box.getBoundingClientRect()
    
    dropdownPosition.value = {
      top: rect.bottom - boxRect.top + 8,
      left: rect.left - boxRect.left + rect.width / 2
    }
  }
}

function selectStatus(date, statusId) {
  if (!editedShifts.value[date]) {
    editedShifts.value[date] = { ...getEditedShift(date) }
  }
  editedShifts.value[date].status = statusId
  selectedShiftDate.value = null
}

function handleClickOutside(event) {
  const dropdown = document.querySelector('.status-dropdown-portal')
  const button = event.target.closest('.status-selector')
  
  if (dropdown && dropdown.contains(event.target)) return
  if (button) return
  
  selectedShiftDate.value = null
}

async function saveSchedule() {
  try {
    if (userStore.isManager && initialApprovedStatus.value) {
      await scheduleStore.changeApproveStatus(currentMonth.value, false)
    }
    
    const shifts = scheduleStore.mySchedule.userSchedules[0].shifts
    const shiftsToSend = shifts.map(shift => ({
      date: shift.date,
      startTime: getEditedShift(shift.date).startTime,
      endTime: getEditedShift(shift.date).endTime,
      status: getEditedShift(shift.date).status
    }))

    await scheduleStore.updateMySchedule(currentMonth.value, shiftsToSend)
    
    isEditingSchedule.value = false
    selectedShiftDate.value = null
    editedShifts.value = {}

    if (userStore.isManager && initialApprovedStatus.value) {
      await scheduleStore.changeApproveStatus(currentMonth.value, true)
    }
    
    await loadSchedule()
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    alert('Ошибка при сохранении расписания')
  }
}

onMounted(async () => {
  await userStore.init()
  
  if (userStore.currentUser?.cafeId) {
    scheduleStore.cafeId.value = userStore.currentUser.cafeId
  }
  
  await loadSchedule()
  await scheduleStore.fetchStatusesSchedule()
  
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.profile-container {
  padding-top: 80px;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
}

.profile-container h1 {
  font-size: 28px;
  margin-bottom: 18px;
}

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

.user-info-summary summary {
  cursor: pointer;
  font-weight: 600;
  padding: 6px 0;
}

.info-item {
  padding: 6px 0;
}

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
  min-width: 200px;
  text-align: center;
}

.month-btn {
  background-color: #ffffff;
  color: rgb(0, 0, 0);
  border: 1px solid rgba(0, 0, 0, 0.3);
  width: 34px;
  height: 34px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.month-btn:hover {
  background-color: #ececec;
  transform: translateY(-1px);
  box-shadow: 0 0 12px #d8d8d8d0;
}

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

.edit-btn, .save-btn, .cancel-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.25s;
}

.edit-btn {
  background: #ffb547;
}

.edit-btn:hover {
  background: #e69a2e;
}

.save-btn {
  background: #4CAF50;
}

.save-btn:hover {
  background: #3b9a41;
}

.cancel-btn {
  background: #ff4444;
}

.cancel-btn:hover {
  background: #ff3c3c;
}

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
  overflow-x: auto;
  margin-bottom: 24px;
}

.schedule-table {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
}

.schedule-header {
  display: grid;
  grid-template-columns: 60px 80px 150px 100px;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
}

.header-date, .header-day, .header-time, .header-status {
  text-align: center;
  padding: 8px 0;
}

.schedule-row {
  display: grid;
  grid-template-columns: 60px 80px 150px 100px;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.2s;
}

.schedule-row.weekend {
  background: rgba(255, 107, 107, 0.06);
}

.schedule-row.today {
  background: rgba(76, 136, 255, 0.12);
  border-left: 3px solid #4c88ff;
}

.schedule-row:hover {
  background: rgba(76, 136, 255, 0.08);
}

.cell-date {
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.cell-day {
  text-align: center;
  font-size: 13px;
  color: #666;
  text-transform: uppercase;
}

.cell-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  min-height: 36px;
}

.time-display {
  font-weight: 500;
}

.empty-time {
  color: #999;
}

.time-input {
  width: 65px;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 4px rgba(102, 126, 234, 0.3);
}

.time-sep {
  color: #999;
  margin: 0 2px;
}

.cell-status {
  display: flex;
  justify-content: center;
}

.status-box {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-selector {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 70px;
  justify-content: center;
}

.status-selector:hover {
  filter: brightness(0.9);
  transform: translateY(-1px);
}

.edited-marker {
  color: #ffeb3b;
  font-size: 14px;
  font-weight: 900;
}

.status-dropdown-portal {
  position: absolute;
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  padding: 4px;
  z-index: 1000;
  transform: translateX(-50%);
  animation: dropdownAppear 0.2s ease-out;
  max-height: 300px;
  overflow-y: auto;
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
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: rgba(76, 136, 255, 0.1);
  color: #4c88ff;
}

.status-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dropdown-text {
  font-weight: 500;
}

.status-legend {
  margin-top: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  border-radius: 8px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.4);
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

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
  border-top: 2px solid #667eea;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  line-height: 1.3;
}

@media (max-width: 768px) {
  .schedule-header, .schedule-row {
    grid-template-columns: 50px 60px 100px 80px;
    gap: 8px;
    padding: 10px 12px;
    font-size: 12px;
  }

  .cell-time {
    font-size: 11px;
  }

  .time-input {
    width: 50px;
    font-size: 11px;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>
