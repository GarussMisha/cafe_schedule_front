<template>
  <main>
    <div class="schedule-container">
      <h1>Расписание сотрудников</h1>
      
      <pre class="info-text">Расписание на следующий месяц можно внести до последнего дня текущего месяца 18:00
Изменения расписания осуществляются по согласованию с Менеджером.</pre>

      <div class="view-controls">
        <div class="view-buttons">
          <button
            v-for="view in ['month', 'week', 'day']" 
            :key="view"
            @click="setViewMode(view)"
            :class="['view-btn', { active: viewMode === view }]"
            type="button"
          >
            {{ getViewLabel(view) }}
          </button>
        </div>

        <div class="period-controls">
          <button @click="previousPeriod" class="nav-btn" type="button">
            <i class="pi pi-angle-left"></i>
          </button>
          <h2 class="period-title">{{ getPeriodTitle() }}</h2>
          <button @click="nextPeriod" class="nav-btn" type="button">
            <i class="pi pi-angle-right"></i>
          </button>
        </div>

        <div v-if="viewMode === 'day'" class="date-picker">
          <label>Выберите дату:</label>
          <input
            type="date"
            :value="selectedDate"
            @input="selectDate($event.target.value)"
          />
        </div>

        <div class="cafe-id-controls">
          <label>ID кафе:</label>
          <input
            type="number"
            v-model.number="cafeIdInput"
            min="1"
            class="cafe-id-input"
          />
          <button @click="applyCafeId" class="cafe-id-btn" type="button">
            Загрузить
          </button>
          <span v-if="scheduleError" class="cafe-id-error">{{ scheduleError }}</span>
        </div>
      </div>

      <div class="approve-section">
        <p>Статус расписания: <strong>{{ scheduleStore.allSchedule?.approved ? 'Утверждено ✓' : 'Не утверждено' }}</strong></p>
        
        <div class="action-buttons">
          <template v-if="!isEditingSchedule">
            <button
              v-if="isScheduleEmpty && userStore.isManager"
              @click="handleCreateSchedule"
              class="create-btn"
              type="button"
            >
              + Создать расписание
            </button>
            <template v-else>
              <button
                v-if="!scheduleStore.allSchedule?.approved && userStore.isManager"
                @click="startEditing"
                class="edit-btn"
                type="button"
              >
                ✏️ Редактировать расписание
              </button>
              <button
                @click="toggleApproveStatus"
                v-if="userStore.isManager"
                :class="['approve-btn', scheduleStore.allSchedule?.approved ? 'approved' : 'not-approved']"
                type="button"
              >
                {{ scheduleStore.allSchedule?.approved ? 'Отозвать утверждение' : 'Утвердить расписание' }}
              </button>
            </template>
          </template>
          <template v-else>
            <button @click="saveAllSchedules" class="save-btn" type="button">
              ✓ Сохранить
            </button>
            <button @click="openAddEmployeeModal" class="add-employee-btn" type="button">
              ⚙ Управление сотрудниками
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

      <div class="schedule-grid-container" v-if="scheduleStore.allSchedule?.userSchedules?.length > 0 && getDaysInPeriod().length > 0">
        <div class="schedule-table-wrapper">
          <div class="schedule-table">
            <div class="table-header" :style="{ gridTemplateColumns: gridTemplateCols }">
              <div class="header-corner">Сотрудник</div>
              <div 
                v-for="day in getDaysInPeriod()" 
                :key="day"
                :class="['header-day', {
                  'today-col': isToday(day),
                  'weekend-col': isWeekend(day)
                }]">
                <div class="day-date">{{ new Date(day).getDate() }}</div>
                <div class="day-name">{{ getDayOfWeekShort(day) }}</div>
              </div>
            </div>

            <div 
              v-for="(user, userIdx) in scheduleStore.allSchedule.userSchedules"
              :key="user.userId"
              class="table-row" :style="{ gridTemplateColumns: gridTemplateCols }">
              
              <div class="row-header">
                <div class="employee-info">
                  <div class="employee-name">{{ user.firstName }} {{ user.lastName }}</div>
                  <div class="employee-position">{{ user.position }}</div>
                </div>

              </div>

              <div 
                v-for="day in getDaysInPeriod()"
                :key="`${user.userId}-${day}`"
                :class="['cell', {
                  'today-col': isToday(day),
                  'weekend-col': isWeekend(day),
                  'editing': isEditingSchedule
                }]"
                :style="getCellBackground(userIdx, day)"
                @click="onCellClick(userIdx, day, $event)">
                
               <div class="cell-content">
                  <div class="shift-display">
                    <div class="shift-time" v-if="getShiftForDayWithEdit(userIdx, day) && !isNonWorkingShift(getShiftForDayWithEdit(userIdx, day).status)">
                      <span class="shift-start">{{ formatTime(getShiftForDayWithEdit(userIdx, day).startTime) }}</span>
                      <span class="shift-separator">—</span>
                      <span class="shift-end">{{ formatTime(getShiftForDayWithEdit(userIdx, day).endTime) }}</span>
                    </div>
                    <div class="shift-edit-indicator" v-if="isEditingSchedule && getIsCellEdited(userIdx, day)">
                      <i class="pi pi-star"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-data">
        <p>Нет данных для отображения</p>
      </div>
    </div>
  </main>
  
  <!-- Модальное окно добавления/удаления сотрудников -->
  <AddEmployeeModal
    :isOpen="showAddEmployeeModal"
    :users="availableUsers"
    :currentEmployees="scheduleStore.allSchedule?.userSchedules || []"
    @close="showAddEmployeeModal = false"
    @add="handleAddEmployees"
    @remove="handleRemoveEmployee"
  />

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
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { getDayOfWeekShort, isWeekend, isToday, getPreviousMonth, getNextMonth, formatTime } from '@/utils/schedule'
import AddEmployeeModal from '@/components/modal/schedule/AddEmployeeModal.vue'

