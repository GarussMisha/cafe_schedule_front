<template>
  <main>
    <p>Здесь отображаются расписания сотрудников</p>
    <div>
      <h1>Расписание сотрудников</h1>

      <!-- Управление месяцем -->
      <div class="month-controls-compact">
        <button @click="previousMonth" class="month-btn">‹</button>
        <h2 class="month-title">{{ formatMonth(currentMonth) }}</h2>
        <button @click="nextMonth" class="month-btn">›</button>
      </div>

      <!-- Кнопка обновления расписания -->
      <div style="display:flex; gap:8px; margin:10px 0;">
        <button @click="refreshSchedule">⟳</button>
        <select v-model="interval" @change="interval > 0 ? startTimer(interval) : clearInterval(timer)">
          <option value="0">Без авто</option>
          <option value="5">5с</option>
          <option value="30">30с</option>
        </select>
      </div>
      <!-- Отображение статуса -->
      <div class="refresh-status">
        {{ scheduleStore.scheduleStatus ? 'Заблокоронно' : 'Не заблокированно' }}
      </div>

      <!-- Кнопка изменения статуса утверждения расписания -->
      <div class="approve-section">
        <p>Статус расписания: <strong>{{ scheduleStore.allSchedule?.approved ? 'Утверждено ✓' : 'Не утверждено' }}</strong></p>
        
        <!-- Кнопка редактирования и утверждения -->
        <div class="action-buttons">
          <template v-if="!isEditingSchedule">
            <button v-if="!scheduleStore.allSchedule?.approved"
              @click="startEditing(userStore.roles)" class="edit-btn">
              ✏️ Редактировать расписание
            </button>
            <button @click="toggleApproveStatus" v-if="userStore.isManager"
              :class="['approve-btn', scheduleStore.allSchedule?.approved ? 'approved' : 'not-approved']">
              {{ scheduleStore.allSchedule?.approved ? 'Отозвать утверждение' : 'Утвердить расписание' }}
            </button>
          </template>
          <template v-else>
            <button @click="showAddEmployeeModal = true" class="add-employee-btn" v-if="userStore.isManager">
              ➕ Добавить сотрудника
            </button>
            <button v-if="userStore.isManager" @click="saveAllSchedules" class="save-btn">
              ✓ Сохранить
            </button>
            <button v-if="userStore.isEmployee" @click="saveSTAFFSchedules" class="save-btn">
              ✓ Сохранить STAFF
            </button>
            <button @click="cancelEditing" class="cancel-btn">
              ✕ Отменить
            </button>
          </template>
        </div>
      </div>

      <!-- Таблица расписания всех сотрудников  -->
      <div class="fullscreen-schedule" v-if="scheduleStore.allSchedule?.userSchedules?.[0]?.days">
        <table class="compact-table">
          <!-- Заголовки дат -->
          <thead>
            <tr>
              <th class="employee-name-header"></th>
              <th v-for="day in scheduleStore.allSchedule.userSchedules[0].days" 
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
          
          <!-- Статусы для каждого сотрудника -->
          <tbody>
            <tr v-for="(userSchedule, userIdx) in scheduleStore.allSchedule.userSchedules" :key="userSchedule.userId">
              <!-- Имя сотрудника -->
              <td class="employee-name">
                {{ userSchedule.firstName }} {{ userSchedule.lastName }} {{ userSchedule.id }} {{ userSchedule.role }}
                <button v-if="isEditingSchedule && (userStore.isManager || userStore.currentUser.id === userSchedule.userId)" @click="removeEmployee(userIdx)" class="remove-employee-btn">✕</button>
              </td>
              <!-- Дни для сотрудника -->
              <td v-for="(day, dayIdx) in userSchedule.days"
                  :key="day.date"
                  :class="{
                    'weekend': isWeekend(day.date),
                    'today': isToday(day.date),
                    'compact': true,
                    'editing': isEditingSchedule,
                    'edited': isEditingSchedule && isDateEdited(userIdx, day.date)
                  }"
                  @click="isEditingSchedule && (userStore.currentUser.id === userSchedule.userId || userStore.isManager) && openStatusDropdown(userIdx, day.date)">
               <div class="compact-status-wrapper">
                 <div class="compact-status"
                      :style="{ backgroundColor: getStatusColor(getEditedDayStatus(userIdx, day.date)) }">
                   {{ getStatusShortName(getEditedDayStatus(userIdx, day.date)) }}
                 </div>
                 <!-- Звездочка для отредактированных дней -->
                 <span v-if="isEditingSchedule && isDateEdited(userIdx, day.date)" class="edited-marker">*</span>
               </div>

               <!-- Dropdown с выбором статуса -->
               <div v-if="isEditingSchedule && selectedCell?.userIdx === userIdx && selectedCell?.date === day.date" 
                    class="status-dropdown">
                 <div v-for="status in scheduleStatusesFromStore"
                      :key="status.id"
                      class="dropdown-item"
                      @click.stop="selectStatus(userIdx, day.date, status.id)">
                   <span class="status-color" :style="{ backgroundColor: status.color }"></span>
                   {{ status.short_name }} - {{ status.name_rus }}
                 </div>
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

    <!-- Модальное окно для добавления сотрудника -->
    <div v-if="showAddEmployeeModal" class="modal-overlay" @click="showAddEmployeeModal = false">
      <div class="modal-content" @click.stop>
        <h3>Добавить сотрудника в расписание</h3>
        <div class="employee-list">
          <div
            v-for="employee in availableEmployees"
            :key="employee.id"
            class="employee-item"
            @click="addEmployeeToSchedule(employee)"
          >
            {{ employee.firstName }} {{ employee.lastName }} ({{ employee.position }})
          </div>
          <div v-if="availableEmployees.length === 0" class="no-employees">
            Нет сотрудников для добавления
          </div>
        </div>
        <button @click="showAddEmployeeModal = false" class="close-modal-btn">Закрыть</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted} from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { getDayOfWeekShort, isWeekend, isToday, formatMonth, getPreviousMonth, getNextMonth } from '@/utils/schedule'

