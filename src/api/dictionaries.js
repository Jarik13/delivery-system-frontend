import api from './axiosConfig';

export const DictionaryApi = {
    getAll: (endpoint, page = 0, size = 10, filters = {}) => {
        return api.get(`/${endpoint}`, {
            params: {
                page,
                size,
                ...filters
            }
        });
    },

    getStatistics: async (entityType) => api.get(`${entityType}/statistics`),
    getMovement: async (shipmentId) => api.get(`shipments/${shipmentId}/movement`),
    getByParam: (endpoint, paramName, paramValue, page = 0, size = 5000) => {
        return api.get(`/${endpoint}`, { 
            params: { 
                [paramName]: paramValue,
                page,
                size
            } 
        });
    },
    getById: (endpoint, id) => api.get(`/${endpoint}/${id}`),

    calculatePrices: (data) => api.post('/shipments/calculate', data),
    create: (endpoint, data) => api.post(`/${endpoint}`, data),
    update: (endpoint, id, data) => api.put(`/${endpoint}/${id}`, data),
    delete: (endpoint, id) => api.delete(`/${endpoint}/${id}`),
};