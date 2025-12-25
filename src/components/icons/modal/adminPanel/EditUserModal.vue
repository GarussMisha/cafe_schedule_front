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
                        <label for="editFirstName">FirstName:</label>
                        <input id="editFirstName" type="text" v-model="editUserData.firstName"/>
                    </div>

                    <div class="form-group">
                        <label for="editLastName">LastName:</label>
                        <input id="editLastName" type="text" v-model="editUserData.lastName"/>
                    </div>

                    <div class="form-group">
                        <label for="editPosition">Position:</label>
                        <input id="editPosition" type="text" v-model="editUserData.position"/>
                    </div>

                    <div class="form-group">
                        <label for="editRoles">Roles:</label>
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
