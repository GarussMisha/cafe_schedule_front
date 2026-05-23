<template>
  <main>
    <div class="schedule-container">
      <h1>Расписание сотрудников</h1>
      
      <pre class="info-text">Расписание на следующий месяц можно внести до последнего дня текущего месяца 18:00
Изменения расписания осуществляются по согласованию с Менеджером.</pre>

      <!-- Выбор вида отображения -->
      <div class="view-controls">
        <div class="view-buttons">
          <button 
            v-for="view in ['month', 'week', 'day']" 
            :key="view"
            @click="setViewMode(view)"
            :class="['view-btn', { active: viewMode === view }]">
            {{ getViewLabel(view) }}
          </button>
        </div>

        <!-- Навигация по периодам -->
        <div class="period-controls">
          <button @click="previousPeriod" class="nav-btn">‹ Назад</button>
          <h2 class="period-title">{{ getPeriodTitle() }}</h2>
          <button @click="nextPeriod" class="nav-btn">Вперёд ›</button>
        </div>

        <!-- Выбор даты для недели/дня -->
        <div v-if="viewMode !== 'month'" class="date-picker">
          <label>Выберите дату:</label>
          <input 
            type="date"
            :value="selectedDate"
            @input="selectDate($event.target.value)"
          />
        </div>
      </div>

      <!-- Статус и действия -->
      <div class="approve-section">
        <p>Статус расписания: <strong>{{ scheduleStore.allSchedule?.approved ? 'Утверждено ✓' : 'Не утверждено' }}</strong></p>
        
        <div class="action-buttons">
          <template v-if="!isEditingSchedule">
            <button 
              v-if="!scheduleStore.allSchedule?.approved && userStore.isManager"
              @click="startEditing" 
              class="edit-btn">
              ✏️ Редактировать расписание
            </button>
            <button 
              @click="toggleApproveStatus" 
              v-if="userStore.isManager"
              :class="['approve-btn', scheduleStore.allSchedule?.approved ? 'approved' : 'not-approved']">
              {{ scheduleStore.allSchedule?.approved ? 'Отозвать утверждение' : 'Утвердить расписание' }}
            </button>
          </template>
          <template v-else>
            <button @click="saveAllSchedules" class="save-btn">✓ Сохранить</button>
            <button @click="cancelEditing" class="cancel-btn">✕ Отменить</button>
          </template>
        </div>
      </div>

      <!-- Легенда статусов -->
      <div class="status-legend" v-if="scheduleStatusesFromStore">
        <div class="legend-item" v-for="status in scheduleStatusesFromStore" :key="status.id">
          <span class="legend-color" :style="{ backgroundColor: status.color }"></span>
          <span class="legend-text">{{ status.short_name }} - {{ status.name_rus }}</span>
        </div>
      </div>

      <!-- Таблица расписания (сотрудники × дни) -->
      <div class="schedule-grid-container" v-if="scheduleStore.allSchedule?.userSchedules && getDaysInPeriod().length > 0">
        <div class="schedule-table-wrapper">
          <!-- Заголовок с днями -->
          <div class="schedule-table">
            <!-- Корнер (пусто) + заголовок дней -->
            <div class="table-header" :style="{ gridTemplateColumns: `120px repeat(${daysCount}, 1fr)` }">
              <div class="header-corner">Сотрудник</div>
              <div 
                v-for="day in getDaysInPeriod()" 
                :key="day"
                :class="['header-day', {
                  'today': isToday(day),
                  'weekend': isWeekend(day)
                }]">
                <div class="day-date">{{ new Date(day).getDate() }}</div>
                <div class="day-name">{{ getDayOfWeekShort(day) }}</div>
              </div>
            </div>

            <!-- Строки сотрудников -->
            <div 
              v-for="(user, userIdx) in scheduleStore.allSchedule.userSchedules"
              :key="user.userId"
              class="table-row"
              :style="{ gridTemplateColumns: `120px repeat(${daysCount}, 1fr)` }">
              
              <!-- Имя сотрудника -->
              <div class="row-header">
                <div class="employee-info">
                  <div class="employee-name">{{ user.firstName }} {{ user.lastName }}</div>
                  <div class="employee-position">{{ user.position }}</div>
                </div>
                <button 
                  v-if="isEditingSchedule && userStore.isManager"
                  @click="removeUserByIdx(userIdx)"
                  class="remove-employee-btn"
                  title="Удалить сотрудника из расписания">
                  ✕
                </button>
              </div>

              <!-- Ячейки со смёнами -->
              <div 
                v-for="day in getDaysInPeriod()"
                :key="`${user.userId}-${day}`"
                :class="['cell', {
                  'today': isToday(day),
                  'weekend': isWeekend(day),
                  'editing': isEditingSchedule
                }]"
                @click="!isEditingSchedule && expandCell(userIdx, day)">
                
                <div v-if="getShiftForDay(user, day)" class="cell-content">
                  <div v-if="!isEditingSchedule" class="shift-display">
                    <div class="shift-time">
                      {{ getShiftForDay(user, day).startTime }} - {{ getShiftForDay(user, day).endTime }}
                    </div>
                    <div 
                      class="shift-status"
                      :style="{ backgroundColor: getStatusColor(getShiftForDay(user, day).status) }">
                      {{ getStatusShortName(getShiftForDay(user, day).status) }}
                    </div>
                  </div>
                  
                  <div v-else class="shift-edit">
                    <div class="time-edit-group">
                      <input 
                        type="time"
                        :value="getEditedShift(userIdx, day).startTime"
                        @input="updateShiftTime(userIdx, day, 'startTime', $event.target.value)"
                        class="time-input"
                      />
                      <span>—</span>
                      <input 
                        type="time"
                        :value="getEditedShift(userIdx, day).endTime"
                        @input="updateShiftTime(userIdx, day, 'endTime', $event.target.value)"
                        class="time-input"
                      />
                    </div>
                    <button 
                      class="status-dropdown-btn"
                      :style="{ backgroundColor: getStatusColor(getEditedShift(userIdx, day).status) }"
                      @click.stop="openStatusDropdown(userIdx, day, $event)">
                      {{ getStatusShortName(getEditedShift(userIdx, day).status) }}
                    </button>
                  </div>
                </div>
                <div v-else class="cell-empty">—</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dropdown для выбора статуса -->
      <div 
        v-if="isEditingSchedule && selectedCell"
        class="status-dropdown-overlay"
        :style="dropdownPosition"
        @click.stop>
        <div 
          v-for="status in scheduleStatusesFromStore"
          :key="status.id"
          class="dropdown-item"
          @click="selectStatus(selectedCell.userIdx, selectedCell.day, status.id)">
          <span class="color" :style="{ backgroundColor: status.color }"></span>
          <span>{{ status.short_name }} - {{ status.name_rus }}</span>
        </div>
      </div>

      <div v-else class="no-data">
        <p>Нет данных для отображения</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { getDayOfWeekShort, isWeekend, isToday, formatMonth, getPreviousMonth, getNextMonth } from '@/utils/schedule'

