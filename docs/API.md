# Описание API backend

## v2 - 19.05.2026 (актуализация по исходному коду)

> **Важно:** Все schedule endpoints теперь требуют параметр `cafeId`. Структура ответа изменилась — вместо `days` используется `shifts` (с startTime и endTime).

---

## Auth

### POST /api/auth/login — Авторизация
Получение JWT токена.

**Request Body:**
```json
{
  "username": "barista1",
  "password": "staff123"
}
```

**Response (200):**
```json
{
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "type": "Bearer",
    "id": 3,
    "username": "barista1",
    "email": "barista1@cafe.com",
    "firstName": "Анна",
    "lastName": "Смирнова",
    "position": "Бариста",
    "roles": ["STAFF"]
}
```

> **Примечание:** `roles` — массив строк (не объектов). `position` включён в ответ.

---

## Profile

### GET /api/profile — Профиль текущего пользователя

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "id": 3,
    "username": "barista1",
    "email": "barista1@cafe.com",
    "firstName": "Анна",
    "lastName": "Смирнова",
    "position": "Бариста",
    "roles": ["STAFF"]
}
```

> **Примечание:** `roles` — массив строк. Поле `fullName` отсутствует.

---

## User Management

### GET /api/users — Все пользователи

**Доступ:** `USER_ADMIN` или `CAFE_ADMIN`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
    {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "firstName": "Админ",
        "lastName": "Системы",
        "position": "Администратор пользователей",
        "roles": [
            {
                "id": 1,
                "name": "USER_ADMIN"
            }
        ]
    },
    {
        "id": 2,
        "username": "manager",
        "email": "manager@cafe.com",
        "firstName": "Иван",
        "lastName": "Петров",
        "position": "Менеджер кафе",
        "roles": [
            {
                "id": 2,
                "name": "CAFE_ADMIN"
            }
        ]
    }
]
```

> **Важно:** `roles` в ответе — массив объектов `{id, name}` (из User entity). Метод `getFullName()` доступен программно, но в JSON не сериализуется.

### POST /api/users — Создать пользователя

**Доступ:** `USER_ADMIN`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (UserDto):**
```json
{
  "username": "barista3",
  "firstName": "Егор",
  "lastName": "Егоров",
  "position": "главный бариста",
  "email": "barista3@cafe.com",
  "password": "secret123",
  "roles": ["STAFF"]
}
```

**Response (201):**
```json
{
    "id": 5,
    "username": "barista3",
    "email": "barista3@cafe.com",
    "firstName": "Егор",
    "lastName": "Егоров",
    "position": "главный бариста",
    "roles": [
        {
            "id": 3,
            "name": "STAFF"
        }
    ]
}
```

> **Примечание:** `roles` в body — массив строк (Set<String>). В ответе — массив объектов.

### PUT /api/users/{id} — Обновить пользователя

**Доступ:** `USER_ADMIN`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (UserDto):**
```json
{
  "email": "newemail@cafe.com",
  "password": "newpassword123"
}
```
> Нулевые значения игнорируются.

**Response (200):**
```json
{
    "id": 4,
    "username": "barista2",
    "email": "newemail@cafe.com",
    "firstName": "Дмитрий",
    "lastName": "Козлов",
    "position": "Помощник повара",
    "roles": [
        {
            "id": 3,
            "name": "STAFF"
        }
    ]
}
```

### DELETE /api/users/{id} — Удалить пользователя

**Доступ:** `USER_ADMIN`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```
Пустое тело
```

---

## Schedule

> **Важно:** Все schedule endpoints требуют параметр `cafeId`. Структура использует `shifts` (date + startTime + endTime + status), а не `days`.

### Statuses (DEPRECATED)

**GET /api/schedule/statuses**

> Эндпоинт **не реализован** в бэкенде. Фронтенд использует дефолтные статусы:
```json
[
    { "id": "WORKING",    "color": "#00b10fff", "name_rus": "Рабочая",    "short_name": "Р" },
    { "id": "OFF",        "color": "#ccccccff", "name_rus": "Выходной",   "short_name": "В" },
    { "id": "VACATION",   "color": "#c45e5eff", "name_rus": "Отпуск",     "short_name": "О" },
    { "id": "SICK_LEAVE", "color": "#d5e400ff", "name_rus": "Больничный", "short_name": "Б" }
]
```
> Статусы определены в `ScheduleEntry.Status`: `WORKING`, `OFF`, `VACATION`, `SICK_LEAVE`.

---

### GET /api/schedule/my — Моё расписание

**Доступ:** `STAFF` или `CAFE_ADMIN`

**Query Parameters:**
- `month` — дата в формате `YYYY-MM-DD` (обязательно)
- `cafeId` — ID кафе (обязательно)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```
GET /api/schedule/my?month=2025-12-01&cafeId=1
```

**Response (200):**
```json
{
    "cafeId": 1,
    "approved": false,
    "userSchedules": [
        {
            "userId": 3,
            "username": "barista1",
            "firstName": "Анна",
            "lastName": "Смирнова",
            "position": "Бариста",
            "shifts": [
                {
                    "date": "2025-12-05",
                    "startTime": "09:00",
                    "endTime": "17:00",
                    "status": "WORKING"
                }
            ]
        }
    ]
}
```

