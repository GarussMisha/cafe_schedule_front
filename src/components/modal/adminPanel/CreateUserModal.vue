<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Создать пользователя</h3>
        <button @click="closeModal" class="modal-close-btn" type="button">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group" :class="{ 'has-error': usernameError }">
          <label for="username">Логин</label>
          <input id="username" v-model="newUser.username" @input="usernameError = ''" placeholder="Введите логин" />
          <span v-if="usernameError" class="field-error">{{ usernameError }}</span>
        </div>

        <div class="form-group" :class="{ 'has-error': emailError }">
          <label for="email">Email</label>
          <input id="email" type="text" v-model="newUser.email" @input="emailError = ''" placeholder="example@mail.com" />
          <span v-if="emailError" class="field-error">{{ emailError }}</span>
        </div>

        <div class="form-group" :class="{ 'has-error': passwordError }">
          <label for="password">Пароль</label>
          <input id="password" type="password" v-model="newUser.password" @input="passwordError = ''" placeholder="••••••••" />
          <span v-if="passwordError" class="field-error">{{ passwordError }}</span>
        </div>

        <div class="form-group">
          <label for="firstName">Имя</label>
          <input id="firstName" type="text" v-model="newUser.firstName" placeholder="Иван" />
        </div>

        <div class="form-group">
          <label for="lastName">Фамилия</label>
          <input id="lastName" type="text" v-model="newUser.lastName" placeholder="Иванов" />
        </div>

        <div class="form-group">
          <label for="position">Должность</label>
          <input id="position" type="text" v-model="newUser.position" placeholder="Пекарь" />
        </div>

        <div class="form-group">
          <label for="roles">Роль</label>
          <select id="roles" v-model="newUser.roles">
            <option value="" disabled>Выберите роль</option>
            <option v-for="role in roleOptions" :key="role.value" :value="role.value">
              {{ role.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="createUser" class="btn-primary" type="button" :disabled="isSubmitting">
          {{ isSubmitting ? 'Создание...' : 'Создать пользователя' }}
        </button>
        <button @click="closeModal" class="btn-secondary" type="button">
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { useToast } from 'primevue/usetoast'

const toast = useToast()
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
const isSubmitting = ref(false)
const emailError = ref('')
const usernameError = ref('')
const passwordError = ref('')

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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

  function resetForm() {
  newUser.value = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    position: '',
    roles: ''
  }
  emailError.value = ''
  usernameError.value = ''
  passwordError.value = ''
}

async function createUser() {
  if (isSubmitting.value) return
  if (!newUser.value.roles) {
    toast.add({ severity: 'warn', summary: 'Внимание', detail: 'Выберите роль!', life: 3000 })
    return
  }
  if (!newUser.value.username || newUser.value.username.length < 3 || newUser.value.username.length > 20) {
    usernameError.value = 'Логин должен быть от 3 до 20 символов'
    return
  }
  if (!isValidEmail(newUser.value.email)) {
    emailError.value = 'Введите корректный email (например, user@example.com)'
    return
  }
  if (!newUser.value.password || newUser.value.password.length < 6 || newUser.value.password.length > 40) {
    passwordError.value = 'Пароль должен быть от 6 до 40 символов'
    return
  }
  const userData = { ...newUser.value, roles: [newUser.value.roles] }

  isSubmitting.value = true
  try {
    await userStore.createUser_store(userData)
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Пользователь создан!', life: 3000 })
    resetForm()
    emit('success');
    emit('close');
  } catch (error) {
    console.error('E -> views/AdminPanel.vue -> Ошибка создания пользователя:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.message || error.response?.data || 'Ошибка создания пользователя', life: 5000 })
  } finally {
    isSubmitting.value = false
  }
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

.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: inherit;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
}

.form-group.has-error input {
  border-color: #e74c3c;
}

.form-group.has-error input:focus {
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.15);
}

.field-error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-primary {
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

.btn-primary:hover {
  background: #e68900;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
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
</style>
