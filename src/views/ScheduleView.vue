<template>
  <main>
    <h1>Расписание сотрудников</h1>
    <pre class="info-text">
      Расписание на следующий месяц можно внести до последнего дня текущего месяца 18:00
      Изменения расписания осуществляются по согласованию с Менеджером.
    </pre>
    <div>
      

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
        <!-- Новое колоночное отображение расписания -->
        <div class="schedule-table">
          <!-- Заголовок с днями -->
          <div class="schedule-header">
            <div class="employee-name-cell">Сотрудник</div>
            <div v-for="day in scheduleStore.allSchedule.userSchedules[0].days"
                 :key="day.date"
                 :class="['day-header-cell', { 'weekend': isWeekend(day.date), 'today': isToday(day.date) }]">
              <div class="day-name">{{ getDayOfWeekShort(day.date) }}</div>
              <div class="day-number">{{ new Date(day.date).getDate() }}</div>
            </div>
          </div>

          <!-- Расписания сотрудников -->
          <div v-for="(userSchedule, userIdx) in scheduleStore.allSchedule.userSchedules"
               :key="userSchedule.userId"
               class="schedule-row">
            <!-- Имя сотрудника -->
            <div class="employee-name-cell">
              <div class="employee-cell-content">
                <div class="employee-name-text">
                  <strong>{{ userSchedule.firstName }} {{ userSchedule.lastName }}</strong>
                  <span class="employee-position">{{ userSchedule.position }}</span>
                </div>
                <button v-if="isEditingSchedule && userStore.isManager" 
                        @click="removeEmployee(userIdx)" 
                        class="remove-employee-btn-small">✕</button>
              </div>
            </div>

            <!-- Статусы по дням -->
            <div v-for="day in userSchedule.days"
                 :key="day.date"
                 :class="{
                   'schedule-cell': true,
                   'weekend': isWeekend(day.date),
                   'today': isToday(day.date),
                   'editing': isEditingSchedule && (userStore.isManager || userStore.currentUser.id === userSchedule.userId),
                   'edited': isEditingSchedule && isDateEdited(userIdx, day.date)
                 }"
                 @click.stop="isEditingSchedule && (userStore.isManager || userStore.currentUser.id === userSchedule.userId) && openStatusDropdown(userIdx, day.date, $event)">
              
              <!-- Статус -->
              <div class="status-box" :style="{ backgroundColor: getStatusColor(getEditedDayStatus(userIdx, day.date)) }">
                <div class="status-text">{{ getStatusShortName(getEditedDayStatus(userIdx, day.date)) }}</div>
                <span v-if="isEditingSchedule && isDateEdited(userIdx, day.date)" class="edited-marker">*</span>
              </div>
            </div>
          </div>

          <!-- Сводка сотрудников на смене -->
          <div class="schedule-row shift-summary-row">
            <div class="employee-name-cell">
              <div class="employee-cell-content">
                <div class="employee-name-text">
                  <strong>На смене</strong>
                </div>
              </div>
            </div>
            <div v-for="day in scheduleStore.allSchedule.userSchedules[0].days"
                 :key="day.date"
                 :class="['schedule-cell', { 'weekend': isWeekend(day.date), 'today': isToday(day.date) }]">
              <div class="summary-box">{{ getEmployeesOnShift(day.date) }}</div>
            </div>
          </div>
        </div>

        <!-- Dropdown с выбором статуса (вынесен за пределы таблицы) -->
        <div v-if="isEditingSchedule && selectedCell" 
             class="status-dropdown-portal"
             :style="{
               top: dropdownPosition.top + 'px',
               left: dropdownPosition.left + 'px'
             }"
             @click.stop>
          <div v-for="status in scheduleStatusesFromStore"
               :key="status.id"
               class="dropdown-item"
               @click="selectStatus(selectedCell.userIdx, selectedCell.date, status.id)">
            <span class="status-color" :style="{ backgroundColor: status.color }"></span>
            <span class="dropdown-text">{{ status.short_name }}</span>
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
    isEditingSchedule.value = true
    editedDays.value = {}
    await loadAllEmployees()
  } else if (role == 'STAFF') {
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
  const scheduleCell = event.target.closest('.schedule-cell')
  
  // Если клик на dropdown, ничего не делаем
  if (dropdown && dropdown.contains(event.target)) return
  
  // Если клик на ячейку расписания, ничего не делаем (обработает openStatusDropdown)
  if (scheduleCell) return
  
  // Если клик не на dropdown и не на ячейку, закрываем
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
      // Вычисляем позицию dropdown относительно viewport (как в ProfileView)
      const cell = event.currentTarget
      const rect = cell.getBoundingClientRect()
      const scheduleBox = document.querySelector('.fullscreen-schedule')
      const scheduleRect = scheduleBox.getBoundingClientRect()
      
      // Используем координаты относительно scheduleBox
      dropdownPosition.value = {
        top: rect.bottom - scheduleRect.top + 8,
        left: rect.left - scheduleRect.left + rect.width / 2
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
    // Фильтруем сотрудников (STAFF) и менеджеров (CAFE_ADMIN или MANAGER)
    allEmployees.value = users.filter(user => user.roles.includes('STAFF') || user.roles.includes('CAFE_ADMIN') || user.roles.includes('MANAGER'))
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
  margin: 10px;
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
  background-color: #ffffff;
  color: rgb(0, 0, 0);
  border: 1px solid rgba(0, 0, 0, 0.3);
  width: 34px;
  height: 34px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
}
.month-btn:hover {
  background-color: #ececec;
  transform: translateY(-1px);
  box-shadow: 0 0 12px #d8d8d8d0;
}

/* Блок статуса расписания */
.approve-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 12px 15px;
  border-radius: 10px;
  margin-bottom: 20px;
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
  background: #35a73c;
}
.cancel-btn {
  background: #ff4444;
}

