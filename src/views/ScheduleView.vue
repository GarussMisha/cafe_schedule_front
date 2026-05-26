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
          <label>Кафе:</label>
          <Select
            :options="cafeOptions"
            optionLabel="name"
            optionValue="id"
            v-model="cafeIdInput"
            @change="applyCafeId"
            placeholder="Выберите кафе"
            class="cafe-select"
            :loading="cafesLoading"
            :disabled="cafesLoading"
          />
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
              <button @click="printSchedule" class="print-btn" type="button" title="Печать">
                <i class="pi pi-print"></i> Печать
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

      <template v-if="scheduleStore.isLoading">
        <div class="schedule-grid-container">
          <Skeleton width="100%" height="40px" borderRadius="8px" class="skeleton-mb" />
          <Skeleton width="100%" height="65px" borderRadius="8px" class="skeleton-mb" v-for="i in 3" :key="i" />
        </div>
      </template>
      <div class="schedule-grid-container" v-else-if="scheduleStore.allSchedule?.userSchedules?.length > 0 && getDaysInPeriod().length > 0">
        <template v-if="viewMode !== 'day'">
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
                class="table-row"
                :class="{ 'current-user-row': user.userId === currentUserId }"
                :style="{ gridTemplateColumns: gridTemplateCols }">
              
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
        </template>

        <template v-else>
          <div class="day-timeline-wrapper">
            <div class="timeline-scroll-area">
              <div class="timeline-row timeline-header-row">
                <div class="timeline-row-header">
                  <div class="timeline-corner-text">Сотрудник</div>
                </div>
                <div class="timeline-track timeline-header-track">
                  <div v-for="h in 25" :key="h" class="timeline-hour-header">
                    <span class="hour-primary">{{ String((h - 1) % 24).padStart(2, '0') }}</span>
                    <span class="hour-secondary">:00</span>
                  </div>
                  <div v-if="showNowIndicator" class="now-indicator" :style="{ left: currentTimePercent + '%' }"></div>
                </div>
              </div>

              <div 
                v-for="(user, userIdx) in scheduleStore.allSchedule.userSchedules"
                :key="user.userId"
                class="timeline-row"
                :class="{
                  'timeline-row-editing': isEditingSchedule,
                  'current-user-row': user.userId === currentUserId
                }">
                <div class="timeline-row-header">
                  <div class="timeline-employee-info">
                    <div class="timeline-name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="timeline-position">{{ user.position }}</div>
                  </div>
                </div>
                <div class="timeline-track" @click="onCellClick(userIdx, selectedDate, $event)">
                  <div 
                    v-if="getShiftForDayWithEdit(userIdx, selectedDate) && getShiftForDayWithEdit(userIdx, selectedDate).status !== 'OFF'"
                    class="timeline-bar"
                    :class="{ 'timeline-bar-full': isFullDayShift(getShiftForDayWithEdit(userIdx, selectedDate).status) }"
                    :style="getShiftBarStyle(getShiftForDayWithEdit(userIdx, selectedDate))"
                    @mouseenter="onBarMouseEnter(userIdx, $event)"
                    @mousemove="onBarMouseMove"
                    @mouseleave="onBarMouseLeave"
                  ></div>
                  <div 
                    v-for="h in 25" 
                    :key="h" 
                    class="timeline-hour-marker"
                    :class="{ 'marker-hour-start': h === 1 || (h - 1) % 3 === 0 }"
                  ></div>
                  <div v-if="showNowIndicator" class="now-indicator" :style="{ left: currentTimePercent + '%' }"></div>
                </div>
              </div>

              <div class="timeline-row coverage-row">
                <div class="timeline-row-header">
                  <div class="timeline-coverage-label">
                    <i class="pi pi-users"></i> Покрытие
                  </div>
                </div>
                <div class="timeline-track coverage-track">
                  <div 
                    v-for="h in 25" 
                    :key="h"
                    class="coverage-cell"
                    :style="{ backgroundColor: getCoverageColor((h - 1) % 24) }"
                    :title="'Сотрудников в ' + (h - 1) + ':00: ' + getCoverageCount((h - 1) % 24)">
                    <span class="coverage-count">{{ getCoverageCount((h - 1) % 24) }}</span>
                  </div>
                  <div v-if="showNowIndicator" class="now-indicator" :style="{ left: currentTimePercent + '%' }"></div>
                </div>
              </div>

            </div>
          </div>
          <div v-if="tooltip.show" class="timeline-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
            {{ tooltip.text }}
          </div>
        </template>
      </div>

      <div v-else-if="!scheduleStore.isLoading" class="no-data">
        <div class="empty-state-icon"><i class="pi pi-calendar-plus"></i></div>
        <p class="empty-state-title">Нет данных</p>
        <p class="empty-state-desc">Расписание на {{ getPeriodTitle() }} ещё не создано.</p>
        <button v-if="userStore.isManager" @click="handleCreateSchedule" class="create-btn empty-state-btn" type="button">
          + Создать расписание
        </button>
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

  <ConfirmDialog />
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
        <button class="popover-cancel-btn" @click="cancelPopover" type="button">
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
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import { getAllCafes } from '@/api/cafe'
import { getDayOfWeekShort, isWeekend, isToday, getPreviousMonth, getNextMonth, formatTime } from '@/utils/schedule'
import AddEmployeeModal from '@/components/modal/schedule/AddEmployeeModal.vue'

