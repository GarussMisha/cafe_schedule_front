<template>
  <main>
    <div class="profile-container">
      <div class="profile-header">
        <h1>Профиль</h1>
      </div>

      <section class="info-tile" v-if="userStore.currentUser">
        <div class="tile-content">
          <div class="user-head">
            <div class="user-avatar">{{ userInitials }}</div>
            <div>
              <p class="user-name">{{ userStore.currentUser.firstName }} {{ userStore.currentUser.lastName }}</p>
              <p class="user-username">@{{ userStore.currentUser.username }}</p>
            </div>
          </div>
          <div class="details-body">
            <div class="detail-row">
              <span class="detail-icon"><i class="pi pi-envelope"></i></span>
              <div class="detail-fields">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ userStore.currentUser.email || '—' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-icon"><i class="pi pi-briefcase"></i></span>
              <div class="detail-fields">
                <span class="detail-label">Должность</span>
                <span class="detail-value">{{ userStore.currentUser.position || '—' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-icon"><i class="pi pi-shield"></i></span>
              <div class="detail-fields">
                <span class="detail-label">Роли</span>
                <div class="role-tags">
                  <span v-for="role in userStore.currentUser.roles" :key="role" class="role-tag" :class="'role-'+role">{{ role }}</span>
                  <span v-if="!userStore.currentUser.roles?.length" class="detail-value">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="controls-tile">
        <div class="tile-content">
          <div class="controls-row">
            <div class="month-nav">
              <button @click="previousMonth" class="nav-arrow" type="button">
                <i class="pi pi-chevron-left"></i>
              </button>
              <h2 class="month-title">{{ formatMonth(currentMonth) }}</h2>
              <button @click="nextMonth" class="nav-arrow" type="button">
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
            <div class="cafe-selector">
              <Select :options="cafeOptions" optionLabel="name" optionValue="id" v-model="cafeIdInput" @change="applyCafeId" placeholder="Кафе" class="cafe-select" :loading="cafesLoading" :disabled="cafesLoading" />
            </div>
          </div>
        </div>
      </section>

      <section class="status-tile">
        <div class="tile-content">
          <div class="status-row">
            <p class="status-text">
              Статус: <strong>{{ scheduleStore.mySchedule?.approved ? 'Закрыто' : 'Открыто' }}</strong>
            </p>
            <div class="action-buttons" v-if="!scheduleStore.mySchedule?.approved || userStore.isManager">
              <template v-if="!isEditingSchedule">
                <button @click="startEditing" class="btn-pill" type="button">
                  Редактировать
                </button>
                <button @click="printSchedule" class="btn-pill-outline" type="button">
                  <i class="pi pi-print"></i> Печать
                </button>
              </template>
              <template v-else>
                <button @click="saveSchedule" class="btn-pill" type="button">
                  Сохранить
                </button>
                <button @click="cancelEditing" class="btn-pill-outline" type="button">
                  Отменить
                </button>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section class="legend-tile" v-if="scheduleStatusesFromStore">
        <div class="tile-content">
          <div class="legend-row">
            <div class="legend-item" v-for="status in scheduleStatusesFromStore" :key="status.id">
              <span class="legend-dot" :style="{ backgroundColor: status.color }"></span>
              <span class="legend-label">{{ status.short_name }} — {{ status.name_rus }}</span>
            </div>
          </div>
        </div>
      </section>

      <template v-if="scheduleStore.isLoading">
        <section class="skeleton-tile">
          <div class="tile-content">
            <Skeleton width="100%" height="40px" borderRadius="8px" class="sk-mb" />
            <Skeleton width="100%" height="65px" borderRadius="8px" class="sk-mb" />
            <Skeleton width="100%" height="65px" borderRadius="8px" />
          </div>
        </section>
      </template>

      <template v-else-if="scheduleStore.mySchedule?.userSchedules?.[0]">
        <section class="schedule-tile">
          <div class="schedule-wrap">
            <div class="schedule-grid">
              <div class="grid-header" :style="{ gridTemplateColumns: gridCols }">
                <div class="grid-corner">Дата</div>
                <div v-for="day in days" :key="day" :class="['grid-day', { 'is-today': isToday(day), 'is-weekend': isWeekend(day) }]">
                  <span class="day-num">{{ new Date(day).getDate() }}</span>
                  <span class="day-name">{{ getDayOfWeekShort(day) }}</span>
                </div>
              </div>
              <div class="grid-row" :style="{ gridTemplateColumns: gridCols }">
                <div class="grid-row-header">
                  <span class="row-label">Моё расписание</span>
                </div>
                <div v-for="day in days" :key="`m-${day}`" :class="['grid-cell', { 'is-today': isToday(day), 'is-weekend': isWeekend(day) }]" :style="getCellBg(day)" @click="onCellClick(day, $event)">
                  <div class="cell-time" v-if="getShift(day) && !isNonWork(getShift(day).status)">
                    <span>{{ formatTime(getShift(day).startTime) }}</span>
                    <span class="cell-sep">—</span>
                    <span>{{ formatTime(getShift(day).endTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <div v-else-if="!scheduleStore.isLoading" class="empty-tile">
        <div class="tile-content">
          <p class="empty-title">Нет данных</p>
          <p class="empty-desc">Расписание на {{ formatMonth(currentMonth) }} ещё не создано.</p>
        </div>
      </div>

      <div v-if="isEditingSchedule && editingCell" class="edit-popover" :style="popoverStyle">
        <div class="popover-head">
          <span class="popover-date">{{ editingCell.dateDisplay }}</span>
          <button @click="closePopover" class="popover-close" type="button"><i class="pi pi-times"></i></button>
        </div>
        <div class="popover-body">
          <div class="popover-field">
            <label>Начало</label>
            <input type="time" :value="getPopShift()?.startTime" @input="onPopTime('startTime', $event.target.value)" class="popover-input" :disabled="['OFF','VACATION','SICK_LEAVE'].includes(getPopShift()?.status)" />
          </div>
          <div class="popover-field">
            <label>Конец</label>
            <input type="time" :value="getPopShift()?.endTime" @input="onPopTime('endTime', $event.target.value)" class="popover-input" :disabled="['OFF','VACATION','SICK_LEAVE'].includes(getPopShift()?.status)" />
          </div>
          <div class="popover-field">
            <label>Статус</label>
            <select :value="getPopShift()?.status" @input="onPopStatus($event.target.value)" class="popover-select">
              <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <div class="popover-actions">
            <button @click="closePopover" class="btn-pill" type="button">Готово</button>
            <button @click="cancelPopover" class="btn-pill-outline" type="button">Отмена</button>
          </div>
        </div>
      </div>

      <section class="stats-tile" v-if="scheduleStats">
        <div class="tile-content">
          <h2 class="section-heading">Статистика</h2>
          <div class="stats-grid">
            <div class="stat-card" v-for="(count, name) in scheduleStats" :key="name">
              <span class="stat-num">{{ count }}</span>
              <span class="stat-lbl">{{ statLabel(name) }}</span>
            </div>
          </div>
          <div v-if="hourStats" class="hour-stats">
            <h3 class="section-subheading">Рабочие часы</h3>
            <div class="hours-bar-wrap">
              <div class="hours-bar-track">
                <div class="hours-bar-fill" :style="{ width: hourBarPct }"></div>
              </div>
              <div class="hours-bar-labels">
                <span class="hours-bar-label"><strong>{{ hourStats.worked }}ч</strong> отработано</span>
                <span class="hours-bar-label"><strong>{{ hourStats.planned }}ч</strong> запланировано</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { useScheduleStore } from '@/stores/schedule'
import { useToast } from 'primevue/usetoast'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select'
import { getAllCafes } from '@/api/cafe'
import { useDarkMode } from '@/composables/useDarkMode'
import { getDayOfWeekShort, isWeekend, isToday, formatMonth, getPreviousMonth, getNextMonth, formatTime } from '@/utils/schedule'

const toast = useToast()
const userStore = useUserStore()
const scheduleStore = useScheduleStore()
const { isDarkMode } = useDarkMode()

const currentMonth = ref(scheduleStore.currentMonth)
const isEditingSchedule = ref(false)
const editingCell = ref(null)
const editedShifts = ref({})
const originalSchedule = ref(null)
const popoverStyle = ref({})
const popoverSnapshot = ref(null)
const cafeOptions = ref([])
const cafesLoading = ref(false)
const cafeIdInput = ref(scheduleStore.cafeId)

const userInitials = computed(() => {
  const u = userStore.currentUser
  if (!u) return '?'
  return ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || u.username?.[0]?.toUpperCase() || '?'
})

const scheduleStatusesFromStore = computed(() => scheduleStore.statusesSchedule)

const days = computed(() => {
  const d = []
  const [y, m] = currentMonth.value.split('-')
  const cnt = new Date(parseInt(y), parseInt(m), 0).getDate()
  for (let i = 1; i <= cnt; i++) d.push(`${y}-${m}-${String(i).padStart(2, '0')}`)
  return d
})

const gridCols = computed(() => `120px repeat(${days.value.length}, minmax(48px,1fr))`)

const statusOptions = computed(() => (scheduleStore.statusesSchedule || []).map(s => ({ label: `${s.short_name} - ${s.name_rus}`, value: s.id })))

const scheduleStats = computed(() => {
  const u = scheduleStore.mySchedule?.userSchedules?.[0]
  if (!u) return null
  const shiftMap = new Map((u.shifts || []).map(sh => [sh.date, sh]))
  const [y, m] = currentMonth.value.split('-')
  const cnt = new Date(parseInt(y), parseInt(m), 0).getDate()
  const s = { worked: 0, weekends: 0, vacation: 0, sick: 0 }
  for (let i = 1; i <= cnt; i++) {
    const date = `${y}-${m}-${String(i).padStart(2, '0')}`
    const sh = shiftMap.get(date)
    if (!sh) { s.weekends++; continue }
    const st = scheduleStatusesFromStore.value?.find(x => x.id === getEdited(date).status)
    if (!st) { s.weekends++; continue }
    const n = st.name_rus.toLowerCase()
    if (n.includes('отпуск')) s.vacation++
    else if (n.includes('больнич')) s.sick++
    else if (n.includes('выход')) s.weekends++
    else if (n.includes('рабоч')) s.worked++
    else s.weekends++
  }
  return s
})

const hourStats = computed(() => {
  const u = scheduleStore.mySchedule?.userSchedules?.[0]
  if (!u?.shifts) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let planned = 0, worked = 0
  u.shifts.forEach(sh => {
    const ed = getEdited(sh.date)
    const st = scheduleStatusesFromStore.value?.find(x => x.id === ed.status)
    if (!st) return
    if (st.name_rus.toLowerCase().includes('рабоч')) {
      const h = calcHours(ed.startTime, ed.endTime)
      planned += h
      if (new Date(sh.date + 'T00:00:00') <= today) worked += h
    }
  })
  return { worked: Math.ceil(worked), planned: Math.ceil(planned) }
})

const hourBarPct = computed(() => {
  if (!hourStats.value || hourStats.value.planned === 0) return '0%'
  const pct = (hourStats.value.worked / hourStats.value.planned) * 100
  return Math.min(pct, 100) + '%'
})

function onCellClick(day, event) {
  if (!isEditingSchedule.value) return
  const r = event.target.getBoundingClientRect()
  let l = r.right + 10, t = r.top
  if (l + 240 > window.innerWidth) l = r.left - 250
  if (t + 280 > window.innerHeight) t = window.innerHeight - 300
  if (t < 10) t = 10
  popoverStyle.value = { position: 'fixed', top: `${t}px`, left: `${l}px`, zIndex: 9999 }
  editingCell.value = { day, dateDisplay: formatDateDisplay(day) }
  const u = scheduleStore.mySchedule?.userSchedules?.[0]
  const sh = u?.shifts?.find(s => s.date === day)
  if (!editedShifts.value[day]) editedShifts.value[day] = sh ? { ...sh } : { date: day, startTime: '', endTime: '', status: 'OFF' }
  popoverSnapshot.value = { ...editedShifts.value[day] }
}

function formatDateDisplay(d) {
  const dt = new Date(d)
  const ms = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  const wd = ['вс','пн','вт','ср','чт','пт','сб']
  return `${dt.getDate()} ${ms[dt.getMonth()]} (${wd[dt.getDay()]})`
}

function getPopShift() {
  if (!editingCell.value) return null
  return editedShifts.value[editingCell.value.day] || null
}

function onPopStatus(val) {
  if (!editingCell.value) return
  const day = editingCell.value.day
  if (!editedShifts.value[day]) {
    const u = scheduleStore.mySchedule?.userSchedules?.[0]
    const sh = u?.shifts?.find(s => s.date === day)
    editedShifts.value[day] = sh ? { ...sh } : { date: day, startTime: '', endTime: '', status: 'OFF' }
  }
  editedShifts.value[day].status = val
  if (isNonWork(val)) { editedShifts.value[day].startTime = ''; editedShifts.value[day].endTime = '' }
  editedShifts.value[day] = { ...editedShifts.value[day] }
}

function onPopTime(field, val) {
  if (!editingCell.value) return
  const day = editingCell.value.day
  if (!editedShifts.value[day]) {
    const u = scheduleStore.mySchedule?.userSchedules?.[0]
    const sh = u?.shifts?.find(s => s.date === day)
    editedShifts.value[day] = sh ? { ...sh } : { date: day, startTime: '', endTime: '', status: 'OFF' }
  }
  editedShifts.value[day][field] = val
}

function getShift(day) {
  if (editingCell.value && editingCell.value.day === day) return getPopShift()
  if (editedShifts.value[day]) return editedShifts.value[day]
  const u = scheduleStore.mySchedule?.userSchedules?.[0]
  return u?.shifts?.find(s => s.date === day)
}

function getEdited(date) {
  if (Object.prototype.hasOwnProperty.call(editedShifts.value, date)) return editedShifts.value[date]
  const u = scheduleStore.mySchedule?.userSchedules?.[0]
  const o = u?.shifts?.find(s => s.date === date)
  return o || { date, startTime: '', endTime: '', status: 'OFF' }
}

function getStatusColor(id) { return scheduleStatusesFromStore.value?.find(s => s.id === id)?.color || '#f1f1f1' }

function isNonWork(id) { return ['OFF','VACATION','SICK_LEAVE'].includes(id) }

function offColorDark() { return '#2a2a2c' }
function offColorLight() { const off=scheduleStatusesFromStore.value?.find(s=>s.id==='OFF'); return off?.color||'#cccccc' }

function getCellBg(day) {
  const ed = editedShifts.value[day]
  if (ed) return shiftColor(ed)
  const u = scheduleStore.mySchedule?.userSchedules?.[0]
  const sh = u?.shifts?.find(s => s.date === day)
  if (!sh) { const c = getOffColorHex(); return { backgroundColor: `rgba(${c.r},${c.g},${c.b},1)` } }
  return shiftColor(sh)
}

function getOffColorHex() {
  const isDark = isDarkMode.value
  if (isDark) { const h='#2a2a2c'.replace('#',''); return { r:parseInt(h.substring(0,2),16), g:parseInt(h.substring(2,4),16), b:parseInt(h.substring(4,6),16) } }
  const off = scheduleStatusesFromStore.value?.find(s => s.id === 'OFF')
  const h = (off?.color || '#cccccc').replace('#','')
  return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) }
}

function shiftColor(sh) {
  const c = sh.status==='OFF'&&isDarkMode.value ? '#2a2a2c' : getStatusColor(sh.status)
  if (!c) return {}
  const a = sh.status === 'OFF' ? 1 : 0.25
  const h = c.replace('#','')
  return { backgroundColor: `rgba(${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)},${a})` }
}

function closePopover() { popoverSnapshot.value = null; editingCell.value = null }
function cancelPopover() {
  if (popoverSnapshot.value && editingCell.value) editedShifts.value[editingCell.value.day] = { ...popoverSnapshot.value }
  popoverSnapshot.value = null; editingCell.value = null
}

function handleClickOutside(e) {
  if (editingCell.value && !e.target.closest('.edit-popover') && !e.target.closest('.grid-cell')) cancelPopover()
}

function handleKeydown(e) {
  if (e.key === 'Escape' && editingCell.value) { cancelPopover(); e.preventDefault() }
  if ((e.ctrlKey||e.metaKey) && e.key === 's' && isEditingSchedule.value) { e.preventDefault(); saveSchedule() }
  if (e.key === 'ArrowLeft' && !editingCell.value) previousMonth()
  if (e.key === 'ArrowRight' && !editingCell.value) nextMonth()
}

function startEditing() {
  isEditingSchedule.value = true
  originalSchedule.value = JSON.parse(JSON.stringify(scheduleStore.mySchedule))
  editedShifts.value = {}
}

function cancelEditing() {
  if (originalSchedule.value) scheduleStore.mySchedule = JSON.parse(JSON.stringify(originalSchedule.value))
  isEditingSchedule.value = false; editedShifts.value = {}; originalSchedule.value = null
}

async function saveSchedule() {
  try {
    const NW = ['OFF','VACATION','SICK_LEAVE']
    const u = scheduleStore.mySchedule.userSchedules[0]
    const ex = u.shifts || []
    const exD = new Set(ex.map(s => s.date))
    const edD = new Set(Object.keys(editedShifts.value))
    const allD = new Set([...exD, ...edD])
    const data = Array.from(allD).map(d => {
      const ed = editedShifts.value[d], exs = ex.find(s => s.date === d)
      const sd = ed || exs
      if (!sd) return null
      const nw = NW.includes(sd.status)
      return { date: sd.date, startTime: nw ? '00:00' : (sd.startTime||'00:00'), endTime: nw ? '23:59' : (sd.endTime||'23:59'), status: sd.status }
    }).filter(Boolean)
    await scheduleStore.updateMySchedule(currentMonth.value, data)
    editedShifts.value = {}; originalSchedule.value = null; isEditingSchedule.value = false
    await loadSchedule()
    toast.add({ severity:'success', summary:'Успех', detail:'Расписание сохранено!', life:3000 })
  } catch {
    toast.add({ severity:'error', summary:'Ошибка', detail:'Ошибка при сохранении', life:5000 })
  }
}

function printSchedule() { window.print() }

function statLabel(name) {
  const lbs = { worked:'Рабочих дней', weekends:'Выходных дней', vacation:'Отпускных дней', sick:'Больничных дней' }
  return lbs[name] || name
}

function calcHours(s, e) {
  if (!s || !e) return 0
  const [sh,sm] = s.split(':').map(Number), [eh,em] = e.split(':').map(Number)
  return Math.max(0, (eh+em/60)-(sh+sm/60))
}

async function loadSchedule() {
  try { await scheduleStore.fetchMySchedule(currentMonth.value) } catch (_e) { console.error('Schedule load error:', _e) }
}

async function previousMonth() { currentMonth.value = getPreviousMonth(currentMonth.value); scheduleStore.currentMonth = currentMonth.value; await loadSchedule() }
async function nextMonth() { currentMonth.value = getNextMonth(currentMonth.value); scheduleStore.currentMonth = currentMonth.value; await loadSchedule() }

async function applyCafeId() {
  if (!cafeIdInput.value) return
  scheduleStore.invalidateScheduleCache()
  scheduleStore.cafeId = cafeIdInput.value
  cancelEditing()
  await loadSchedule()
  await scheduleStore.fetchStatusesSchedule()
}

async function loadCafes() {
  cafesLoading.value = true
  try {
    const c = await getAllCafes()
    cafeOptions.value = c
    if (c.length > 0 && !cafeIdInput.value) {
      cafeIdInput.value = c[0].id
      scheduleStore.cafeId = c[0].id
    }
  } catch (e) {
    console.error(e)
  } finally {
    cafesLoading.value = false
  }
}

onMounted(async () => {
  await userStore.init()
  if (userStore.currentUser?.cafeId && !cafeIdInput.value) {
    scheduleStore.cafeId = userStore.currentUser.cafeId
    cafeIdInput.value = userStore.currentUser.cafeId
  }
  await loadCafes()
  await loadSchedule()
  await scheduleStore.fetchStatusesSchedule()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside); document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
main { padding: 0; min-height: calc(100vh - 44px); }

.profile-container { padding: 32px 20px; }

.profile-header h1 {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 600;
  line-height: 1.1;
  margin-bottom: 32px;
  color: var(--color-ink);
}

.info-tile { background: var(--color-canvas); padding: 32px 24px; margin-bottom: 2px; }

.user-head { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }

.user-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--color-surface-black); color: var(--color-body-on-dark); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 20px; font-weight: 600; flex-shrink: 0; }

.user-name { font-family: var(--font-display); font-size: 28px; font-weight: 400; line-height: 1.14; letter-spacing: 0.196px; color: var(--color-ink); margin: 0; }

.user-username { font-size: 14px; color: var(--color-ink-muted-48); margin: 2px 0 0; }

.details-body { border-top: 1px solid var(--color-divider-soft); padding-top: 20px; display: flex; flex-direction: row; gap: 32px; flex-wrap: wrap; }

.detail-row { display: flex; align-items: flex-start; gap: 12px; }

.detail-icon { width: 32px; height: 32px; border-radius: 50%; background: var(--color-surface-pearl); display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--color-ink-muted-48); flex-shrink: 0; }

.detail-fields { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.detail-label { font-size: 11px; font-weight: 600; color: var(--color-ink-muted-48); text-transform: uppercase; letter-spacing: 0.04em; }
.detail-value { font-size: 15px; color: var(--color-ink); }

.role-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.role-tag { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.02em; }
.role-tag.role-STAFF { background: rgba(0,177,15,0.12); color: #00b10fff; }
.role-tag.role-CAFE_ADMIN { background: rgba(0,102,204,0.12); color: #0066cc; }
.role-tag.role-USER_ADMIN { background: rgba(196,94,94,0.12); color: #c45e5e; }

.controls-tile { background: var(--color-canvas-parchment); padding: 24px; margin-bottom: 2px; }

.controls-row { display: flex; justify-content: center; align-items: center; position: relative; }
.cafe-selector { position: absolute; left: 0; min-width: 180px; }
.cafe-select { width: 100%; }

.month-nav { display: flex; align-items: center; gap: 16px; }

.month-title { font-family: var(--font-display); font-size: 28px; font-weight: 400; line-height: 1.14; letter-spacing: 0.196px; min-width: 220px; text-align: center; color: var(--color-ink); }

.nav-arrow { padding: 8px 12px; border: none; border-radius: var(--rounded-sm); background: transparent; color: var(--color-ink); cursor: pointer; transition: opacity 0.2s; font-size: 14px; opacity: 0.5; }
.nav-arrow:hover { opacity: 1; }
.nav-arrow:active { transform: scale(0.95); }

.status-tile { background: var(--color-canvas); padding: 24px; margin-bottom: 2px; }

.status-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }

.status-text { font-size: 17px; color: var(--color-ink); }
.status-text strong { font-weight: 600; }

.action-buttons { display: flex; gap: 10px; flex-wrap: wrap; }

.legend-tile { background: var(--color-canvas-parchment); padding: 16px 24px; margin-bottom: 2px; }

.legend-row { display: flex; gap: 16px; flex-wrap: wrap; }

.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.legend-label { font-size: 12px; color: var(--color-ink-muted-48); }

.schedule-tile { background: var(--color-canvas); padding: 24px; margin-bottom: 2px; }

.schedule-wrap { overflow-x: auto; }

.schedule-grid { display: flex; flex-direction: column; width: 100%; }

.grid-header { display: grid; gap: 0; }

.grid-corner { padding: 8px; font-size: 11px; font-weight: 600; color: var(--color-body-on-dark); background: var(--color-surface-black); text-align: center; position: sticky; left: 0; z-index: 2; }

.grid-day { padding: 6px 4px; text-align: center; font-size: 10px; background: var(--color-surface-black); color: var(--color-body-on-dark); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; gap: 3px; }
.grid-day.is-today { background: var(--color-primary); }
.grid-day.is-weekend { background: var(--color-surface-tile-1); }

.day-num { font-weight: 700; font-size: 12px; }
.day-name { font-size: 9px; opacity: 0.7; }

.grid-row { display: grid; gap: 0; min-height: 56px; }

.grid-row-header { padding: 8px; background: var(--color-canvas-parchment); display: flex; align-items: center; position: sticky; left: 0; z-index: 1; }
.row-label { font-size: 12px; font-weight: 600; color: var(--color-ink); }

.grid-cell { min-height: 56px; padding: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-divider-soft); font-size: 10px; cursor: pointer; transition: border-color 0.2s; position: relative; }
.grid-cell:hover { border-color: var(--color-primary); }
.grid-cell.is-today::after { content: '●'; position: absolute; top: 2px; right: 2px; font-size: 7px; color: var(--color-primary); }
.grid-cell.is-weekend { background: rgba(0,0,0,0.02); }

.cell-time { display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 10px; font-weight: 600; color: var(--color-ink); }
.cell-sep { font-size: 7px; opacity: 0.4; }

.edit-popover { position: fixed; background: var(--color-canvas); border-radius: var(--rounded-lg); box-shadow: 0 8px 32px rgba(0,0,0,0.15); padding: 0; z-index: 9999; min-width: 220px; overflow: hidden; }

.popover-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: var(--color-surface-black); color: var(--color-body-on-dark); }
.popover-date { font-weight: 600; font-size: 13px; }
.popover-close { background: rgba(255,255,255,0.15); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: background 0.2s; }
.popover-close:hover { background: rgba(255,255,255,0.3); }

.popover-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.popover-field { display: flex; flex-direction: column; gap: 4px; }
.popover-field label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--color-ink-muted-48); letter-spacing: 0.04em; }

