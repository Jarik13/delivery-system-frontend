import { Money, CreditCard, AccountBalanceWallet, AccountBalance, PointOfSale } from '@mui/icons-material';

export const PAYMENT_TYPE_CONFIG = {
    'Готівка': { color: '#4caf50', icon: Money },
    'Картка': { color: '#2196f3', icon: CreditCard },
    'Онлайн-оплата': { color: '#9c27b0', icon: AccountBalanceWallet },
    'Безготівковий розрахунок': { color: '#00bcd4', icon: AccountBalance },
    'Післяплата (накладений платіж)': { color: '#ff9800', icon: PointOfSale },
    'default': { color: '#9e9e9e', icon: AccountBalanceWallet },
};

export const SHIPMENT_TYPE_COLORS = {
    'Стандартна': '#2196f3',
    'Експрес': '#ff9800',
    'default': '#9e9e9e',
};

export const BRANCH_TYPE_COLORS = {
    'Вантажне відділення': '#795548',
    'Відділення': '#2196f3',
    'Пункт приймання-видачі': '#00bcd4',
    'Мобільне відділення': '#ff9800',
    'Міні-відділення': '#8bc34a',
    'Сортувальний пункт': '#673ab7',
    'default': '#9e9e9e',
};

export const RETURN_REASON_COLORS = {
    'Відмова отримувача': '#f44336',
    'Пошкоджено': '#ff9800',
    'Неправильна адреса': '#9c27b0',
    'Не забрали вчасно': '#795548',
    'За ініціативою відправника': '#2196f3',
    'default': '#9e9e9e',
};

export const getTypeConfig = (configMap, name) => configMap[name] ?? configMap['default'];
export const getTypeColor = (colorMap, typeName) => colorMap[typeName] ?? colorMap['default'] ?? '#9e9e9e';