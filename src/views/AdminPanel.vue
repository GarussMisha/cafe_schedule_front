<template>
  <main class="admin-panel-container">
    <h1>Панель администратора</h1>

    <div v-if="isUserAdmin" class="admin-panel">
      <div class="summary-section">
        <div class="stat-card">
          <div class="stat-value">{{ allUsers.length }}</div>
          <div class="stat-label">Всего сотрудников</div>
        </div>
      </div>

      <div class="columns">
        <div class="column">
          <div class="column-header">
            <button class="action-btn create-user-btn" @click="showCreateModal = true" type="button">
              <i class="pi pi-user-plus"></i> Создать пользователя
            </button>
          </div>

          <div class="content-card">
            <div class="card-header">
              <h2>Сотрудники</h2>
              <span class="card-badge">{{ allUsers.length }}</span>
            </div>

            <template v-if="userStore.isLoading">
              <Skeleton width="100%" height="72px" borderRadius="12px" class="skeleton-mb" v-for="i in 3" :key="'u'+i" />
            </template>

            <template v-else-if="allUsers.length > 0">
              <div class="list-items">
                <div v-for="user in allUsers" :key="user.id" class="list-item">
                  <div class="item-info">
                    <div class="item-name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="item-sub">
                      <span class="item-detail">@{{ user.username }}</span>
                      <span class="item-detail-sep">·</span>
                      <span class="item-detail">{{ user.position || '—' }}</span>
                    </div>
                    <div class="item-tags">
                      <span v-for="role in user.roles" :key="role" class="role-tag" :class="'role-' + role">
                        {{ role }}
                      </span>
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="item-btn item-btn-edit" @click="openEditModal(user)" type="button">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="item-btn item-btn-delete"
                            @click="confirmDeleteUser(user)"
                            :disabled="user.id === userStore.currentUser?.id"
                            type="button">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="empty-state">
              <div class="empty-state-icon">👥</div>
              <div class="empty-state-title">Нет сотрудников</div>
              <div class="empty-state-desc">Создайте первого пользователя</div>
            </div>
          </div>
        </div>

        <div class="column">
          <div class="column-header">
            <button class="action-btn create-cafe-btn" @click="showCreateCafeModal = true" type="button">
              <i class="pi pi-building"></i> Создать кафе
            </button>
          </div>

          <div class="content-card">
            <div class="card-header">
              <h2>Кафе</h2>
              <span class="card-badge">{{ cafes.length }}</span>
            </div>

            <template v-if="cafesLoading">
              <Skeleton width="100%" height="72px" borderRadius="12px" class="skeleton-mb" v-for="i in 3" :key="'c'+i" />
            </template>

            <template v-else-if="cafes.length > 0">
              <div class="list-items">
                <div v-for="cafe in cafes" :key="cafe.id" class="list-item">
                  <div class="item-info">
                    <div class="item-name">{{ cafe.name }}</div>
                    <div class="item-sub">
                      <span class="item-detail" v-if="cafe.address">{{ cafe.address }}</span>
                      <span class="item-detail-sep" v-if="cafe.address && cafe.phone">·</span>
                      <span class="item-detail" v-if="cafe.phone">{{ cafe.phone }}</span>
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="item-btn item-btn-edit" @click="openEditCafeModal(cafe)" type="button">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="item-btn item-btn-delete" @click="confirmDeleteCafe(cafe)" type="button">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="empty-state">
              <div class="empty-state-icon">🏪</div>
              <div class="empty-state-title">Нет кафе</div>
              <div class="empty-state-desc">Создайте первое кафе</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">🔒</div>
      <div class="empty-state-title">Доступ запрещён</div>
      <div class="empty-state-desc">Только администратор может управлять пользователями и кафе</div>
    </div>

    <CreateUserModal :is-open="showCreateModal"
                      @close="showCreateModal = false"
                      @success="handleUserUpdated" />

    <EditUserModal :is-open="showEditModal"
                    :user="selectedUser"
                    @close="showEditModal = false"
                    @success="handleUserUpdated" />

    <CreateCafeModal :is-open="showCreateCafeModal"
                      @close="showCreateCafeModal = false"
                      @success="handleCafeUpdated" />

    <EditCafeModal :is-open="showEditCafeModal"
                    :cafe="selectedCafe"
                    @close="showEditCafeModal = false"
                    @success="handleCafeUpdated" />

    <div v-if="showConfirmModal" class="modal-overlay" @click.self="closeConfirmModal">
      <div class="confirm-modal">
        <div class="confirm-modal-header">
          <h3>Подтверждение удаления</h3>
        </div>
        <div class="confirm-modal-body">
          <p>{{ confirmMessage }}</p>
        </div>
        <div class="confirm-modal-actions">
          <button class="btn-danger" @click="executeConfirm" type="button">Удалить</button>
          <button class="btn-secondary" @click="closeConfirmModal" type="button">Отмена</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useUserStore } from '@/stores/user';
