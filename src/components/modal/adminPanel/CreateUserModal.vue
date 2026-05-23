<template>
    <main>
        <div v-if="isOpen" class="modal-overlay" :style="{ maxWidth: '500px' }">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Создать пользователя</h3>
                    <button @click="closeModal" class="modal-close-btn" type="button">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input id="username" v-model="newUser.username" placeholder="..." />
                </div>

                <div class="form-group">
                    <label for="email">Email:</label>
                    <input id="email" type="text" v-model="newUser.email" />
                </div>

                <div class="form-group">
                    <label for="password">Password:</label>
                    <input id="password" type="password" v-model="newUser.password" />
                </div>

                <div class="form-group">
                    <label for="firstName">Имя:</label>
                    <input id="firstName" type="text" v-model="newUser.firstName" />
                </div>

                <div class="form-group">
                    <label for="lastName">Фамилия:</label>
                    <input id="lastName" type="text" v-model="newUser.lastName" />
                </div>

                <div class="form-group">
                    <label for="position">Должность:</label>
                    <input id="position" type="text" v-model="newUser.position" />
                </div>

                <div class="form-group">
                    <label for="roles">Роль:</label>
                    <select id="roles" v-model="newUser.roles">
                        <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                            {{ role.label }}
                        </option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button @click="createUser" class="btn-create" type="button">
                        Создать пользователя
                    </button>
                    <button @click="closeModal" class="btn-close" type="button">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const newUser = ref({
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  position: '',
  roles: ''
});

const roleOptions = [
  { label: 'USER_ADMIN', value: 'USER_ADMIN' },
  { label: 'CAFE_ADMIN', value: 'CAFE_ADMIN' },
  { label: 'STAFF', value: 'STAFF' }
];

const emit = defineEmits(['close', 'success']);

const props = defineProps({
  isOpen: {
    type: Boolean
  }
});

const internalVisible = ref(false);

watch(() => props.isOpen, (val) => {
  internalVisible.value = val;
});

watch(internalVisible, (val) => {
  if (!val) {
    emit('close');
  }
});

function closeModal() {
  internalVisible.value = false;
  emit('close');
}

async function createUser() {
  if (!newUser.value.roles) {
    alert('Выберите роль!')
    return
  }
  const userData = { ...newUser.value, roles: [newUser.value.roles] }
  
  try {
    await userStore.createUser_store(userData)
    newUser.value = {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      position: '',
      roles: ''
    }
    emit('success');
    emit('close');
  } catch (error) {
    console.error('E -> views/AdminPanel.vue -> Ошибка создания пользователя:', error)
    alert(error.response?.data || 'Ошибка создания пользователя')
  }
}



</script>

<style scoped>
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

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.btn-create {
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
