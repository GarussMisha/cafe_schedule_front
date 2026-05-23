<template>
    <main>
        <div v-if="isOpen" class="modal-overlay" :style="{ maxWidth: '500px' }">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Редактировать пользователя</h3>
                    <button @click="closeModal" class="modal-close-btn" type="button">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div v-if="user" class="edit-form">
                    <h4>Редактирование: {{ user.username }}</h4>

                    <div class="form-group">
                        <label for="editUsername">Username:</label>
                        <input id="editUsername" v-model="editUserData.username" />
                    </div>

                    <div class="form-group">
                        <label for="editEmail">Email:</label>
                        <input id="editEmail" type="email" v-model="editUserData.email" />
                    </div>

                    <div class="form-group">
                        <label for="editFirstName">Имя:</label>
                        <input id="editFirstName" type="text" v-model="editUserData.firstName" />
                    </div>

                    <div class="form-group">
                        <label for="editLastName">Фамилия:</label>
                        <input id="editLastName" type="text" v-model="editUserData.lastName" />
                    </div>

                    <div class="form-group">
                        <label for="editPosition">Должность:</label>
                        <input id="editPosition" type="text" v-model="editUserData.position" />
                    </div>

                    <div class="form-group">
                        <label for="editRoles">Роль:</label>
                        <select id="editRoles" v-model="editUserData.roles" multiple>
                            <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                                {{ role.label }}
                            </option>
                        </select>
                        <small>Для выбора нескольких ролей: используйте Ctrl+Click</small>
                    </div>

                    <div class="modal-actions">
                        <button @click="updateUser" class="btn-update" type="button">
                            Обновить пользователя
                        </button>
                        <button @click="closeModal" class="btn-close" type="button">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const emit = defineEmits(['close', 'success']);

const props = defineProps({
  isOpen: Boolean,
  user: Object
});

const editUserData = ref({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  position: '',
  roles: []
});

const roleOptions = [
  { label: 'STAFF', value: 'STAFF' },
  { label: 'CAFE_ADMIN', value: 'CAFE_ADMIN' },
  { label: 'USER_ADMIN', value: 'USER_ADMIN' }
];

const internalVisible = ref(false);

watch(() => props.isOpen, (val) => {
  internalVisible.value = val;
});

watch(internalVisible, (val) => {
  if (!val) {
    emit('close');
  }
});

watch(() => props.user, (newUser) => {
  if (newUser) {
    editUserData.value = {
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName || '',
      lastName: newUser.lastName || '',
      position: newUser.position || '',
      roles: [...(newUser.roles || [])]
    }
  }
}, { immediate: true });

function closeModal() {
  internalVisible.value = false;
  emit('close');
}

async function updateUser() {
  if (!props.user) {
    alert('Пользователь не выбран')
    return
  }

  try {
    await userStore.updatedUser_store(props.user.id, editUserData.value)
    alert('Пользователь успешно обновлен!')
    emit('success')
    emit('close')
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error)
    alert(error.response?.data || 'Ошибка обновления пользователя')
  }
}
</script>

<style scoped>
.edit-form h4 {
  color: #667eea;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  color: #555;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-group .p-inputtext,
.form-group .p-dropdown {
  width: 100%;
}

.form-group small {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.3rem;
  font-style: italic;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.btn-update {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-close {
  flex: 1;
  background: #e0e0e0;
  color: #333;
}
</style>
