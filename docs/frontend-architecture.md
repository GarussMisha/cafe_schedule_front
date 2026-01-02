# Архитектура Frontend приложения (Vue.js + Composition API + Pinia)

## Общая структура проекта
Проект использует Vite + Vue 3 с Composition API. Базовая структура уже создана в `front/src/`. Предлагаемая архитектура расширяет её для поддержки ролей пользователей (админ, менеджер, сотрудник), аутентификации (JWT), управления состоянием (Pinia) и интеграции с Java API.

### Древо проекта
```
front/src/
├── api/                  # API клиенты и эндпоинты
│   ├── index.js          # Основной axios instance с интерцепторами
│   ├── auth.js           # /api/auth/** (login, logout, refresh)
│   ├── schedule.js       # /api/schedule/** - Управление расписанием
│   └── user.js           # /api/users/** - Управление пользователем
│ 
├── assets/
│
├── components
│
├── stores/               # Pinia stores для глобального состояния
│   ├── auth.js           # Токен JWT, пользователь, роль
│   ├── schedule.js       # Расписание (календарь, записи)
│   └── user.js           # Пользователи (для админа/менеджера)
├── components/           # Переиспользуемые компоненты
│   ├── common/           # Header, Sidebar, Modal, Loader
│   ├── calendar/         # CalendarView, ScheduleEntry
│   └── ui/               # Button, Input, RoleBadge
├── views/                # Страницы (роуты)
│   ├── LoginView.vue
│   ├── HomeView.vue
│   ├── CalendarView.vue
│   ├── ProfileView.vue
│   └── AdminPanel.vue
├── router/               # Vue Router с guards
│   └── index.js          # Роуты + навигационные guards по ролям
├── utils/                # Утилиты
│   ├── auth.js           # Helpers для JWT (isLoggedIn, getRole)
│   ├── constants.js      # Роли, статусы, месяцы
│   └── validators.js     # Валидация форм
├── assets/               # Статические ресурсы
└── App.vue               # Корневой компонент с роутером + Header
```

## API Интеграция
- **Базовый URL**: `http://localhost:8080/api` (из `vite.config.js` или env).
- **Интерцепторы** (`src/api/index.js`):
  1. Request: Добавлять `Authorization: Bearer ${token}` из store.
  2. Response: Обработка ошибок 401 (redirect to login), 403 (no access).
- **Эндпоинты** (на основе бэкенда):
  | Метод | Эндпоинт | Описание | Доступ |
  |-------|----------|----------|--------|
  | POST | /auth/login | Вход (LoginRequest) → JwtResponse | Все |
  | GET | /schedule/my | Моё расписание (MyScheduleDto) | authenticated |
  | GET/POST | /schedule/month/{year}/{month} | Расписание месяца (FullScheduleDto) | manager/admin |
  | POST | /schedule/entry | Создать/обновить запись (ScheduleEntryDto) | manager |
  | GET/POST | /users | Список/управление пользователями (UserDto) | admin |

Пример запроса:
```javascript
// src/api/auth.js
import api from './index.js';

export const login = (credentials) => api.post('/auth/login', credentials);
```

## State Management (Pinia)
- Установка: Уже есть `stores/counter.js`, используем Pinia.
- **authStore** (`stores/auth.js`):
  ```javascript
  import { defineStore } from 'pinia';
  import { login } from '@/api/auth.js';

  export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token'));
    const user = ref(null);
    const role = computed(() => user.value?.role);

    const logout = () => { /* clear token, redirect */ };

    return { token, user, role, login, logout };
  });
  ```
- **scheduleStore**: Массив записей, текущий месяц, фильтры по роли.

## Роутер и Guards
- `router/index.js`: Meta-роли для роутов.
- Navigation Guard: Проверять `authStore.isLoggedIn && hasRole(route.meta.requiredRole)`.

Пример роутов:
```javascript
const routes = [
  { path: '/login', component: LoginView, meta: { public: true } },
  { path: '/', component: HomeView, meta: { requiresAuth: true } },
  { path: '/calendar', component: CalendarView, meta: { role: 'MANAGER' } },
  { path: '/admin', component: AdminPanel, meta: { role: 'ADMIN' } }
];
```

## Компоненты по ролям
- **Сотрудник**: Просмотр графика + подача пожеланий (форма в CalendarView).
- **Менеджер**: Редактирование расписания (drag&drop? или формы).
- **Админ**: + Управление пользователями (таблица + CRUD).

## Константы
- `src/utils/constants.js`:
  ```javascript
  export const ROLES = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', EMPLOYEE: 'EMPLOYEE' };
  export const MONTHS = ['Январь', 'Февраль', ...];
  export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  ```

## План реализации (пошагово)
1. Создать `src/api/` файлы + интерцепторы.
2. Настроить Pinia stores.
3. Доработать router с guards.
4. Реализовать LoginView + auth flow.
5. CalendarView с FullCalendar или custom table.
6. Profile/Admin с учетом ролей.
7. Тестирование: граничные случаи (нет токена, 403, пустое расписание).

Эта архитектура масштабируема, следует Vue best practices и интегрируется с готовым API.