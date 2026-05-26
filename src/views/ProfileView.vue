<template>
  <main>
    <div class="profile-container">
      <h1>Профиль пользователя</h1>
      
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

      <div class="month-controls-compact">
        <button @click="previousMonth" class="month-btn" type="button">
          <i class="pi pi-angle-left"></i>
        </button>
        <h2 class="month-title">{{ formatMonth(currentMonth) }}</h2>
        <button @click="nextMonth" class="month-btn" type="button">
          <i class="pi pi-angle-right"></i>
        </button>
      </div>

      <div class="approve-section">
        <p>Статус вашего расписания: <strong>{{ scheduleStore.mySchedule?.approved ? 'Закрыто' : 'Открыто' }}</strong></p>
        
        <div class="action-buttons" v-if="!scheduleStore.mySchedule?.approved || userStore.isManager">
          <template v-if="!isEditingSchedule">
            <button @click="startEditing" class="edit-btn" type="button">
              ✏️ Редактировать расписание
            </button>
          </template>
          <template v-else>
            <button @click="saveSchedule" class="save-btn" type="button">
              ✓ Сохранить
            </button>
            <button @click="cancelEditing" class="cancel-btn" type="button">
              ✕ Отменить
            </button>
          </template>
        </div>
      </div>

      <div class="status-legend" v-if="scheduleStatusesFromStore">
        <div class="legend-item" v-for="status in scheduleStatusesFromStore" :key="status.id">
          <span class="legend-color" :style="{ backgroundColor: status.color }"></span>
          <span class="legend-text">{{ status.short_name }} - {{ status.name_rus }}</span>
        </div>
      </div>

      <template v-if="scheduleStore.mySchedule?.userSchedules?.[0]">
        <div class="schedule-grid-container">
          <div class="schedule-table-wrapper">
            <div class="schedule-table">
              <div class="table-header" :style="{ gridTemplateColumns: gridTemplateCols }">
                <div class="header-corner">Дата</div>
                <div 
                  v-for="day in getDaysInMonth()" 
                  :key="day"
                  :class="['header-day', {
                    'today-col': isToday(day),
                    'weekend-col': isWeekend(day)
                  }]">
                  <div class="day-date">{{ new Date(day).getDate() }}</div>
                  <div class="day-name">{{ getDayOfWeekShort(day) }}</div>
                </div>
              </div>

              <div class="table-row" :style="{ gridTemplateColumns: gridTemplateCols }">
                <div class="row-header">
                  <div class="employee-info">
                    <div class="employee-name">Моё расписание</div>
                  </div>
                </div>

                <div 
                  v-for="day in getDaysInMonth()"
                  :key="`me-${day}`"
                  :class="['cell', {
                    'today-col': isToday(day),
                    'weekend-col': isWeekend(day),
                    'editing': isEditingSchedule
                  }]"
                  :style="getCellBackground(day)"
                  @click="onCellClick(day, $event)">
                  
                 <div class="cell-content">
                    <div class="shift-display">
                      <div class="shift-time" v-if="getShiftForDayWithEdit(day) && !isNonWorkingShift(getShiftForDayWithEdit(day).status)">
                        <span class="shift-start">{{ formatTime(getShiftForDayWithEdit(day).startTime) }}</span>
                        <span class="shift-separator">—</span>
                        <span class="shift-end">{{ formatTime(getShiftForDayWithEdit(day).endTime) }}</span>
                      </div>
                      <div class="shift-edit-indicator" v-if="isEditingSchedule && getIsCellEdited(day)">
                        <i class="pi pi-star"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="no-data">
          <p>Нет данных для отображения</p>
        </div>
      </template>
      
      <!-- Popover для редактирования смен -->
      <div v-if="isEditingSchedule && editingCell" class="edit-popover" :style="popoverStyle">
        <div class="popover-header">
          <span class="popover-date">{{ editingCell.dateDisplay }}</span>
          <button class="popover-close-btn" @click="closePopover" type="button">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="popover-body">
          <div class="popover-field">
            <label>Начало</label>
            <input
              type="time"
              :value="getPopoverShift()?.startTime"
              @input="onPopoverTimeChange('startTime', $event.target.value)"
              class="popover-time-input"
              :disabled="['OFF', 'VACATION', 'SICK_LEAVE'].includes(getPopoverShift()?.status)"
            />
          </div>
          <div class="popover-field">
            <label>Конец</label>
            <input
              type="time"
              :value="getPopoverShift()?.endTime"
              @input="onPopoverTimeChange('endTime', $event.target.value)"
              class="popover-time-input"
              :disabled="['OFF', 'VACATION', 'SICK_LEAVE'].includes(getPopoverShift()?.status)"
            />
          </div>
          <div class="popover-field">
            <label>Статус</label>
            <select
              :value="getPopoverShift()?.status"
              @input="onPopoverStatusChange($event.target.value)"
              class="popover-status-select"
            >
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>
          <div class="popover-actions">
            <button class="popover-save-btn" @click="closePopover" type="button">
              Сохранить
            </button>
            <button class="popover-cancel-btn" @click="closePopover" type="button">
              Отмена
            </button>
          </div>
        </div>
      </div>

      <div class="schedule-statistics" v-if="scheduleStatistics">
        <h3>Статистика за месяц</h3>
        <div class="statistics-grid">
          <div class="stat-card" v-for="(count, statusName) in scheduleStatistics" :key="statusName">
            <div class="stat-value">{{ count }}</div>
            <div class="stat-label">{{ getStatisticLabel(statusName) }}</div>
          </div>
        </div>
        <div v-if="hourStatistics" class="hour-statistics">
          <h4>Рабочие часы</h4>
          <div class="statistics-grid">
            <div class="stat-card">
              <div class="stat-value">{{ hourStatistics.worked }}</div>
              <div class="stat-label">Отработано часов</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ hourStatistics.planned }}</div>
              <div class="stat-label">Запланировано часов</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { useScheduleStore } from '@/stores/schedule'
