<template>
  <Toast position="top-right" />
  <Headbar v-if="!isLoginPage" :key="route.path" />
  <RouterView />
</template>

<script setup>
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from 'primevue/usetoast'
import { onToast } from '@/utils/toast'
import Headbar from '@/components/Headbar.vue'

const toast = useToast()
const userStore = useUserStore()
const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')

let unsubToast = null

onMounted(() => {
  userStore.init()
  unsubToast = onToast((options) => {
    toast.add(options)
  })
  const saved = localStorage.getItem('darkMode')
  if (saved === 'true') {
    document.documentElement.classList.add('my-app-dark')
  }
})

onBeforeUnmount(() => {
  if (unsubToast) unsubToast()
})
</script>

<style>
:root {
  --color-primary: #0066cc;
  --color-primary-focus: #0071e3;
  --color-primary-on-dark: #2997ff;
  --color-ink: #1d1d1f;
  --color-body: #1d1d1f;
  --color-body-on-dark: #ffffff;
  --color-body-muted: #cccccc;
  --color-ink-muted-80: #333333;
  --color-ink-muted-48: #7a7a7a;
  --color-divider-soft: #f0f0f0;
  --color-hairline: #e0e0e0;
  --color-canvas: #ffffff;
  --color-canvas-parchment: #f5f5f7;
  --color-surface-pearl: #fafafc;
  --color-surface-tile-1: #272729;
  --color-surface-tile-2: #2a2a2c;
  --color-surface-tile-3: #252527;
  --color-surface-black: #000000;
  --color-on-primary: #ffffff;
  --color-on-dark: #ffffff;

  --font-display: 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;

  --rounded-sm: 8px;
  --rounded-md: 11px;
  --rounded-lg: 18px;
  --rounded-pill: 9999px;

  --shadow-product: rgba(0, 0, 0, 0.22) 3px 5px 30px;
}

body {
  background: var(--color-canvas-parchment);
  margin: 0;
  padding: 0;
  min-height: 100vh;
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 17px;
  line-height: 1.47;
  letter-spacing: -0.374px;
  color: var(--color-body);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

* {
  box-sizing: border-box;
}

.my-app-dark {
  --color-canvas-parchment: #1d1d1f;
  --color-canvas: #2a2a2c;
  --color-ink: #f5f5f7;
  --color-body: #f5f5f7;
  --color-surface-pearl: #333333;
  --color-hairline: #444444;
  --color-divider-soft: #333333;
  --color-ink-muted-80: #cccccc;
  --color-ink-muted-48: #888888;
}

.my-app-dark body {
  background: var(--color-surface-tile-1) !important;
  color: var(--color-body-on-dark) !important;
}

@media print {
  .headbar, .view-controls, .approve-section, .status-legend, .month-controls-compact,
  .action-buttons, .edit-popover, .cafe-id-controls, .footer-decoration, .user-info,
  .schedule-statistics, .instructions-card, .feed-container, .welcome-card, .stats-row,
  .greeting-section, .btn-container, .login-prompt {
    display: none !important;
  }
  .schedule-grid-container, .schedule-table, .profile-container {
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
  }
  body {
    background: white !important;
  }
  .schedule-table-wrapper {
    overflow: visible !important;
  }
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.374px;
  color: var(--color-ink);
}

p {
  margin: 0;
}
</style>
