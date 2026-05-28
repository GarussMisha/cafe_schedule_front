
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
    throw error
  }
}

export async function createUser(userDto) {
  try {
    const response = await apiClient.post('/users', userDto)
    return response.data
  } catch (error) {
    throw error
  }
}

export async function updateUser(id, userDto) {
  try {
    const response = await apiClient.put(`/users/${id}`, userDto)
    return response.data
  } catch (error) {
    throw error
  }
}

export async function deleteUser(id) {
  try {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}
