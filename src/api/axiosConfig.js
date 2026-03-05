import axios from 'axios';
import qs from 'qs';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
});

api.interceptors.request.use(config => {
    const auth = sessionStorage.getItem('auth');
    if (auth) {
        const { accessToken } = JSON.parse(auth);
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;