import { A, E, SA, ED, DA, EDC, ROLES } from "./roles";

const DEFAULT_COLS = [{ id: 'name', label: 'Назва' }];

export const MENU_GROUPS = [
    {
        title: "Керування логістикою",
        roles: EDC,
        items: [
            { label: 'Відправлення', path: 'shipments', isCustomPage: true, endpoint: 'shipments', roles: E },
            { label: 'Посилки', path: 'parcels', isCustomPage: true, endpoint: 'parcels', roles: E },
            { label: 'Платежі', path: 'payments', isCustomPage: true, endpoint: 'payments', roles: E },
            { label: 'Повернення', path: 'returns', isCustomPage: true, endpoint: 'returns', roles: E },
            { label: 'Рейси', path: 'trips', isCustomPage: true, endpoint: 'trips', roles: ED },
            { label: 'Накладні', path: 'waybills', isCustomPage: true, endpoint: 'waybills', roles: ED },
            { label: 'Маршрутні листи', path: 'route-lists', isCustomPage: true, endpoint: 'route-lists', roles: EDC },
        ]
    },
    {
        title: "Мережа доставки",
        roles: ED,
        items: [
            { label: 'Відділення', path: 'branches', isCustomPage: true, endpoint: 'branches', roles: ED },
            { label: 'Поштомати', path: 'postomats', isCustomPage: true, endpoint: 'postomats', roles: ED },
        ]
    },
    {
        title: "Логістика та Автопарк",
        roles: DA,
        items: [
            { label: 'Магістральні маршрути', path: 'routes', isCustomPage: true, endpoint: 'routes', roles: [ROLES.DRIVER] },
            { label: 'Марки авто', path: 'fleet-brands', endpoint: 'fleet-brands', columns: DEFAULT_COLS, roles: DA },
            { label: 'Типи кузовів', path: 'fleet-body-types', endpoint: 'fleet-body-types', columns: DEFAULT_COLS, roles: DA },
            { label: 'Типи пального', path: 'fleet-fuel-types', endpoint: 'fleet-fuel-types', columns: DEFAULT_COLS, roles: DA },
            { label: 'Типи КПП', path: 'fleet-transmission-types', endpoint: 'fleet-transmission-types', columns: DEFAULT_COLS, roles: DA },
            { label: 'Типи приводу', path: 'fleet-drive-types', endpoint: 'fleet-drive-types', columns: DEFAULT_COLS, roles: DA },
            { label: 'Статуси авто', path: 'vehicle-activity-statuses', endpoint: 'vehicle-activity-statuses', columns: DEFAULT_COLS, roles: DA },
            { label: 'Статуси рейсів', path: 'trip-statuses', endpoint: 'trip-statuses', columns: DEFAULT_COLS, roles: DA },
        ]
    },
    {
        title: "Вантажі та Пакування",
        roles: A,
        items: [
            { label: 'Типи коробок', path: 'box-types', endpoint: 'box-types', columns: DEFAULT_COLS, roles: A },
            { label: 'Типи посилок', path: 'parcel-types', endpoint: 'parcel-types', columns: DEFAULT_COLS, roles: A },
            { label: 'Типи відправлень', path: 'shipment-types', endpoint: 'shipment-types', columns: DEFAULT_COLS, roles: A },
            { label: 'Статуси вантажу', path: 'shipment-statuses', endpoint: 'shipment-statuses', columns: DEFAULT_COLS, roles: A },
            {
                label: 'Умови зберігання', path: 'storage-conditions', endpoint: 'storage-conditions',
                columns: [{ id: 'name', label: 'Назва' }, { id: 'description', label: 'Опис технічних вимог' }], roles: A
            },
            { label: 'Причини повернення', path: 'return-reasons', endpoint: 'return-reasons', columns: DEFAULT_COLS, roles: A },
            { label: 'Статуси маршрутних листів', path: 'route-list-statuses', endpoint: 'route-list-statuses', columns: DEFAULT_COLS, roles: A },
        ]
    },
    {
        title: "Організація та Фінанси",
        roles: A,
        items: [
            { label: 'Типи відділень', path: 'branch-types', endpoint: 'branch-types', columns: DEFAULT_COLS, roles: A },
            { label: 'Типи оплати', path: 'payment-types', endpoint: 'payment-types', columns: DEFAULT_COLS, roles: A },
        ]
    },
    {
        title: "Адміністрування",
        roles: SA,
        items: [
            { label: 'Управління користувачами', path: 'admin', isCustomPage: true, endpoint: 'admin', roles: SA },
        ]
    },
];