> **Важно:** `shifts` содержит startTime и endTime (LocalTime), а не просто статус.

---

### POST /api/schedule/my — Сохранить моё расписание

**Доступ:** `STAFF` или `CAFE_ADMIN`

**Query Parameters:**
- `month` — дата в формате `YYYY-MM-DD` (обязательно)
- `cafeId` — ID кафе (обязательно)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (MyScheduleDto):**
```json
{
    "cafeId": 1,
    "shifts": [
        {
            "date": "2025-12-01",
            "startTime": "09:00",
            "endTime": "17:00",
            "status": "WORKING"
        },
        {
            "date": "2025-12-02",
            "startTime": null,
            "endTime": null,
            "status": "OFF"
        }
    ]
}
```

**Response (200):** FullScheduleDto (см. GET /api/schedule/my)

**Validation:**
- Дата shifts должна быть в том же месяце, что и `month`
- startTime должен быть раньше endTime
- Проверка пересечений с существующими записями

---

### GET /api/schedule/all — Расписание всех сотрудников

**Доступ:** `CAFE_ADMIN` или `USER_ADMIN`

**Query Parameters:**
- `month` — дата в формате `YYYY-MM-DD` (обязательно)
- `cafeId` — ID кафе (обязательно)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```
GET /api/schedule/all?month=2025-12-01&cafeId=1
```

**Response (200):**
```json
{
    "cafeId": 1,
    "approved": false,
    "userSchedules": [
        {
            "userId": 2,
            "username": "manager",
            "firstName": "Иван",
            "lastName": "Петров",
            "position": "Менеджер кафе",
            "shifts": [
                {
                    "date": "2025-12-01",
                    "startTime": "10:00",
                    "endTime": "18:00",
                    "status": "WORKING"
                }
            ]
        },
        {
            "userId": 3,
            "username": "barista1",
            "firstName": "Анна",
            "lastName": "Смирнова",
            "position": "Бариста",
            "shifts": [
                {
                    "date": "2025-12-01",
                    "startTime": "08:00",
                    "endTime": "16:00",
                    "status": "OFF"
                }
            ]
        }
    ]
}
```

---

### POST /api/schedule/all — Обновить расписание всех сотрудников

**Доступ:** `CAFE_ADMIN`

**Query Parameters:**
- `month` — дата в формате `YYYY-MM-DD` (обязательно)
- `cafeId` — ID кафе (обязательно)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (FullScheduleDto):**
```json
{
    "cafeId": 1,
    "approved": false,
    "userSchedules": [
        {
            "userId": 2,
            "username": "manager",
            "firstName": "Иван",
            "lastName": "Петров",
            "position": "Менеджер кафе",
            "shifts": [
                {
                    "date": "2025-12-01",
                    "startTime": "10:00",
                    "endTime": "18:00",
                    "status": "OFF"
                }
            ]
        }
    ]
}
```

**Response (200):** FullScheduleDto (см. GET /api/schedule/all)

---

### POST /api/schedule/approve — Утвердить/отклонить расписание

**Доступ:** `CAFE_ADMIN`

**Query Parameters:**
- `month` — дата в формате `YYYY-MM-DD` (обязательно)
- `cafeId` — ID кафе (обязательно)
- `approved` — `true` или `false` (по умолчанию `true`)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```
POST /api/schedule/approve?month=2025-12-01&cafeId=1&approved=true
```

**Response (200):** FullScheduleDto (см. GET /api/schedule/all)

---

### GET /api/schedule/status — Статус утверждения расписания

**Query Parameters:**
- `month` — дата в формате `YYYY-MM-DD` (обязательно)
- `cafeId` — ID кафе (обязательно)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```
GET /api/schedule/status?month=2025-12-01&cafeId=1
```

**Response (200):**
```json
true
```
или
```json
false
```

---

## Роли

| Роль | Описание |
|------|----------|
| `USER_ADMIN` | Управление пользователями (CRUD) |
| `CAFE_ADMIN` | Управление расписанием кафе |
| `STAFF` | Просмотр/редактирование своего расписания |

---

## DTO-структуры (для справки)

### JwtResponse
```
token: String
type: "Bearer"
id: Long
username: String
email: String
firstName: String
lastName: String
position: String
roles: List<String>
```

### MyScheduleDto (для POST /api/schedule/my)
```
cafeId: Long (required)
shifts: List<Shift>
  - date: LocalDate (required)
  - startTime: LocalTime (required)
  - endTime: LocalTime (required)
  - status: ScheduleEntry.Status (required)
```

### FullScheduleDto (ответ всех schedule endpoints)
```
cafeId: Long (required)
approved: boolean
userSchedules: List<UserSchedule>
  - userId: Long
  - username: String
  - firstName: String
  - lastName: String
  - position: String
  - shifts: List<Shift>
```

### UserDto (для POST/PUT /api/users)
```
username: String (min 3, max 20)
email: String (email format)
password: String (min 6, max 40)
firstName: String
lastName: String
position: String
roles: Set<String>
```