// Переменные и функции
const scheduleStore = useScheduleStore()
const userStore = useUserStore()
const currentMonth = ref(scheduleStore.currentMonth)
const isEditingSchedule = ref(false)
const selectedCell = ref(null)
const editedDays = ref({})

// Авто обновление статуса 
const interval = ref(0)
let timer = null

// Одна функция для управления автообновлением
function startTimer(sec) {
  clearInterval(timer)
  timer = setInterval(refreshSchedule, sec * 1000)
}

// 1. Получение статусов из store
const scheduleStatusesFromStore = computed(() => {
  return scheduleStore.statusesSchedule
})


// Функции для работы со статусами
function getStatusColor(statusId) {
    const status = scheduleStatusesFromStore.value?.find(s => s.id === statusId)
    return status?.color || '#f1f1f1ff'
}


//Отображение статусов дня календаря
function getStatusShortName(statusId) {
    const status = scheduleStatusesFromStore.value?.find(s => s.id === statusId)
    return status?.short_name || statusId
}

// Загрузка расписания по всем сотрудникам
async function loadAllSchedules() {
  await scheduleStore.fetchAllSchedule(currentMonth.value)
}

// Переключение месяцев
// Предыдущий месяц
async function previousMonth() {
  currentMonth.value = getPreviousMonth(currentMonth.value)
  scheduleStore.currentMonth = currentMonth.value
  await loadAllSchedules()
}
// Следующий месяц
async function nextMonth() {
  currentMonth.value = getNextMonth(currentMonth.value)
  scheduleStore.currentMonth = currentMonth.value
  await loadAllSchedules()
}

// Загрузка данных при монтировании
onMounted(async () => {
  await userStore.init()
  await loadAllSchedules()
  await scheduleStore.fetchStatusesSchedule()
  await scheduleStore.fetchMySchedule()
  await refreshSchedule()
})

// Изменение статуса утверждения расписания
async function toggleApproveStatus() {
  const newStatus = !scheduleStore.allSchedule.approved
  try {
    await scheduleStore.changeApproveStatus(currentMonth.value, newStatus)
  } catch (error) {
    console.error('Ошибка при изменении статуса:', error)
  }
}

// Редактирование расписания для всех сотрудников //
// Функции редактирования расписания для всех сотрудников
async function startEditing(role) {
  if (role == 'CAFE_ADMIN') {
    console.log(`Редактируем от: ${role}`)
    isEditingSchedule.value = true
    editedDays.value = {}
    await loadAllEmployees()
  } else if (role == 'STAFF') {
    console.log(`Редактируем от: ${role}`)
    isEditingSchedule.value = true
    editedDays.value = {}
    await loadAllEmployees()
  }
}

// Функция для отмены
function cancelEditing() {
  isEditingSchedule.value = false
  selectedCell.value = null
  editedDays.value = {}
}
//----------------------------------------------//

// Открытие расписания на редактирование (одного дня)
function openStatusDropdown(userIdx, date) {
  if (selectedCell.value?.userIdx === userIdx && selectedCell.value?.date === date) {
    selectedCell.value = null
  } else {
    selectedCell.value = { userIdx, date }
  }
}

