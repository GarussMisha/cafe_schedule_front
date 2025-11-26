import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authAPI } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const isLoading = ref(false)

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
      console.error('Ошибка загрузки профиля:', error)
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
      console.error('Ошибка логина:', error)
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
    logout
  }
})