import { getDayOfWeekShort, isWeekend, isToday, formatMonth, getPreviousMonth, getNextMonth, formatTime } from '@/utils/schedule'

const userStore = useUserStore()
const scheduleStore = useScheduleStore()

const currentMonth = ref(scheduleStore.currentMonth)
const isEditingSchedule = ref(false)
const editingCell = ref(null)
const editedShifts = ref({})
const originalSchedule = ref(null)
const popoverStyle = ref({ position: 'fixed', zIndex: 9999 })

const scheduleStatusesFromStore = computed(() => scheduleStore.statusesSchedule)

const daysCount = computed(() => getDaysInMonth().length)

const gridTemplateCols = computed(() => {
  const count = daysCount.value
  if (count === 0) return '120px'
  return `120px repeat(${count}, minmax(48px, 1fr))`
})

const statusOptions = computed(() => {
  return (scheduleStore.statusesSchedule || []).map(s => ({
    label: `${s.short_name} - ${s.name_rus}`,
    value: s.id
  }))
})

const scheduleStatistics = computed(() => {
  const user = scheduleStore.mySchedule?.userSchedules?.[0]
  if (!user?.shifts) return null
  
  const shifts = user.shifts
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

const hourStatistics = computed(() => {
  const user = scheduleStore.mySchedule?.userSchedules?.[0]
  if (!user?.shifts) return null

  const shifts = user.shifts
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let plannedHours = 0
  let workedHours = 0

  shifts.forEach(shift => {
    const editedShift = getEditedShift(shift.date)
    const status = scheduleStatusesFromStore.value?.find(s => s.id === editedShift.status)
    if (!status) return

    const name = status.name_rus.toLowerCase()
    if (name.includes('рабоч') || name.includes('смена')) {
      const hours = calculateHours(editedShift.startTime, editedShift.endTime)
      plannedHours += hours

      const shiftDate = new Date(shift.date + 'T00:00:00')
      if (shiftDate <= today) {
        workedHours += hours
      }
    }
  })

  return {
    worked: Math.ceil(workedHours),
    planned: Math.ceil(plannedHours)
  }
})

function getDaysInMonth() {
  const days = []
  const [year, month] = currentMonth.value.split('-')
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`
    days.push(dateStr)
  }
  return days
}

function onCellClick(day, event) {
  if (!isEditingSchedule.value) return
  
  const rect = event.target.getBoundingClientRect()
  const popoverWidth = 240
  const popoverHeight = 280
  
  let left = rect.right + 10
  let top = rect.top
  
  if (left + popoverWidth > window.innerWidth) {
    left = rect.left - popoverWidth - 10
  }
  if (top + popoverHeight > window.innerHeight) {
    top = window.innerHeight - popoverHeight - 20
  }
  if (top < 10) top = 10
  
  popoverStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 9999
  }
  
  editingCell.value = {
    day,
    dateDisplay: formatDateDisplay(day)
  }
  
  const key = day
  const user = scheduleStore.mySchedule?.userSchedules?.[0]
  const shift = user?.shifts?.find(s => s.date === day)
  
  if (!editedShifts.value[key]) {
    editedShifts.value[key] = shift ? { ...shift } : { date: day, startTime: '', endTime: '', status: 'OFF' }
  }
}

const formatDateDisplay = (dateStr) => {
  const date = new Date(dateStr)
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  const weekDays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
  return `${date.getDate()} ${months[date.getMonth()]} (${weekDays[date.getDay()]})`
}

function getPopoverShift() {
  if (!editingCell.value) return null
  return editedShifts.value[editingCell.value.day] || null
}

function onPopoverStatusChange(value) {
  if (!editingCell.value) return
  const day = editingCell.value.day
  if (!editedShifts.value[day]) {
    const user = scheduleStore.mySchedule?.userSchedules?.[0]
    const shift = user?.shifts?.find(s => s.date === day)
    if (shift) {
      editedShifts.value[day] = { ...shift }
    } else {
      editedShifts.value[day] = { date: day, startTime: '', endTime: '', status: 'OFF' }
    }
  }
  editedShifts.value[day].status = value
  if (isNonWorkingShift(value)) {
    editedShifts.value[day].startTime = ''
    editedShifts.value[day].endTime = ''
  }
  editedShifts.value[day] = { ...editedShifts.value[day] }
}

function onPopoverTimeChange(field, value) {
  if (!editingCell.value) return
  const day = editingCell.value.day
  if (!editedShifts.value[day]) {
    const user = scheduleStore.mySchedule?.userSchedules?.[0]
    const shift = user?.shifts?.find(s => s.date === day)
    if (shift) {
      editedShifts.value[day] = { ...shift }
    } else {
      editedShifts.value[day] = { date: day, startTime: '', endTime: '', status: 'OFF' }
    }
  }
  editedShifts.value[day][field] = value
}

function getShiftForDay(day) {
  const user = scheduleStore.mySchedule?.userSchedules?.[0]
  return user?.shifts?.find(s => s.date === day)
}

function getShiftForDayWithEdit(day) {
  if (editingCell.value && editingCell.value.day === day) {
    return getPopoverShift()
  }
  
  if (editedShifts.value[day]) return editedShifts.value[day]
  
  const user = scheduleStore.mySchedule?.userSchedules?.[0]
  return user?.shifts?.find(s => s.date === day)
}

function getEditedShift(date) {
  if (editedShifts.value.hasOwnProperty(date)) {
    return editedShifts.value[date]
  }
  const user = scheduleStore.mySchedule?.userSchedules?.[0]
  const original = user?.shifts?.find(s => s.date === date)
  return original || { date, startTime: '', endTime: '', status: 'OFF' }
}

function getStatusColor(statusId) {
  return scheduleStatusesFromStore.value?.find(s => s.id === statusId)?.color || '#f1f1f1'
}

function getStatusShortName(statusId) {
  return scheduleStatusesFromStore.value?.find(s => s.id === statusId)?.short_name || statusId
}

function isNonWorkingShift(statusId) {
  return ['OFF', 'VACATION', 'SICK_LEAVE'].includes(statusId)
}

function getOffColor() {
  const offStatus = scheduleStatusesFromStore.value?.find(s => s.id === 'OFF')
  return offStatus?.color || '#cccccc'
}

function getCellBackground(day) {
  const edited = editedShifts.value[day]
  if (edited) {
    return getShiftColor(edited)
  }
  
  const user = scheduleStore.mySchedule?.userSchedules?.[0]
  const shift = user?.shifts?.find(s => s.date === day)
  if (!shift) {
    const offColor = getOffColor()
    const hex = offColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return { backgroundColor: `rgba(${r}, ${g}, ${b}, 1)` }
  }
  return getShiftColor(shift)
}

function getShiftColor(shift) {
  const color = getStatusColor(shift.status)
  
  if (!color) return {}
  
  const alpha = shift.status === 'OFF' ? 1 : 0.25
  
  const isHex = color.startsWith('#')
  if (isHex) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` }
  }
  
  return {}
}

