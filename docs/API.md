# Описание API backend

Привет! 
Здесь приведён список API на backend.
Таж жу указано как их вызывать и какой ответ ожидать

## v1 - 29.12.2025 
### User
1. auth - Авторизация
Получение токена 
```
POST http://localhost:8080/api/auth/login
Body:
{
  "username": "barista1",
  "password": "staff123"
}

return:
{
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiYXJpc3RhMSIsImlhdCI6MTc2Njk5OTIyMCwiZXhwIjoxNzY3MDg1NjIwfQ.odNB8V7U6y_FrT7iAyf9s9k3pRBz7A8Jb_EriH-GWAo",
    "type": "Bearer",
    "id": 3,
    "username": "barista1",
    "email": "barista1@cafe.com",
    "firstName": "Анна",
    "lastName": "Смирнова",
    "position": "Бариста",
    "roles": [
        "STAFF"
    ]
}
```

2. get profile - получение профиля пользователя.
```
GET http://localhost:8080/api/profile
Headers:
{
  "Authorization": "token"
}

return:
{
    "id": 3,
    "username": "barista1",
    "email": "barista1@cafe.com",
    "firstName": "Анна",
    "lastName": "Смирнова",
    "position": "Бариста",
    "roles": [
        "STAFF"
    ]
}
```

3. get all users (CAFE_ADMIN) - Получение профилей всех пользователей
```
GET http://localhost:8080/api/users
Headers:
{
  "Authorization": "token"
}

return:
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
        ],
        "fullName": "Админ Системы"
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
        ],
        "fullName": "Иван Петров"
    },
    {
        "id": 3,
        "username": "barista1",
        "email": "barista1@cafe.com",
        "firstName": "Анна",
        "lastName": "Смирнова",
        "position": "Бариста",
        "roles": [
            {
                "id": 3,
                "name": "STAFF"
            }
        ],
        "fullName": "Анна Смирнова"
    },
    {
        "id": 4,
        "username": "barista2",
        "email": "barista2@cafe.com",
        "firstName": "Дмитрий",
        "lastName": "Козлов",
        "position": "Помощник повара",
        "roles": [
            {
                "id": 3,
                "name": "STAFF"
            }
        ],
        "fullName": "Дмитрий Козлов"
    }
]
```

4. Create user (USER_ADMIN) — Создание нового пользователя
```
POST http://localhost:8080/api/users
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Body:
{
  "username": "barista3",
  "firstName": "Егор",
  "lastName": "Егоров",
  "position": "главный бариста",
  "email": "barista3@cafe.com",
  "password": "secret123",
  "roles": ["STAFF"]
}

Return:
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
    ],
    "fullName": "Егор Егоров"
}
```

5. Delete user (USER_ADMIN) — Удаление пользователя по ID
```
DELETE http://localhost:8080/api/users/{id}
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Return: 204 No Content (успешное удаление)
```

6. Update user (USER_ADMIN или сам пользователь) — Обновление данных пользователя
```
PUT http://localhost:8080/api/users/{id}
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Body:
{
  "email": "newemail@cafe.com",
  "password": "newpassword123"
}

Return:
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
    ],
    "fullName": "Дмитрий Козлов"
}
```

### Schedule
1. GET my schedule — Получить своё расписание на месяц
```
GET http://localhost:8080/api/schedule/my?month={month}
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Params:
{
  "month": "2025-12-01"
}

Return:
{
    "userSchedules": [
        {
            "userId": 2,
            "username": "manager",
            "firstName": "Иван",
            "lastName": "Петров",
            "position": "Менеджер кафе",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-02",
                    "status": "VACATION"
                },
                {
                    "date": "2025-12-03",
                    "status": "VACATION"
                },
                {
                    "date": "2025-12-04",
                    "status": "VACATION"
                },
                {
                    "date": "2025-12-05",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-06",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-07",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-08",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-09",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-10",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-11",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-12",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-13",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-14",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-15",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-16",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-17",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-18",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-19",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-20",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-21",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-22",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-23",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-24",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-25",
                    "status": "SICK_LEAVE"
                },
                {
                    "date": "2025-12-26",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-27",
                    "status": "SICK_LEAVE"
                },
                {
                    "date": "2025-12-28",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-29",
                    "status": "WORKING"
                },
                {
                    "date": "2025-12-30",
                    "status": "OFF"
                },
                {
                    "date": "2025-12-31",
                    "status": "SICK_LEAVE"
                }
            ]
        }
    ],
    "approved": false
}
```

