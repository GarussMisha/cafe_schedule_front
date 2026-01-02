import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ApminPanel from '../views/AdminPanel.vue'
import ScheduleView from '../views/ScheduleView.vue'
import ProfileView from '../views/ProfileView.vue'
import { isAuthenticated, getRole } from '@/api/auth.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { showHeadbar: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { showHeadbar: false },
    },
    {
      path: '/admin',
      name: 'adminPanel',
      component: ApminPanel,
      meta: { showHeadbar: true },
    },
    {
      path: '/schedule',
      name: 'ScheduleView',
      component: ScheduleView,
      meta: { showHeadbar: true },
    },
    {
      path: '/profile',
      name: 'ProfileView',
      component: ProfileView,
      meta: { showHeadbar: true },
    },

  ],
})

router.beforeEach((to, from, next) => {
  // Защищаем все роуты кроме /login
  if (to.path !== '/login' && !isAuthenticated()) {
    next('/login')
  } else if ((to.path == '/schedule' || to.path == '/profile') && getRole() == "USER_ADMIN") { 
      next('/')
      console.warn('Доступ запрещен: Ваша роль == USER_ADMIN. Для неё доспуп к расписанию закрыт.') 
  } else {
    next()
  }
})

export default router
