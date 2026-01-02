/**
 * @file API клиент для взаимодействия с бекендом пекарни
 * @version 1.0.0
 * @description 
 * - Создает экземпляр axios с базовыми настройками
 * - Добавляет автоматическую авторизацию через JWT токен
 * - Обрабатывает глобальные ошибки аутентификации и авторизации
 * - Перенаправляет на страницу логина при истечении токена
 * 
 * @example
 * // Использование в store или компонентах
 * import apiClient from '@/api'
 * 
 * const response = await apiClient.get('/users')
 * const data = await apiClient.post('/auth/login', credentials)
 */

import axios from 'axios'
import router from '@/router'

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Интерцептор запроса: добавляем JWT токен из localStorage
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('E:API:AUTH: API request ERROR:', error.message);
        return Promise.reject(error);
    }
);

// Интерцептор ответа: обработка ошибок аутентификации
//Возможно нужно доработать, потому что вроде бекенд возвращает когда нет прав 401
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status
        
        if (status === 401) {
            // ✅ Очищаем ТОЛЬКО токен
            localStorage.removeItem('token')
            
            // ✅ Не перенаправляем если уже на странице логина
            if (!window.location.pathname.includes('/login')) {
                router.push('/login')
            }
        } else if (status === 403) {
            // Нет доступа
            alert('Нет доступа к ресурсу')
        }
        
        console.error('API response ERROR:', error.message)
        return Promise.reject(error)
    }
)

export default apiClient

