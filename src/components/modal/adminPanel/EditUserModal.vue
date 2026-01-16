<template>
    <main>
        <!-- Форма редактирования пользователя (только для USER_ADMIN) -->
        <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-content">
                <h3>Редактировать пользователя</h3>
                
                <div v-if="user" class="edit-form">
                    <h4>Редактирование: {{ user.username }}</h4>

                    <div class="form-group">
                        <label for="editUsername">Username:</label>
                        <input id="editUsername" v-model="editUserData.username"/>
                    </div>

                    <div class="form-group">
                        <label for="editEmail">Email:</label>
                        <input id="editEmail" type="email" v-model="editUserData.email"/>
                    </div>

                    <div class="form-group">
                        <label for="editFirstName">Имя:</label>
                        <input id="editFirstName" type="text" v-model="editUserData.firstName"/>
                    </div>

                    <div class="form-group">
                        <label for="editLastName">Фамилия:</label>
                        <input id="editLastName" type="text" v-model="editUserData.lastName"/>
                    </div>

                    <div class="form-group">
                        <label for="editPosition">Должность:</label>
                        <input id="editPosition" type="text" v-model="editUserData.position"/>
                    </div>

                    <div class="form-group">
                        <label for="editRoles">Роль:</label>
                        <select id="editRoles" v-model="editUserData.roles" multiple>
                            <option value="STAFF">STAFF</option>
                            <option value="CAFE_ADMIN">CAFE_ADMIN</option>
                            <option value="USER_ADMIN">USER_ADMIN</option>
                        </select>
                        <small>Для выбора нескольких ролей: Ctrl+Click</small>
                    </div>

                    <div class="modal-actions">
                        <button @click="updateUser">Обновить пользователя</button>
                        <button @click="$emit('close')">Закрыть</button>
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

// 🔥 ОБЪЯВИТЕ PROPS И СОХРАНИТЕ В ПЕРЕМЕННУЮ
const props = defineProps({
  isOpen: Boolean,
  user: Object // Пользователь передается из родителя
});

// Данные для редактирования
const editUserData = ref({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  position: '',
  roles: []
});

// 🔥 ЗАПОЛНЯЕМ ФОРМУ ПРИ ОТКРЫТИИ МОДАЛКИ ИЛИ ИЗМЕНЕНИИ ПОЛЬЗОВАТЕЛЯ
watch(() => props.user, (newUser) => {
  if (newUser) {
    editUserData.value = {
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName || '',
      lastName: newUser.lastName || '',
      position: newUser.position || '',
      roles: [...(newUser.roles || [])] // Копируем массив ролей
    }
  }
}, { immediate: true });

async function updateUser() {
  // 🔥 ИСПОЛЬЗУЙТЕ props.user
  if (!props.user) {
    alert('Пользователь не выбран')
    return
  }

  try {
    // 🔥 ИСПОЛЬЗУЙТЕ props.user.id
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

/* Форма редактирования */
.edit-form h4 {
  color: #667eea;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
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

.form-group select {
  cursor: pointer;
  background-color: #f9f9f9;
}

.form-group select:hover {
  border-color: #bbb;
}

.form-group select[multiple] {
  min-height: 100px;
  padding: 0.5rem;
}

.form-group select[multiple] option {
  padding: 0.5rem;
}

.form-group small {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.3rem;
  font-style: italic;
}

/* Кнопки модального окна */
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.modal-actions button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.modal-actions button:first-child {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-actions button:first-child:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.modal-actions button:last-child {
  background: #e0e0e0;
  color: #333;
}

.modal-actions button:last-child:hover {
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

  .edit-form h4 {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .modal-actions {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
  }

  .modal-actions button {
    width: 100%;
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