function getIsCellEdited(day) {
  const currentShift = getShiftForDayWithEdit(day)
  if (!currentShift) return false
  
  if (!originalSchedule.value) return false
  
  const originalUser = originalSchedule.value.userSchedules?.[0]
  const originalShift = originalUser?.shifts?.find(s => s.date === day)
  
  if (!originalShift) return false
  
  return currentShift.status !== originalShift.status ||
         currentShift.startTime !== originalShift.startTime ||
         currentShift.endTime !== originalShift.endTime
}

function closePopover() {
  editingCell.value = null
}

function handleClickOutside(event) {
  if (editingCell.value && !event.target.closest('.edit-popover') && !event.target.closest('.cell')) {
    closePopover()
  }
}

function startEditing() {
  isEditingSchedule.value = true
  originalSchedule.value = JSON.parse(JSON.stringify(scheduleStore.mySchedule))
  editedShifts.value = {}
}

function cancelEditing() {
  if (originalSchedule.value) {
    scheduleStore.mySchedule = JSON.parse(JSON.stringify(originalSchedule.value))
  }
  isEditingSchedule.value = false
  editedShifts.value = {}
  originalSchedule.value = null
}

async function saveSchedule() {
  try {
    const NON_WORKING_STATUSES = ['OFF', 'VACATION', 'SICK_LEAVE']
    const user = scheduleStore.mySchedule.userSchedules[0]
    const existingShifts = user.shifts || []
    const existingDates = new Set(existingShifts.map(s => s.date))
    
    const editedDates = new Set(Object.keys(editedShifts.value))
    
    const allDates = new Set([...existingDates, ...editedDates])
    
    const shiftsData = Array.from(allDates).map(date => {
      const edited = editedShifts.value[date]
      const existing = existingShifts.find(s => s.date === date)
      
      const shiftData = edited || existing
      
      if (!shiftData) return null
      
      const isNonWorking = NON_WORKING_STATUSES.includes(shiftData.status)
      return {
        date: shiftData.date,
        startTime: isNonWorking ? '00:00' : (shiftData.startTime || '00:00'),
        endTime: isNonWorking ? '23:59' : (shiftData.endTime || '23:59'),
        status: shiftData.status
      }
    }).filter(Boolean)

    await scheduleStore.updateMySchedule(currentMonth.value, shiftsData)

    editedShifts.value = {}
    originalSchedule.value = null
    isEditingSchedule.value = false
    
    await loadSchedule()
    alert('Расписание успешно сохранено!')
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    alert('Ошибка при сохранении расписания')
  }
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

function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const start = startH + startM / 60
  const end = endH + endM / 60
  return Math.max(0, end - start)
}

