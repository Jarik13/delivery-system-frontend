import axios from 'axios';
import qs from 'qs';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    withCredentials: true,
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
});

api.interceptors.request.use(config => {
    const auth = localStorage.getItem('auth');
    if (auth) {
        try {
            const { accessToken } = JSON.parse(auth);
            if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
        } catch (e) {
            console.error("Auth parsing error", e);
        }
    }
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
            
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            return new Promise((resolve, reject) => {
                axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
                    .then(({ data }) => {
                        const { accessToken } = data;

                        const saved = localStorage.getItem('auth');
                        if (saved) {
                            const auth = JSON.parse(saved);
                            localStorage.setItem('auth', JSON.stringify({ ...auth, accessToken }));
                        }

                        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        
                        processQueue(null, accessToken);
                        resolve(api(originalRequest));
                    })
                    .catch((err) => {
                        processQueue(err, null);
                        localStorage.removeItem('auth');
                        window.location.href = '/login';
                        reject(err);
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            });
        }

        return Promise.reject(error);
    }
);

export default api;