export const TRIP_EDITABLE_STATUSES = ['Заплановано', 'Завантаження', 'У дорозі', 'Розвантаження'];
export const isTripEditable = (statusName) => TRIP_EDITABLE_STATUSES.includes(statusName);