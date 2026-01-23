import api from './axiosConfig';

export const DictionaryApi = {
    getAll: (endpoint, page = 0, size = 10) => api.get(`/${endpoint}?page=${page}&size=${size}`),  
    getByParam: (endpoint, paramName, paramValue) => api.get(`/${endpoint}?${paramName}=${paramValue}`),
    getById: (endpoint, id) => api.get(`/${endpoint}/${id}`),

    create: (endpoint, data) => api.post(`/${endpoint}`, data),
    update: (endpoint, id, data) => api.put(`/${endpoint}/${id}`, data),
    delete: (endpoint, id) => api.delete(`/${endpoint}/${id}`),
};