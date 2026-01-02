
import apiClient from './index.js'

// 1. Получение всех пользователей
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
    console.error('E:API:USER: Get all users error:', error)
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
    console.error('E:API:USER: Create user error:', error)
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
    console.error('E:API:USER: Update user error:', error)
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
    console.error('E:API:USER: Delete user error:', error)
    throw error
  }
}
