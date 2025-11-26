<template>
  <div class="login-container">
    <h1>Вход в систему</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">Логин:</label>
        <input
          id="username"
          v-model="username"
          type="text"
          placeholder="Введите логин"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Пароль:</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Введите пароль"
          required
        />
      </div>
      <button type="submit" :disabled="userStore.isLoading">
        {{ userStore.isLoading ? 'Вход...' : 'Войти' }}
      </button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const error = ref('')

// Если уже авторизован — redirect на главную
onMounted(async () => {
  await userStore.init()
  if (userStore.isAuthenticated) {
    router.push('/')
  }
})

async function handleLogin() {
  error.value = ''
  try {
    await userStore.login({
      username: username.value,
      password: password.value
    })
    router.push('/') // Redirect на главную после успеха
  } catch (err) {
    console.error('Ошибка логина:', err)
    error.value = 'Неверный логин или пароль'
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  margin-top: 1rem;
}
</style>