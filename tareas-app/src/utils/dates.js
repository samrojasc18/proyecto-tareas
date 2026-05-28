export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return toDateStr(new Date(y, m - 1, d + n))
}

// Determina si una tarea aparece en una fecha dada.
// Las tareas reprogramadas sólo aparecen en su nueva fecha.
export function matchesDate(task, dateStr) {
  if (task.status === 'reprogramado' && task.rescheduledTo) {
    return task.rescheduledTo === dateStr
  }
  const start = task.startDate || task.date
  const end   = task.endDate
  if (end) return start <= dateStr && end >= dateStr
  return start === dateStr
}

export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export function isSameDay(a, b) {
  return a === b
}

export function isPast(dateStr) {
  return dateStr < todayStr()
}
