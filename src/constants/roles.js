export const ROLES_META = [
    { value: 'EMPLOYEE', label: 'Працівник', color: '#2196f3' },
    { value: 'COURIER', label: "Кур'єр", color: '#4caf50' },
    { value: 'DRIVER', label: 'Водій', color: '#ff9800' },
    { value: 'ADMIN', label: 'Адміністратор', color: '#9c27b0' },
    { value: 'SUPER_ADMIN', label: 'Супер адмін', color: '#f44336' },
];

export const getRoleMeta = (roleValue) => ROLES_META.find(r => r.value === roleValue) || { label: roleValue, color: '#757575' };