const toast = useToast()
const confirm = useConfirm()
const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const cafeIdInput = ref(scheduleStore.cafeId)
const scheduleError = ref('')
const cafeOptions = ref([])
const cafesLoading = ref(false)

const viewMode = ref('month')
function getLocalDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const selectedDate = ref(getLocalDateString(new Date()))
const currentMonth = ref(scheduleStore.currentMonth)
const currentWeekStart = ref('')

const currentUserId = computed(() => userStore.currentUser?.id)

const isEditingSchedule = ref(false)
const showAddEmployeeModal = ref(false)
const editingCell = ref(null)
const editedShifts = ref({})
const originalSchedule = ref(null)
const popoverStyle = ref({ position: 'fixed', zIndex: 9999 })
const popoverSnapshot = ref(null)

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

const currentTimePercent = computed(() => {
  const now = new Date()
  return ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100
})

const showNowIndicator = computed(() => isToday(selectedDate.value))

const tooltip = ref({ show: false, text: '', x: 0, y: 0 })

function getStatusName(shift) {
  const status = scheduleStore.statusesSchedule?.find(s => s.id === shift.status)
  return status?.name_rus || shift.status
}

function onBarMouseEnter(userIdx, event) {
  const shift = getShiftForDayWithEdit(userIdx, selectedDate.value)
  if (shift) {
    const text = isFullDayShift(shift.status)
      ? getStatusName(shift)
      : `${formatTime(shift.startTime)} — ${formatTime(shift.endTime)}`
    tooltip.value = {
      show: true,
      text,
      x: event.clientX,
      y: event.clientY
    }
  }
}

function onBarMouseMove(event) {
  if (tooltip.value.show) {
    tooltip.value.x = event.clientX
    tooltip.value.y = event.clientY
  }
}

function onBarMouseLeave() {
  tooltip.value.show = false
}

function onCellClick(userIdx, day, event) {
	if (!isEditingSchedule.value) {
    return
  }
	
	const popoverWidth = 240
	const popoverHeight = 280
	
	let left = event.clientX + 10
	let top = event.clientY + 10
	
	if (left + popoverWidth > window.innerWidth) {
		left = event.clientX - popoverWidth - 10
	}
	if (top + popoverHeight > window.innerHeight) {
		top = window.innerHeight - popoverHeight - 20
	}
	if (top < 10) top = 10
	if (left < 10) left = 10
	
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
	popoverSnapshot.value = { ...editedShifts.value[key] }
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
      days.push(getLocalDateString(date))
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
    selectedDate.value = getLocalDateString(today)
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
    currentWeekStart.value = getLocalDateString(d)
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (newMonth !== currentMonth.value) {
      currentMonth.value = newMonth
    }
  } else {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() - 1)
    selectedDate.value = getLocalDateString(d)
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
    currentWeekStart.value = getLocalDateString(d)
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (newMonth !== currentMonth.value) {
      currentMonth.value = newMonth
    }
  } else {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() + 1)
    selectedDate.value = getLocalDateString(d)
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
  if (!cafeIdInput.value) return
  scheduleStore.invalidateScheduleCache()
  scheduleStore.cafeId = cafeIdInput.value
  scheduleError.value = ''
  cancelEditing()
  const ok = await loadSchedule()
  if (!ok) {
    const cafe = cafeOptions.value.find(c => c.id === cafeIdInput.value)
    scheduleError.value = 'Ошибка загрузки: кафе "' + (cafe?.name || cafeIdInput.value) + '" не найдено'
    return
  }
  await scheduleStore.fetchStatusesSchedule()
}