// Функция для отображения статуса
function selectStatus(userIdx, date, statusId) {
  const key = `${userIdx}_${date}`
  editedDays.value[key] = statusId
  selectedCell.value = null
}

// Проверка на редактирование дня пользователя по индексу и дате
function isDateEdited(userIdx, date) {
  const key = `${userIdx}_${date}`
  return editedDays.value.hasOwnProperty(key)
}

// Получить статус редактируемого дня
function getEditedDayStatus(userIdx, date) {
  const key = `${userIdx}_${date}`
  if (editedDays.value.hasOwnProperty(key)) {
    return editedDays.value[key]
  }
  const originalDay = scheduleStore.allSchedule.userSchedules[userIdx].days.find(d => d.date === date)
  return originalDay?.status
}

// Функция для сохранения изменений
async function saveAllSchedules() {
  try {
    const schedulesToSend = scheduleStore.allSchedule.userSchedules.map((userSchedule, userIdx) => ({
      userId: userSchedule.userId,
      username: userSchedule.username,
      firstName: userSchedule.firstName,
      lastName: userSchedule.lastName,
      position: userSchedule.position,
      days: userSchedule.days.map(day => ({
        date: day.date,
        status: getEditedDayStatus(userIdx, day.date)
      }))
    }))

    await scheduleStore.updateAllScheduleData(currentMonth.value, schedulesToSend)
    
    isEditingSchedule.value = false
    selectedCell.value = null
    editedDays.value = {}
    
    await loadAllSchedules()
  } catch (error) {
    console.error('Ошибка при сохранении расписания:', error)
  }
}

// Функция сохранения расписания STAFF (только своего)
async function saveSTAFFSchedules() {
  try {
    // Находим расписание текущего пользователя
    const currentUserSchedule = scheduleStore.allSchedule.userSchedules.find(
      schedule => schedule.userId === userStore.currentUser.id
    )
    
    if (!currentUserSchedule) {
      console.error('Расписание текущего пользователя не найдено')
      return
    }

    // Подготавливаем данные для отправки (только дни с изменениями)
    const daysToSend = currentUserSchedule.days.map(day => ({
      date: day.date,
      status: getEditedDayStatus(
        scheduleStore.allSchedule.userSchedules.findIndex(s => s.userId === currentUserSchedule.userId),
        day.date
      )
    }))

    // Отправляем только своё расписание
    await scheduleStore.updateMySchedule(currentMonth.value, daysToSend)
    
    // Сбрасываем состояние редактирования
    isEditingSchedule.value = false
    selectedCell.value = null
    editedDays.value = {}
    
    // Перезагружаем общее расписание для отображения изменений
    await loadAllSchedules()
  } catch (error) {
    console.error('Ошибка при сохранении расписания:', error)
  }
}

// Функции добавления/удаления сотрудников
const showAddEmployeeModal = ref(false)
const allEmployees = ref([])

async function loadAllEmployees() {
  try {
    const users = await userStore.fetchAllUsers()
    // Фильтруем только сотрудников (STAFF)
    allEmployees.value = users.filter(user => user.roles.includes('STAFF'))
  } catch (error) {
    console.error('Ошибка при загрузке списка сотрудников:', error)
  }
}

// Добавление сотрудника в расписание
function addEmployeeToSchedule(employee) {
  // Проверяем, есть ли уже этот сотрудник в расписании
  const existingIndex = scheduleStore.allSchedule.userSchedules.findIndex(
    schedule => schedule.userId === employee.id
  )
  
  if (existingIndex === -1) {
    // Создаем новый объект расписания для сотрудника
    const newUserSchedule = {
      userId: employee.id,
      username: employee.username,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      days: []
    }
    
    // Добавляем дни месяца с дефолтным статусом
    const daysInMonth = scheduleStore.allSchedule.userSchedules[0]?.days || []
    newUserSchedule.days = daysInMonth.map(day => ({
      date: day.date,
      status: 'OFF' // Дефолтный статус - выходной
    }))
    
    // Добавляем сотрудника в расписание
    scheduleStore.allSchedule.userSchedules.push(newUserSchedule)
  }
  
  showAddEmployeeModal.value = false
}

function removeEmployee(userIdx) {
  if (confirm('Вы уверены, что хотите удалить этого сотрудника из расписания?')) {
    scheduleStore.allSchedule.userSchedules.splice(userIdx, 1)
  }
}


// Вычисляем доступных сотрудников (которых еще нет в расписании)
const availableEmployees = computed(() => {
  if (!scheduleStore.allSchedule?.userSchedules) return []
  
  const existingUserIds = scheduleStore.allSchedule.userSchedules.map(schedule => schedule.userId)
  return allEmployees.value.filter(employee => !existingUserIds.includes(employee.id))
})

