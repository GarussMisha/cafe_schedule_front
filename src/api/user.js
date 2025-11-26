/**
 * @file API модуль для управления пользователями (админ-панель)
 * @version 1.0.0
 * @description
 * - getAllUsers(): GET /api/users — список всех пользователей (USER_ADMIN)
 * - createUser(userDto): POST /api/users — создание пользователя (USER_ADMIN)
 * - updateUser(id, userDto): PUT /api/users/{id} — обновление пользователя
 * - deleteUser(id): DELETE /api/users/{id} — удаление пользователя (USER_ADMIN)
 *
 * @example
 * import { getAllUsers, createUser } from '@/api/user'
 *
 * const users = await getAllUsers()
 * await createUser({ username: 'newuser', email: 'user@example.com', password: 'pass', roles: ['STAFF'] })
 *
 * Структура userDto:
 * {
 *   username: string (3-20 chars),
 *   email: string (valid email),
 *   password: string (6-40 chars, обязательно для create),
 *   firstName: string,
 *   lastName: string,
 *   position: string,
 *   roles: string[{id, name}] (e.g. ['USER_ADMIN', 'CAFE_ADMIN', 'STAFF'])
 * }
 *
 * Ошибки 401/403/400 обрабатываются в интерцепторах apiClient.
 * Роли: STAFF (сотрудник), MANAGER (менеджер), ADMIN (админ).
 */

import apiClient from './index.js'

/**
 * 1. Получение списка всех пользователей
 * GET /api/users
 * Только USER_ADMIN
 * @returns {Promise<User[]>} Массив пользователей: [{ id, username, email, firstName, lastName, position, roles }]
 */
export async function getAllUsers() {
  try {
    const response = await apiClient.get('/users')
    // Бек возвращает List<User>, password игнорируем на фронте
    return response.data.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      roles: user.roles ? user.roles.map(role => role.name) : []
    }))
  } catch (error) {
    console.error('Get all users error:', error)
    throw error
  }
}

/**
 * 2. Создание нового пользователя
 * POST /api/users
 * Только USER_ADMIN
 * @param {Object} userDto - см. описание выше
 * @returns {Promise<string>} "User created successfully!"
 */
export async function createUser(userDto) {
  try {
    const response = await apiClient.post('/users', userDto)
    return response.data
  } catch (error) {
    console.error('Create user error:', error)
    throw error
  }
}

/**
 * 3. Обновление пользователя (частичное)
 * PUT /api/users/{id}
 * Требует USER_ADMIN (проверка в UserService)
 * @param {number} id - ID пользователя
 * @param {Object} userDto - поля для обновления (password optional)
 * @returns {Promise<string>} "User updated successfully!"
 */
export async function updateUser(id, userDto) {
  try {
    const response = await apiClient.put(`/users/${id}`, userDto)
    return response.data
  } catch (error) {
    console.error('Update user error:', error)
    throw error
  }
}

/**
 * 4. Удаление пользователя
 * DELETE /api/users/{id}
 * Только USER_ADMIN
 * @param {number} id - ID пользователя
 * @returns {Promise<string>} "User deleted successfully!"
 */
export async function deleteUser(id) {
  try {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  } catch (error) {
    console.error('Delete user error:', error)
    throw error
  }
}
