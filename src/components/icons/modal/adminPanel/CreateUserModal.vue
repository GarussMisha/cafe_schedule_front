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
                    <label for="firstName">FirstName:</label>
                    <input id="firstName" type="text" v-model="newUser.firstName"/>
                </div>

                <div class="form-group">
                    <label for="lastName">LastName:</label>
                    <input id="lastName" type="text" v-model="newUser.lastName"/>
                </div>

                <div class="form-group">
                    <label for="position">Position:</label>
                    <input id="position" type="text" v-model="newUser.position"/>
                </div>

                <div class="form-group">
                    <label for="roles">Roles:</label>
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