const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const cafeIdInput = ref(scheduleStore.cafeId)
const scheduleError = ref('')

const viewMode = ref('month')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const currentMonth = ref(scheduleStore.currentMonth)
const currentWeekStart = ref('')

const isEditingSchedule = ref(false)
const showAddEmployeeModal = ref(false)
const editingCell = ref(null)
const editedShifts = ref({})
const originalSchedule = ref(null)
const popoverStyle = ref({ position: 'fixed', zIndex: 9999 })

const isScheduleEmpty = computed(() => !scheduleStore.allSchedule?.userSchedules?.length)

const scheduleStatusesFromStore = computed(() => scheduleStore.statusesSchedule)

const daysCount = computed(() => getDaysInPeriod().length)

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

function onCellClick(userIdx, day, event) {
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
		userIdx,
		day,
		dateDisplay: formatDateDisplay(day)
	}
	
	// Initialize editedShifts if not already present
	const key = `${userIdx}-${day}`
	const user = scheduleStore.allSchedule?.userSchedules?.[userIdx]
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
  const key = `${editingCell.value.userIdx}-${editingCell.value.day}`
  return editedShifts.value[key] || null
}

function onPopoverStatusChange(value) {
  if (!editingCell.value) return
  const key = `${editingCell.value.userIdx}-${editingCell.value.day}`
  if (!editedShifts.value[key]) {
    const user = scheduleStore.allSchedule?.userSchedules?.[editingCell.value.userIdx]
    const shift = user?.shifts?.find(s => s.date === editingCell.value.day)
    if (shift) {
      editedShifts.value[key] = { ...shift }
    } else {
      editedShifts.value[key] = { date: editingCell.value.day, startTime: '', endTime: '', status: 'OFF' }
    }
  }
  editedShifts.value[key].status = value
  if (isNonWorkingShift(value)) {
    editedShifts.value[key].startTime = ''
    editedShifts.value[key].endTime = ''
  }
  editedShifts.value[key] = { ...editedShifts.value[key] }
}

function onPopoverTimeChange(field, value) {
  if (!editingCell.value) return
  const key = `${editingCell.value.userIdx}-${editingCell.value.day}`
  if (!editedShifts.value[key]) {
    const user = scheduleStore.allSchedule?.userSchedules?.[editingCell.value.userIdx]
    const shift = user?.shifts?.find(s => s.date === editingCell.value.day)
    if (shift) {
      editedShifts.value[key] = { ...shift }
    } else {
      editedShifts.value[key] = { date: editingCell.value.day, startTime: '', endTime: '', status: 'OFF' }
    }
  }
  editedShifts.value[key][field] = value
}

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
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const daysToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(monday.getDate() + daysToMonday)
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
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (newMonth !== currentMonth.value) {
      currentMonth.value = newMonth
    }
  } else {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() - 1)
    selectedDate.value = d.toISOString().split('T')[0]
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (newMonth !== currentMonth.value) {
      currentMonth.value = newMonth
    }
  }
  cancelEditing()
  loadSchedule()
}

