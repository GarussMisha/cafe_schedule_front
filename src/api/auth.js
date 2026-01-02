import apiClient from './index.js'

// 1. Авторизация
export async function login(credentials) {
  try {
    const response = await apiClient.post('/auth/login', credentials)
    const data = response.data
    
    // Сохраняем токен отдельно (интерцептор использует его)
    localStorage.setItem('token', data.token)
    localStorage.setItem('roles', data.roles)
    
    // Возвращаем userData (без token) для store/компонента
    return  {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      roles: data.roles
    }
  } catch (error) {
    // Ошибки (401/403) обрабатываются в интерцепторах apiClient
    throw error
  }
}

// 2. Получение данных текущего пользователя
export async function getProfile() {
  try {
    const response = await apiClient.get('/profile')
    return response.data
  } catch (error) {
    console.error('E:API:AUTH: Get profile error:', error)
    throw error
  }
}

// 3. Выход из системы
export function logout() {
  localStorage.removeItem('token')
}

// 4. Проверка аутентификации (локально)
export function isAuthenticated() {
  return !!localStorage.getItem('token')
}

// 5. Получение роли пользователя
export function getRole() {
  return localStorage.getItem('roles')
}

// export 
export const authAPI = {
  login,
  getProfile,
  logout,
  isAuthenticated,
  getRole
}