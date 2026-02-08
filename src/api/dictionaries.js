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
    getByParam: (endpoint, paramName, paramValue) => api.get(`/${endpoint}`, { params: { [paramName]: paramValue } }),
    getById: (endpoint, id) => api.get(`/${endpoint}/${id}`),

    create: (endpoint, data) => api.post(`/${endpoint}`, data),
    update: (endpoint, id, data) => api.put(`/${endpoint}/${id}`, data),
    delete: (endpoint, id) => api.delete(`/${endpoint}/${id}`),
};