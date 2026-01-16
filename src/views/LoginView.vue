<template>
  <div class="login-container">
    <!-- Контейнер для падающих батонов -->
    <canvas ref="canvas" class="falling-batons-canvas"></canvas>
    
    <div class="login-card">
      <h1 class="title">Вход в систему</h1>
      <p class="subtitle">Система составления и учета рабочего времени</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Логин:</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Введите логин"
            required
            class="form-input"
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
            class="form-input"
          />
        </div>
        
        <button type="submit" :disabled="userStore.isLoading" class="login-btn">
          {{ userStore.isLoading ? 'Вход...' : 'Войти' }}
        </button>
        <a class="subtitle" href="#" onclick="alert('Напишите на почту админа admin@example.com')">Забыли пароль?</a> 
      </form>
      
      <p v-if="error" class="error-message">{{ error }}</p>
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
const canvas = ref(null)

let animationId = null
let batons = []
let batonImages = []

// Настройки размера батонов
const BATON_MIN_SIZE = 60 // Минимальная ширина батона в пикселях
const BATON_MAX_SIZE = 160 // Максимальная ширина батона в пикселях

class Baton {
  constructor(canvasWidth, canvasHeight, images) {
    // Позиция
    this.x = Math.random() * canvasWidth
    this.y = -50 - Math.random() * 100 // Начинаем выше экрана
    
    // Физика
    this.speedY = Math.random() * 2 + 1 // Скорость падения: 2-4 px/frame
    this.rotation = Math.random() * Math.PI * 2 // Начальный угол
    this.rotationSpeed = (Math.random() - 0.2) * 0.1 // Скорость вращения
    
    // Размер с сохранением пропорций
    this.baseSize = Math.random() * (BATON_MAX_SIZE - BATON_MIN_SIZE) + BATON_MIN_SIZE
    
    // Выбираем случайное изображение
    this.image = images[Math.floor(Math.random() * images.length)]
    
    // Вычисляем размеры с учётом пропорций изображения
    if (this.image) {
      const aspectRatio = this.image.height / this.image.width
      this.width = this.baseSize
      this.height = this.baseSize * aspectRatio
    } else {
      // Если изображения нет, делаем квадрат
      this.width = this.baseSize
      this.height = this.baseSize
    }
    
    // Прозрачность
    this.opacity = 0
    this.maxOpacity = Math.random() * 0.3 + 0.5 // 0.5-0.8
    this.fadeIn = true
    
    // Максимальная высота
    this.maxHeight = canvasHeight
  }
  
  update() {
    // Падение
    this.y += this.speedY
    
    // Вращение
    this.rotation += this.rotationSpeed
    
    // Плавное появление и исчезновение
    if (this.fadeIn && this.opacity < this.maxOpacity) {
      this.opacity += 0.02
      if (this.opacity >= this.maxOpacity) {
        this.fadeIn = false
      }
    }
    
    // Начинаем исчезать когда приближаемся к низу
    if (this.y > this.maxHeight - 200) {
      this.opacity -= 0.01
    }
    
    // Проверяем, вышел ли батон за экран
    return this.y < this.maxHeight + 100 && this.opacity > 0
  }
  
  draw(ctx) {
    if (!this.image) return
    
    ctx.save()
    ctx.globalAlpha = this.opacity
    
    // Перемещаемся к центру батона
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)
    
    // Рисуем батон с правильными пропорциями (центрируем)
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
  
  // Устанавливаем размер canvas
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
  // Создаём простой батон на canvas как запасной вариант
  const fallbackCanvas = document.createElement('canvas')
  fallbackCanvas.width = 60
  fallbackCanvas.height = 60
  const ctx = fallbackCanvas.getContext('2d')
  
  // Рисуем простой батон (овал)
  ctx.fillStyle = '#d4a574'
  ctx.beginPath()
  ctx.ellipse(30, 30, 25, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // Добавляем тени для объёма
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
  const spawnInterval = 500 // Создаём новый батон каждые 500ms
  
  function animate(currentTime) {
    // Очищаем canvas
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
    
    // Создаём новые батоны
    if (currentTime - lastSpawnTime > spawnInterval) {
      batons.push(new Baton(canvasEl.width, canvasEl.height, batonImages))
      lastSpawnTime = currentTime
    }
    
    // Обновляем и рисуем батоны
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
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
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
  background: fff0ab;
  backdrop-filter: blur(30px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  z-index: 2;
  position: relative;
}

.title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #000000;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1rem;
  color: #424242;
  text-align: center;
  margin-bottom: 2rem;
  margin-top: 5px;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.25rem;
}

label {
  font-size: 0.9rem;
  color: #000000;
  margin-bottom: 0.5rem;
  font-weight: 500;
  display: block;
}

.form-input {
  width: 100%;
  padding: 0.85rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s, background-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.6);
  background-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.2);
}

.login-btn {
  padding: 0.85rem;
  background-color: #ffe15b;
  color: rgb(0, 0, 0);
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.login-btn:hover:not(:disabled) {
  background-color: #ffda36;
  transform: scale(1.02);
}

.login-btn:disabled {
  background-color: #a0c4ff;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
</style>