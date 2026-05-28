export const SHIFT_STATUS = {
  WORKING: 'WORKING',
  OFF: 'OFF',
  VACATION: 'VACATION',
  SICK_LEAVE: 'SICK_LEAVE',
}

export const NON_WORKING_STATUSES = [SHIFT_STATUS.OFF, SHIFT_STATUS.VACATION, SHIFT_STATUS.SICK_LEAVE]

export function isNonWorkingShift(status) {
  return NON_WORKING_STATUSES.includes(status)
}

export function normalizeShiftTimes(shift) {
  if (!shift) return null
  const nw = isNonWorkingShift(shift.status)
  return {
    date: shift.date,
    startTime: nw ? '00:00' : (shift.startTime || '00:00'),
    endTime: nw ? '23:59' : (shift.endTime || '23:59'),
    status: shift.status,
  }
}
