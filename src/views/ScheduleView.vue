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
      <!-- Кнопка изменения статуса утверждения расписания -->
      <div class="approve-section">
        <p>Статус расписания: <strong>{{ scheduleStore.allSchedule?.approved ? 'Утверждено ✓' : 'Не утверждено' }}</strong></p>
        
        <!-- Кнопка редактирования и утверждения -->
        <div class="action-buttons">
          <template v-if="!isEditingSchedule">
            <button v-if="!scheduleStore.allSchedule?.approved"
              @click="startEditing(userStore.roles)" class="edit-btn">
                {{ scheduleStore.allSchedule?.userSchedules && scheduleStore.allSchedule.userSchedules.length > 0 ? '✏️ Редактировать расписание' : '📝 Создать расписание' }}
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

          <!-- Легенда статусов из store -->
          <div class="status-legend" v-if="scheduleStatusesFromStore">
            <div class="legend-item" v-for="status in scheduleStatusesFromStore" :key="status.id">
              <span class="legend-color" :style="{ backgroundColor: status.color }"></span>
              <span class="legend-text">{{ status.short_name }} - {{ status.name_rus }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Расписание всех сотрудников как на ProfileView -->
      <div class="fullscreen-schedule" v-if="scheduleStore.allSchedule?.userSchedules?.[0]?.days">
        <!-- Расписание для каждого сотрудника -->
        <div v-for="(userSchedule, userIdx) in scheduleStore.allSchedule.userSchedules" 
             :key="userSchedule.userId"
             class="employee-schedule-block">
          
          <!-- Информация о сотруднике -->
          <div class="employee-header">
            <div class="employee-info">
              <strong>{{ userSchedule.firstName }} {{ userSchedule.lastName }}</strong>
              <span class="employee-details">{{ userSchedule.position }} • {{ userSchedule.role }}</span>
            </div>
            <button v-if="isEditingSchedule && userStore.isManager" 
                    @click="removeEmployee(userIdx)" 
                    class="remove-employee-btn">✕ Удалить</button>
          </div>

          <!-- Сетка дней -->
          <div class="schedule-grid">
            <div v-for="day in userSchedule.days"
                 :key="day.date"
                 :class="{
                   'day-card': true,
                   'weekend': isWeekend(day.date),
                   'today': isToday(day.date),
                   'editing': isEditingSchedule && (userStore.isManager || userStore.currentUser.id === userSchedule.userId)
                 }"
                 @click.stop="isEditingSchedule && (userStore.isManager || userStore.currentUser.id === userSchedule.userId) && openStatusDropdown(userIdx, day.date, $event)">
              
              <!-- Дата (день недели + число) -->
              <div class="day-header">
                <div class="day-name">{{ getDayOfWeekShort(day.date) }}</div>
                <div class="day-number">{{ new Date(day.date).getDate() }}</div>
              </div>
              
              <!-- Статус -->
              <div class="day-status" :style="{ backgroundColor: getStatusColor(getEditedDayStatus(userIdx, day.date)) }">
                <div class="status-text">{{ getStatusShortName(getEditedDayStatus(userIdx, day.date)) }}</div>
                <span v-if="isEditingSchedule && isDateEdited(userIdx, day.date)" class="edited-marker">*</span>
              </div>
            </div>
          </div>

          <!-- Dropdown с выбором статуса -->
          <div v-if="isEditingSchedule && selectedCell?.userIdx === userIdx && selectedCell?.date" 
               class="status-dropdown-portal"
               :style="{
                 top: dropdownPosition.top + 'px',
                 left: dropdownPosition.left + 'px'
               }"
               @click.stop>
            <div v-for="status in scheduleStatusesFromStore"
                 :key="status.id"
                 class="dropdown-item"
                 @click="selectStatus(userIdx, selectedCell.date, status.id)">
              <span class="status-color" :style="{ backgroundColor: status.color }"></span>
              <span class="dropdown-text">{{ status.short_name }}</span>
            </div>
          </div>
        </div>

        <!-- Сводка: сколько сотрудников на смене по дням -->
        <div class="shift-summary">
          <div class="shift-summary-header">
            <h3>Сотрудники на смене</h3>
          </div>
          <div class="summary-grid">
            <div v-for="day in scheduleStore.allSchedule.userSchedules[0].days"
                 :key="day.date"
                 :class="['summary-card', { 'weekend': isWeekend(day.date), 'today': isToday(day.date) }]">
              <div class="summary-day">
                <div class="summary-day-name">{{ getDayOfWeekShort(day.date) }}</div>
                <div class="summary-day-number">{{ new Date(day.date).getDate() }}</div>
              </div>
              <div class="summary-count">{{ getEmployeesOnShift(day.date) }}</div>
            </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
