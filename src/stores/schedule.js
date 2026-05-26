import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getAllSchedule, getMySchedule, getStatusesSchedule, changeScheduleStatus, updateMySchedule as updateMyScheduleAPI, updateAllSchedule, getScheduleStatus } from '@/api/schedule'

export const useScheduleStore = defineStore('schedule', () => {
    //State
    const mySchedule = ref([])
    const allSchedule = ref([])
    const statusesSchedule = ref([])
    const scheduleStatus = ref([])
    const cafeId = ref(1)
    const schedulesCache = ref({})
    const allScheduleMonthsKey = ref('')
    
    // Текущий месяц в формате YYYY-MM-DD (первый день месяца)
    const currentMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);

    // Получение статуса расписаний (approved - true/false)
    const isStatusMySchedule = computed(() => mySchedule.value.approved)
    const isStatusAllSchedule = computed(() => allSchedule.value.approved)

    //1. Получение расписания по текущему пользователю.
    async function fetchMySchedule(month = currentMonth.value) {
        try {
            const data = await getMySchedule(month, cafeId.value);
            mySchedule.value = data;
        } catch (error) {
            console.error('Error in fetchMySchedule:', error);
            throw error;
        }
    }

    //2. Получение расписание на указанный месяц(ы) по всем сотрудникам.
    //   month может быть строкой (один месяц) или массивом строк (несколько месяцев — данные будут объединены)
    //   Всегда запрашивает свежие данные с бэка, но обновляет UI только если данные изменились.
    //   Это гарантирует актуальность и убирает дёрганье при переключении недель внутри одного месяца.
    async function fetchAllSchedule(month = currentMonth.value) {
        try {
            const months = Array.isArray(month) ? [...month] : [month]
            const newMonthsKey = months.join('|')

            // Всегда запрашиваем с бэка
            const results = await Promise.all(
                months.map(m => getAllSchedule(m, cafeId.value))
            )

            // Сравниваем с кэшем, обновляем если изменилось
            let cacheUpdated = false
            months.forEach((m, i) => {
                const cached = schedulesCache.value[m]
                const fresh = results[i]
                if (!cached || JSON.stringify(cached) !== JSON.stringify(fresh)) {
                    schedulesCache.value[m] = fresh
                    cacheUpdated = true
                }
            })

            // Обновляем отображение, если сменился период или обновились данные
            const periodChanged = newMonthsKey !== allScheduleMonthsKey.value
            if (periodChanged || cacheUpdated) {
                if (months.length === 1) {
                    allSchedule.value = schedulesCache.value[months[0]]
                } else {
                    allSchedule.value = mergeSchedules(months.map(m => schedulesCache.value[m]))
                }
                allScheduleMonthsKey.value = newMonthsKey
            }
        } catch (error) {
            console.error('Error in fetchAllSchedule:', error);
            throw error;
        }
    }

    function invalidateScheduleCache(month) {
        if (month) {
            delete schedulesCache.value[month]
        } else {
            schedulesCache.value = {}
        }
    }

    // Объединение расписаний из нескольких месяцев в один allSchedule
    // Склеивает userSchedules по userId, объединяя массивы shifts
    function mergeSchedules(schedules) {
        if (!schedules || schedules.length === 0) return null
        if (schedules.length === 1) return schedules[0]

        const result = JSON.parse(JSON.stringify(schedules[0]))
        const userMap = new Map()

        for (const schedule of schedules) {
            if (!schedule.userSchedules) continue
            for (const user of schedule.userSchedules) {
                if (!userMap.has(user.userId)) {
                    userMap.set(user.userId, { ...user, shifts: [] })
                }
                const existingUser = userMap.get(user.userId)
                if (user.shifts) {
                    existingUser.shifts.push(...user.shifts)
                }
            }
        }

        result.userSchedules = Array.from(userMap.values())
        return result
    }

    //3. Получение статусов смен.
    async function fetchStatusesSchedule() {
        try {
            const data = await getStatusesSchedule(cafeId.value);
            statusesSchedule.value = data;
        } catch (error) {
            console.error('Error in fetchStatusesSchedule:', error);
            throw error;
        }
    }

    //4. Получение статуса расписания (утвержден/не утвержден)
    async function fetchScheduleStatus(month = currentMonth.value) {
        try {
            const data = await getScheduleStatus(month, cafeId.value);
            console.log(data)
            scheduleStatus.value = data;
        } catch (error) {
            console.error('Error in fetchScheduleStatus:', error);
            throw error;
        }
    }

    //5. Обновление расписания по текущему пользователю (поддержка shifts)
    async function updateMySchedule(month = currentMonth.value, shiftsData) {
        try {
            // Отправляем shifts (массив смен с startTime, endTime, status)
            const data = await updateMyScheduleAPI(month, { shifts: shiftsData }, cafeId.value);
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
            const data = await changeScheduleStatus({ month, approved: approve }, cafeId.value);
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
            // Отправляем FullScheduleDto: { cafeId, approved, userSchedules }
            const payload = {
                cafeId: cafeId.value,
                approved: allSchedule.value?.approved || false,
                userSchedules: schedulesData
            };
            const data = await updateAllSchedule(month, payload, cafeId.value);
            allSchedule.value = data;
        } catch (error) {
            console.error('Error in updateAllScheduleData:', error);
            throw error;
        }
    }

    return {
        currentMonth,
        cafeId,
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
        invalidateScheduleCache,
        isStatusMySchedule,
        isStatusAllSchedule,
    }
})

