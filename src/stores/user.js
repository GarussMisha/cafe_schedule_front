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

  async function init() {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      currentUser.value = JSON.parse(savedUser)
      return currentUser.value
    }
    if (!token) return null
    try {
      isLoading.value = true
      const userData = await authAPI.getProfile()
      currentUser.value = userData
      return userData
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function login(credentials) {
    try {
      isLoading.value = true
      const userData = await authAPI.login(credentials)
      currentUser.value = userData
      localStorage.setItem('currentUser', JSON.stringify(userData))
      return userData
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    authAPI.logout()
    currentUser.value = null
    allUsers.value = []
    router.push('/login')
  }

  async function fetchAllUsers() {
    try {
      const users = await getAllUsers()
      allUsers.value = users
      return allUsers.value
    } catch (error) {
      throw error
    }
  }

  async function createUser_store(userData) {
    try {
      const newUser = await createUser(userData)
      return newUser
    } catch (error) {
      throw error
    }
  }

  async function updatedUser_store(userId, userData) {
    try {
      const updatedUser = await updateUser(userId, userData)
      return updatedUser
    } catch (error) {
      throw error
    }
  }

  async function deleteUser_store(userId) {
    try {
      const result = await deleteUser(userId)
      return result
    } catch (error) {
      throw error
    }
  }

  return {
    currentUser,
    isLoading,
    allUsers,
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
