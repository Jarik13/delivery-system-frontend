import { Person, Inventory2 } from '@mui/icons-material';

export const STEPS = [
    { label: 'Кур\'єр та виїзд', icon: Person },
    { label: 'Відправлення', icon: Inventory2 },
];

export const MAX_WEIGHT = 100;
export const MAX_SHIPMENTS = 13;

export const formatCourierName = (c) => {
    if (!c) return '';
    return `${c.lastName || ''} ${c.firstName || ''} ${c.middleName || ''}`.trim() || `Кур'єр №${c.id}`;
};

export const calcTotals = (shipments) => ({
    weight: shipments.reduce((s, sh) => s + (sh.weight ?? 0), 0),
    count: shipments.length,
});