async function loadSchedule() {
  try {
    await scheduleStore.fetchMySchedule(currentMonth.value)
  } catch (error) {
    console.error('Ошибка при загрузке расписания:', error)
  }
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
main {
  padding: 0;
  min-height: calc(100vh - 60px);
  background: transparent;
}

.profile-container {
  padding-top: 70px;
  max-width: none;
  margin: 0 auto;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 20px;
  animation: profileEnter 0.5s ease-out both;
}

@keyframes profileEnter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-container h1 {
  font-size: 28px;
  margin-bottom: 18px;
  color: #2c3e50;
}

.user-info {
  background: rgba(255, 255, 255, 0.6);
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
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.month-title {
  font-size: 22px;
  font-weight: 700;
  min-width: 200px;
  text-align: center;
}

.month-btn {
  background: transparent;
  color: #1a1a1a;
  border: 1.5px solid #e0e0e0;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-btn:hover {
  border-color: #ff9800;
  color: #ff9800;
  background: rgba(255, 152, 0, 0.05);
  transform: translateY(-1px);
}

.approve-section {
  background: rgba(255, 255, 255, 0.6);
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
  padding: 8px 20px;
  border: 1.5px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 400;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.edit-btn {
  background: transparent;
  color: #ff9800;
  border-color: #ff9800;
}

.edit-btn:hover {
  background: rgba(255, 152, 0, 0.1);
  color: #e68900;
  border-color: #e68900;
}

.save-btn {
  background: transparent;
  color: #4CAF50;
  border-color: #4CAF50;
}

.save-btn:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #3b9a41;
  border-color: #3b9a41;
}

.cancel-btn {
  background: transparent;
  color: #ff4444;
  border-color: #ff4444;
}

.cancel-btn:hover {
  background: rgba(255, 68, 68, 0.1);
  color: #ff3c3c;
  border-color: #ff3c3c;
}

.status-legend {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.6);
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

/* schedule grid styles */
.schedule-grid-container {
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-bottom: 24px;
}

.schedule-grid-container::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.schedule-grid-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.schedule-grid-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.schedule-grid-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.schedule-table-wrapper {
  display: block;
  width: auto;
  min-width: 100%;
  overflow-x: auto;
  flex-shrink: 0;
}

.schedule-table {
  display: flex;
  flex-direction: column;
  min-width: fit-content;
}

.table-header {
  display: grid;
  position: sticky;
  top: 0;
  z-index: 11;
  box-sizing: border-box;
}

.header-corner {
  background: linear-gradient(135deg, #ff9800 0%, #e68900 100%);
  color: white;
  font-weight: 700;
  font-size: 9px;
  padding: 4px 2px;
  text-align: center;
  min-width: 48px;
  box-sizing: border-box;
  word-break: break-word;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  left: 0;
  z-index: 12;
}

.header-day {
  background: linear-gradient(135deg, #ff9800 0%, #e68900 100%);
  color: white;
  font-weight: 600;
  font-size: 9px;
  padding: 4px 2px;
  text-align: center;
  min-width: 48px;
  box-sizing: border-box;
  word-break: break-word;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header-day.today-col {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  font-weight: 700;
}

.header-day.weekend-col {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8a80 100%);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.day-date {
  font-weight: 700;
  font-size: 11px;
}

.day-name {
  font-size: 9px;
  opacity: 0.9;
  margin-top: 1px;
}

.table-row {
  display: grid;
  gap: 0;
  background: #e0e0e0;
  min-height: 65px;
  width: auto;
}

.row-header {
  background: #f9f9f9;
  padding: 10px 8px;
  font-size: 11px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  left: 0;
  z-index: 9;
  gap: 6px;
  box-sizing: border-box;
}

.employee-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
}

.employee-name {
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  flex-shrink: 1;
}

.employee-position {
  font-size: 9px;
  color: #999;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.cell {
  background: white;
  padding: 4px 2px;
  min-height: 65px;
  max-height: 65px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  box-sizing: border-box;
  word-break: break-word;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  position: relative;
}

.cell:hover {
  border-color: #ff9800;
}

.cell.today-col::after {
  content: '●';
  position: absolute;
  top: 3px;
  right: 3px;
  font-size: 9px;
  color: #4CAF50;
  z-index: 2;
  line-height: 1;
}

.cell.editing {
  cursor: auto;
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 1px;
}

.shift-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.shift-time {
  font-size: 11px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
  box-sizing: border-box;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.shift-start, .shift-end {
  white-space: nowrap;
}

.shift-separator {
  font-size: 8px;
  opacity: 0.4;
  line-height: 1;
}

.shift-edit-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #ff9800;
  font-size: 10px;
  opacity: 0.8;
  pointer-events: none;
  z-index: 10;
}

.no-data {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  color: #888;
  margin-bottom: 24px;
}

/* edit popover styles */
.edit-popover {
  position: fixed;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  padding: 0;
  z-index: 9999;
  min-width: 240px;
  animation: popoverAppear 0.2s ease-out;
  overflow: hidden;
}

@keyframes popoverAppear {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.popover-date {
  font-weight: 600;
  font-size: 14px;
}

.popover-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  font-size: 14px;
}

.popover-close-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.popover-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.popover-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.popover-field label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.04em;
}

.popover-time-input {
  padding: 10px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: #fafafa;
}

.popover-time-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
}

.popover-time-input:disabled {
  background: #f5f5f5;
  color: #bbb;
  cursor: not-allowed;
}

.popover-status-select {
  padding: 10px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  transition: border-color 0.2s;
  background: #fafafa;
  cursor: pointer;
}

.popover-status-select:focus {
  outline: none;
  border-color: #667eea;
  background: white;
}

.popover-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.popover-save-btn,
.popover-cancel-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.popover-save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.popover-save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.popover-cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.popover-cancel-btn:hover {
  background: #e0e0e0;
}

/* statistics styles */
.schedule-statistics {
  margin-top: 28px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.6);
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
  border-top: 2px solid #ff9800;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(255, 152, 0, 0.15);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #ff9800;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  line-height: 1.3;
}

.hour-statistics {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.hour-statistics h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2c3e50;
}

@media (max-width: 768px) {
  .profile-container {
    padding-left: 10px;
    padding-right: 10px;
  }

  .month-title {
    font-size: 18px;
    min-width: 140px;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>
