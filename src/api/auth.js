/**
 * @file API модуль для работы с авторизацией пользователей
 * @version 1.1.0
 * @description
 * - login(credentials): POST /api/auth/login — аутентификация, сохранение token в localStorage, возврат userData
 * - getProfile(): GET /api/profile — получение данных пользователя
 * - logout(): очистка localStorage + redirect на /login
 * - isAuthenticated(): локальная проверка токена
 *
 * @example
 * import { login, logout, isAuthenticated } from '@/api/auth'
 *
 * const userData = await login({ username: 'user', password: 'pass' })
 * logout() // очистит storage и redirect
 */

import apiClient from './index.js'

/**
 * 1. Аутентификация пользователя
 * POST /api/auth/login
 * @param {Object} credentials - { username: string, password: string }
 * @returns {Promise<Object>} userData без token: { id, username, email, firstName, lastName, position, roles }
 * Token автоматически сохраняется в localStorage для интерцептора
 */
export async function login(credentials) {
  try {
    const response = await apiClient.post('/auth/login', credentials)
    const data = response.data
    
    // Сохраняем токен отдельно (интерцептор использует его)
    localStorage.setItem('token', data.token)
    
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

/**
 * 2. Получение данных текущего пользователя
 * GET /api/profile
 * @returns {Promise<Object>} Данные пользователя
 */
export async function getProfile() {
  try {
    const response = await apiClient.get('/profile')
    return response.data
  } catch (error) {
    console.error('Get profile error:', error)
    throw error
  }
}

/**
 * 3. Выход из системы
 * Очищает localStorage + автоматический redirect на /login
 * (аналогично интерцептору на 401)
 */
export function logout() {
  localStorage.removeItem('token')
}

/**
 * 4. Проверка аутентификации (локально)
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem('token')
}

export const authAPI = {
  login,
  getProfile,
  logout,
  isAuthenticated
}