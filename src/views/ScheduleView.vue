<template>
  <main>
    <div class="schedule-container">
      <div class="page-header">
        <h1>Расписание</h1>
        <p class="info-text">Расписание на следующий месяц можно внести до последнего дня текущего месяца 18:00. Изменения по согласованию с Менеджером.</p>
      </div>

      <section class="controls-section">
        <div class="controls-inner">
          <div class="controls-row">
            <div class="view-tabs">
              <button v-for="view in ['month','week','day']" :key="view" @click="setViewMode(view)" :class="['tab-btn', { active: viewMode === view }]" type="button">{{ getViewLabel(view) }}</button>
            </div>
            <div class="period-nav">
              <button @click="previousPeriod" class="nav-btn" type="button"><i class="pi pi-chevron-left"></i></button>
              <h2 class="period-title">{{ getPeriodTitle() }}</h2>
              <button @click="nextPeriod" class="nav-btn" type="button"><i class="pi pi-chevron-right"></i></button>
            </div>
            <div class="cafe-selector">
              <Select :options="cafeOptions" optionLabel="name" optionValue="id" v-model="cafeIdInput" @change="applyCafeId" placeholder="Кафе" class="cafe-select" :loading="cafesLoading" :disabled="cafesLoading" />
            </div>
          </div>
          <div v-if="viewMode === 'day'" class="date-row">
            <input type="date" :value="selectedDate" @input="selectDate($event.target.value)" class="date-input" />
          </div>
        </div>
      </section>

      <section class="approve-section">
        <div class="approve-inner">
          <p class="approve-text">Статус: <strong>{{ scheduleStore.allSchedule?.approved ? 'Утверждено' : 'Не утверждено' }}</strong></p>
          <div class="action-group">
            <template v-if="!isEditingSchedule">
              <button v-if="isScheduleEmpty && userStore.isManager" @click="handleCreateSchedule" class="btn-pill" type="button">+ Создать</button>
              <template v-else>
                <button v-if="!scheduleStore.allSchedule?.approved && userStore.isManager" @click="startEditing" class="btn-pill" type="button">Редактировать</button>
                <button @click="toggleApproveStatus" v-if="userStore.isManager" :class="['btn-pill-outline', scheduleStore.allSchedule?.approved ? 'btn-green' : '']" type="button">{{ scheduleStore.allSchedule?.approved ? 'Отозвать' : 'Утвердить' }}</button>
                <button @click="printSchedule" class="btn-ghost" type="button"><i class="pi pi-print"></i></button>
              </template>
            </template>
            <template v-else>
              <button @click="saveAllSchedules" class="btn-pill" type="button">Сохранить</button>
              <button @click="openAddEmployeeModal" class="btn-pill-outline" type="button">Сотрудники</button>
              <button @click="cancelEditing" class="btn-ghost" type="button">Отмена</button>
            </template>
          </div>
        </div>
      </section>

      <section class="legend-section" v-if="scheduleStatusesFromStore">
        <div class="legend-row">
          <div class="legend-item" v-for="status in scheduleStatusesFromStore" :key="status.id">
            <span class="legend-dot" :style="{ backgroundColor: status.color }"></span>
            <span class="legend-text">{{ status.short_name }} — {{ status.name_rus }}</span>
          </div>
        </div>
      </section>

      <template v-if="scheduleStore.isLoading">
        <section class="skeleton-section">
          <Skeleton width="100%" height="40px" borderRadius="8px" class="sk-mb" />
          <Skeleton width="100%" height="65px" borderRadius="8px" class="sk-mb" v-for="i in 3" :key="i" />
        </section>
      </template>

      <template v-else-if="scheduleStore.allSchedule?.userSchedules?.length > 0 && getDaysInPeriod().length > 0">
        <template v-if="viewMode !== 'day'">
          <section class="grid-section">
            <div class="grid-wrap">
              <div class="grid" :style="{ gridTemplateColumns: gridTemplateCols }">
                <div class="grid-corner">Сотрудник</div>
                <div v-for="day in getDaysInPeriod()" :key="day" :class="['grid-day', { 'is-today': isToday(day), 'is-weekend': isWeekend(day) }]">
                  <span class="day-num">{{ new Date(day).getDate() }}</span>
                  <span class="day-name">{{ getDayOfWeekShort(day) }}</span>
                </div>
                <template v-for="(user, uIdx) in scheduleStore.allSchedule.userSchedules" :key="user.userId">
                  <div :class="['grid-row-header', { 'is-current': user.userId === currentUserId }]">
                    <span class="row-name">{{ user.firstName }} {{ user.lastName }}</span>
                    <span class="row-pos">{{ user.position }}</span>
                  </div>
                  <div v-for="day in getDaysInPeriod()" :key="`${user.userId}-${day}`" :class="['grid-cell', { 'is-today': isToday(day), 'is-weekend': isWeekend(day) }]" :style="getCellBackground(uIdx, day)" @click="onCellClick(uIdx, day, $event)">
                    <div class="cell-time" v-if="getShiftForDayWithEdit(uIdx, day) && !isNonWorkingShift(getShiftForDayWithEdit(uIdx, day).status)">
                      <span>{{ formatTime(getShiftForDayWithEdit(uIdx, day).startTime) }}</span>
                      <span class="cell-sep">—</span>
                      <span>{{ formatTime(getShiftForDayWithEdit(uIdx, day).endTime) }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="timeline-section">
            <div class="timeline-scroll">
              <div class="timeline">
                <div class="tl-row tl-header">
                  <div class="tl-corner">Сотрудник</div>
                  <div class="tl-track tl-track-header">
                    <div v-for="h in 25" :key="h" class="tl-hour"><span class="tl-h">{{ String(h-1).padStart(2,'0') }}</span><span class="tl-m">:00</span></div>
                    <div v-if="showNowIndicator" class="now-line" :style="{ left: currentTimePercent + '%' }"></div>
                  </div>
                </div>
                <div v-for="(user, uIdx) in scheduleStore.allSchedule.userSchedules" :key="user.userId" :class="['tl-row', { 'is-current': user.userId === currentUserId }]">
                  <div class="tl-corner">
                    <span class="tl-name">{{ user.firstName }} {{ user.lastName }}</span>
                    <span class="tl-pos">{{ user.position }}</span>
                  </div>
                  <div class="tl-track" @click="onCellClick(uIdx, selectedDate, $event)">
                    <div v-if="getShiftForDayWithEdit(uIdx, selectedDate) && getShiftForDayWithEdit(uIdx, selectedDate).status !== 'OFF'" class="tl-bar" :class="{ 'tl-bar-full': isFullDayShift(getShiftForDayWithEdit(uIdx, selectedDate).status) }" :style="getShiftBarStyle(getShiftForDayWithEdit(uIdx, selectedDate))" @mouseenter="onBarEnter(uIdx, $event)" @mousemove="onBarMove" @mouseleave="onBarLeave"></div>
                    <div v-for="h in 25" :key="h" class="tl-marker" :class="{ 'tl-marker-start': h===1||(h-1)%3===0 }"></div>
                    <div v-if="showNowIndicator" class="now-line" :style="{ left: currentTimePercent + '%' }"></div>
                  </div>
                </div>
                <div class="tl-row tl-coverage">
                  <div class="tl-corner"><i class="pi pi-users"></i> Покрытие</div>
                  <div class="tl-track">
                    <div v-for="h in 25" :key="h" class="cov-cell" :style="{ backgroundColor: getCoverageColor((h-1)%24) }"><span class="cov-count">{{ getCoverageCount((h-1)%24) }}</span></div>
                    <div v-if="showNowIndicator" class="now-line" :style="{ left: currentTimePercent + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="tooltip.show" class="tl-tooltip" :style="{ left: tooltip.x+'px', top: tooltip.y+'px' }">{{ tooltip.text }}</div>
          </section>
        </template>
      </template>

      <div v-else-if="!scheduleStore.isLoading" class="empty-section">
        <p class="empty-title">Нет данных</p>
        <p class="empty-desc">Расписание на {{ getPeriodTitle() }} ещё не создано.</p>
        <button v-if="userStore.isManager" @click="handleCreateSchedule" class="btn-pill" type="button">+ Создать</button>
      </div>
    </div>

    <AddEmployeeModal :isOpen="showAddEmployeeModal" :users="availableUsers" :currentEmployees="scheduleStore.allSchedule?.userSchedules || []" @close="showAddEmployeeModal = false" @add="handleAddEmployees" @remove="handleRemoveEmployee" />
    <ConfirmDialog />

    <div v-if="isEditingSchedule && editingCell" class="edit-popover" :style="popoverStyle">
      <div class="popover-head">
        <span class="popover-date">{{ editingCell.dateDisplay }}</span>
        <button @click="closePopover" class="popover-close" type="button"><i class="pi pi-times"></i></button>
      </div>
      <div class="popover-body">
        <div class="popover-field">
          <label>Начало</label>
          <input type="time" :value="getPopoverShift()?.startTime" @input="onPopoverTimeChange('startTime', $event.target.value)" class="popover-input" :disabled="['OFF','VACATION','SICK_LEAVE'].includes(getPopoverShift()?.status)" />
        </div>
        <div class="popover-field">
          <label>Конец</label>
          <input type="time" :value="getPopoverShift()?.endTime" @input="onPopoverTimeChange('endTime', $event.target.value)" class="popover-input" :disabled="['OFF','VACATION','SICK_LEAVE'].includes(getPopoverShift()?.status)" />
        </div>
        <div class="popover-field">
          <label>Статус</label>
          <select :value="getPopoverShift()?.status" @input="onPopoverStatusChange($event.target.value)" class="popover-select">
            <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="popover-actions">
          <button @click="closePopover" class="btn-pill" type="button">Готово</button>
          <button @click="cancelPopover" class="btn-pill-outline" type="button">Отмена</button>
        </div>
      </div>
    </div>
  </main>
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
import { useDarkMode } from '@/composables/useDarkMode'
import { getDayOfWeekShort, isWeekend, isToday, getPreviousMonth, getNextMonth, formatTime } from '@/utils/schedule'
import AddEmployeeModal from '@/components/modal/schedule/AddEmployeeModal.vue'

const toast = useToast()
const userStore = useUserStore()
const scheduleStore = useScheduleStore()
const { isDarkMode } = useDarkMode()

const cafeIdInput = ref(scheduleStore.cafeId)
const scheduleError = ref('')
const cafeOptions = ref([])
const cafesLoading = ref(false)

const viewMode = ref('month')
function getLocalDateString(date) {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0')
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
const gridTemplateCols = computed(() => `120px repeat(${daysCount.value || 1}, minmax(48px,1fr))`)
const statusOptions = computed(() => (scheduleStore.statusesSchedule || []).map(s => ({ label: `${s.short_name} - ${s.name_rus}`, value: s.id })))
const currentTimePercent = computed(() => { const n = new Date(); return ((n.getHours()*60+n.getMinutes())/(24*60))*100 })
const showNowIndicator = computed(() => isToday(selectedDate.value))
const tooltip = ref({ show: false, text: '', x: 0, y: 0 })

function getStatusName(shift) { const s = scheduleStore.statusesSchedule?.find(x => x.id === shift.status); return s?.name_rus || shift.status }
function onBarEnter(uIdx, e) {
  const sh = getShiftForDayWithEdit(uIdx, selectedDate.value)
  if (sh) tooltip.value = { show: true, text: isFullDayShift(sh.status) ? getStatusName(sh) : `${formatTime(sh.startTime)} — ${formatTime(sh.endTime)}`, x: e.clientX, y: e.clientY }
}
function onBarMove(e) { if (tooltip.value.show) { tooltip.value.x = e.clientX; tooltip.value.y = e.clientY } }
function onBarLeave() { tooltip.value.show = false }

function onCellClick(uIdx, day, e) {
  if (!isEditingSchedule.value) return
  let l = e.clientX + 10, t = e.clientY + 10
  if (l + 240 > window.innerWidth) l = e.clientX - 250
  if (t + 280 > window.innerHeight) t = window.innerHeight - 300
  if (t < 10) t = 10; if (l < 10) l = 10
  popoverStyle.value = { position: 'fixed', top: `${t}px`, left: `${l}px`, zIndex: 9999 }
  editingCell.value = { userIdx: uIdx, day, dateDisplay: formatDateDisplay(day) }
  const key = `${uIdx}-${day}`, u = scheduleStore.allSchedule?.userSchedules?.[uIdx], sh = u?.shifts?.find(s => s.date === day)
  if (!editedShifts.value[key]) editedShifts.value[key] = sh ? { ...sh } : { date: day, startTime: '', endTime: '', status: 'OFF' }
  popoverSnapshot.value = { ...editedShifts.value[key] }
}

const formatDateDisplay = (d) => { const dt = new Date(d); return `${dt.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][dt.getMonth()]} (${['вс','пн','вт','ср','чт','пт','сб'][dt.getDay()]})` }
function getPopoverShift() { if (!editingCell.value) return null; return editedShifts.value[`${editingCell.value.userIdx}-${editingCell.value.day}`] || null }
function onPopoverStatusChange(v) {
  if (!editingCell.value) return
  const key = `${editingCell.value.userIdx}-${editingCell.value.day}`
  if (!editedShifts.value[key]) { const u = scheduleStore.allSchedule?.userSchedules?.[editingCell.value.userIdx], sh = u?.shifts?.find(s => s.date === editingCell.value.day); editedShifts.value[key] = sh ? { ...sh } : { date: editingCell.value.day, startTime: '', endTime: '', status: 'OFF' } }
  editedShifts.value[key].status = v
  if (isNonWorkingShift(v)) { editedShifts.value[key].startTime = ''; editedShifts.value[key].endTime = '' }
  editedShifts.value[key] = { ...editedShifts.value[key] }
}
function onPopoverTimeChange(field, v) {
  if (!editingCell.value) return
  const key = `${editingCell.value.userIdx}-${editingCell.value.day}`
  if (!editedShifts.value[key]) { const u = scheduleStore.allSchedule?.userSchedules?.[editingCell.value.userIdx], sh = u?.shifts?.find(s => s.date === editingCell.value.day); editedShifts.value[key] = sh ? { ...sh } : { date: editingCell.value.day, startTime: '', endTime: '', status: 'OFF' } }
  editedShifts.value[key][field] = v
}
function getDaysInPeriod() {
  const d = []
  if (viewMode.value === 'month') { const [y,m] = currentMonth.value.split('-'); const cnt = new Date(parseInt(y),parseInt(m),0).getDate(); for (let i=1;i<=cnt;i++) d.push(`${y}-${m}-${String(i).padStart(2,'0')}`) }
  else if (viewMode.value === 'week') { const ws = new Date(currentWeekStart.value); for (let i=0;i<7;i++) { const dt = new Date(ws); dt.setDate(dt.getDate()+i); d.push(getLocalDateString(dt)) } }
  else d.push(selectedDate.value)
  return d
}
function getWeekStart(ds) { const d = new Date(ds); d.setHours(0,0,0,0); const day = d.getDay(); const toMon = day===0 ? -6 : 1-day; const m = new Date(d); m.setDate(m.getDate()+toMon); return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}-${String(m.getDate()).padStart(2,'0')}` }
function setViewMode(m) {
  viewMode.value = m; const t = new Date(); t.setHours(0,0,0,0)
  if (m==='month') currentMonth.value = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-01`
  else if (m==='week') currentWeekStart.value = getWeekStart(new Date(currentMonth.value))
  else selectedDate.value = getLocalDateString(t)
}
function getPeriodTitle() {
  if (viewMode.value==='month') { const [y,m] = currentMonth.value.split('-'); return `${['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][parseInt(m)-1]} ${y}` }
  else if (viewMode.value==='week') { const s=new Date(currentWeekStart.value), e=new Date(s); e.setDate(e.getDate()+6); return `${s.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][s.getMonth()]} — ${e.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][e.getMonth()]}` }
  else { const d=new Date(selectedDate.value); return `${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}, ${['пн','вт','ср','чт','пт','сб','вс'][(d.getDay()+6)%7]}` }
}
function getViewLabel(v) { return { month:'Месяц', week:'Неделя', day:'День' }[v] }
function previousPeriod() {
  if (viewMode.value==='month') currentMonth.value = getPreviousMonth(currentMonth.value)
  else if (viewMode.value==='week') { const d=new Date(currentWeekStart.value); d.setDate(d.getDate()-7); currentWeekStart.value=getLocalDateString(d) }
  else { const d=new Date(selectedDate.value); d.setDate(d.getDate()-1); selectedDate.value=getLocalDateString(d) }
  cancelEditing(); loadSchedule()
}
function nextPeriod() {
  if (viewMode.value==='month') currentMonth.value = getNextMonth(currentMonth.value)
  else if (viewMode.value==='week') { const d=new Date(currentWeekStart.value); d.setDate(d.getDate()+7); currentWeekStart.value=getLocalDateString(d) }
  else { const d=new Date(selectedDate.value); d.setDate(d.getDate()+1); selectedDate.value=getLocalDateString(d) }
  cancelEditing(); loadSchedule()
}
function selectDate(date) { viewMode.value='day'; selectedDate.value=date; cancelEditing(); loadSchedule() }
async function applyCafeId() { if (!cafeIdInput.value) return; scheduleStore.invalidateScheduleCache(); scheduleStore.cafeId=cafeIdInput.value; scheduleError.value=''; cancelEditing(); await loadSchedule(); await scheduleStore.fetchStatusesSchedule() }
async function loadCafes() { cafesLoading.value=true; try { const c=await getAllCafes(); cafeOptions.value=c; if (c.length>0&&!cafeIdInput.value) { cafeIdInput.value=c[0].id; scheduleStore.cafeId=c[0].id } } catch(e) { console.error(e) } finally { cafesLoading.value=false } }
function getShiftForDay(user, day) { return user.shifts?.find(s=>s.date===day) }
function getShiftForDayWithEdit(uIdx, day) {
  const key=`${uIdx}-${day}`
  if (editingCell.value && editingCell.value.userIdx===uIdx && editingCell.value.day===day) return getPopoverShift()
  if (editedShifts.value[key]) return editedShifts.value[key]
  const u=scheduleStore.allSchedule?.userSchedules?.[uIdx]; return u?.shifts?.find(s=>s.date===day)
}
function getStatusColor(id) { return scheduleStatusesFromStore.value?.find(s=>s.id===id)?.color||'#f1f1f1' }
function isNonWorkingShift(id) { return ['OFF','VACATION','SICK_LEAVE'].includes(id) }
function offColorDark() { return '#2a2a2c' }
function offColorLight() { const off=scheduleStatusesFromStore.value?.find(s=>s.id==='OFF'); return off?.color||'#cccccc' }
function getOffColor() { return isDarkMode.value ? offColorDark() : offColorLight() }
function getCellBackground(uIdx, day) {
  const ed=editedShifts.value[`${uIdx}-${day}`]
  if (ed) return getShiftColor(ed)
  const u=scheduleStore.allSchedule?.userSchedules?.[uIdx], sh=getShiftForDay(u,day)
  if (!sh) { const h=getOffColor().replace('#',''); return {backgroundColor:`rgba(${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)},1)`} }
  return getShiftColor(sh)
}
function getShiftColor(sh) {
  const c=sh.status==='OFF'&&isDarkMode.value?offColorDark():getStatusColor(sh.status)
  if (!c) return {}
  const a=sh.status==='OFF'?1:0.25, h=c.replace('#','')
  return {backgroundColor:`rgba(${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)},${a})`}
}
function timeToPercent(t, isEnd) { if (!t) return isEnd?100:0; const [h,m]=t.split(':').map(Number); if (isEnd&&h===0&&m===0) return 100; return ((h*60+m)/(24*60))*100 }
function isFullDayShift(id) { return ['VACATION','SICK_LEAVE'].includes(id) }
function getShiftBarStyle(sh) {
  if (!sh) return {}
  if (isFullDayShift(sh.status)) return { left:'0%', width:'100%', backgroundColor:getStatusColor(sh.status)||'#cccccc' }
  if (!sh.startTime||!sh.endTime) return {}
  const l=timeToPercent(sh.startTime), r=timeToPercent(sh.endTime,true)
  return { left:l+'%', width:Math.max(r-l,0)+'%', backgroundColor:getStatusColor(sh.status)||'#4CAF50' }
}
function getCoverageCount(hour) {
  const users=scheduleStore.allSchedule?.userSchedules||[]
  return users.filter((u,uIdx)=>{ const shift=getShiftForDayWithEdit(uIdx,selectedDate.value); if (!shift||isNonWorkingShift(shift.status)) return false; const [startH,startM]=(shift.startTime||'00:00').split(':').map(Number); let [endH,endM]=(shift.endTime||'23:59').split(':').map(Number); if (endH===0&&endM===0) endH=24; const smin=startH*60+startM, emin=endH*60+endM, hs=hour*60, he=(hour+1)*60; return smin<he&&emin>hs }).length
}
function getCoverageColor(hour) { const c=getCoverageCount(hour); if (c===0) return '#ff3b30'; if (c===1) return '#ff9f0a'; if (c===2) return '#ffd60a'; return '#30d158' }
function closePopover() { popoverSnapshot.value=null; editingCell.value=null }
function cancelPopover() { if (popoverSnapshot.value&&editingCell.value) editedShifts.value[`${editingCell.value.userIdx}-${editingCell.value.day}`]={...popoverSnapshot.value}; popoverSnapshot.value=null; editingCell.value=null }
function handleClickOutside(evt) { if (editingCell.value&&!evt.target.closest('.edit-popover')&&!evt.target.closest('.grid-cell')&&!evt.target.closest('.tl-track')) cancelPopover() }
function handleKeydown(e) {
  if (e.key==='Escape'&&editingCell.value) { cancelPopover(); e.preventDefault() }
  if ((e.ctrlKey||e.metaKey)&&e.key==='s'&&isEditingSchedule.value) { e.preventDefault(); saveAllSchedules() }
  if (e.key==='ArrowLeft'&&!editingCell.value&&!showAddEmployeeModal.value) previousPeriod()
  if (e.key==='ArrowRight'&&!editingCell.value&&!showAddEmployeeModal.value) nextPeriod()
}
const availableUsers = computed(() => { const ids=new Set((scheduleStore.allSchedule?.userSchedules||[]).map(u=>u.userId)); return (userStore.allUsers||[]).filter(u=>!ids.has(u.id)&&!(u.roles||[]).includes('USER_ADMIN')) })
function handleCreateSchedule() { userStore.fetchAllUsers(); showAddEmployeeModal.value=true }
function openAddEmployeeModal() { userStore.fetchAllUsers(); showAddEmployeeModal.value=true }
function getMonthDays(ms) { const [y,m]=ms.split('-'), cnt=new Date(parseInt(y),parseInt(m),0).getDate(); return Array.from({length:cnt},(_,i)=>`${y}-${m}-${String(i+1).padStart(2,'0')}`) }
function getMonthsToLoad() { if (viewMode.value==='month') return currentMonth.value; const ms=new Set(getDaysInPeriod().map(d=>d.substring(0,7))); return ms.size===1?[...ms][0]+'-01':[...ms].map(m=>m+'-01') }
function handleAddEmployees(su) {
  const days=getMonthDays(currentMonth.value)
  su.forEach(u=>{ scheduleStore.allSchedule.userSchedules.push({userId:u.id,username:u.username,firstName:u.firstName,lastName:u.lastName,position:u.position||'',shifts:days.map(d=>({date:d,startTime:'00:00',endTime:'23:59',status:'OFF'}))}) })
  showAddEmployeeModal.value=false; if (!isEditingSchedule.value) startEditing()
}
function startEditing() { isEditingSchedule.value=true; originalSchedule.value=JSON.parse(JSON.stringify(scheduleStore.allSchedule)); editedShifts.value={}; userStore.fetchAllUsers() }
function cancelEditing() { if (originalSchedule.value) scheduleStore.allSchedule=JSON.parse(JSON.stringify(originalSchedule.value)); isEditingSchedule.value=false; editedShifts.value={}; originalSchedule.value=null }
async function saveAllSchedules() {
  try {
    const NW=['OFF','VACATION','SICK_LEAVE']
    const data=scheduleStore.allSchedule.userSchedules.map((u,uIdx)=>({userId:u.userId,shifts:(u.shifts||[]).map(s=>{const ed=editedShifts.value[`${uIdx}-${s.date}`],sd=ed||s;if(!sd)return null;const nw=NW.includes(sd.status);return{date:sd.date,startTime:nw?'00:00':(sd.startTime||'00:00'),endTime:nw?'23:59':(sd.endTime||'23:59'),status:sd.status}}).filter(Boolean)}))
    await scheduleStore.updateAllScheduleData(currentMonth.value,data)
    editedShifts.value={}; originalSchedule.value=null; isEditingSchedule.value=false; await loadSchedule()
    toast.add({severity:'success',summary:'Успех',detail:'Расписание сохранено!',life:3000})
  } catch { toast.add({severity:'error',summary:'Ошибка',detail:'Ошибка при сохранении',life:5000}) }
}
async function toggleApproveStatus() {
  try { await scheduleStore.changeApproveStatus(currentMonth.value,!scheduleStore.allSchedule.approved); await loadSchedule() } catch { /* ignore */ }
}
async function loadSchedule() { try { return await scheduleStore.fetchAllSchedule(getMonthsToLoad()) } catch { return false } }
function printSchedule() { window.print() }
function handleRemoveEmployee(uid) {
  const idx=scheduleStore.allSchedule.userSchedules.findIndex(u=>u.userId===uid); if (idx===-1) return
  const u=scheduleStore.allSchedule.userSchedules[idx]
  confirm.require({message:`Удалить ${u.firstName} ${u.lastName} из расписания?`,header:'Подтверждение',icon:'pi pi-exclamation-triangle',rejectLabel:'Отмена',acceptLabel:'Удалить',accept:()=>{scheduleStore.allSchedule.userSchedules.splice(idx,1);editedShifts.value={}}})
}
onMounted(async () => {
  const t=new Date(); t.setHours(0,0,0,0); currentWeekStart.value=getWeekStart(t); selectedDate.value=getWeekStart(t)
  await userStore.init(); await loadCafes()
  if (userStore.currentUser?.cafeId&&!cafeIdInput.value) { scheduleStore.cafeId=userStore.currentUser.cafeId; cafeIdInput.value=userStore.currentUser.cafeId }
  await loadSchedule(); await scheduleStore.fetchStatusesSchedule()
  document.addEventListener('click',handleClickOutside); document.addEventListener('keydown',handleKeydown)
})
onBeforeUnmount(() => { document.removeEventListener('click',handleClickOutside); document.removeEventListener('keydown',handleKeydown) })
</script>

<style scoped>
main { padding: 0; min-height: calc(100vh - 44px); }
.schedule-container { padding: 32px 20px; }

.page-header h1 { font-family: var(--font-display); font-size: 40px; font-weight: 600; line-height: 1.1; color: var(--color-ink); margin-bottom: 8px; }
.info-text { font-size: 14px; line-height: 1.5; color: var(--color-ink-muted-48); margin-bottom: 24px; }

.controls-section { background: var(--color-canvas); padding: 20px 24px; margin-bottom: 2px; }
.controls-inner { display: flex; flex-direction: column; gap: 12px; }
.controls-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

.view-tabs { display: flex; gap: 4px; background: var(--color-canvas-parchment); padding: 3px; border-radius: var(--rounded-pill); }
.tab-btn { padding: 6px 16px; border: none; border-radius: var(--rounded-pill); background: transparent; color: var(--color-ink-muted-48); font-family: var(--font-body); font-size: 13px; font-weight: 400; cursor: pointer; transition: all 0.2s; }
.tab-btn.active { background: var(--color-canvas); color: var(--color-ink); }
.tab-btn:hover:not(.active) { color: var(--color-ink); }

.period-nav { display: flex; align-items: center; gap: 12px; }
.nav-btn { padding: 6px 10px; border: none; border-radius: var(--rounded-sm); background: transparent; color: var(--color-ink); cursor: pointer; opacity: 0.5; transition: opacity 0.2s; font-size: 13px; }
.nav-btn:hover { opacity: 1; }
.nav-btn:active { transform: scale(0.95); }
.period-title { font-family: var(--font-display); font-size: 20px; font-weight: 600; line-height: 1.1; min-width: 200px; text-align: center; color: var(--color-ink); }

.cafe-select { min-width: 160px; }
.date-row { display: flex; justify-content: center; }
.date-input { padding: 8px 12px; border: 1px solid var(--color-hairline); border-radius: var(--rounded-sm); font-size: 14px; background: var(--color-canvas); color: var(--color-ink); }
.date-input:focus { outline: none; border-color: var(--color-primary); }

.approve-section { background: var(--color-canvas-parchment); padding: 16px 24px; margin-bottom: 2px; }
.approve-inner { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.approve-text { font-size: 15px; color: var(--color-ink); }
.approve-text strong { font-weight: 600; }
.action-group { display: flex; gap: 8px; flex-wrap: wrap; }

.legend-section { background: var(--color-canvas); padding: 12px 24px; margin-bottom: 2px; }
.legend-row { display: flex; gap: 14px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-text { font-size: 11px; color: var(--color-ink-muted-48); }

.grid-section { background: var(--color-canvas); padding: 20px; margin-bottom: 2px; }
.grid-wrap { overflow-x: auto; }
.grid { display: grid; gap: 0; width: 100%; }

.grid-corner { padding: 10px 8px; font-size: 11px; font-weight: 600; color: var(--color-body-on-dark); background: var(--color-surface-black); text-align: center; position: sticky; left: 0; z-index: 2; }

.grid-day { padding: 6px 2px; text-align: center; font-size: 10px; background: var(--color-surface-black); color: var(--color-body-on-dark); border: 1px solid rgba(255,255,255,0.08); }
.grid-day.is-today { background: var(--color-primary); }
.grid-day.is-weekend { background: var(--color-surface-tile-1); }

.day-num { display: block; font-weight: 700; font-size: 11px; }
.day-name { font-size: 9px; opacity: 0.7; }

.grid-row-header { padding: 10px 8px; background: var(--color-canvas-parchment); display: flex; flex-direction: column; justify-content: center; position: sticky; left: 0; z-index: 1; min-height: 56px; }
.grid-row-header.is-current { background: #e8f0fe; }
.row-name { font-size: 12px; font-weight: 600; color: var(--color-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-pos { font-size: 10px; color: var(--color-ink-muted-48); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.is-current .row-name { color: var(--color-primary); }

.grid-cell { min-height: 56px; padding: 4px 2px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-divider-soft); font-size: 10px; cursor: pointer; transition: border-color 0.2s; position: relative; overflow: hidden; }
.grid-cell:hover { border-color: var(--color-primary); }
.grid-cell.is-today::after { content: '●'; position: absolute; top: 2px; right: 2px; font-size: 7px; color: var(--color-primary); }
.grid-cell.is-weekend { background: rgba(0,0,0,0.02); }

.cell-time { display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 10px; font-weight: 600; color: var(--color-ink); }
.cell-sep { font-size: 7px; opacity: 0.4; }

.btn-pill { padding: 8px 20px; border: none; border-radius: var(--rounded-pill); background: var(--color-primary); color: var(--color-on-primary); font-family: var(--font-body); font-size: 14px; font-weight: 400; cursor: pointer; transition: opacity 0.2s; letter-spacing: -0.224px; }
.btn-pill:hover { opacity: 0.85; }
.btn-pill:active { transform: scale(0.95); }

.btn-pill-outline { padding: 8px 20px; border: 1px solid var(--color-primary); border-radius: var(--rounded-pill); background: transparent; color: var(--color-primary); font-family: var(--font-body); font-size: 14px; font-weight: 400; cursor: pointer; transition: opacity 0.2s; letter-spacing: -0.224px; }
.btn-pill-outline:hover { opacity: 0.7; }
.btn-pill-outline:active { transform: scale(0.95); }
.btn-pill-outline.btn-green { border-color: #30d158; color: #30d158; }

.btn-ghost { padding: 8px 12px; border: none; border-radius: var(--rounded-sm); background: transparent; color: var(--color-ink-muted-48); cursor: pointer; font-size: 14px; transition: opacity 0.2s; }
.btn-ghost:hover { opacity: 0.7; }

.skeleton-section { background: var(--color-canvas); padding: 20px; margin-bottom: 2px; }
.sk-mb { margin-bottom: 12px; }

.empty-section { background: var(--color-canvas); padding: 64px 24px; text-align: center; margin-bottom: 2px; }
.empty-title { font-family: var(--font-display); font-size: 24px; font-weight: 400; line-height: 1.5; color: var(--color-ink-muted-48); margin-bottom: 8px; }
.empty-desc { font-size: 17px; color: var(--color-ink-muted-48); margin-bottom: 20px; }

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

.timeline-section { background: var(--color-canvas); padding: 20px; margin-bottom: 2px; }
.timeline-scroll { overflow-x: auto; min-height: 200px; }
.timeline { min-width: max-content; display: flex; flex-direction: column; border: 1px solid var(--color-hairline); border-radius: var(--rounded-sm); }
.tl-row { display: flex; min-height: 48px; border-bottom: 1px solid var(--color-divider-soft); }
.tl-row:last-child { border-bottom: none; }
.tl-row.is-current .tl-corner { background: #e8f0fe; }
.tl-row.is-current .tl-track { background: #f5f9ff; }
.tl-row.is-current .tl-name { color: var(--color-primary); font-weight: 700; }

.tl-corner { width: 120px; min-width: 120px; padding: 8px 10px; background: var(--color-canvas-parchment); display: flex; flex-direction: column; justify-content: center; position: sticky; left: 0; z-index: 1; border-right: 1px solid var(--color-hairline); font-size: 11px; }
.tl-name { font-weight: 600; color: var(--color-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tl-pos { font-size: 10px; color: var(--color-ink-muted-48); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tl-track { flex: 1; position: relative; display: flex; align-items: center; background: var(--color-canvas); min-height: 48px; }
.tl-track-header { background: var(--color-surface-black); }

.tl-header { background: var(--color-surface-black); min-height: 36px; }
.tl-header .tl-corner { background: transparent; border-right-color: rgba(255,255,255,0.15); color: var(--color-body-on-dark); font-weight: 700; font-size: 10px; text-transform: uppercase; }

.tl-hour { flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px 2px; border-right: 1px solid rgba(255,255,255,0.12); }
.tl-hour:last-child { border-right: none; }
.tl-h { font-size: 10px; font-weight: 700; color: var(--color-body-on-dark); }
.tl-m { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.45); }

.tl-marker { flex: 1; height: 100%; border-right: 1px solid var(--color-divider-soft); }
.tl-marker.tl-marker-start { border-right-color: var(--color-hairline); }

.tl-bar { position: absolute; top: 4px; bottom: 4px; border-radius: 6px; opacity: 0.7; z-index: 5; cursor: pointer; transition: opacity 0.2s; min-width: 4px; }
.tl-bar:hover { opacity: 1; }
.tl-bar-full { opacity: 0.4; border-radius: 0; background-image: repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(255,255,255,0.2) 6px,rgba(255,255,255,0.2) 12px); }

.tl-coverage { border-top: 2px solid var(--color-hairline); background: var(--color-canvas-parchment); }
.tl-coverage .tl-corner { background: var(--color-divider-soft); font-weight: 700; font-size: 10px; color: var(--color-ink-muted-48); display: flex; flex-direction: row; align-items: center; gap: 4px; }

.cov-cell { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: rgba(0,0,0,0.6); border-right: 1px solid rgba(0,0,0,0.04); }
.cov-cell:last-child { border-right: none; }
.cov-count { text-shadow: 0 1px 1px rgba(255,255,255,0.5); }

.now-line { position: absolute; top: 0; bottom: 0; width: 2px; background: #ff3b30; z-index: 15; pointer-events: none; box-shadow: 0 0 4px rgba(255,59,48,0.4); }

.tl-tooltip { position: fixed; transform: translate(10px,-100%); background: var(--color-surface-black); color: var(--color-body-on-dark); padding: 4px 10px; border-radius: var(--rounded-sm); font-size: 12px; font-weight: 500; white-space: nowrap; pointer-events: none; z-index: 9999; }

@media (max-width: 768px) {
  .schedule-container { padding: 20px 12px; }
  .page-header h1 { font-size: 28px; }
  .controls-row { flex-direction: column; align-items: stretch; }
  .period-nav { justify-content: center; }
  .period-title { font-size: 18px; min-width: 160px; }
  .view-tabs { align-self: center; }
  .cafe-selector { align-self: center; }
  .tl-corner { width: 90px; min-width: 90px; }
}
</style>
