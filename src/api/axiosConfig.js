import axios from 'axios';
import qs from 'qs';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
    headers: { 'Content-Type': 'application/json' },
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
});

export default api;