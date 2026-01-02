import apiClient from './index.js'

// 1. Получение всего расписания по всем пользователям
export async function getAllSchedule(month) {
    try {
        const response = await apiClient.get('/schedule/all', {
            params: { month }
        });
        return response.data;
    } catch (error) {
        console.error('E:API:SCHEDULE: fetching ALL schedules:', error);
        throw error;
    }
}

// 2. Получение расписания по текущему пользователю
export async function getMySchedule(month) {
    try {
        const response = await apiClient.get('/schedule/my', {
            params: { month }
        });
        return response.data;
    } catch (error) {
        console.error('E:API:SCHEDULE: fetching MY schedules:', error);
        throw error;
    }
}

// 3. Создание расписания по текущему пользователю
export async function createMySchedule(scheduleData) {
    try {
        const response = await apiClient.post('/schedule/my', scheduleData);
        return response.data;
    } catch (error) {
        console.error('E:API:SCHEDULE: creating MY schedule:', error);
        throw error;
    }
}

// 4. Внесение изменений в расписание по текущему пользователю
export async function updateMySchedule(month, scheduleData) {
    try {
        const response = await apiClient.post('/schedule/my', scheduleData, {
            params: { month }
        });
        return response.data;
    } catch (error) {
        console.error('E:API:SCHEDULE: updating MY schedule:', error);
        throw error;
    }
}
    
// 5. Получение статусов смен
export async function getStatusesSchedule() {
    try {
        const response = await apiClient.get('/schedule/statuses');
        return response.data;
    } catch (error) {
        console.warn('E:API:SCHEDULE: fetching statuses schedules. Return default statuses:', error);
        
        // Дефолтные статусы (TODO: пока не реализуем endpoint)
        const defaultStatusesSchedule = [
            { id: 'WORKING',    color: '#00b10fff', name_rus: 'Рабочая',    short_name: 'Р' },
            { id: 'OFF',        color: '#ccccccff', name_rus: 'Выходной',   short_name: 'В' },
            { id: 'VACATION',   color: '#c45e5eff', name_rus: 'Отпуск',     short_name: 'О' },
            { id: 'SICK_LEAVE', color: '#d5e400ff', name_rus: 'Больничный', short_name: 'Б' },
        ]
        return defaultStatusesSchedule;
    }
}

// 6. Получение статуса расписания all
export async function getScheduleStatus(month) {
    try {
        const response = await apiClient.get('/schedule/status', { params: {month}});
        return response.data;
    } catch (error) {
        console.error('E:API:SCHEDULE: fetching schedule status:', error);
        throw error;
    }
}

// 7. Изменение статуса расписания (Открыто / закрыто)
export async function changeScheduleStatus(scheduleData) {
    try { 
        console.log("changeScheduleStatus")
        const response = await apiClient.post('/schedule/approve', null, {
            params: { 
                month: scheduleData.month,
                approved: scheduleData.approved
            }
        });
        return response.data;
    } catch (error) {
        console.error('E:API:SCHEDULE: changing schedule status:', error);
        throw error;
    }
}

// 8. Обновление расписания для всех сотрудников
export async function updateAllSchedule(month, scheduleData) {
    try { 
        const response = await apiClient.post('/schedule/all', scheduleData, {
            params: { month }
        });
        return response.data;
    } catch (error) {
        console.error('E:API:SCHEDULE: updating ALL schedules:', error);
        throw error;
    }
}