.cancel-btn:hover {
  background: #ff2525;
}

.add-employee-btn {
  background: #5da8ff;
  color: #000000;
}

.add-employee-btn:hover {
  background: #489dff;
  color: #000000;
}

.approve-btn.not-approved {
  background: #7aff7f;
  color: rgb(0, 0, 0);
}
.approve-btn.approved {
  background: #fdad66;
  color: rgb(0, 0, 0);
}

/* Таблица расписания — один блок с обводкой */
.fullscreen-schedule {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 20px;
  overflow-x: auto;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Сетка расписания */
.schedule-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: min-content;
  border-collapse: collapse;
}

.schedule-header {
  display: flex;
  flex-direction: row;
  gap: 0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  min-width: min-content;
}

.schedule-row {
  display: flex;
  flex-direction: row;
  gap: 0;
  min-width: min-content;
}

/* Ячейка с именем сотрудника */
.employee-name-cell {
  padding: 12px 10px;
  display: flex;
  align-items: center;
  background: #fafafa;
  position: sticky;
  left: 0;
  z-index: 15;
  flex: 0 0 150px;
  min-width: 150px;
  width: 150px;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}

.schedule-header .employee-name-cell {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid #ddd;
}

.shift-summary-row .employee-name-cell {
  background: rgba(76, 175, 80, 0.1);
  color: #2d5016;
  border-bottom: none;
}

.employee-cell-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 6px;
}

.employee-name-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.employee-name-text strong {
  font-size: 12px;
  color: #2c3e50;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-position {
  font-size: 10px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-employee-btn-small {
  background: #f44336;
  color: white;
  border: none;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  flex-shrink: 0;
  transition: background 0.2s;
}

.remove-employee-btn-small:hover {
  background: #d32f2f;
}

/* Ячейка расписания (статус дня) */
.schedule-cell {
  padding: 6px 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  cursor: default;
  position: relative;
  background: white;
  transition: all 0.2s;
  flex: 1;
  min-width: 20px;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}

.schedule-header .schedule-cell {
  min-height: auto;
}

.schedule-cell.editing {
  cursor: pointer;
}

.schedule-cell.editing:hover {
  background: rgba(76, 136, 255, 0.08);
  border-right-color: #4c88ff;
}

.schedule-cell.edited::after {
  content: '*';
  position: absolute;
  top: 2px;
  right: 2px;
  color: #ffb547;
  font-size: 16px;
  font-weight: 900;
}

.shift-summary-row .schedule-cell {
  border-bottom: none;
  background: transparent;
}

/* Выделение столбцов (выходные и текущий день) — на весь столбец */
.weekend {
  background: rgba(255, 31, 31, 0.15) !important;
}

.today {
  background: rgba(55, 119, 248, 0.25) !important;
}

/* Для заголовка дней — чуть интенсивнее */
.day-header-cell.weekend {
  background: rgba(255, 31, 31, 0.15) !important;
}

.day-header-cell.today {
  background: rgba(55, 119, 248, 0.25) !important;
}

/* Для сводки — лёгкий фон, но с учётом столбца */
.shift-summary-row .schedule-cell.weekend {
  background: rgba(230, 52, 52, 0.08) !important;
}

.shift-summary-row .schedule-cell.today {
  background: rgba(55, 119, 248, 0.25) !important;
}

/* Заголовок дня (день и число) */
.day-header-cell {
  padding: 8px 2px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  min-width: 20px;
  min-height: 60px;
  position: sticky;
  top: 0;
  z-index: 10;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}

.day-header-cell .day-name {
  font-size: 9px;
  color: #999;
  text-transform: uppercase;
  font-weight: 600;
}

.day-header-cell .day-number {
  font-size: 12px;
  font-weight: 700;
  color: #000000;
}

/* Статус в ячейке */
.status-box {
  width: 90%;
  padding: 4px 2px;
  border-radius: 4px;
  text-align: center;
  font-size: 8px;
  font-weight: 700;
  color: rgb(0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  line-height: 2;
}

/* Сводка на смене */
.shift-summary-row {
  background: rgba(253, 253, 253, 0.897);
  font-weight: 600;
}

.shift-summary-row .employee-name-cell {
  background: rgb(255, 255, 255);
  color: #2d5016;
  border-bottom: none;
}

.summary-box {
  width: 100%;
  padding: 4px 2px;
  border-radius: 4px;
  text-align: center;
  font-size: 8px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  line-height: 1;
  background: #00000071;
}

/* Dropdown выбора статуса */
.status-dropdown-portal {
  position: fixed;
  background: white;
  border-radius: 12px;
  border: 1px solid #ddd;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  padding: 8px;
  z-index: 9000;
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px 15px;
  margin-top: 15px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #f7fcdd88;
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

/* Убираем границы на последних элементах (чтобы не было двойных) */
.schedule-row:last-child .schedule-cell {
  border-bottom: none;
}

.schedule-cell:last-child {
  border-right: none;
}

.schedule-header .day-header-cell:last-child {
  border-right: none;
}
</style>