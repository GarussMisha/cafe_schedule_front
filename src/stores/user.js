import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authAPI } from '@/api/auth'
import { getAllUsers, createUser, deleteUser, updateUser} from '@/api/user'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const isLoading = ref(false)
  const allUsers = ref([])

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value)
  const roles = computed(() => currentUser.value?.roles || [])
  const isAdmin = computed(() => roles.value.includes('USER_ADMIN'))
  const isManager = computed(() => roles.value.includes('CAFE_ADMIN'))
  const isEmployee = computed(() => roles.value.includes('STAFF'))

  /**
   * Инициализация - загружает профиль по токену
   */
  async function init() {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      isLoading.value = true
      const userData = await authAPI.getProfile()
      currentUser.value = userData
      return userData
    } catch (error) {
      console.error('E -> stores/user.js -> Ошибка загрузки профиля:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Логин - использует ваш метод login
   */
  async function login(credentials) {
    try {
      isLoading.value = true
      // ✅ Используем ваш метод login
      const userData = await authAPI.login(credentials)
      currentUser.value = userData
      return userData
    } catch (error) {
      console.error('E -> stores/user.js -> Ошибка логина:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Выход - использует ваш метод logout
   */
  async function logout() {
    authAPI.logout()
    router.push('/login')
  }

  /**
   * Загрузка всех пользователей
   */
  async function fetchAllUsers() {
    try {
      const users = await getAllUsers()
      allUsers.value = users
      console.log('Пользователи загружены успешно:', users)
      return allUsers.value
    } catch (error) {
      console.error('E -> stores/user.js -> Ошибка загрузки пользователей:', error)
      throw error
    }
  }

  async function createUser_store(userData) {
    try {
      const newUser = await createUser(userData)
      console.log('Пользователь создан успешно:', newUser)
      return newUser
    } catch (error) {
      console.error('E -> stores/user.js -> Ошибка создания пользователя:', error)
      throw error
    }
  }

  async function updatedUser_store(userId, userData) {
    try {
      const updatedUser = await updateUser(userId, userData)
      console.log('Пользователь обновлен успешно:', updatedUser)
      return updatedUser
    } catch (error) {
      console.error('E -> stores/user.js -> Ошибка обновления пользователя:', error)
      throw error     
    }
  }


  async function deleteUser_store(userId) {
    try {
      const result = await deleteUser(userId)
      console.log('Пользователь удален успешно:', result)
      return result
    } catch (error) {
      console.error('E -> stores/user.js -> Ошибка удаления пользователя:', error)
      throw error
    }
  }


  return {
    currentUser,
    isLoading,
    isAuthenticated,
    roles,
    isAdmin,
    isManager,
    isEmployee,
    init,
    login,
    logout,
    fetchAllUsers,
    createUser_store,
    deleteUser_store,
    updatedUser_store
  }
})