import apiClient from './index.js'

// 1. Получение всего расписания
export async function getAllSchedule(month) {
    try {
        const response = await apiClient.get('/schedule/all', {
            params: { month }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching ALL schedules:', error);
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
        console.error('Error fetching MY schedules:', error);
        throw error;
    }
}

// 3. Создание расписания по текущему пользователю
export async function createMySchedule(scheduleData) {
    try {
        const response = await apiClient.post('/schedule/my', scheduleData);
        return response.data;
    } catch (error) {
        console.error('Error creating MY schedule:', error);
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
        console.error('Error updating MY schedule:', error);
        throw error;
    }
}
    
//Получение статусов смен
export async function getStatusesSchedule() {
    try {
        const response = await apiClient.get('/schedule/statuses');
        return response.data;
    } catch (error) {
        console.warn('Error fetching statuses schedules. Return default statuses:', error);
        
        // Дефолтные статусы
        const defaultStatusesSchedule = [
            { id: 'WORKING',    color: '#00b10fff', name_rus: 'Рабочая',    short_name: 'Р' },
            { id: 'OFF',        color: '#ccccccff', name_rus: 'Выходной',   short_name: 'В' },
            { id: 'VACATION',   color: '#c45e5eff', name_rus: 'Отпуск',     short_name: 'О' },
            { id: 'SICK_LEAVE', color: '#d5e400ff', name_rus: 'Больничный', short_name: 'Б' },
        ]
        return defaultStatusesSchedule;
    }
}

// Получение статуса расписания all
export async function getScheduleStatus(month) {
    try {
        const response = await apiClient.get('/schedule/status', { params: {month}});
        return response.data;
    } catch (error) {
        console.error('Error fetching schedule status:', error);
        throw error;
    }
}

// Изменение статуса расписания (утверждение/отмена утверждения)
export async function changeScheduleStatus(scheduleData, approve) {
    try { 
        const response = await apiClient.post('/schedule/approve', null, {
            params: { 
                month: scheduleData.month,
                approved: scheduleData.approve
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error changing schedule status:', error);
        throw error;
    }
}

// Обновление расписания для всех сотрудников
export async function updateAllSchedule(month, scheduleData) {
    try { 
        const response = await apiClient.post('/schedule/all', scheduleData, {
            params: { month }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating ALL schedules:', error);
        throw error;
    }
}