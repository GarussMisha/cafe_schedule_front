<template>
  <div class="login-page">
    <canvas ref="canvas" class="falling-batons-canvas"></canvas>
    
    <div class="login-card">
      <div class="card-header">
        <div class="logo-container">
          <i class="pi pi-user" style="font-size: 3rem; color: #ff9800;"></i>
        </div>
        <h1 class="title">Вход в систему</h1>
        <p class="subtitle">Система составления и учета рабочего времени</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-field">
          <p-float-label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="input-field"
              :class="{ 'input-error': errors.username }"
            />
            <label for="username">Логин</label>
          </p-float-label>
          <p-message v-if="errors.username" severity="error" size="small">{{ errors.username }}</p-message>
        </div>
        
        <div class="form-field">
          <p-float-label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="input-field"
              :class="{ 'input-error': errors.password }"
            />
            <label for="password">Пароль</label>
          </p-float-label>
          <p-message v-if="errors.password" severity="error" size="small">{{ errors.password }}</p-message>
        </div>
        
        <button
          type="submit"
          :disabled="userStore.isLoading"
          class="login-btn"
        >
          {{ userStore.isLoading ? 'Вход...' : 'Войти' }}
        </button>
        
        <a class="forgot-link" href="#" onclick="alert('Напишите на почту админа admin@example.com')">
          Забыли пароль?
        </a>
      </form>
      
      <p-message v-if="error" severity="error" style="margin-top: 1rem;" size="small">{{ error }}</p-message>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const error = ref('')
const errors = ref({})
const canvas = ref(null)

let animationId = null
let batons = []
let batonImages = []

const BATON_MIN_SIZE = 60
const BATON_MAX_SIZE = 160

class Baton {
  constructor(canvasWidth, canvasHeight, images) {
    this.x = Math.random() * canvasWidth
    this.y = -50 - Math.random() * 100
    this.speedY = Math.random() * 2 + 1
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.2) * 0.1
    this.baseSize = Math.random() * (BATON_MAX_SIZE - BATON_MIN_SIZE) + BATON_MIN_SIZE
    this.image = images[Math.floor(Math.random() * images.length)]
    if (this.image) {
      const aspectRatio = this.image.height / this.image.width
      this.width = this.baseSize
      this.height = this.baseSize * aspectRatio
    } else {
      this.width = this.baseSize
      this.height = this.baseSize
    }
    this.opacity = 0
    this.maxOpacity = Math.random() * 0.3 + 0.5
    this.fadeIn = true
    this.maxHeight = canvasHeight
  }
  
  update() {
    this.y += this.speedY
    this.rotation += this.rotationSpeed
    if (this.fadeIn && this.opacity < this.maxOpacity) {
      this.opacity += 0.02
      if (this.opacity >= this.maxOpacity) {
        this.fadeIn = false
      }
    }
    if (this.y > this.maxHeight - 200) {
      this.opacity -= 0.01
    }
    return this.y < this.maxHeight + 100 && this.opacity > 0
  }
  
  draw(ctx) {
    if (!this.image) return
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)
    ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}

onMounted(async () => {
  await userStore.init()
  if (userStore.isAuthenticated) {
    router.push('/')
    return
  }
  initCanvas()
  loadBatonImage()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

function initCanvas() {
  const canvasEl = canvas.value
  if (!canvasEl) return
  const resize = () => {
    canvasEl.width = window.innerWidth
    canvasEl.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)
  onUnmounted(() => {
    window.removeEventListener('resize', resize)
  })
}

function loadBatonImage() {
  const imagePaths = [
    '/src/assets/baton.png',
    '/src/assets/Cheesecake.png',
    '/src/assets/Croissant.png'
  ]
  let loadedImages = 0
  const totalImages = imagePaths.length
  imagePaths.forEach(path => {
    const img = new Image()
    img.src = path
    img.onload = () => {
      batonImages.push(img)
      loadedImages++
      if (loadedImages === totalImages) {
        startAnimation()
      }
    }
    img.onerror = () => {
      console.warn(`Не удалось загрузить изображение ${path}`)
      loadedImages++
      if (loadedImages === totalImages && batonImages.length === 0) {
        console.warn('Не удалось загрузить ни одно изображение, используем запасной вариант')
        createFallbackBaton()
        startAnimation()
      }
    }
  })
}

function createFallbackBaton() {
  const fallbackCanvas = document.createElement('canvas')
  fallbackCanvas.width = 60
  fallbackCanvas.height = 60
  const ctx = fallbackCanvas.getContext('2d')
  ctx.fillStyle = '#d4a574'
  ctx.beginPath()
  ctx.ellipse(30, 30, 25, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#c49563'
  ctx.beginPath()
  ctx.ellipse(30, 32, 20, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  batonImages.push(fallbackCanvas)
}

function startAnimation() {
  const canvasEl = canvas.value
  if (!canvasEl) return
  const ctx = canvasEl.getContext('2d')
  let lastSpawnTime = 0
  const spawnInterval = 500
  function animate(currentTime) {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
    if (currentTime - lastSpawnTime > spawnInterval) {
      batons.push(new Baton(canvasEl.width, canvasEl.height, batonImages))
      lastSpawnTime = currentTime
    }
    batons = batons.filter(baton => {
      const isAlive = baton.update()
      if (isAlive) {
        baton.draw(ctx)
      }
      return isAlive
    })
    animationId = requestAnimationFrame(animate)
  }
  animationId = requestAnimationFrame(animate)
}

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
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #fff4c4, #fff3c0, #fcefb9);
}

.falling-batons-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.login-card {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 3rem;
  width: 100%;
  max-width: 440px;
  z-index: 2;
  position: relative;
}

.card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-container {
  margin-bottom: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1rem;
  color: #666666;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-field {
  width: 100% !important;
  padding: 1rem !important;
  border: 2px solid #e0e0e0 !important;
  border-radius: 12px !important;
  font-size: 1rem !important;
  transition: all 0.3s ease !important;
  box-sizing: border-box !important;
  background: #ffffff !important;
  color: #1a1a1a !important;
}

.input-field:focus {
  outline: none !important;
  border-color: #ff9800 !important;
  box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1) !important;
}

.input-field::placeholder {
  color: #999999 !important;
}

.input-error {
  border-color: #e74c3c !important;
}

.input-error:focus {
  box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.1) !important;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  margin-top: 0.5rem;
  background: #ff9800;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  background: #e68900;
  transform: translateY(-1px);
}

.login-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.forgot-link {
  text-align: center;
  color: #ff9800;
  font-size: 0.95rem;
  text-decoration: none;
  margin-top: 0.5rem;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #e68900;
}

@media (max-width: 600px) {
  .login-card {
    padding: 2rem;
    margin: 1rem;
    border-radius: 20px;
  }
  
  .title {
    font-size: 1.75rem;
  }
}
</style>
