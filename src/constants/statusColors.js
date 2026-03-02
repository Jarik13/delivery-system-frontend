import {
    RadioButtonUnchecked, PendingActions, LocalShipping,
    MoveToInbox, CheckCircle, WarningAmber
} from '@mui/icons-material';

export const SHIPMENT_STATUS_COLORS = {
    'Створено': '#2196f3',
    'Очікує надходження': '#90caf9',
    'Прийнято у відділенні': '#673ab7',
    'Сортування термінал': '#00bcd4',
    'У дорозі': '#ff9800',
    'Прибув у відділення': '#8bc34a',
    'Видано кур\'єру': '#e91e63',
    'Доставлено': '#2e7d32',
    'Відмова': '#f44336',
    'Втрачено': '#b71c1c',
    'Утилізовано': '#616161',
    'default': '#9e9e9e',
};

export const TRIP_STATUS_CONFIG = {
    'Заплановано': { color: '#2196f3', icon: RadioButtonUnchecked },
    'Завантаження': { color: '#673ab7', icon: PendingActions },
    'В дорозі': { color: '#ff9800', icon: LocalShipping },
    'Розвантаження': { color: '#00bcd4', icon: MoveToInbox },
    'Завершено': { color: '#2e7d32', icon: CheckCircle },
    'Аварійна зупинка': { color: '#f44336', icon: WarningAmber },
    'default': { color: '#9e9e9e', icon: null },
};

export const ROUTE_LIST_STATUS_COLORS = {
    'Сформовано': '#2196f3',
    'Видано кур\'єру': '#e91e63',
    'У процесі доставки': '#ff9800',
    'Завершено': '#2e7d32',
    'Скасовано': '#f44336',
    'default': '#9e9e9e',
};

export const getStatusColor = (colorMap, statusName) => colorMap[statusName] ?? colorMap['default'] ?? '#9e9e9e';