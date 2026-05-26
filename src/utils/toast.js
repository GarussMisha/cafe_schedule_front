const listeners = []

export function onToast(callback) {
  listeners.push(callback)
  return () => {
    const idx = listeners.indexOf(callback)
    if (idx !== -1) listeners.splice(idx, 1)
  }
}

export function emitToast(options) {
  listeners.forEach(cb => cb(options))
}
