<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-header">
        <h1 class="title">Cafe Schedule</h1>
        <p class="subtitle">Система составления и учёта рабочего времени</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="Логин"
            class="input-field"
            :class="{ 'input-error': errors.username }"
          />
          <p-message v-if="errors.username" severity="error" size="small" variant="simple">{{ errors.username }}</p-message>
        </div>

        <div class="form-group">
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Пароль"
            class="input-field"
            :class="{ 'input-error': errors.password }"
          />
          <p-message v-if="errors.password" severity="error" size="small" variant="simple">{{ errors.password }}</p-message>
        </div>

        <button
          type="submit"
          :disabled="userStore.isLoading"
          class="login-btn"
        >
          {{ userStore.isLoading ? 'Вход...' : 'Войти' }}
        </button>

        <a class="forgot-link" href="#" @click.prevent="showForgotHint">
          Забыли пароль?
        </a>
      </form>

      <p-message v-if="error" severity="error" size="small" variant="simple" style="margin-top: 1rem;">{{ error }}</p-message>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const error = ref('')
const errors = ref({})

onMounted(async () => {
  await userStore.init()
  if (userStore.isAuthenticated) {
    router.push('/')
  }
})

async function handleLogin() {
  error.value = ''
  errors.value = {}

  if (!username.value) {
    errors.value.username = 'Введите логин'
    return
  }
  if (!password.value) {
    errors.value.password = 'Введите пароль'
    return
  }

  try {
    await userStore.login({
      username: username.value,
      password: password.value
    })
    router.push('/')
  } catch (err) {
    console.error('Ошибка логина:', err)
    error.value = 'Неверный логин или пароль'
  }
}

function showForgotHint() {
  toast.add({ severity: 'info', summary: 'Восстановление пароля', detail: 'Напишите на почту админа admin@example.com', life: 5000 })
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--color-canvas-parchment);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
}

.card-header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 600;
  line-height: 1.47;
  letter-spacing: -0.374px;
  color: var(--color-ink);
}

.subtitle {
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.374px;
  color: var(--color-ink-muted-48);
  margin-top: 8px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--rounded-sm);
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.374px;
  color: var(--color-ink);
  background: var(--color-canvas);
  transition: border-color 0.2s;
  box-sizing: border-box;
  outline: none;
}

.input-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.12);
}

.input-field::placeholder {
  color: var(--color-ink-muted-48);
}

.input-error {
  border-color: #ff3b30;
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.12);
}

.login-btn {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: var(--rounded-pill);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.374px;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.login-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.forgot-link {
  text-align: center;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.224px;
  text-decoration: none;
  margin-top: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.forgot-link:hover {
  opacity: 0.7;
}

@media (max-width: 600px) {
  .login-card {
    padding: 32px 24px;
  }

  .title {
    font-size: 28px;
  }
}
</style>
