<template>
  <main>
    <h1>AdminPanel</h1>
    <div v-if="isUserAdmin" class="admin-panel">
      <button @click="showCreateModal = true">Создать пользователя</button>

      <!-- Форма отображения всех пользователей (только для USER_ADMIN) -->
      <div v-if="isUserAdmin" class="user-list">
        <h2>Список всех пользователей</h2>
        <ul>
          <li v-for="user in allUsers" :key="user.id">
            {{ user.username }} - {{ user.email }} ({{ user.roles?.join(', ') }})
            <button @click="openEditModal(user)">Редактировать</button>
            <button @click="deleteUser(user.id)" :disabled="user.id === userStore.currentUser?.id">Удалить</button>
          </li>
        </ul>
      </div>

    </div>


    <CreateUserModal :is-open="showCreateModal" 
                     @close="showCreateModal = false"
                     @success="handleUserUpdated" />

    <EditUserModal :is-open="showEditModal"
                   :user="selectedUser"
                   @close="showEditModal = false"
                   @success="handleUserUpdated" />
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user';
import CreateUserModal from '@/components/icons/modal/adminPanel/CreateUserModal.vue';
import EditUserModal from '@/components/icons/modal/adminPanel/EditUserModal.vue';

const userStore = useUserStore();
const allUsers = ref([])

// Модальные окна
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedUser = ref(null)

const isUserAdmin = computed(() => userStore.isAdmin)

onMounted(async () => {
  await userStore.init()
  await loadUsers()
})

function handleUserUpdated() {
  loadUsers()
  showEditModal.value = false
}

function openEditModal(user) {
  selectedUser.value = user
  showEditModal.value = true
}

async function loadUsers() {
  try {
    const users = await userStore.fetchAllUsers()
    allUsers.value = users
  } catch (error){
    console.error('E -> views/AdminPanel.vue -> Ошибка загрузки всех пользователей:', error)
  }
}

async function deleteUser(userId) {
  try {
    await userStore.deleteUser_store(userId)
    await loadUsers()
  } catch (error) {
    console.error('E -> views/AdminPanel.vue -> Ошибка удаления пользователя:', error)
    alert(error.response?.data || 'Ошибка удаления пользователя')
  }
}
</script>