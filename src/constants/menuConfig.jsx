import React from 'react';
import {
    Business, Apartment, LocalPostOffice, LocalShipping, DirectionsCar, AttachMoney,
    LocationCity, Category, People, Inventory,
    LocalAtm, Assignment, Public, Place, Home,
    LocationOn, AltRoute, Badge, DeliveryDining,
    Payments, AssignmentReturned, LocalConvenienceStore,
    AirportShuttle, AirlineSeatReclineNormal, DirectionsBus,
    BuildCircle, SettingsEthernet, SettingsInputComponent, EvStation,
    DirectionsCarFilled, DirectionsCarOutlined,
    Schedule, AccessTime, AllInbox, TrackChanges, AcUnit, HelpOutline,
    TripOrigin, ListAlt, ChecklistRtl, Event, Inbox, Storage,
    Receipt,
    AdminPanelSettings,
} from '@mui/icons-material';

export const GROUPS = {
    LOGISTICS: "Керування логістикою",
    NETWORK: "Мережа доставки",
    FLEET: "Логістика та Автопарк",
    PACKAGING: "Вантажі та Пакування",
    FINANCE: "Організація та Фінанси",
    ADMIN: "Адміністрування",
};

export const GROUP_COLORS = {
    [GROUPS.LOGISTICS]: '#673ab7',
    [GROUPS.NETWORK]: '#2196f3',
    [GROUPS.FLEET]: '#f44336',
    [GROUPS.PACKAGING]: '#9c27b0',
    [GROUPS.FINANCE]: '#009688',
    [GROUPS.ADMIN]: '#f44336',
    "default": '#757575'
};

export const groupIcons = {
    [GROUPS.LOGISTICS]: <Inventory />,
    [GROUPS.NETWORK]: <Business />,
    [GROUPS.FLEET]: <LocalShipping />,
    [GROUPS.PACKAGING]: <Inbox />,
    [GROUPS.FINANCE]: <AttachMoney />,
    [GROUPS.ADMIN]: <AdminPanelSettings />,
};


export const ITEM_GROUP_MAP = {
    "parcels": GROUPS.LOGISTICS,
    "shipments": GROUPS.LOGISTICS,
    "payments": GROUPS.LOGISTICS,
    "returns": GROUPS.LOGISTICS,
    "trips": GROUPS.LOGISTICS,
    "waybills": GROUPS.LOGISTICS,
    "route-lists": GROUPS.LOGISTICS,

    "branches": GROUPS.NETWORK,
    "postomats": GROUPS.NETWORK,
    "regions": GROUPS.NETWORK,
    "districts": GROUPS.NETWORK,
    "cities": GROUPS.NETWORK,
    "streets": GROUPS.NETWORK,
    "address-houses": GROUPS.NETWORK,
    "delivery-points": GROUPS.NETWORK,

    "routes": GROUPS.FLEET,
    "fleet-brands": GROUPS.FLEET,
    "fleet-body-types": GROUPS.FLEET,
    "fleet-fuel-types": GROUPS.FLEET,
    "fleet-transmission-types": GROUPS.FLEET,
    "fleet-drive-types": GROUPS.FLEET,
    "vehicle-activity-statuses": GROUPS.FLEET,
    "fleets": GROUPS.FLEET,
    "vehicles": GROUPS.FLEET,
    "drivers": GROUPS.FLEET,
    "trip-statuses": GROUPS.FLEET,

    "box-types": GROUPS.PACKAGING,
    "parcel-types": GROUPS.PACKAGING,
    "shipment-types": GROUPS.PACKAGING,
    "shipment-statuses": GROUPS.PACKAGING,
    "storage-conditions": GROUPS.PACKAGING,
    "return-reasons": GROUPS.PACKAGING,
    "box-variants": GROUPS.PACKAGING,
    "route-list-statuses": GROUPS.FINANCE,

    "branch-types": GROUPS.FINANCE,
    "payment-types": GROUPS.FINANCE,
    "clients": GROUPS.FINANCE,
    "employees": GROUPS.FINANCE,

    "users": GROUPS.ADMIN,
    "admin": GROUPS.ADMIN,
    "ddl": GROUPS.ADMIN,
};

// --- 5. ІКОНКИ ПУНКТІВ МЕНЮ ---
export const itemIcons = {
    "parcels": <Inventory />,
    "regions": <Public />,
    "districts": <Place />,
    "cities": <LocationCity />,
    "streets": <AltRoute />,
    "address-houses": <Home />,
    "branches": <Apartment />,
    "branch-types": <LocalConvenienceStore />,
    "postomats": <AllInbox />,
    "shipments": <LocalShipping />,
    "parcel-types": <Category />,
    "box-types": <Inbox />,
    "storage-conditions": <AcUnit />,
    "return-reasons": <HelpOutline />,
    "routes": <AltRoute />,
    "fleet-brands": <DirectionsCar />,
    "fleet-body-types": <AirportShuttle />,
    "fleet-fuel-types": <EvStation />,
    "fleet-transmission-types": <SettingsInputComponent />,
    "fleet-drive-types": <SettingsEthernet />,
    "vehicle-activity-statuses": <BuildCircle />,
    "trip-statuses": <TripOrigin />,
    "payment-types": <LocalAtm />,
    "clients": <People />,
    "employees": <Badge />,
    "trips": <DirectionsBus />,
    "waybills": <Receipt />,
    "route-lists": <ListAlt />,
    "route-list-statuses": <ChecklistRtl />,
    "payments": <Payments />,
    "returns": <AssignmentReturned />,
    "admin": <AdminPanelSettings />,
    "users": <People />,
    "ddl": <Storage />,
};