function nextPeriod() {
  if (viewMode.value === 'month') {
    currentMonth.value = getNextMonth(currentMonth.value)
  } else if (viewMode.value === 'week') {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() + 7)
    currentWeekStart.value = d.toISOString().split('T')[0]
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (newMonth !== currentMonth.value) {
      currentMonth.value = newMonth
    }
  } else {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() + 1)
    selectedDate.value = d.toISOString().split('T')[0]
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (newMonth !== currentMonth.value) {
      currentMonth.value = newMonth
    }
  }
  cancelEditing()
  loadSchedule()
}

function selectDate(date) {
  viewMode.value = 'day'
  const d = new Date(date)
  selectedDate.value = date
  const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  if (newMonth !== currentMonth.value) {
    currentMonth.value = newMonth
  }
  cancelEditing()
  loadSchedule()
}

async function applyCafeId() {
  if (!cafeIdInput.value || cafeIdInput.value < 1) return
  scheduleStore.invalidateScheduleCache()
  scheduleStore.cafeId = cafeIdInput.value
  scheduleError.value = ''
  const ok = await loadSchedule()
  if (!ok) {
    scheduleError.value = 'Ошибка загрузки: кафе с ID ' + cafeIdInput.value + ' не найдено'
    return
  }
  await scheduleStore.fetchStatusesSchedule()
}

function getShiftForDay(user, day) {
  return user.shifts?.find(s => s.date === day)
}

function getShiftForDayWithEdit(userIdx, day) {
  const key = `${userIdx}-${day}`
  
  // Check if this is the currently editing cell
  if (editingCell.value && editingCell.value.userIdx === userIdx && editingCell.value.day === day) {
    return getPopoverShift()
  }
  
  if (editedShifts.value[key]) return editedShifts.value[key]
  
  const user = scheduleStore.allSchedule?.userSchedules?.[userIdx]
  return user?.shifts?.find(s => s.date === day)
}

function getStatusColor(statusId) {
  return scheduleStatusesFromStore.value?.find(s => s.id === statusId)?.color || '#f1f1f1'
}

function isNonWorkingShift(statusId) {
  return ['OFF', 'VACATION', 'SICK_LEAVE'].includes(statusId)
}

function getOffColor() {
  const offStatus = scheduleStatusesFromStore.value?.find(s => s.id === 'OFF')
  return offStatus?.color || '#cccccc'
}

function getCellBackground(userIdx, day) {
  const edited = editedShifts.value[`${userIdx}-${day}`]
  if (edited) {
    return getShiftColor(edited)
  }
  
  const user = scheduleStore.allSchedule?.userSchedules?.[userIdx]
  const shift = getShiftForDay(user, day)
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

function closePopover() {
  editingCell.value = null
}

function getIsCellEdited(userIdx, day) {
  const key = `${userIdx}-${day}`
  
  const currentShift = getShiftForDayWithEdit(userIdx, day)
  if (!currentShift) return false
  
  if (!originalSchedule.value) return false
  
  const originalUser = originalSchedule.value.userSchedules?.[userIdx]
  const originalShift = originalUser?.shifts?.find(s => s.date === day)
  
  if (!originalShift) return false
  
  return currentShift.status !== originalShift.status ||
         currentShift.startTime !== originalShift.startTime ||
         currentShift.endTime !== originalShift.endTime
}

function handleClickOutside(event) {
  if (editingCell.value && !event.target.closest('.edit-popover') && !event.target.closest('.cell')) {
    closePopover()
  }
}

const availableUsers = computed(() => {
  const scheduleUserIds = new Set(
    (scheduleStore.allSchedule?.userSchedules || []).map(u => u.userId)
  )
  return (userStore.allUsers || []).filter(u =>
    !scheduleUserIds.has(u.id) && !(u.roles || []).includes('USER_ADMIN')
  )
})

function handleCreateSchedule() {
  userStore.fetchAllUsers()
  showAddEmployeeModal.value = true
}

function openAddEmployeeModal() {
  userStore.fetchAllUsers()
  showAddEmployeeModal.value = true
}

function getMonthDays(monthStr) {
  const [year, month] = monthStr.split('-')
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
  const days = []
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(`${year}-${month}-${String(i).padStart(2, '0')}`)
  }
  return days
}

function getMonthsToLoad() {
  if (viewMode.value === 'month') {
    return currentMonth.value
  }
  const days = getDaysInPeriod()
  const monthSet = new Set()
  days.forEach(day => {
    monthSet.add(day.substring(0, 7))
  })
  const months = Array.from(monthSet).sort()
  if (months.length === 1) return months[0] + '-01'
  return months.map(m => m + '-01')
}

