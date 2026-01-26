const DEFAULT_COLS = [
    { id: 'name', label: 'Назва' }
];

export const MENU_GROUPS = [
    {
        title: "Керування логістикою",
        items: [
            { 
                label: 'Посилки', 
                path: 'parcels', 
                isCustomPage: true,
                endpoint: 'parcels'
            },
        ]
    },
    {
        title: "Мережа доставки",
        items: [
            { 
                label: 'Відділення', 
                path: 'branches', 
                isCustomPage: true,
                endpoint: 'branches'
            },
            { 
                label: 'Поштомати', 
                path: 'postomats', 
                isCustomPage: true,
                endpoint: 'postomats'
            },
        ]
    },
    {
        title: "Логістика та Автопарк",
        items: [
            { 
                label: 'Магістральні маршрути', 
                path: 'routes', 
                isCustomPage: true,
                endpoint: 'routes' 
            },
            { label: 'Марки авто', path: 'fleet-brands', endpoint: 'fleet-brands', columns: DEFAULT_COLS },
            { label: 'Типи кузовів', path: 'fleet-body-types', endpoint: 'fleet-body-types', columns: DEFAULT_COLS },
            { label: 'Типи пального', path: 'fleet-fuel-types', endpoint: 'fleet-fuel-types', columns: DEFAULT_COLS },
            { label: 'Типи КПП', path: 'fleet-transmission-types', endpoint: 'fleet-transmission-types', columns: DEFAULT_COLS },
            { label: 'Типи приводу', path: 'fleet-drive-types', endpoint: 'fleet-drive-types', columns: DEFAULT_COLS },
            { label: 'Статуси авто', path: 'vehicle-activity-statuses', endpoint: 'vehicle-activity-statuses', columns: DEFAULT_COLS },
        ]
    },
    {
        title: "Вантажі та Пакування",
        items: [
            { label: 'Типи коробок', path: 'box-types', endpoint: 'box-types', columns: DEFAULT_COLS },
            { label: 'Типи посилок', path: 'parcel-types', endpoint: 'parcel-types', columns: DEFAULT_COLS },
            { label: 'Типи відправлень', path: 'shipment-types', endpoint: 'shipment-types', columns: DEFAULT_COLS },
            { label: 'Статуси вантажу', path: 'shipment-statuses', endpoint: 'shipment-statuses', columns: DEFAULT_COLS },
            { 
                label: 'Умови зберігання', 
                path: 'storage-conditions', 
                endpoint: 'storage-conditions',
                columns: [
                    { id: 'name', label: 'Назва' },
                    { id: 'description', label: 'Опис технічних вимог' }
                ]
            },
            { label: 'Причини повернення', path: 'return-reasons', endpoint: 'return-reasons', columns: DEFAULT_COLS },
        ]
    },
    {
        title: "Організація та Фінанси",
        items: [
            { label: 'Типи відділень', path: 'branch-types', endpoint: 'branch-types', columns: DEFAULT_COLS },
            { label: 'Типи оплати', path: 'payment-types', endpoint: 'payment-types', columns: DEFAULT_COLS },
            { label: 'Статуси рейсів', path: 'trip-statuses', endpoint: 'trip-statuses', columns: DEFAULT_COLS },
        ]
    }
];