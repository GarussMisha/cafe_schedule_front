import apiClient from './index.js'

export async function getAllCafes() {
    try {
        const response = await apiClient.get('/cafes')
        return response.data
    } catch (error) {
        throw error
    }
}

export async function createCafe(cafeData) {
    try {
        const response = await apiClient.post('/cafes', cafeData)
        return response.data
    } catch (error) {
        throw error
    }
}

export async function updateCafe(id, cafeData) {
    try {
        const response = await apiClient.put(`/cafes/${id}`, cafeData)
        return response.data
    } catch (error) {
        throw error
    }
}

export async function deleteCafe(id) {
    try {
        const response = await apiClient.delete(`/cafes/${id}`)
        return response.data
    } catch (error) {
        throw error
    }
}