2. POST my schedule — Отправить/обновить своё расписание на месяц
```
POST http://localhost:8080/api/schedule/my?month={month}
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Params:
{
  "month": "2025-12-01"
}

Body:
{
  "days": [
                {
                    "date": "2025-12-01",
                    "status": "VACATION"
                },
                ..., (Упращение, тут все дни между 01 и 31)
                {
                    "date": "2025-12-31",
                    "status": "SICK_LEAVE"
                }
            ]
}

Return: 
{
    "userSchedules": [
        {
            "userId": 2,
            "username": "manager",
            "firstName": "Иван",
            "lastName": "Петров",
            "position": "Менеджер кафе",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "VACATION"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "SICK_LEAVE"
                }
            ]
        }
    ],
    "approved": false
}
```
3. GET all schedule (CAFE_ADMIN) — Получить расписание всех сотрудников на месяц
```
GET http://localhost:8080/api/schedule/all?month={month}
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Params:
{
  "month": "2025-12-01"
}

Return:
{
    "userSchedules": [
        {
            "userId": 2,
            "username": "manager",
            "firstName": "Иван",
            "lastName": "Петров",
            "position": "Менеджер кафе",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "VACATION"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "SICK_LEAVE"
                }
            ]
        },
        {
            "userId": 3,
            "username": "barista1",
            "firstName": "Анна",
            "lastName": "Смирнова",
            "position": "Бариста",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "WORKING"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "OFF"
                }
            ]
        },
        {
            "userId": 4,
            "username": "barista2",
            "firstName": "Алёна",
            "lastName": "Козлова",
            "position": "Помощник повара",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "OFF"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "OFF"
                }
            ]
        }
    ],
    "approved": false
}
```

4. POST all schedule (CAFE_ADMIN) — Обновить расписание всех сотрудников на месяц
```
POST http://localhost:8080/api/schedule/all?month={month}
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Params:
{
  "month": "2025-12-01"
}

Body:
{
    "userSchedules": [
        {
            "userId": 2,
            "username": "manager",
            "firstName": "Иван",
            "lastName": "Петров",
            "position": "Менеджер кафе",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "OFF"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "SICK_LEAVE"
                }
            ]
        },
        {
            "userId": 3,
            "username": "barista1",
            "firstName": "Анна",
            "lastName": "Смирнова",
            "position": "Бариста",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "WORKING"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "OFF"
                }
            ]
        },
        {
            "userId": 4,
            "username": "barista2",
            "firstName": "Алёна",
            "lastName": "Козлова",
            "position": "Помощник повара",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "OFF"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "OFF"
                }
            ]
        }
    ],
    "approved": false
}

Return: 
{
    "userSchedules": [
        {
            "userId": 2,
            "username": "manager",
            "firstName": "Иван",
            "lastName": "Петров",
            "position": "Менеджер кафе",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "OFF"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "SICK_LEAVE"
                }
            ]
        },
        {
            "userId": 3,
            "username": "barista1",
            "firstName": "Анна",
            "lastName": "Смирнова",
            "position": "Бариста",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "WORKING"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "OFF"
                }
            ]
        },
        {
            "userId": 4,
            "username": "barista2",
            "firstName": "Алёна",
            "lastName": "Козлова",
            "position": "Помощник повара",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "OFF"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "OFF"
                }
            ]
        }
    ],
    "approved": false
}
```

5. GET status (CAFE_ADMIN) — Получить статус заполнения расписания на месяц
```
GET http://localhost:8080/api/schedule/status?month={month}
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Params:
{
  "month": "2025-12-01"
}

Return:
{
  true
}
(true / false)
```

6. POST approve (CAFE_ADMIN) — Утвердить/отклонить расписание на месяц
```
POST http://localhost:8080/api/schedule/approve?month={month}&approved={approved}
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Params:
{
  "month": "2025-12-01",
  "approved": false
}

Return: 
{
    "userSchedules": [
        {
            "userId": 2,
            "username": "manager",
            "firstName": "Иван",
            "lastName": "Петров",
            "position": "Менеджер кафе",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "OFF"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "SICK_LEAVE"
                }
            ]
        },
        {
            "userId": 3,
            "username": "barista1",
            "firstName": "Анна",
            "lastName": "Смирнова",
            "position": "Бариста",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "WORKING"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "OFF"
                }
            ]
        },
        {
            "userId": 4,
            "username": "barista2",
            "firstName": "Алёна",
            "lastName": "Козлова",
            "position": "Помощник повара",
            "days": [
                {
                    "date": "2025-12-01",
                    "status": "OFF"
                },
                ...,
                {
                    "date": "2025-12-31",
                    "status": "OFF"
                }
            ]
        }
    ],
    "approved": false
}
```
