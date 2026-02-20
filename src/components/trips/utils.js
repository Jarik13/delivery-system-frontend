import L from 'leaflet';

export const cleanCityName = (name) => {
    if (!name) return '';
    return name
        .replace(/^(місто|м\.|село|с\.|смт\.?|селище міського типу|селище|smt\.?)\s+/i, '')
        .trim();
};

export const fetchCoordinates = async (cityName) => {
    const clean = cleanCityName(cityName);
    if (!clean) return null;
    try {
        const params = new URLSearchParams({ city: clean, countrycodes: 'ua', format: 'json', limit: '1', 'accept-language': 'uk' });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) { console.warn('Nominatim structured failed:', e); }
    try {
        const params = new URLSearchParams({ q: `${clean}, Україна`, format: 'json', limit: '1', 'accept-language': 'uk' });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) { console.warn('Nominatim q-query failed:', e); }
    return null;
};

export const makeColoredIcon = (color, label) => L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
});

export const toDatetimeLocal = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
};

export const initialForm = { driverId: null, vehicleId: null, scheduledDeparture: '', scheduledArrival: '' };

let segIdCounter = 0;
export const makeSegment = (overrides = {}) => ({
    id: `seg-${++segIdCounter}`,
    regionId: null,
    districtId: null,
    cityId: null,
    cityName: '',
    lat: null,
    lng: null,
    ...overrides,
});

export const initialSegments = () => [makeSegment(), makeSegment()];

export const STEPS = [
    { label: 'Екіпаж', icon: 1 },
    { label: 'Маршрут', icon: 2 },
    { label: 'Розклад', icon: 3 },
];

export const stepVariants = {
    enter: (d) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d < 0 ? 80 : -80, opacity: 0 }),
};