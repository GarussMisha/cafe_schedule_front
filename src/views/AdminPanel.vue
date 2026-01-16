<template>
  <main class="admin-panel-container">
    <h1>Панель администратора</h1>
    
    <div v-if="isUserAdmin" class="admin-panel">
      <!-- Сводка (статистика) -->
      <section class="summary-section">
        <h2>Сводка</h2>
        <div class="summary-cards">
          <div class="summary-card">
            <span class="summary-label">Всего сотрудников</span>
            <span class="summary-value">{{ allUsers.length }}</span>
          </div>
        </div>
      </section>

      <!-- Кнопка создания пользователя -->
      <section class="actions-section">
        <button class="btn btn-primary" @click="showCreateModal = true">
          ➕ Создать пользователя
        </button>
      </section>

      <!-- Список всех пользователей -->
      <section v-if="allUsers.length > 0" class="users-section">
        <h2>Список действующих сотрудников</h2>
        <div class="users-list">
          <div v-for="user in allUsers" :key="user.id" class="user-card">
            <div class="user-info">
              <div class="user-username">{{ user.username }}</div>
              <div class="user-email">{{ user.email }}</div>
              <div class="user-roles">{{ user.roles?.join(', ') }}</div>
            </div>
            <div class="user-actions">
              <button class="btn btn-edit" @click="openEditModal(user)">Редактировать</button>
              <button class="btn btn-delete" 
                      @click="deleteUser(user.id)" 
                      :disabled="user.id === userStore.currentUser?.id">
                Удалить
              </button>
            </div>
          </div>
        </div>
      </section>

      <div v-else class="empty-state">
        <p>Нет пользователей. Создайте первого пользователя.</p>
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
import CreateUserModal from '@/components/modal/adminPanel/CreateUserModal.vue';
import EditUserModal from '@/components/modal/adminPanel/EditUserModal.vue';

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

<style scoped>
.admin-panel-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-panel-container h1 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

/* Сводка (статистика) */
.summary-section {
  margin-bottom: 2rem;
}

.summary-section h2 {
  color: #555;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(30px);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 2rem;
  font-weight: bold;
}

/* Секция действий */
.actions-section {
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Секция пользователей */
.users-section {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(30px);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

.users-section h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.users-list {
  display: grid;
  gap: 1rem;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(30px);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.user-card:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.user-username {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
}

.user-email {
  font-size: 0.95rem;
  color: #666;
}

.user-roles {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
}

.user-actions {
  display: flex;
  gap: 0.75rem;
  margin-left: 1rem;
}

/* Стили кнопок */
.btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Кнопка создания (первичная) */
.btn-primary {
  background: #ffb547;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Кнопка редактирования */
.btn-edit {
  background: #4CAF50;
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.btn-edit:active:not(:disabled) {
  transform: translateY(0);
}

/* Кнопка удаления */
.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #da190b;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.btn-delete:active:not(:disabled) {
  transform: translateY(0);
}

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 1rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .admin-panel-container {
    padding: 1rem;
  }
  
  .admin-panel-container h1 {
    font-size: 1.8rem;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .user-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .user-actions {
    margin-left: 0;
    margin-top: 0;
    width: 100%;
    display: flex;
  }
  
  .user-actions .btn {
    flex: 1;
    text-align: center;
    justify-content: center;
  }
  
  .actions-section {
    justify-content: center;
  }
}

/* Дополнительно: для очень маленьких экранов */
@media (max-width: 480px) {
  .user-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .user-actions .btn {
    width: 100%;
  }
  
  .summary-card {
    padding: 1rem;
  }
  
  .summary-value {
    font-size: 1.5rem;
  }
}
</style>