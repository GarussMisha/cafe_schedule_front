import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getAllSchedule, getMySchedule, getStatusesSchedule, changeScheduleStatus, updateMySchedule as updateMyScheduleAPI, updateAllSchedule, getScheduleStatus } from '@/api/schedule'

export const useScheduleStore = defineStore('schedule', () => {
    //State
    const mySchedule = ref([])
    const allSchedule = ref([])
    const statusesSchedule = ref([])
    const scheduleStatus = ref([])
    
    // Текущий месяц в формате YYYY-MM-DD (первый день месяца)
    const currentMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);

    // Получение статуса расписаний (approved - true/false)
    const isStatusMySchedule = computed(() => mySchedule.value.approved)
    const isStatusAllSchedule = computed(() => allSchedule.value.approved)

    //1. Получение расписания по текущему пользователю.
    async function fetchMySchedule(month = currentMonth.value) {
        try {
            const data = await getMySchedule(month);
            mySchedule.value = data;
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

    //4. Получение статуса расписания (утвержден/не утвержден)
    async function fetchScheduleStatus(month = currentMonth.value) {
        try {
            const data = await getScheduleStatus(month);
            console.log(data)
            scheduleStatus.value = data;
        } catch (error) {
            console.error('Error in fetchScheduleStatus:', error);
            throw error;
        }
    }

    //5. Обновление расписания по текущему пользователю
    async function updateMySchedule(month = currentMonth.value, daysData) {
        try {
            const data = await updateMyScheduleAPI(month, { days: daysData });
            mySchedule.value = data;
        } catch (error) {
            console.error('Error in updateMySchedule:', error);
            throw error;
        }
    }

    //6. Изменение статуса расписания (approved/not approved)
    async function changeApproveStatus(month = currentMonth.value, approve) {
        try {
            console.log("changeApproveStatus", month, approve)
            const data = await changeScheduleStatus({ month, approved: approve });
            mySchedule.value = data;
            allSchedule.value = data;
        } catch (error) {
            console.error('Error in changeApproveStatus:', error);
            throw error;
        }
    }

    //7. Обновление расписания для всех сотрудников
    async function updateAllScheduleData(month = currentMonth.value, schedulesData) {
        try {
            const data = await updateAllSchedule(month, { userSchedules: schedulesData });
            allSchedule.value = data;
        } catch (error) {
            console.error('Error in updateAllScheduleData:', error);
            throw error;
        }
    }

    return {
        currentMonth,
        fetchMySchedule,
        fetchAllSchedule,
        mySchedule,
        allSchedule,
        scheduleStatus,
        fetchStatusesSchedule,
        fetchScheduleStatus,
        statusesSchedule,
        updateMySchedule,
        changeApproveStatus,
        updateAllScheduleData,
        isStatusMySchedule,
        isStatusAllSchedule,
    }
})