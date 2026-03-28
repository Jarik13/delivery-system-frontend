export const TRIP_EDITABLE_STATUSES = ['Заплановано', 'Завантаження', 'В дорозі', 'Розвантаження'];
export const isTripEditable = (statusName) => TRIP_EDITABLE_STATUSES.includes(statusName);