import { ref } from 'vue'

const isDarkMode = ref(document.documentElement.classList.contains('my-app-dark'))

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('my-app-dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

export function useDarkMode() {
  return { isDarkMode }
}
