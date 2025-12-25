import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getAllSchedule, getMySchedule, getStatusesSchedule } from '@/api/schedule'

export const useScheduleStore = defineStore('schedule', () => {
    //State
    const mySchedule = ref([])
    const allSchedule = ref([])
    const statusesSchedule = ref([])
    
    // Текущий месяц в формате YYYY-MM-DD (первый день месяца)
    const currentMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);


    //1. Получение расписания по текущему пользователю.
    async function fetchMySchedule(month = currentMonth.value) {
        try {
            const data = await getMySchedule(month);
            mySchedule.value = data;
            console.log('Расписание загружено:', data); // Для отладки
        } catch (error) {
            console.error('Error in fetchMySchedule:', error);
            throw error;
        }
    }

    //2. Получение расписание на указанный месяц по всем сотрудникам.
    async function fetchAllSchedule(month = currentMonth.value) {
        try {
            const data = await getAllSchedule(month);
            allSchedule.value = data;
            console.log('Общее расписание загружено:', data); // Для отладки
        } catch (error) {
            console.error('Error in fetchAllSchedule:', error);
            throw error;
        }
    }

    //3. Получение статусов смен.
    async function fetchStatusesSchedule() {
        try {
            const data = await getStatusesSchedule();
            statusesSchedule.value = data;
        } catch (error) {
            console.error('Error in fetchStatusesSchedule:', error);
            throw error;
        }
    }

    async function updateMySchedule(month = currentMonth.value) {
        await fetchMySchedule(month);
    }

    return {
        currentMonth,
        fetchMySchedule,
        fetchAllSchedule,
        mySchedule,
        fetchStatusesSchedule,
        statusesSchedule,
    }
})