import { useToast } from 'primevue/usetoast'
import Skeleton from 'primevue/skeleton'
import { getAllCafes, deleteCafe } from '@/api/cafe'
import CreateUserModal from '@/components/modal/adminPanel/CreateUserModal.vue';
import EditUserModal from '@/components/modal/adminPanel/EditUserModal.vue';
import CreateCafeModal from '@/components/modal/adminPanel/CreateCafeModal.vue';
import EditCafeModal from '@/components/modal/adminPanel/EditCafeModal.vue';

const toast = useToast()
const userStore = useUserStore();
const allUsers = ref([])

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedUser = ref(null)

const showCreateCafeModal = ref(false)
const showEditCafeModal = ref(false)
const selectedCafe = ref(null)
const cafes = ref([])
const cafesLoading = ref(false)

const isUserAdmin = computed(() => userStore.isAdmin)

const showConfirmModal = ref(false)
const confirmMessage = ref('')
let confirmCallback = null

function openConfirmModal(message, callback) {
  confirmMessage.value = message
  confirmCallback = callback
  showConfirmModal.value = true
}

function closeConfirmModal() {
  showConfirmModal.value = false
  confirmMessage.value = ''
  confirmCallback = null
}

function executeConfirm() {
  if (confirmCallback) {
    confirmCallback()
  }
  closeConfirmModal()
}

function handleKeydown(event) {
  if (event.key === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey && !showCreateModal.value && !showEditModal.value) {
    showCreateModal.value = true
  }
  if (event.key === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey && !showCreateCafeModal.value && !showEditCafeModal.value) {
    showCreateCafeModal.value = true
  }
  if (event.key === 'Escape') {
    showCreateModal.value = false
    showEditModal.value = false
    showCreateCafeModal.value = false
    showEditCafeModal.value = false
  }
}