async function loadCafes() {
  cafesLoading.value = true
  try {
    const cafes = await getAllCafes()
    cafeOptions.value = cafes
    if (cafes.length > 0 && !cafeIdInput.value) {
      cafeIdInput.value = cafes[0].id
      scheduleStore.cafeId = cafes[0].id
    }
  } catch (error) {
    console.error('Ошибка загрузки кафе:', error)
  } finally {
    cafesLoading.value = false
  }
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

function timeToPercent(timeStr, isEnd = false) {
  if (!timeStr) return isEnd ? 100 : 0
  const [h, m] = timeStr.split(':').map(Number)
  if (isEnd && h === 0 && m === 0) return 100
  return ((h * 60 + m) / (24 * 60)) * 100
}

function isFullDayShift(statusId) {
  return ['VACATION', 'SICK_LEAVE'].includes(statusId)
}

function getShiftBarStyle(shift) {
  if (!shift) return {}
  if (isFullDayShift(shift.status)) {
    return {
      left: '0%',
      width: '100%',
      backgroundColor: getStatusColor(shift.status) || '#cccccc'
    }
  }
  if (!shift.startTime || !shift.endTime) return {}
  const left = timeToPercent(shift.startTime)
  const right = timeToPercent(shift.endTime, true)
  const width = right - left
  const color = getStatusColor(shift.status)
  return {
    left: left + '%',
    width: Math.max(width, 0) + '%',
    backgroundColor: color || '#4CAF50'
  }
}

function getCoverageCount(hour) {
  const users = scheduleStore.allSchedule?.userSchedules || []
  return users.filter((user, userIdx) => {
    const shift = getShiftForDayWithEdit(userIdx, selectedDate.value)
    if (!shift || isNonWorkingShift(shift.status)) return false
    const [startH, startM] = (shift.startTime || '00:00').split(':').map(Number)
    let [endH, endM] = (shift.endTime || '23:59').split(':').map(Number)
    if (endH === 0 && endM === 0) {
      endH = 24
    }
    const startMin = startH * 60 + startM
    const endMin = endH * 60 + endM
    const hourStart = hour * 60
    const hourEnd = (hour + 1) * 60
    return startMin < hourEnd && endMin > hourStart
  }).length
}

function getCoverageColor(hour) {
  const count = getCoverageCount(hour)
  if (count === 0) return '#ff4444'
  if (count === 1) return '#ff9800'
  if (count === 2) return '#ffd54f'
  return '#a5d6a7'
}

function closePopover() {
  popoverSnapshot.value = null
  editingCell.value = null
}

function cancelPopover() {
  if (popoverSnapshot.value && editingCell.value) {
    const key = `${editingCell.value.userIdx}-${editingCell.value.day}`
    editedShifts.value[key] = { ...popoverSnapshot.value }
  }
  popoverSnapshot.value = null
  editingCell.value = null
}

function getIsCellEdited(userIdx, day) {
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
  if (editingCell.value && !event.target.closest('.edit-popover') && !event.target.closest('.cell') && !event.target.closest('.timeline-track')) {
    cancelPopover()
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape' && editingCell.value) {
    cancelPopover()
    event.preventDefault()
  }
  if ((event.ctrlKey || event.metaKey) && event.key === 's' && isEditingSchedule.value) {
    event.preventDefault()
    saveAllSchedules()
  }
  if (event.key === 'ArrowLeft' && !editingCell.value && !showAddEmployeeModal.value) {
    previousPeriod()
  }
  if (event.key === 'ArrowRight' && !editingCell.value && !showAddEmployeeModal.value) {
    nextPeriod()
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
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Расписание успешно сохранено!', life: 3000 })
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Ошибка при сохранении расписания', life: 5000 })
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

function printSchedule() {
  window.print()
}

function handleRemoveEmployee(userId) {
  const idx = scheduleStore.allSchedule.userSchedules.findIndex(u => u.userId === userId)
  if (idx === -1) return
  const user = scheduleStore.allSchedule.userSchedules[idx]
  confirm.require({
    message: `Вы уверены, что хотите удалить ${user.firstName} ${user.lastName} из расписания?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Отмена',
    acceptLabel: 'Удалить',
    accept: () => {
      scheduleStore.allSchedule.userSchedules.splice(idx, 1)
      editedShifts.value = {}
    }
  })
}

onMounted(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  currentWeekStart.value = getWeekStart(today)
  selectedDate.value = getWeekStart(today)

  await userStore.init()

  await loadCafes()
  
  if (userStore.currentUser?.cafeId && !cafeIdInput.value) {
    scheduleStore.cafeId = userStore.currentUser.cafeId
    cafeIdInput.value = userStore.currentUser.cafeId
  }
  
  await loadSchedule()
  await scheduleStore.fetchStatusesSchedule()
  
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
main {
  padding: 0;
  min-height: calc(100vh - 60px);
  background: transparent;
}

.schedule-container {
  padding-top: 70px;
  max-width: none;
  margin: 0 auto;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 20px;
  animation: scheduleEnter 0.5s ease-out both;
}

@keyframes scheduleEnter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
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

.cafe-select {
  min-width: 200px;
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

.print-btn {
  padding: 8px 20px;
  border: 1.5px solid #607d8b;
  background: transparent;
  color: #607d8b;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 400;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.print-btn:hover {
  background: rgba(96, 125, 139, 0.1);
  color: #455a64;
  border-color: #455a64;
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

.current-user-row .row-header {
  background: #e3f2fd;
  border-left: 3px solid #1976d2;
  box-shadow: inset 0 0 0 1px #bbdefb;
}

.current-user-row .cell {
  box-shadow: inset 0 0 0 1px #bbdefb;
}

.current-user-row .employee-name {
  color: #1976d2;
  font-weight: 700;
}

.timeline-row.current-user-row .timeline-row-header {
  background: #e3f2fd;
  border-left: 3px solid #1976d2;
  box-shadow: inset 0 0 0 1px #bbdefb;
}

.timeline-row.current-user-row .timeline-track {
  box-shadow: inset 0 0 0 1px #bbdefb;
  background: #f5faff;
}

.timeline-row.current-user-row .timeline-name {
  color: #1976d2;
  font-weight: 700;
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

.skeleton-mb {
  margin-bottom: 12px;
}

.empty-state-icon {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 16px;
}

.empty-state-title {
  font-size: 20px;
  font-weight: 700;
  color: #666;
  margin-bottom: 8px;
}

.empty-state-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
  line-height: 1.6;
}

.empty-state-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.day-timeline-wrapper {
  width: 100%;
  overflow-x: auto;
  min-height: 200px;
}

.timeline-scroll-area {
  min-width: max-content;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.timeline-row {
  display: flex;
  min-height: 52px;
  border-bottom: 1px solid #e8e8e8;
}

.timeline-row:last-child {
  border-bottom: none;
}

.timeline-row-header {
  width: 130px;
  min-width: 130px;
  background: #f9f9f9;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  position: sticky;
  left: 0;
  z-index: 9;
  border-right: 1px solid #e0e0e0;
  box-sizing: border-box;
}

.timeline-employee-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.timeline-name {
  font-weight: 600;
  font-size: 12px;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeline-position {
  font-size: 10px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeline-track {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  min-height: 52px;
}

.timeline-header-track {
  border-right: 1px solid rgba(255, 255, 255, 0.15);
}

.timeline-hour-marker {
  flex: 1;
  height: 100%;
  border-right: 1px solid #f0f0f0;
  box-sizing: border-box;
}

.timeline-hour-marker.marker-hour-start {
  border-right-color: #ddd;
}

.timeline-bar {
  position: absolute;
  top: 6px;
  bottom: 6px;
  border-radius: 6px;
  opacity: 0.75;
  z-index: 5;
  cursor: pointer;
  transition: opacity 0.2s;
  min-width: 4px;
}

.timeline-bar:hover {
  opacity: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.timeline-bar-full {
  opacity: 0.5;
  border-radius: 0;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 6px,
    rgba(255, 255, 255, 0.25) 6px,
    rgba(255, 255, 255, 0.25) 12px
  );
}

.timeline-header-row {
  background: linear-gradient(135deg, #ff9800 0%, #e68900 100%);
  min-height: 40px;
  border-bottom: 2px solid #d48000;
}

.timeline-header-row .timeline-row-header {
  background: transparent;
  border-right-color: rgba(255, 255, 255, 0.2);
}

.timeline-corner-text {
  font-weight: 700;
  font-size: 11px;
  color: white;
  text-transform: uppercase;
}

.timeline-hour-header {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 8px 2px;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  box-sizing: border-box;
}

.timeline-hour-header:last-child {
  border-right: none;
}

.hour-primary {
  font-size: 11px;
  font-weight: 700;
  color: #3e2723;
}

.hour-secondary {
  font-size: 11px;
  font-weight: 500;
  color: rgba(62, 39, 35, 0.45);
}

.coverage-row {
  border-top: 2px solid #e0e0e0;
  background: #fafafa;
}

.coverage-row .timeline-row-header {
  background: #f0f0f0;
}

.timeline-coverage-label {
  font-weight: 700;
  font-size: 11px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 6px;
}

.coverage-track {
  gap: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.coverage-cell {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.7);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  transition: opacity 0.2s;
  box-sizing: border-box;
}

.coverage-cell:last-child {
  border-right: none;
}

.coverage-count {
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.timeline-row .timeline-track {
  cursor: pointer;
}

.now-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ff1744;
  z-index: 15;
  pointer-events: none;
  box-shadow: 0 0 6px rgba(255, 23, 68, 0.5);
}

.timeline-tooltip {
  position: fixed;
  transform: translate(10px, -100%);
  background: #333;
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .timeline-row-header {
    width: 100px;
    min-width: 100px;
  }
  
  .timeline-name {
    font-size: 11px;
  }
}
</style>
