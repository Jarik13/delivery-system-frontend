import axios from 'axios';
import qs from 'qs';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    withCredentials: true,
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
});

api.interceptors.request.use(config => {
    const auth = localStorage.getItem('auth');
    if (auth) {
        const { accessToken } = JSON.parse(auth);
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    failedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async error => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                }).catch(err => Promise.reject(err));
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken } = res.data;

                const saved = localStorage.getItem('auth');
                if (saved) {
                    const auth = JSON.parse(saved);
                    localStorage.setItem('auth', JSON.stringify({ ...auth, accessToken }));
                }

                processQueue(null, accessToken);
                original.headers.Authorization = `Bearer ${accessToken}`;
                return api(original);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('auth');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;