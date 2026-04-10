import { ROLES } from "./roles";

const DEFAULT_COLS = [{ id: 'name', label: 'Назва' }];

export const MENU_GROUPS = [
    {
        title: "Керування логістикою",
        roles: [ROLES.EMPLOYEE, ROLES.DRIVER, ROLES.COURIER],
        items: [
            { label: 'Відправлення', path: 'shipments', isCustomPage: true, endpoint: 'shipments', roles: [ROLES.EMPLOYEE] },
            { label: 'Рейси', path: 'trips', isCustomPage: true, endpoint: 'trips', roles: [ROLES.EMPLOYEE, ROLES.DRIVER] },
            { label: 'Накладні', path: 'waybills', isCustomPage: true, endpoint: 'waybills', roles: [ROLES.EMPLOYEE] },
            { label: 'Маршрутні листи', path: 'route-lists', isCustomPage: true, endpoint: 'route-lists', roles: [ROLES.EMPLOYEE, ROLES.COURIER] },
        ]
    },
    {
        title: "Мережа доставки",
        roles: [ROLES.ADMIN],
        items: [
            { label: 'Відділення', path: 'branches', isCustomPage: true, endpoint: 'branches', roles: [ROLES.ADMIN] },
            { label: 'Поштомати', path: 'postomats', isCustomPage: true, endpoint: 'postomats', roles: [ROLES.ADMIN] },
        ]
    },
    {
        title: "Логістика та Автопарк",
        roles: [ROLES.DRIVER, ROLES.ADMIN],
        items: [
            { label: 'Магістральні маршрути', path: 'routes', isCustomPage: true, endpoint: 'routes', roles: [ROLES.DRIVER, ROLES.ADMIN] },
            { label: 'Марки авто', path: 'fleet-brands', endpoint: 'fleet-brands', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Типи кузовів', path: 'fleet-body-types', endpoint: 'fleet-body-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Типи пального', path: 'fleet-fuel-types', endpoint: 'fleet-fuel-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Типи КПП', path: 'fleet-transmission-types', endpoint: 'fleet-transmission-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Типи приводу', path: 'fleet-drive-types', endpoint: 'fleet-drive-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Статуси авто', path: 'vehicle-activity-statuses', endpoint: 'vehicle-activity-statuses', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Статуси рейсів', path: 'trip-statuses', endpoint: 'trip-statuses', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
        ]
    },
    {
        title: "Вантажі та Пакування",
        roles: [ROLES.ADMIN],
        items: [
            { label: 'Типи коробок', path: 'box-types', endpoint: 'box-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Типи посилок', path: 'parcel-types', endpoint: 'parcel-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Типи відправлень', path: 'shipment-types', endpoint: 'shipment-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Статуси вантажу', path: 'shipment-statuses', endpoint: 'shipment-statuses', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            {
                label: 'Умови зберігання', path: 'storage-conditions', endpoint: 'storage-conditions',
                columns: [{ id: 'name', label: 'Назва' }, { id: 'description', label: 'Опис технічних вимог' }],
                roles: [ROLES.ADMIN]
            },
            { label: 'Причини повернення', path: 'return-reasons', endpoint: 'return-reasons', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Статуси маршрутних листів', path: 'route-list-statuses', endpoint: 'route-list-statuses', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
        ]
    },
    {
        title: "Організація та Фінанси",
        roles: [ROLES.ADMIN],
        items: [
            { label: 'Типи відділень', path: 'branch-types', endpoint: 'branch-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
            { label: 'Типи оплати', path: 'payment-types', endpoint: 'payment-types', columns: DEFAULT_COLS, roles: [ROLES.ADMIN] },
        ]
    },
    {
        title: "Адміністрування",
        roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
        items: [
            { label: 'Управління користувачами', path: 'super-admin', isCustomPage: true, endpoint: 'super-admin', roles: [ROLES.SUPER_ADMIN] },
            { label: 'Управління структурою БД', path: 'ddl', isCustomPage: true, endpoint: 'ddl', roles: [ROLES.SUPER_ADMIN] },
            { label: 'Аналітика', path: 'admin', isCustomPage: true, endpoint: 'admin', roles: [ROLES.ADMIN] },
        ]
    },
];