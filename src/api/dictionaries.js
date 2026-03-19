import api from './axiosConfig';

export const AuthApi = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
};

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
    patch: (endpoint, data) => api.patch(`/${endpoint}`, data),
    delete: (endpoint, id) => api.delete(`/${endpoint}/${id}`),

    exportFile: (endpoint, params = {}, config = {}) => {
        return api.get(`/${endpoint}`, {
            params,
            responseType: 'blob',
            ...config,
        });
    },
};

export const UserApi = {
    getAll: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    delete: (keycloakId) => api.delete(`/users/${keycloakId}`),
    resendEmail: (keycloakId) => api.post(`/users/${keycloakId}/resend-email`),
    updateRole: (keycloakId, role) => api.patch(`/users/${keycloakId}/role`, { role }),
    updateBranch: (keycloakId, branchId) => api.patch(`/users/${keycloakId}/branch`, { branchId }),
};