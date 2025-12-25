// Получение сокращенного дня недели
export function getDayOfWeekShort(dateString) {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const date = new Date(dateString)
  return days[date.getDay()]
}

// Проверка является ли день выходным
export function isWeekend(dateString) {
  const date = new Date(dateString)
  const day = date.getDay() // 0 = Воскресенье, 6 = Суббота
  return day === 0 || day === 6
}

// Проверка является ли день сегодняшним
export function isToday(dateString) {
  const today = new Date()
  const date = new Date(dateString)
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

// Форматирование месяца для отображения
export function formatMonth(monthString) {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  const date = new Date(monthString)
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${month} ${year}`
}

// Получение предыдущего месяца (возвращает новую дату)
export function getPreviousMonth(currentMonthString) {
  const date = new Date(currentMonthString)
  date.setMonth(date.getMonth() - 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

// Получение следующего месяца (возвращает новую дату)
export function getNextMonth(currentMonthString) {
  const date = new Date(currentMonthString)
  date.setMonth(date.getMonth() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}