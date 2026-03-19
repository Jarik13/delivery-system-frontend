export const NON_EDITABLE_STATUSES = new Set([
    'Доставлено',
    'Відмова',
    'Втрачено',
    'Утилізовано',
]);

export const isShipmentEditable = (statusName) => !NON_EDITABLE_STATUSES.has(statusName);