<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Управление сотрудниками</h3>
        <button @click="close" class="modal-close-btn" type="button">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="section">
          <h4 class="section-title">Текущие сотрудники</h4>
          <div class="current-list">
            <div
              v-for="emp in currentEmployees"
              :key="emp.userId"
              class="current-item"
            >
              <div class="user-info">
                <span class="user-name">{{ emp.firstName }} {{ emp.lastName }}</span>
                <span class="user-position">{{ emp.position || '—' }}</span>
              </div>
              <button
                @click="removeEmployee(emp.userId)"
                class="remove-btn"
                type="button"
                title="Удалить из расписания"
              >
                <i class="pi pi-trash"></i>
              </button>
            </div>
            <div v-if="currentEmployees.length === 0" class="no-items">
              Нет сотрудников в расписании
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section">
          <h4 class="section-title">Добавить сотрудников</h4>
          <div class="search-bar">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск..."
              class="search-input"
            />
          </div>
          <div class="add-list">
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              class="add-item"
              @click="toggleUser(user)"
            >
              <input
                type="checkbox"
                :checked="isSelected(user.id)"
                class="user-checkbox"
                @click.stop
                @change="toggleUser(user)"
              />
              <div class="user-info">
                <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                <span class="user-position">{{ user.position || '—' }}</span>
              </div>
            </div>
            <div v-if="filteredUsers.length === 0" class="no-items">
              Нет доступных сотрудников для добавления
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="addSelected" class="btn-add" type="button" :disabled="selectedUserIds.length === 0">
          Добавить ({{ selectedUserIds.length }})
        </button>
        <button @click="close" class="btn-close" type="button">
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  users: {
    type: Array,
    default: () => []
  },
  currentEmployees: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'add', 'remove'])

const searchQuery = ref('')
const selectedUserIds = ref([])

const filteredUsers = computed(() => {
  if (!searchQuery.value) return props.users
  const q = searchQuery.value.toLowerCase()
  return props.users.filter(u =>
    u.firstName?.toLowerCase().includes(q) ||
    u.lastName?.toLowerCase().includes(q) ||
    u.position?.toLowerCase().includes(q)
  )
})

function isSelected(userId) {
  return selectedUserIds.value.includes(userId)
}

function toggleUser(user) {
  const idx = selectedUserIds.value.indexOf(user.id)
  if (idx === -1) {
    selectedUserIds.value.push(user.id)
  } else {
    selectedUserIds.value.splice(idx, 1)
  }
}

function removeEmployee(userId) {
  emit('remove', userId)
}

function reset() {
  searchQuery.value = ''
  selectedUserIds.value = []
}

function close() {
  reset()
  emit('close')
}

function addSelected() {
  const selected = props.users.filter(u => selectedUserIds.value.includes(u.id))
  emit('add', selected)
  reset()
}
</script>

<style scoped>
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
  z-index: 10000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1a1a1a;
}

.modal-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #999;
  padding: 4px;
  border-radius: 4px;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.modal-body {
  padding: 12px 24px;
  overflow-y: auto;
  flex: 1;
}

.section {
  margin-bottom: 8px;
}

.section-title {
  margin: 8px 0;
  font-size: 13px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.current-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.current-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f9f9f9;
}

.current-item .user-info {
  flex: 1;
  min-width: 0;
}

.current-item .user-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.remove-btn {
  flex-shrink: 0;
  background: transparent;
  color: #ff4444;
  border: 1.5px solid #ff4444;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  padding: 6px 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-btn:hover {
  background: rgba(255, 68, 68, 0.1);
  color: #cc0000;
  border-color: #cc0000;
}

.divider {
  height: 1px;
  background: #e8e8e8;
  margin: 12px 0;
}

.search-bar {
  margin-bottom: 8px;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
}

.add-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.add-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-item:hover {
  background: #f5f5f5;
}

.user-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #ff9800;
  cursor: pointer;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
}

.user-position {
  font-size: 12px;
  color: #999;
}

.no-items {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-add {
  flex: 1;
  padding: 10px 20px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #e68900;
}

.btn-add:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-close {
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

.btn-close:hover {
  background: rgba(0, 0, 0, 0.03);
  color: #666;
  border-color: #ccc;
}
</style>