.popover-input { padding: 8px 10px; border: 1px solid var(--color-hairline); border-radius: var(--rounded-sm); font-size: 13px; transition: border-color 0.2s; background: var(--color-surface-pearl); }
.popover-input:focus { outline: none; border-color: var(--color-primary); }
.popover-input:disabled { opacity: 0.5; cursor: not-allowed; }

.popover-select { padding: 8px 10px; border: 1px solid var(--color-hairline); border-radius: var(--rounded-sm); font-size: 13px; background: var(--color-surface-pearl); cursor: pointer; }
.popover-select:focus { outline: none; border-color: var(--color-primary); }

.popover-actions { display: flex; gap: 8px; margin-top: 4px; }
.popover-actions .btn-pill, .popover-actions .btn-pill-outline { flex: 1; padding: 8px 12px; font-size: 13px; }

.btn-pill { padding: 8px 20px; border: none; border-radius: var(--rounded-pill); background: var(--color-primary); color: var(--color-on-primary); font-family: var(--font-body); font-size: 14px; font-weight: 400; cursor: pointer; transition: opacity 0.2s; letter-spacing: -0.224px; }
.btn-pill:hover { opacity: 0.85; }
.btn-pill:active { transform: scale(0.95); }

.btn-pill-outline { padding: 8px 20px; border: 1px solid var(--color-primary); border-radius: var(--rounded-pill); background: transparent; color: var(--color-primary); font-family: var(--font-body); font-size: 14px; font-weight: 400; cursor: pointer; transition: opacity 0.2s; letter-spacing: -0.224px; }
.btn-pill-outline:hover { opacity: 0.7; }
.btn-pill-outline:active { transform: scale(0.95); }

