export const ROLES = {
    SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
    ADMIN: 'ROLE_ADMIN',
    EMPLOYEE: 'ROLE_EMPLOYEE',
    DRIVER: 'ROLE_DRIVER',
    COURIER: 'ROLE_COURIER',
};

export const ROLES_META = [
    { value: 'EMPLOYEE', label: 'Працівник', color: '#2196f3' },
    { value: 'COURIER', label: "Кур'єр", color: '#4caf50' },
    { value: 'DRIVER', label: 'Водій', color: '#ff9800' },
    { value: 'ADMIN', label: 'Адміністратор', color: '#9c27b0' },
    { value: 'SUPER_ADMIN', label: 'Супер адмін', color: '#f44336' },
];

export const ROLE_LABELS = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Admin',
    'EMPLOYEE': 'Employee',
    'DRIVER': 'Driver',
    'COURIER': 'Courier'
};

export const getRoleMeta = (roleValue) =>
    ROLES_META.find(r => r.value === roleValue) || { label: roleValue, color: '#757575' };

export const SA = [ROLES.SUPER_ADMIN];
export const A = [ROLES.ADMIN];
export const E = [ROLES.EMPLOYEE];
export const D = [ROLES.DRIVER];
export const C = [ROLES.COURIER];
export const DA = [ROLES.DRIVER, ROLES.ADMIN];
export const ED = [ROLES.EMPLOYEE, ROLES.DRIVER];
export const EC = [ROLES.EMPLOYEE, ROLES.COURIER];
export const DC = [ROLES.DRIVER, ROLES.COURIER];
export const EA = [ROLES.EMPLOYEE, ROLES.ADMIN];
export const EDC = [ROLES.EMPLOYEE, ROLES.DRIVER, ROLES.COURIER];
export const EDA = [ROLES.EMPLOYEE, ROLES.DRIVER, ROLES.ADMIN];
export const ECA = [ROLES.EMPLOYEE, ROLES.COURIER, ROLES.ADMIN];
export const DCA = [ROLES.DRIVER, ROLES.COURIER, ROLES.ADMIN];
export const EDCA = [ROLES.EMPLOYEE, ROLES.DRIVER, ROLES.COURIER, ROLES.ADMIN];