const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const viewMode = ref('month')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const currentMonth = ref(scheduleStore.currentMonth)
const currentWeekStart = ref('')

// Инициализация currentWeekStart при монтировании компонента
onMounted(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Принудительно устанавливаем понедельник как начало недели
  currentWeekStart.value = getWeekStart(today)
  // Обновляем selectedDate чтобы совпадал с понедельником
  selectedDate.value = getWeekStart(today)
})
const isEditingSchedule = ref(false)
const selectedCell = ref(null)
const editedShifts = ref({})
const dropdownPosition = ref({ position: 'absolute', top: 0, left: 0, zIndex: 1000 })

const scheduleStatusesFromStore = computed(() => scheduleStore.statusesSchedule)

// Количество дней в текущем периоде для grid
const daysCount = computed(() => getDaysInPeriod().length)

// Получить массив дней для текущего периода
function getDaysInPeriod() {
  const days = []
  
  if (viewMode.value === 'month') {
    const [year, month] = currentMonth.value.split('-')
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`
      days.push(dateStr)
    }
  } else if (viewMode.value === 'week') {
    const weekStart = new Date(currentWeekStart.value)
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      days.push(date.toISOString().split('T')[0])
    }
  } else {
    days.push(selectedDate.value)
  }
  
  return days
}

function getWeekStart(dateStr) {
  // Создаём дату с временем 00:00:00 для консистентности
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  
  // getDay(): 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
  const day = date.getDay()
  
  // Считаем дней до понедельника (день === 1)
  // Если воскресенье (0) → идём назад на 6 дней
  // Если понедельник (1) → остаёмся на месте (0)
  // Если вторник (2) → идём назад на 1 день
  const daysToMonday = day === 0 ? -6 : 1 - day
  
  // Создаём новую дату для понедельника
  const monday = new Date(date)
  monday.setDate(monday.getDate() + daysToMonday)
  
  // Используем local date string чтобы избежать проблем с часовым поясом
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const dayNum = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${dayNum}`
}

function setViewMode(mode) {
  viewMode.value = mode
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (mode === 'month') {
    currentMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  } else if (mode === 'week') {
    const firstDayOfMonth = new Date(currentMonth.value)
    firstDayOfMonth.setHours(0, 0, 0, 0)
    currentWeekStart.value = getWeekStart(firstDayOfMonth)
  } else {
    selectedDate.value = today.toISOString().split('T')[0]
  }
}

function getPeriodTitle() {
  if (viewMode.value === 'month') {
    const [year, month] = currentMonth.value.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    const monthName = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][date.getMonth()]
    return `${monthName} ${year}`
  } else if (viewMode.value === 'week') {
    const start = new Date(currentWeekStart.value)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
    return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`
  } else {
    const date = new Date(selectedDate.value)
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
    const weekDays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
    return `${date.getDate()} ${months[date.getMonth()]}, ${weekDays[(date.getDay() + 6) % 7]}`
  }
}

function getViewLabel(view) {
  const labels = { month: 'Месяц', week: 'Неделя', day: 'День' }
  return labels[view]
}

function previousPeriod() {
  if (viewMode.value === 'month') {
    currentMonth.value = getPreviousMonth(currentMonth.value)
  } else if (viewMode.value === 'week') {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() - 7)
    currentWeekStart.value = d.toISOString().split('T')[0]
    // Обновляем currentMonth если неделя перешла в другой месяц
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (newMonth !== currentMonth.value) {
      currentMonth.value = newMonth
    }
  } else {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() - 1)
    selectedDate.value = d.toISOString().split('T')[0]
  }
  loadSchedule()
}

function nextPeriod() {
  if (viewMode.value === 'month') {
    currentMonth.value = getNextMonth(currentMonth.value)
  } else if (viewMode.value === 'week') {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() + 7)
    currentWeekStart.value = d.toISOString().split('T')[0]
    // Обновляем currentMonth если неделя перешла в другой месяц
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (newMonth !== currentMonth.value) {
      currentMonth.value = newMonth
    }
  } else {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() + 1)
    selectedDate.value = d.toISOString().split('T')[0]
  }
  loadSchedule()
}

function selectDate(date) {
  selectedDate.value = date
}

function getShiftForDay(user, day) {
  return user.shifts?.find(s => s.date === day)
}

function getStatusColor(statusId) {
  return scheduleStatusesFromStore.value?.find(s => s.id === statusId)?.color || '#f1f1f1'
}

function getStatusShortName(statusId) {
  return scheduleStatusesFromStore.value?.find(s => s.id === statusId)?.short_name || statusId
}

function getEditedShift(userIdx, day) {
  const key = `${userIdx}-${day}`
  if (editedShifts.value[key]) return editedShifts.value[key]
  
  const user = scheduleStore.allSchedule?.userSchedules?.[userIdx]
  const shift = user?.shifts?.find(s => s.date === day)
  return shift || { date: day, startTime: '', endTime: '', status: 'OFF' }
}

function updateShiftTime(userIdx, day, field, value) {
  const key = `${userIdx}-${day}`
  if (!editedShifts.value[key]) {
    editedShifts.value[key] = { ...getEditedShift(userIdx, day) }
  }
  editedShifts.value[key][field] = value
}

function expandCell(userIdx, day) {
  // Для просмотра (не редактирования) можно добавить модальное окно
}

function openStatusDropdown(userIdx, day, event) {
  selectedCell.value = { userIdx, day }
  
  if (event) {
    const btn = event.currentTarget
    const rect = btn.getBoundingClientRect()
    dropdownPosition.value = {
      position: 'fixed',
      top: rect.bottom + 5 + 'px',
      left: rect.left - 50 + 'px',
      zIndex: 1000
    }
  }
}

function selectStatus(userIdx, day, statusId) {
  const key = `${userIdx}-${day}`
  if (!editedShifts.value[key]) {
    editedShifts.value[key] = { ...getEditedShift(userIdx, day) }
  }
  editedShifts.value[key].status = statusId
  selectedCell.value = null
}

function handleClickOutside(event) {
  if (!event.target.closest('.status-dropdown-overlay') && !event.target.closest('.status-dropdown-btn')) {
    selectedCell.value = null
  }
}

function startEditing() {
  isEditingSchedule.value = true
  editedShifts.value = {}
}

function cancelEditing() {
  isEditingSchedule.value = false
  selectedCell.value = null
  editedShifts.value = {}
}

async function saveAllSchedules() {
  try {
    const schedulesData = scheduleStore.allSchedule.userSchedules.map((user, userIdx) => ({
      userId: user.userId,
      shifts: (user.shifts || []).map(shift => ({
        date: shift.date,
        startTime: getEditedShift(userIdx, shift.date).startTime,
        endTime: getEditedShift(userIdx, shift.date).endTime,
        status: getEditedShift(userIdx, shift.date).status
      }))
    }))

    await scheduleStore.updateAllScheduleData(
      viewMode.value === 'month' ? currentMonth.value : new Date().toISOString().split('T')[0],
      schedulesData
    )

    isEditingSchedule.value = false
    selectedCell.value = null
    editedShifts.value = {}
    
    await loadSchedule()
    alert('Расписание успешно сохранено!')
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    alert('Ошибка при сохранении расписания')
  }
}

async function toggleApproveStatus() {
  const newStatus = !scheduleStore.allSchedule.approved
  try {
    const month = viewMode.value === 'month' ? currentMonth.value : new Date().toISOString().split('T')[0]
    await scheduleStore.changeApproveStatus(month, newStatus)
    await loadSchedule()
  } catch (error) {
    console.error('Ошибка при изменении статуса:', error)
  }
}

async function loadSchedule() {
  try {
    const month = viewMode.value === 'month' ? currentMonth.value : new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
    await scheduleStore.fetchAllSchedule(month)
  } catch (error) {
    console.error('Ошибка при загрузке расписания:', error)
  }
}

function removeUserByIdx(userIdx) {
  if (userIdx >= 0 && userIdx < scheduleStore.allSchedule.userSchedules.length) {
    const user = scheduleStore.allSchedule.userSchedules[userIdx]
    if (confirm(`Вы уверены, что хотите удалить ${user.firstName} ${user.lastName} из расписания?`)) {
      scheduleStore.allSchedule.userSchedules.splice(userIdx, 1)
    }
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
main {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

  .schedule-container {
    padding-top: 70px;
    max-width: none;
    margin: 0 auto;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 20px;
  }

h1 {
  font-size: 32px;
  margin-bottom: 10px;
  color: #2c3e50;
}

.info-text {
  background: rgba(255, 255, 255, 0.6);
  padding: 16px 20px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  margin-bottom: 24px;
  font-size: 13px;
  line-height: 1.5;
  color: #555;
}

.view-controls {
  background: rgba(255, 255, 255, 0.6);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-buttons {
  display: flex;
  gap: 10px;
}

.view-btn {
  padding: 10px 20px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.view-btn.active {
  background: #667eea;
  color: white;
}

.view-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.period-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.period-title {
  font-size: 20px;
  font-weight: 700;
  min-width: 250px;
  text-align: center;
  color: #2c3e50;
}

.nav-btn {
  padding: 10px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f0f0f0;
  border-color: #667eea;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-picker label {
  font-weight: 600;
  color: #2c3e50;
}

.date-picker input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.approve-section {
  background: rgba(255, 255, 255, 0.6);
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.edit-btn, .save-btn, .cancel-btn, .approve-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.edit-btn {
  background: #ffb547;
  color: white;
}

.edit-btn:hover {
  background: #e69a2e;
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.save-btn:hover {
  background: #3b9a41;
}

.cancel-btn {
  background: #ff4444;
  color: white;
}

.cancel-btn:hover {
  background: #ff3c3c;
}

.approve-btn {
  color: white;
  padding: 10px 20px;
}

.approve-btn.not-approved {
  background: #667eea;
}

.approve-btn.not-approved:hover {
  background: #5568d3;
}

.approve-btn.approved {
  background: #4CAF50;
}

.approve-btn.approved:hover {
  background: #3b9a41;
}

.status-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.6);
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.schedule-grid-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  overflow-y: auto;
  max-height: none;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
}

  .schedule-table-wrapper {
    display: inline-block;
    width: auto;
    /* Ensure the wrapper does not enforce a minimum width that would cause scrolling */
    min-width: 0;
    flex: 1;
    overflow-y: auto;
  }

  .schedule-table {
    display: flex;
    flex-direction: column;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    /* Stretch to fill available width, allowing columns to shrink and fit more days */
    width: 100%;
  }

.table-header {
  display: grid;
  gap: 1px;
  background: #e0e0e0;
  background-color: #e0e0e0;
}

.table-header > div:first-child {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 700;
  font-size: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
}

.table-header {
  display: grid;
  gap: 1px;
  background: #e0e0e0;
  background-color: #e0e0e0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  border-bottom: 2px solid #e0e0e0;
}

.header-corner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 700;
  font-size: 11px;
  padding: 12px;
  text-align: center;
  text-transform: uppercase;
  position: sticky;
  left: 0;
  z-index: 11;
}

  .header-day {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 8px;
    padding: 3px 1px;
    text-align: center;
    min-width: 30px;
    max-width: none;
    /* Ensure consistent width with cells */
    box-sizing: border-box;
    /* Prevent content overflow */
    word-break: break-word;
    overflow: hidden;
}

.header-day.today {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.2);
}

.header-day.weekend {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
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
    gap: 1px;
    background: #e0e0e0;
    min-height: 65px;
    width: 100%;
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
    /* Ensure consistent width */
    box-sizing: border-box;
  }

.employee-name {
    font-weight: 600;
    color: #2c3e50;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* Ensure proper text wrapping */
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
    /* Prevent text from expanding */
    flex-shrink: 1;
  }

  .cell {
    background: white;
    padding: 3px 1px;
    min-height: 60px;
    max-height: 60px;
    min-width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    overflow: hidden;
    box-sizing: border-box;
    word-break: break-word;
  }

.cell:hover {
  background: rgba(102, 126, 234, 0.05);
}

.cell.today {
  background: rgba(76, 175, 80, 0.05);
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.cell.weekend {
  background: rgba(255, 107, 107, 0.05);
}

.cell.editing {
  cursor: auto;
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
  padding: 2px;
}

.shift-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.shift-time {
    font-size: 9px;
    font-weight: 600;
    color: #2c3e50;
    line-height: 1.2;
    /* Ensure consistent width */
    box-sizing: border-box;
}

.shift-status {
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
    color: white;
    min-width: 38px;
    text-align: center;
    white-space: nowrap;
    /* Ensure consistent width */
    box-sizing: border-box;
    /* Ensure proper text wrapping */
    max-width: 100%;
}

.shift-edit {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  align-items: center;
}

.time-edit-group {
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  width: 100%;
}

.time-input {
  width: 48px;
  padding: 4px 3px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 11px;
  text-align: center;
  font-weight: 500;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 4px rgba(102, 126, 234, 0.3);
}

.status-dropdown-btn {
    padding: 2px 5px;
    border: none;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    width: auto;
    min-width: 35px;
    white-space: nowrap;
    flex-shrink: 0;
    /* Ensure consistent width */
    box-sizing: border-box;
}

.status-dropdown-btn:hover {
  filter: brightness(0.9);
  transform: translateY(-1px);
}

.cell-empty {
  color: #ccc;
  font-size: 16px;
}

.status-dropdown-overlay {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
  z-index: 1000;
  min-width: 150px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.dropdown-item .color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.no-data {
  background: rgba(255, 255, 255, 0.8);
  padding: 60px 20px;
  text-align: center;
  border-radius: 12px;
  color: #999;
  font-size: 16px;
}

/* Кнопки управления сотрудниками */
.add-user-btn {
  background: #4CAF50;
  color: white;
}

.add-user-btn:hover {
  background: #3b9a41;
}

.remove-user-btn {
  background: #ff6b6b;
  color: white;
}

.remove-user-btn:hover {
  background: #ff5252;
}

/* Кнопка удаления в строке сотрудника */
.remove-employee-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.2s;
  margin-left: 8px;
  flex-shrink: 0;
}

.remove-employee-btn:hover {
  background: #ff5252;
  transform: scale(1.1);
}

.remove-employee-btn:active {
  transform: scale(0.95);
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 20px;
}

.modal-body label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 14px;
}

.modal-body p {
  margin: 12px 0;
  color: #555;
  line-height: 1.6;
}

.user-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s;
}

.user-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 6px rgba(102, 126, 234, 0.2);
}

.user-select option {
  padding: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #f9f9f9;
}

.btn-secondary {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  color: #555;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f0f0f0;
  border-color: #999;
}

.btn-danger {
  padding: 10px 20px;
  border: none;
  background: #ff6b6b;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #ff5252;
}

.btn-danger:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 1200px) {
  .table-header, .table-row {
    grid-auto-columns: 1fr;
  }
  
  .header-day {
    font-size: 9px;
  }
  
  .day-date {
    font-size: 10px;
  }
  
  .time-input {
    width: 42px;
    font-size: 10px;
  }
}

@media (max-width: 768px) {
  .schedule-container {
    padding-top: 60px;
    padding-left: 10px;
    padding-right: 10px;
  }

  .schedule-grid-container {
    padding: 10px;
    height: calc(100vh - 180px);
  }

  .row-header {
    padding: 8px;
    font-size: 11px;
  }

  .table-header, .table-row {
    grid-auto-columns: 1fr;
  }

  .header-day {
    font-size: 8px;
    padding: 4px 2px;
  }

  .day-date {
    font-size: 9px;
  }

  .day-name {
    font-size: 8px;
  }

  .cell {
    min-height: 60px;
    padding: 4px 2px;
    min-width: 25px;
  }

  .shift-time {
    font-size: 9px;
  }

  .time-input {
    width: 38px;
    padding: 3px 2px;
    font-size: 9px;
  }

  .status-dropdown-btn {
    font-size: 9px;
    padding: 2px 4px;
    min-width: 40px;
  }
}
</style>