function handleAddEmployees(selectedUsers) {
  const days = getMonthDays(currentMonth.value)

  const newEntries = selectedUsers.map(u => ({
    userId: u.id,
    username: u.username,
    firstName: u.firstName,
    lastName: u.lastName,
    position: u.position || '',
    shifts: days.map(d => ({
      date: d,
      startTime: '00:00',
      endTime: '23:59',
      status: 'OFF'
    }))
  }))
  if (!scheduleStore.allSchedule.userSchedules) {
    scheduleStore.allSchedule.userSchedules = []
  }
  scheduleStore.allSchedule.userSchedules.push(...newEntries)
  showAddEmployeeModal.value = false

  if (!isEditingSchedule.value) {
    startEditing()
  }
}

function startEditing() {
  isEditingSchedule.value = true
  originalSchedule.value = JSON.parse(JSON.stringify(scheduleStore.allSchedule))
  editedShifts.value = {}
  userStore.fetchAllUsers()
}

function cancelEditing() {
  if (originalSchedule.value) {
    scheduleStore.allSchedule = JSON.parse(JSON.stringify(originalSchedule.value))
  }
  isEditingSchedule.value = false
  editedShifts.value = {}
  originalSchedule.value = null
}

async function saveAllSchedules() {
  try {
    const NON_WORKING_STATUSES = ['OFF', 'VACATION', 'SICK_LEAVE']
    const schedulesData = scheduleStore.allSchedule.userSchedules.map((user, userIdx) => {
      const existingShifts = user.shifts || []
      const existingDates = new Set(existingShifts.map(s => s.date))
      
      // Collect all dates from editedShifts for this user
      const editedDates = new Set()
      Object.keys(editedShifts.value).forEach(key => {
        const firstDash = key.indexOf('-')
        const idx = key.substring(0, firstDash)
        if (parseInt(idx) === userIdx) {
          editedDates.add(key.substring(firstDash + 1))
        }
      })
      
      // Combine existing shifts and edited dates
      const allDates = new Set([...existingDates, ...editedDates])
      
      return {
        userId: user.userId,
        shifts: Array.from(allDates).map(date => {
          const key = `${userIdx}-${date}`
          const edited = editedShifts.value[key]
          const existing = existingShifts.find(s => s.date === date)
          
          // Use edited version if available, otherwise use existing
          const shiftData = edited || existing
          
          if (!shiftData) {
            return null
          }
          
          const isNonWorking = NON_WORKING_STATUSES.includes(shiftData.status)
          return {
            date: shiftData.date,
            startTime: isNonWorking ? '00:00' : (shiftData.startTime || '00:00'),
            endTime: isNonWorking ? '23:59' : (shiftData.endTime || '23:59'),
            status: shiftData.status
          }
        }).filter(Boolean)
      }
    })

    await scheduleStore.updateAllScheduleData(
      currentMonth.value,
      schedulesData
    )

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

async function toggleApproveStatus() {
  const newStatus = !scheduleStore.allSchedule.approved
  try {
    await scheduleStore.changeApproveStatus(currentMonth.value, newStatus)
    await loadSchedule()
  } catch (error) {
    console.error('Ошибка при изменении статуса:', error)
  }
}

async function loadSchedule() {
  try {
    await scheduleStore.fetchAllSchedule(getMonthsToLoad())
    return true
  } catch (error) {
    console.error('Ошибка при загрузке расписания:', error)
    return false
  }
}

function handleRemoveEmployee(userId) {
  const idx = scheduleStore.allSchedule.userSchedules.findIndex(u => u.userId === userId)
  if (idx === -1) return
  const user = scheduleStore.allSchedule.userSchedules[idx]
  if (confirm(`Вы уверены, что хотите удалить ${user.firstName} ${user.lastName} из расписания?`)) {
    scheduleStore.allSchedule.userSchedules.splice(idx, 1)
    editedShifts.value = {}
  }
}

onMounted(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  currentWeekStart.value = getWeekStart(today)
  selectedDate.value = getWeekStart(today)

  await userStore.init()
  
  if (userStore.currentUser?.cafeId) {
    scheduleStore.cafeId = userStore.currentUser.cafeId
    cafeIdInput.value = userStore.currentUser.cafeId
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
  border-radius: 12px;
  border-left: 4px solid #ff9800;
  margin-bottom: 24px;
  font-size: 13px;
  line-height: 1.5;
  color: #555;
}

.view-controls {
  background: #ffffff;
  padding: 20px;
  border-radius: 24px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-buttons {
  display: flex;
  gap: 10px;
}

.view-btn {
  padding: 8px 20px;
  border: 1.5px solid #ff9800;
  background: transparent;
  color: #ff9800;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 400;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.view-btn.active {
  background: #ff9800;
  color: white;
}

.view-btn:hover {
  background: rgba(255, 152, 0, 0.1);
  transform: translateY(-1px);
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
  color: #1a1a1a;
}

.nav-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1.5px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 400;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  color: #1a1a1a;
}

.nav-btn:hover {
  border-color: #ff9800;
  color: #ff9800;
  background: rgba(255, 152, 0, 0.05);
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-picker label {
  font-weight: 600;
  color: #1a1a1a;
}

.date-picker input[type="date"] {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  outline: none;
}

.date-picker input[type="date"]:focus {
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
}



.cafe-id-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cafe-id-controls label {
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
}

.cafe-id-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 80px;
  text-align: center;
  transition: border-color 0.2s;
}

.cafe-id-input:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
}

.cafe-id-btn {
  padding: 8px 16px;
  border: 1.5px solid #ff9800;
  background: transparent;
  color: #ff9800;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.cafe-id-btn:hover {
  background: rgba(255, 152, 0, 0.1);
  transform: translateY(-1px);
}

.cafe-id-error {
  color: #ff4444;
  font-size: 0.85rem;
  font-weight: 500;
}

.approve-section {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 24px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.edit-btn, .save-btn, .cancel-btn, .approve-btn, .create-btn {
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

.create-btn {
  background: transparent;
  color: #4CAF50;
  border-color: #4CAF50;
}

.create-btn:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #3b9a41;
  border-color: #3b9a41;
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

.add-employee-btn {
  background: transparent;
  color: #2196F3;
  border-color: #2196F3;
  border-radius: 20px;
  padding: 8px 20px;
  border: 1.5px solid #2196F3;
  cursor: pointer;
  font-weight: 400;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.add-employee-btn:hover {
  background: rgba(33, 150, 243, 0.1);
  color: #1976D2;
  border-color: #1976D2;
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

.approve-btn {
  color: #ff9800;
  padding: 8px 20px;
  border-color: #ff9800;
  background: transparent;
}

.approve-btn.not-approved {
  border-color: #ff9800;
  color: #ff9800;
  background: transparent;
}

.approve-btn.not-approved:hover {
  background: rgba(255, 152, 0, 0.1);
  color: #e68900;
  border-color: #e68900;
}

.approve-btn.approved {
  border-color: #4CAF50;
  color: #4CAF50;
  background: transparent;
}

.approve-btn.approved:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #3b9a41;
  border-color: #3b9a41;
}

.status-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 24px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
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
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: auto;
  min-width: 100%;
  flex-shrink: 0;
}

.table-header {
  display: grid;
  grid-template-columns: 120px repeat(1, 1fr);
  gap: 0;
  background: #e0e0e0;
  background-color: #e0e0e0;
  min-width: 0;
  width: auto;
  border-bottom: 2px solid #e0e0e0;
}

.header-corner {
  background: linear-gradient(135deg, #ff9800 0%, #e68900 100%);
  color: white;
  font-weight: 700;
  font-size: 11px;
  padding: 12px;
  text-align: center;
  text-transform: uppercase;
  position: sticky;
  left: 0;
  z-index: 11;
  box-sizing: border-box;
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
  grid-template-columns: 120px repeat(1, 1fr);
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

.shift-edit-indicator:hover {
  color: #ff9800;
  opacity: 1;
}

.edit-popover {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 16px;
  min-width: 220px;
  z-index: 9999;
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.popover-date {
  font-weight: 600;
  font-size: 14px;
  color: #1a1a1a;
}

.popover-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.popover-close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.popover-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popover-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.popover-field label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.popover-time-input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  font-weight: 500;
  transition: border-color 0.2s;
}

.popover-time-input:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
}

.popover-time-input:disabled {
  background: #f5f5f5;
  border-color: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  opacity: 0.6;
}

.popover-status-select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.popover-status-select:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
}

.popover-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.popover-save-btn {
  flex: 1;
  padding: 8px 16px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.popover-save-btn:hover {
  background: #e68900;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.popover-cancel-btn {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.popover-cancel-btn:hover {
  background: rgba(0, 0, 0, 0.03);
  color: #666;
  border-color: #ccc;
}

.no-data {
  background: rgba(255, 255, 255, 0.8);
  padding: 60px 20px;
  text-align: center;
  border-radius: 12px;
  color: #999;
  font-size: 16px;
}

@media (max-width: 1200px) {
  .header-day {
    font-size: 9px;
  }
  
  .day-date {
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
    max-height: 60vh;
  }

  .row-header {
    padding: 8px;
    font-size: 11px;
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
    min-width: 48px;
  }

  .shift-time {
    font-size: 9px;
  }
}
</style>