onMounted(async () => {
  await userStore.init()
  await loadUsers()
  await loadCafes()
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
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

function confirmDeleteUser(user) {
  const name = `${user.firstName} ${user.lastName}`.trim() || user.username
  openConfirmModal(`Вы уверены, что хотите удалить пользователя «${name}»? Связанное расписание будет удалено.`, () => executeDeleteUser(user.id))
}

async function executeDeleteUser(userId) {
  try {
    await userStore.deleteUser_store(userId)
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Пользователь удалён', life: 3000 })
    await loadUsers()
  } catch (error) {
    console.error('E -> views/AdminPanel.vue -> Ошибка удаления пользователя:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.message || 'Ошибка удаления пользователя', life: 5000 })
  }
}

function handleCafeUpdated() {
  loadCafes()
  showEditCafeModal.value = false
}

function openEditCafeModal(cafe) {
  selectedCafe.value = cafe
  showEditCafeModal.value = true
}

async function loadCafes() {
  cafesLoading.value = true
  try {
    const data = await getAllCafes()
    cafes.value = data
  } catch (error) {
    console.error('E -> views/AdminPanel.vue -> Ошибка загрузки кафе:', error)
  } finally {
    cafesLoading.value = false
  }
}

function confirmDeleteCafe(cafe) {
  openConfirmModal(`Вы уверены, что хотите удалить кафе «${cafe.name}»? Связанное расписание будет удалено.`, () => executeDeleteCafe(cafe.id))
}

async function executeDeleteCafe(cafeId) {
  try {
    await deleteCafe(cafeId)
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Кафе удалено', life: 3000 })
    await loadCafes()
  } catch (error) {
    console.error('E -> views/AdminPanel.vue -> Ошибка удаления кафе:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.message || 'Ошибка удаления кафе', life: 5000 })
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
  color: #1a1a1a;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  font-weight: 700;
}

.summary-section {
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  text-align: center;
  border-top: 3px solid #ff9800;
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 700;
  color: #ff9800;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-header {
  display: flex;
  justify-content: flex-start;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: 1.5px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
  background: transparent;
}

.create-user-btn {
  color: #ff9800;
  border-color: #ff9800;
}

.create-user-btn:hover {
  background: rgba(255, 152, 0, 0.1);
  color: #e68900;
  border-color: #e68900;
}

.create-cafe-btn {
  color: #4CAF50;
  border-color: #4CAF50;
}

.create-cafe-btn:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #3b9a41;
  border-color: #3b9a41;
}

.content-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.card-badge {
  background: #f5f5f5;
  color: #666;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 16px;
  transition: background 0.2s;
}

.list-item:hover {
  background: #f0f0f0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  font-size: 15px;
  color: #2c3e50;
}

.item-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #888;
  flex-wrap: wrap;
}

.item-detail-sep {
  color: #ccc;
}

.item-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.role-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.03em;
}

.role-USER_ADMIN {
  background: rgba(255, 152, 0, 0.12);
  color: #e68900;
}

.role-CAFE_ADMIN {
  background: rgba(33, 150, 243, 0.12);
  color: #1976D2;
}

.role-STAFF {
  background: rgba(76, 175, 80, 0.12);
  color: #3b9a41;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 700;
  color: #666;
  margin-bottom: 6px;
}

.empty-state-desc {
  font-size: 14px;
  color: #999;
  line-height: 1.5;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
  flex-shrink: 0;
}

.item-btn {
  width: 36px;
  height: 36px;
  border: 1.5px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: transparent;
}

.item-btn-edit {
  color: #ff9800;
  border-color: #ff9800;
}

.item-btn-edit:hover {
  background: rgba(255, 152, 0, 0.1);
  color: #e68900;
  border-color: #e68900;
}

.item-btn-delete {
  color: #ff4444;
  border-color: #ff4444;
}

.item-btn-delete:hover {
  background: rgba(255, 68, 68, 0.1);
  color: #cc0000;
  border-color: #cc0000;
}

.item-btn-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
}

.confirm-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.confirm-modal-header {
  padding: 20px 24px 0;
}

.confirm-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1a1a1a;
}

.confirm-modal-body {
  padding: 16px 24px;
}

.confirm-modal-body p {
  margin: 0;
  color: #555;
  font-size: 15px;
  line-height: 1.5;
}

.confirm-modal-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 20px;
}

.btn-danger {
  flex: 1;
  padding: 10px 20px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #cc0000;
}

.btn-secondary {
  flex: 1;
  padding: 10px 20px;
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.03);
  color: #666;
  border-color: #ccc;
}

.skeleton-mb {
  margin-bottom: 12px;
}

@media (max-width: 1000px) {
  .columns {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .column-header {
    justify-content: center;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .admin-panel-container {
    padding: 1rem;
  }

  .admin-panel-container h1 {
    font-size: 1.4rem;
  }

  .list-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .item-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .stat-value {
    font-size: 1.8rem;
  }

  .content-card {
    padding: 16px;
  }

  .column {
    gap: 8px;
  }
}
</style>
