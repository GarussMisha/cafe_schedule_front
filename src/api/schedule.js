import apiClient from './index.js'

export async function getAllSchedule(month, cafeId) {
    try {
        const response = await apiClient.get('/schedule/all', {
            params: { month, cafeId }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getMySchedule(month, cafeId) {
    try {
        const response = await apiClient.get('/schedule/my', {
            params: { month, cafeId }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function createMySchedule(scheduleData) {
    try {
        const response = await apiClient.post('/schedule/my', scheduleData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function updateMySchedule(month, scheduleData, cafeId) {
    try {
        const payload = {
            cafeId,
            shifts: scheduleData.shifts || scheduleData
        };
        const response = await apiClient.post('/schedule/my', payload, {
            params: { month }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
    
export async function getStatusesSchedule(cafeId) {
    try {
        const response = await apiClient.get('/schedule/statuses', {
            params: { cafeId }
        });
        return response.data;
    } catch (error) {
        const defaultStatusesSchedule = [
            { id: 'WORKING',    color: '#00b10fff', name_rus: 'Рабочая',    short_name: 'Р' },
            { id: 'OFF',        color: '#ccccccff', name_rus: 'Выходной',   short_name: 'В' },
            { id: 'VACATION',   color: '#c45e5eff', name_rus: 'Отпуск',     short_name: 'О' },
            { id: 'SICK_LEAVE', color: '#d5e400ff', name_rus: 'Больничный', short_name: 'Б' },
        ]
        return defaultStatusesSchedule;
    }
}

export async function getScheduleStatus(month, cafeId) {
    try {
        const response = await apiClient.get('/schedule/status', { params: { month, cafeId }});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function changeScheduleStatus(scheduleData, cafeId) {
    try { 
        const response = await apiClient.post('/schedule/approve', null, {
            params: { 
                month: scheduleData.month,
                approved: scheduleData.approved,
                cafeId
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function updateAllSchedule(month, scheduleData, cafeId) {
    try { 
        const response = await apiClient.post('/schedule/all', scheduleData, {
            params: { month, cafeId }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
