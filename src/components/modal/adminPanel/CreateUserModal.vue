<template>
    <main>
        <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
            <div class="modal-content">
            <!-- Форма создания пользователя (только для USER_ADMIN) -->
                <h3>Создать пользователя</h3>
                
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input id="username" v-model="newUser.username" placeholder="..."/>
                </div>

                <div class="form-group">
                    <label for="email">Email:</label>
                    <input id="email" type="text" v-model="newUser.email"/>
                </div>

                <div class="form-group">
                    <label for="password">Password:</label>
                    <input id="password" type="password" v-model="newUser.password"/>
                </div>

                <div class="form-group">
                    <label for="firstName">Имя:</label>
                    <input id="firstName" type="text" v-model="newUser.firstName"/>
                </div>

                <div class="form-group">
                    <label for="lastName">Фамилия:</label>
                    <input id="lastName" type="text" v-model="newUser.lastName"/>
                </div>

                <div class="form-group">
                    <label for="position">Должность:</label>
                    <input id="position" type="text" v-model="newUser.position"/>
                </div>

                <div class="form-group">
                    <label for="roles">Роль:</label>
                    <select id="roles" v-model="newUser.roles">
                    <option value="" disabled>Выберите роль</option>
                    <option value="USER_ADMIN">USER_ADMIN</option>
                    <option value="CAFE_ADMIN">CAFE_ADMIN</option>
                    <option value="STAFF">STAFF</option>
                    </select>
                </div>
                    <button @click="createUser">Создать пользователя</button>
                    <button @click="emit('close')">Закрыть</button>
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
const emit = defineEmits(['close', 'success']);

defineProps({
  isOpen: {
    type: Boolean
  }
});



async function createUser() {
  if (!newUser.value.roles) {
    alert('Выберите роль!')
    return
  }
  // ✅ Преобразуем string в array для API
  const userData = { ...newUser.value, roles: [newUser.value.roles] }
  
  try {
    await userStore.createUser_store(userData)
    // Reset формы
    newUser.value = {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      position: '',
      roles: ''
    }
    emit('success'); // Сообщаем родителю об успехе
    emit('close');   // Закрываем модалку
  } catch (error) {
    console.error('E -> views/AdminPanel.vue -> Ошибка создания пользователя:', error)
    alert(error.response?.data || 'Ошибка создания пользователя')
  }
}



</script>

<style scoped>
/* Оверлей модального окна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Контент модального окна */
.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-in-out;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content h3 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

/* Группы формы */
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

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background-color: #f9f9ff;
}

.form-group input {
  background-color: #f9f9f9;
}

.form-group input:hover {
  border-color: #bbb;
}

.form-group input::placeholder {
  color: #ccc;
}

.form-group select {
  cursor: pointer;
  background-color: #f9f9f9;
}

.form-group select:hover {
  border-color: #bbb;
}

/* Кнопки */
.modal-content button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  margin-top: 0.5rem;
  width: 100%;
}

.modal-content button:first-of-type {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.modal-content button:first-of-type:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.modal-content button:last-of-type {
  background: #e0e0e0;
  color: #333;
}

.modal-content button:last-of-type:hover {
  background: #d0d0d0;
}

/* Адаптивность для мобильных */
@media (max-width: 600px) {
  .modal-content {
    padding: 1.5rem;
    width: 95%;
    border-radius: 10px;
  }

  .modal-content h3 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .modal-content button {
    padding: 0.75rem 1rem;
  }
}

/* Скролл для очень длинных форм */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>