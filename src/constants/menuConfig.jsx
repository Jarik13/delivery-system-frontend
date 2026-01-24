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
    TripOrigin, ListAlt, ChecklistRtl, Event, Inbox, Storage
} from '@mui/icons-material';

// 1. КОЛЬОРИ ГРУП
export const GROUP_COLORS = {
    "Мережа доставки": '#2196f3',
    "Відділення": '#4caf50',
    "Поштомати": '#ff9800',
    "Логістика та Автопарк": '#f44336',
    "Вантажі та Пакування": '#9c27b0',
    "Організація та Фінанси": '#009688',
    "default": '#757575'
};

// 2. ІКОНКИ ГРУП
export const groupIcons = {
    "Мережа доставки": <Business />,
    "Відділення": <Apartment />,
    "Поштомати": <LocalPostOffice />,
    "Логістика та Автопарк": <LocalShipping />,
    "Вантажі та Пакування": <Inventory />,
    "Організація та Фінанси": <AttachMoney />
};

// 3. ІКОНКИ ПУНКТІВ МЕНЮ
export const itemIcons = {
    // ========== МЕРЕЖА ДОСТАВКИ ==========
    "regions": <Public />,
    "districts": <Place />,
    "cities": <LocationCity />,
    "streets": <AltRoute />,
    "address-houses": <Home />,

    // ========== ВІДДІЛЕННЯ ==========
    "branches": <Apartment />,
    "branch-types": <LocalConvenienceStore />,
    "work-schedules": <Schedule />,
    "work-time-intervals": <AccessTime />,
    "delivery-points": <LocationOn />,

    // ========== ПОШТОМАТИ ==========
    "postomats": <AllInbox />,

    // ========== ВАНТАЖІ ТА ПАКУВАННЯ ==========
    "shipments": <LocalShipping />,
    "parcels": <Inventory />,
    "parcel-types": <Category />,
    "box-types": <Inbox />,
    "box-variants": <Storage />,
    "shipment-types": <Category />,
    "shipment-statuses": <TrackChanges />,
    "storage-conditions": <AcUnit />,
    "returns": <AssignmentReturned />,
    "return-reasons": <HelpOutline />,

    // ========== ЛОГІСТИКА ТА АВТОПАРК ==========
    "routes": <AltRoute />,
    "fleets": <DirectionsCarFilled />,
    "vehicles": <DirectionsCarOutlined />,
    "fleet-brands": <DirectionsCar />,
    "fleet-body-types": <AirportShuttle />,
    "fleet-fuel-types": <EvStation />,
    "fleet-transmission-types": <SettingsInputComponent />,
    "fleet-drive-types": <SettingsEthernet />,
    "vehicle-activity-statuses": <BuildCircle />,
    "drivers": <AirlineSeatReclineNormal />,
    "trips": <DirectionsBus />,
    "trip-statuses": <TripOrigin />,

    // ========== ОРГАНІЗАЦІЯ ТА ФІНАНСИ ==========
    "clients": <People />,
    "employees": <Badge />,
    "couriers": <DeliveryDining />,
    "payment-types": <LocalAtm />,
    "payments": <Payments />,
    "waybills": <Assignment />,
    "route-lists": <ListAlt />,
    "route-list-statuses": <ChecklistRtl />,
    "days-of-week": <Event />
};