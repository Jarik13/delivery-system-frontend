import api from './axiosConfig';

export const AuthApi = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
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
    getProfile: () => api.get('/employees/me'),

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
    getProfile: () => api.get('/profile'),
    updateProfile: (data) => api.put('/profile', data),
    getRolePermissions: (roleName) => api.get(`/roles/${roleName}/permissions`),
    updateRolePermissions: (roleName, permissions) => api.put(`/roles/${roleName}/permissions`, permissions),
    getRoles: () => api.get('/roles'),
};

export const DdlApi = {
    getAllTables: () => api.get('/ddl/tables'),
    getTableInfo: (tableName) => api.get(`/ddl/tables/${tableName}`),
 
    addColumn: (data) => api.post('/ddl/columns', data),
    dropColumn: (data) => api.delete('/ddl/columns', { data }),
    alterColumn: (data) => api.put('/ddl/columns', data),
 
    setDefault: (data) => api.put('/ddl/columns/default', data),
 
    addConstraint: (data) => api.post('/ddl/constraints', data),
    dropConstraint: (data) => api.delete('/ddl/constraints', { data }),

    addIndex: (data) => api.post('/ddl/indexes', data),
    dropIndex: (data) => api.delete('/ddl/indexes', { data }),
};