import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

export const DictionaryApi = {
    getAll: (endpoint, page = 0, size = 10) => axios.get(`${API_URL}/${endpoint}?page=${page}&size=${size}`),  
    getByParam: (endpoint, paramName, paramValue) => axios.get(`${API_URL}/${endpoint}?${paramName}=${paramValue}`),
    getById: (endpoint, id) => axios.get(`${API_URL}/${endpoint}/${id}`),
    
    create: (endpoint, data) => axios.post(`${API_URL}/${endpoint}`, data),
    update: (endpoint, id, data) => axios.put(`${API_URL}/${endpoint}/${id}`, data),
    delete: (endpoint, id) => axios.delete(`${API_URL}/${endpoint}/${id}`),
};