async function refreshSchedule() {
  try {
    await scheduleStore.fetchScheduleStatus(currentMonth.value);
    console.log('Результат выполнения fetchScheduleStatus:', scheduleStore.scheduleStatus);
  } catch (error) {
    console.error('Ошибка при обновлении расписания:', error);
  }
}

</script>


<style scoped>
/* Общая страница */
.refresh-section.compact {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.refresh-btn {
  padding: 8px 15px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.interval-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interval-select select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  min-width: 140px;
}

.countdown-badge {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}


main {
  padding-top: 40px;
  padding-bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #3b2f2f;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

/* Заголовок страницы */
h1 {
  margin: 0 0 10px 0;
  font-size: 26px;
  font-weight: 700;
  color: #5a3c2f;
}

/* Панель месяца */
.month-controls-compact {
  margin-top: 10px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;

  background: rgba(255, 245, 225, 0.65);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  padding: 10px 14px;
  border: 1px solid rgba(200, 160, 120, 0.4);
  width: fit-content;
}

.month-title {
  margin: 0;
  font-size: 18px;
  color: #4b2f1f;
}

.month-btn {
  background: rgba(210, 160, 100, 0.2);
  border: 1px solid rgba(210, 160, 100, 0.5);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 18px;
  cursor: pointer;
  transition: 0.2s;
}
.month-btn:hover {
  background: rgba(210, 160, 100, 0.35);
}

/* Статус расписания + кнопки */
.approve-section {
  margin-top: 10px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 250, 235, 0.7);
  border: 1px solid rgba(210, 180, 130, 0.4);
  backdrop-filter: blur(6px);
}

.action-buttons {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-buttons button {
  cursor: pointer;
  border-radius: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(210, 160, 100, 0.5);
  background: rgba(255, 240, 215, 0.7);
  transition: 0.2s;
}

.action-buttons button:hover {
  background: rgba(255, 225, 185, 0.9);
}

.approve-btn.approved {
  background: rgba(120, 200, 140, 0.6);
  border-color: rgba(80, 150, 120, 0.7);
}
.approve-btn.not-approved {
  background: rgba(240, 190, 130, 0.6);
}

/* Таблица расписания */
.fullscreen-schedule {
  margin-top: 15px;
  overflow-x: auto;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 250, 240, 0.65);
  border: 1px solid rgba(210, 180, 130, 0.4);
  backdrop-filter: blur(8px);
}

/* Сетка календаря */
.compact-table {
  width: 100%;
  border-collapse: collapse;
}

.compact-table thead th {
  text-align: center;
  padding: 6px;
  font-size: 12px;
  color: #5b4636;
  min-width: 38px;
}

.employee-name-header {
  width: 400px;
}

tbody td {
  text-align: center;
  border: 1px solid rgba(180,140,110,0.2);
  min-width: 38px;
  position: relative;
}

/* Имя сотрудника */
.employee-name {
  text-align: left;
  font-weight: 600;
  padding: 8px;
  max-width: 400px;
  word-break: break-word;
  white-space: normal;
}

/* Текущий день + выходные */
.weekend {
  background: rgba(255, 225, 205, 0.35);
}
.today {
  outline: 2px solid rgba(240, 170, 60, 0.7);
}

/* Внутри даты */
.compact-date {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.compact-day {
  font-size: 11px;
  opacity: 0.7;
}

.compact-number {
  font-size: 14px;
  font-weight: 700;
}

/* Статусы */
.compact-status-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.compact-status {
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 11px;
  color: #2e2e2e;
  min-width: 24px;
}

/* Изменённая ячейка */
.edited-marker {
  color: #d46a00;
  font-size: 14px;
  font-weight: bold;
}

/* Dropdown статусов */
.status-dropdown {
  position: absolute;
  z-index: 5;
  top: 100%;
  left: 0;
  background: rgba(255, 245, 225, 0.95);
  border-radius: 10px;
  border: 1px solid rgba(180, 140, 100, 0.5);
  backdrop-filter: blur(6px);
  padding: 6px;
}

.dropdown-item {
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  gap: 6px;
  align-items: center;
}

.dropdown-item:hover {
  background: rgba(255, 220, 180, 0.6);
}

.status-color {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

/* Легенда */
.status-legend {
  margin-top: 14px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

/* Модалка */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: rgba(255, 245, 225, 0.95);
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(220, 180, 120, 0.6);
  width: 420px;
  max-height: 80vh;
  overflow: auto;
}

.employee-item {
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
}

.employee-item:hover {
  background: rgba(255, 225, 180, 0.7);
}

</style>