.skeleton-tile { background: var(--color-canvas); padding: 24px; margin-bottom: 2px; }
.sk-mb { margin-bottom: 12px; }

.empty-tile { background: var(--color-canvas); padding: 64px 24px; text-align: center; margin-bottom: 2px; }
.empty-title { font-family: var(--font-display); font-size: 24px; font-weight: 400; line-height: 1.5; color: var(--color-ink-muted-48); margin-bottom: 8px; }
.empty-desc { font-size: 17px; color: var(--color-ink-muted-48); }

.stats-tile { background: var(--color-canvas); padding: 24px; }

.section-heading { font-family: var(--font-display); font-size: 22px; font-weight: 500; line-height: 1.2; color: var(--color-ink); margin-bottom: 16px; }

.section-subheading { font-family: var(--font-display); font-size: 16px; font-weight: 600; line-height: 1.2; color: var(--color-ink); margin-bottom: 12px; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

.stat-card { background: var(--color-surface-pearl); padding: 14px 10px; text-align: center; border-radius: var(--rounded-lg); }
.stat-num { display: block; font-family: var(--font-display); font-size: 24px; font-weight: 600; color: var(--color-ink); margin-bottom: 2px; }
.stat-lbl { font-size: 11px; color: var(--color-ink-muted-48); }

.hour-stats { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-divider-soft); }

.hours-bar-wrap { display: flex; flex-direction: column; gap: 8px; }
.hours-bar-track { height: 12px; border-radius: 6px; background: var(--color-hairline); overflow: hidden; }
.hours-bar-fill { height: 100%; background: var(--color-primary); transition: width 0.3s ease; }
.hours-bar-labels { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-ink-muted-48); }
.hours-bar-label strong { font-weight: 600; color: var(--color-ink); }

@media (max-width: 768px) {
  .profile-container { padding: 20px 12px; max-width: none; }
  .profile-header h1 { font-size: 28px; }
  .month-title { font-size: 22px; min-width: 160px; }
  .details-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
