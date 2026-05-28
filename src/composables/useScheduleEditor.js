import { ref, computed } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { useDarkMode } from '@/composables/useDarkMode'
import { isNonWorkingShift } from '@/utils/constants'

export function useScheduleEditor() {
  const scheduleStore = useScheduleStore()
  const { isDarkMode } = useDarkMode()

  const isEditingSchedule = ref(false)
  const editingCell = ref(null)
  const editedShifts = ref({})
  const originalSchedule = ref(null)
  const popoverStyle = ref({ position: 'fixed', zIndex: 9999 })
  const popoverSnapshot = ref(null)

  const scheduleStatusesFromStore = computed(() => scheduleStore.statusesSchedule)

  const statusOptions = computed(() =>
    (scheduleStore.statusesSchedule || []).map(s => ({
      label: `${s.short_name} - ${s.name_rus}`,
      value: s.id
    }))
  )

  function formatDateDisplay(d) {
    const dt = new Date(d)
    const ms = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
    const wd = ['вс','пн','вт','ср','чт','пт','сб']
    return `${dt.getDate()} ${ms[dt.getMonth()]} (${wd[dt.getDay()]})`
  }

  function getStatusColor(id) {
    return scheduleStatusesFromStore.value?.find(s => s.id === id)?.color || '#f1f1f1'
  }

  function offColorDark() { return '#2a2a2c' }

  function offColorLight() {
    const off = scheduleStatusesFromStore.value?.find(s => s.id === 'OFF')
    return off?.color || '#cccccc'
  }

  function getOffColor() {
    return isDarkMode.value ? offColorDark() : offColorLight()
  }

  function getShiftColor(sh) {
    if (!sh) return {}
    const c = sh.status === 'OFF' && isDarkMode.value ? offColorDark() : getStatusColor(sh.status)
    if (!c) return {}
    const a = sh.status === 'OFF' ? 1 : 0.25
    const h = c.replace('#', '')
    return { backgroundColor: `rgba(${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)},${a})` }
  }

  function startEditing(scheduleData) {
    isEditingSchedule.value = true
    originalSchedule.value = JSON.parse(JSON.stringify(scheduleData))
    editedShifts.value = {}
  }

  function cancelEditing() {
    const restored = originalSchedule.value ? JSON.parse(JSON.stringify(originalSchedule.value)) : null
    isEditingSchedule.value = false
    editedShifts.value = {}
    originalSchedule.value = null
    return restored
  }

  function finalizeEditing() {
    isEditingSchedule.value = false
    editedShifts.value = {}
    originalSchedule.value = null
    editingCell.value = null
    popoverSnapshot.value = null
  }

  function openPopover(cellInfo, event) {
    const e = event
    let l = e.clientX + 10
    let t = e.clientY + 10
    if (l + 240 > window.innerWidth) l = e.clientX - 250
    if (t + 280 > window.innerHeight) t = window.innerHeight - 300
    if (t < 10) t = 10
    if (l < 10) l = 10
    popoverStyle.value = { position: 'fixed', top: `${t}px`, left: `${l}px`, zIndex: 9999 }
    editingCell.value = cellInfo
  }

  function getPopoverShift() {
    if (!editingCell.value) return null
    return editedShifts.value[editingCell.value.editKey] || null
  }

  function initEditedShift(editKey, originalShift, date) {
    if (!editedShifts.value[editKey]) {
      editedShifts.value[editKey] = originalShift
        ? { ...originalShift }
        : { date, startTime: '', endTime: '', status: 'OFF' }
    }
  }

  function onPopoverStatusChange(v) {
    if (!editingCell.value) return
    const key = editingCell.value.editKey
    initEditedShift(key, editingCell.value.originalShift, editingCell.value.day)
    editedShifts.value[key].status = v
    if (isNonWorkingShift(v)) {
      editedShifts.value[key].startTime = ''
      editedShifts.value[key].endTime = ''
    }
    editedShifts.value[key] = { ...editedShifts.value[key] }
  }

  function onPopoverTimeChange(field, v) {
    if (!editingCell.value) return
    const key = editingCell.value.editKey
    initEditedShift(key, editingCell.value.originalShift, editingCell.value.day)
    editedShifts.value[key][field] = v
    editedShifts.value[key] = { ...editedShifts.value[key] }
  }

  function closePopover() {
    popoverSnapshot.value = null
    editingCell.value = null
  }

  function cancelPopover() {
    if (popoverSnapshot.value && editingCell.value) {
      editedShifts.value[editingCell.value.editKey] = { ...popoverSnapshot.value }
    }
    popoverSnapshot.value = null
    editingCell.value = null
  }

  function handleClickOutside(evt) {
    if (editingCell.value && !evt.target.closest('.edit-popover') && !evt.target.closest('.grid-cell') && !evt.target.closest('.tl-track')) {
      cancelPopover()
    }
  }

  return {
    isEditingSchedule,
    editingCell,
    editedShifts,
    originalSchedule,
    popoverStyle,
    popoverSnapshot,
    statusOptions,
    formatDateDisplay,
    getStatusColor,
    getOffColor,
    getShiftColor,
    startEditing,
    cancelEditing,
    finalizeEditing,
    openPopover,
    getPopoverShift,
    initEditedShift,
    onPopoverStatusChange,
    onPopoverTimeChange,
    closePopover,
    cancelPopover,
    handleClickOutside,
    scheduleStatusesFromStore,
  }
}