const dropdownPosition = ref({ top: 0, left: 0 })


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
  
  // Добавляем обработчик клика вне dropdown
  document.addEventListener('click', handleClickOutside)
})

// Очистка обработчика при размонтировании
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Изменение статуса утверждения расписания
async function toggleApproveStatus() {
  console.log("toggleApproveStatus 1")
  const newStatus = !scheduleStore.allSchedule.approved
  try {
    console.log("toggleApproveStatus 2")
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

// Закрытие dropdown при клике вне
function handleClickOutside(event) {
  const dropdown = document.querySelector('.status-dropdown-portal')
  const dayCard = event.target.closest('.day-card')
  
  // Если клик на dropdown, ничего не делаем
  if (dropdown && dropdown.contains(event.target)) return
  
  // Если клик на день-карточку, ничего не делаем (обработает openStatusDropdown)
  if (dayCard) return
  
  // Если клик не на dropdown и не на день, закрываем
  selectedCell.value = null
}
//----------------------------------------------//

// Открытие расписания на редактирование (одного дня)
function openStatusDropdown(userIdx, date, event) {
  if (selectedCell.value?.userIdx === userIdx && selectedCell.value?.date === date) {
    selectedCell.value = null
  } else {
    selectedCell.value = { userIdx, date }
    
    if (event) {
      // Вычисляем позицию dropdown относительно кликнутой карточки
      const card = event.currentTarget
      const rect = card.getBoundingClientRect()
      
      // Найти ближайший parent с position: relative (это .employee-schedule-block)
      const employeeBlock = card.closest('.employee-schedule-block')
      const blockRect = employeeBlock.getBoundingClientRect()
      
      dropdownPosition.value = {
        top: rect.bottom - blockRect.top + 8,
        left: rect.left - blockRect.left + rect.width / 2
      }
    }
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

// Функция подсчета сотрудников на смене в конкретный день
function getEmployeesOnShift(date) {
  if (!scheduleStore.allSchedule?.userSchedules) return 0
  
  const workingStatusIds = ['WRK', 'SHIFT'] // Статусы "рабочий день"
  const count = scheduleStore.allSchedule.userSchedules.filter(userSchedule => {
    const day = userSchedule.days.find(d => d.date === date)
    if (!day) return false
    
    // Проверяем, работает ли сотрудник (не выходной, не больничный, не отпуск)
    const status = scheduleStatusesFromStore.value?.find(s => s.id === getEditedDayStatus(
      scheduleStore.allSchedule.userSchedules.indexOf(userSchedule),
      date
    ))
    
    if (!status) return false
    const statusName = status.name_rus.toLowerCase()
    
    // Считаем только рабочие дни (не выходные, не больничные, не отпуск)
    return !statusName.includes('выходной') && 
           !statusName.includes('больниц') && 
           !statusName.includes('болезн') &&
           !statusName.includes('отпуск') &&
           !statusName.includes('отпускной')
  }).length
  
  return count
}

// Вычисляем доступных сотрудников (которых еще нет в расписании)
const availableEmployees = computed(() => {
  if (!scheduleStore.allSchedule?.userSchedules) return []
  
  const existingUserIds = scheduleStore.allSchedule.userSchedules.map(schedule => schedule.userId)
  return allEmployees.value.filter(employee => !existingUserIds.includes(employee.id))
})
</script>


<style scoped>
main {
  padding-top: 40px;
  padding-bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  color: #2f2f2f;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

/* Заголовки */
h1 {
  font-size: 26px;
  margin: 0;
  font-weight: 700;
}

.month-controls-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 10px 0 5px 0;
}

.month-title {
  font-size: 20px;
  font-weight: 600;
}

.month-btn {
  background: #fff;
  border: 1px solid #ccc;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
}
.month-btn:hover {
  background: #eee;
}

/* Блок статуса расписания */
.approve-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fafafa;
  border: 1px solid #ddd;
  padding: 12px 15px;
  border-radius: 10px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.edit-btn,
.add-employee-btn,
.save-btn,
.cancel-btn,
.approve-btn {
  border: none;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
}

.edit-btn {
  background: #ffd966;
}
.save-btn {
  background: #4caf50;
  color: #fff;
}
.cancel-btn {
  background: #f44336;
  color: #fff;
}
.add-employee-btn {
  background: #5da8ff;
  color: #fff;
}

.approve-btn.not-approved {
  background: #4caf50;
  color: white;
}
.approve-btn.approved {
  background: #e67e22;
  color: white;
}

/* Таблица */
.fullscreen-schedule {
  border-radius: 12px;
  background: white;
  padding: 20px;
}

/* Блок расписания сотрудника */
.employee-schedule-block {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.employee-schedule-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.employee-info strong {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 600;
  white-space: nowrap;
}

.employee-info strong::after {
  content: ' •';
  color: #ccc;
  margin-left: 8px;
}

.employee-details {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

.remove-employee-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.remove-employee-btn:hover {
  background: #d32f2f;
}

/* Сетка дней */
.schedule-grid {
  display: flex;
  gap: 4px;
  padding-bottom: 8px;
}

.day-card {
  background: white;
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

/* Сводка сотрудников на смене */
.shift-summary {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.shift-summary:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.shift-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.shift-summary-header h3 {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 600;
  white-space: nowrap;
  margin: 0;
}

.shift-summary-header h3::after {
  content: ' •';
  color: #ccc;
  margin-left: 8px;
}

.shift-summary-header .summary-stat {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

.summary-grid {
  background-color: #0a3a6b28;
  border: 1px solid #08000075;
  display: flex;
  gap: 4px;
  padding-bottom: 8px;
  padding: 8px 4px;
  border-radius: 10px;
}

.summary-card {
  background: white;
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

.summary-card:hover {
  border-color: #4caf50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
}

.summary-card.weekend {
  background: rgba(255, 107, 107, 0.06);
  border-color: #ff6b6b;
}

.summary-card.today {
  border: 2px solid #4caf50;
  background: rgba(76, 175, 80, 0.12);
}

.summary-day {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 9px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0px;
}

.summary-day-name {
  font-size: 9px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0px;
}

.summary-day-number {
  font-size: 12px;
  font-weight: 700;
  color: #2c3e50;
}

.summary-count {
  padding: 6px 2px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  color: rgb(255, 255, 255);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-height: 26px;
  background: #94687e;
}

/* Легенда */
.status-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 15px;
  margin-top: 15px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fafafa;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 18px;
  height: 18px;
  border-radius: 6px;
}

/* Модалка */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20000;
}

.modal-content {
  background: white;
  padding: 18px;
  border-radius: 14px;
  min-width: 360px;
}

.employee-item {
  padding: 8px;
  background: #f6f6f6;
  margin: 4px 0;
  border-radius: 8px;
  cursor: pointer;
}
.employee-item:hover {
  background: #dfeaff;
}

.close-modal-btn {
  margin-top: 10px;
  width: 100%;
  padding: 9px;
  border-radius: 10px;
  border: none;
  background: #444;
  color: white;
}
</style>

