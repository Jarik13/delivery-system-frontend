import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, Chip, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Tooltip, alpha, useTheme, TablePagination,
    Snackbar, Alert, Divider, CircularProgress,
    Card,
    CardContent,
    Collapse,
    Grid,
    Stack
} from '@mui/material';
import {
    LocalShipping, Close, Map as MapIcon, Schedule, CheckCircle,
    RadioButtonUnchecked, ArrowForward, Person, DirectionsCar,
    Inventory, Add, Edit, Delete,
    ExpandMore,
    AccessTime,
    Scale,
    LocationOn,
    ExpandLess,
    ArrowRightAlt,
    Straighten
} from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const LeafletMap = ({ origin, destination, waypoints = [] }) => {
    const mapRef = useRef(null);
    const instanceRef = useRef(null);

    useEffect(() => {
        if (!window.L || !mapRef.current) return;
        if (instanceRef.current) { instanceRef.current.remove(); }

        const allPoints = [origin, ...waypoints, destination].filter(Boolean);
        if (!allPoints.length) return;

        const map = window.L.map(mapRef.current, { zoomControl: true });
        instanceRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const CITY_COORDS = {
            'Київ': [50.45, 30.52], 'київ': [50.45, 30.52], 'місто київ': [50.45, 30.52],
            'Львів': [49.84, 24.02], 'львів': [49.84, 24.02], 'місто львів': [49.84, 24.02],
            'Харків': [49.99, 36.23], 'харків': [49.99, 36.23],
            'Одеса': [46.48, 30.72], 'одеса': [46.48, 30.72],
            'Дніпро': [48.46, 35.04], 'дніпро': [48.46, 35.04],
            'Запоріжжя': [47.85, 35.12], 'запоріжжя': [47.85, 35.12],
            'Вінниця': [49.23, 28.47], 'вінниця': [49.23, 28.47],
            'Миколаїв': [46.97, 32.00], 'миколаїв': [46.97, 32.00], 'місто миколаїв': [46.97, 32.00],
            'Херсон': [46.64, 32.62], 'херсон': [46.64, 32.62],
            'Полтава': [49.59, 34.54], 'полтава': [49.59, 34.54],
            'Суми': [50.91, 34.80], 'суми': [50.91, 34.80],
            'Чернігів': [51.49, 31.29], 'чернігів': [51.49, 31.29],
            'Черкаси': [49.44, 32.06], 'черкаси': [49.44, 32.06],
            'Рівне': [50.62, 26.25], 'рівне': [50.62, 26.25], 'місто рівне': [50.62, 26.25],
            'Луцьк': [50.75, 25.34], 'луцьк': [50.75, 25.34],
            'Тернопіль': [49.55, 25.59], 'тернопіль': [49.55, 25.59],
            'Хмельницький': [49.42, 26.99], 'хмельницький': [49.42, 26.99],
            'Івано-Франківськ': [48.92, 24.71], 'івано-франківськ': [48.92, 24.71],
            'Ужгород': [48.62, 22.30], 'ужгород': [48.62, 22.30],
            'Чернівці': [48.29, 25.94], 'чернівці': [48.29, 25.94],
            'Житомир': [50.25, 28.66], 'житомир': [50.25, 28.66],
            'Кропивницький': [48.51, 32.27], 'кропивницький': [48.51, 32.27],
        };

        const getCoords = (cityName) => {
            if (!cityName) return null;
            const lower = cityName.toLowerCase().trim();
            for (const [key, val] of Object.entries(CITY_COORDS)) {
                if (lower.includes(key.toLowerCase())) return val;
            }
            return null;
        };

        const coords = allPoints.map(p => getCoords(p.cityName || p)).filter(Boolean);
        if (coords.length < 2) {
            map.setView([49.0, 31.0], 6);
            return;
        }

        const svgIcon = (color, label) => window.L.divIcon({
            html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${label}</div>`,
            className: '', iconSize: [32, 32], iconAnchor: [16, 16]
        });

        coords.forEach((coord, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === coords.length - 1;
            const color = isFirst ? '#4CAF50' : isLast ? '#F44336' : '#2196F3';
            const label = isFirst ? 'A' : isLast ? 'B' : String(idx);
            window.L.marker(coord, { icon: svgIcon(color, label) })
                .addTo(map)
                .bindPopup(allPoints[idx]?.cityName || allPoints[idx] || `Вузол ${idx}`);
        });

        window.L.polyline(coords, {
            color: '#1976d2', weight: 3, opacity: 0.8, dashArray: '8, 6'
        }).addTo(map);

        const bounds = window.L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [40, 40] });

        return () => { if (instanceRef.current) instanceRef.current.remove(); };
    }, [origin, destination, waypoints]);

    return <div ref={mapRef} style={{ width: '100%', height: '420px', borderRadius: 8, zIndex: 0 }} />;
};

const StatusChip = ({ status }) => {
    const config = {
        'Заплановано': { color: '#1976d2', bg: '#e3f2fd', icon: <RadioButtonUnchecked sx={{ fontSize: 13 }} /> },
        'Завантаження': { color: '#00bcd4', bg: '#e0f7fa', icon: <PendingActions sx={{ fontSize: 13 }} /> },
        'В дорозі': { color: '#f57c00', bg: '#fff3e0', icon: <LocalShipping sx={{ fontSize: 13 }} /> },
        'Розвантаження': { color: '#673ab7', bg: '#ede7f6', icon: <MoveToInbox sx={{ fontSize: 13 }} /> },
        'Завершено': { color: '#388e3c', bg: '#e8f5e9', icon: <CheckCircle sx={{ fontSize: 13 }} /> },
        'Аварійна зупинка': { color: '#d32f2f', bg: '#ffebee', icon: <WarningAmber sx={{ fontSize: 13 }} /> },
    };
    const cfg = config[status] || { color: '#666', bg: '#f5f5f5', icon: null };
    return (
        <Chip
            icon={cfg.icon}
            label={status}
            size="small"
            sx={{
                bgcolor: cfg.bg, color: cfg.color,
                fontWeight: 700, fontSize: '0.7rem',
                border: `1px solid ${alpha(cfg.color, 0.3)}`,
                height: 24
            }}
        />
    );
};

const TripCard = ({ trip, color, onMap, onDelete }) => {
    const [expanded, setExpanded] = useState(false);

    const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <Card sx={{
            mb: 2, ml: 6.5, borderRadius: 4, border: '1px solid #eee',
            transition: 'all 0.2s ease-in-out',
            position: 'relative',
            '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                borderColor: alpha(color, 0.3)
            }
        }} elevation={0}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1 }}>
                        <Box sx={{ minWidth: 65, textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight="900" sx={{ color, lineHeight: 1 }}>
                                №{trip.tripNumber}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" display="block" fontWeight="800" sx={{ fontSize: '0.7rem' }}>
                                    {formatTime(trip.scheduledDepartureTime)}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.disabled" fontWeight="600" sx={{ fontSize: '0.6rem' }}>
                                    {formatTime(trip.scheduledArrivalTime)}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />

                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {trip.originCity} <ArrowRightAlt sx={{ fontSize: 16, color: 'text.disabled' }} /> {trip.destinationCity}
                            </Typography>

                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                    <Scale sx={{ fontSize: 13 }} />
                                    <Typography variant="caption" fontWeight="600">{trip.totalWeight || 0} кг</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                    <Straighten sx={{ fontSize: 13 }} />
                                    <Typography variant="caption" fontWeight="600">{trip.distanceKm || 0} км</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                    <LocationOn sx={{ fontSize: 13 }} />
                                    <Typography variant="caption" fontWeight="600">{trip.waypoints?.length || 0} точок</Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusChip status={trip.status} />
                            <IconButton
                                size="small"
                                onClick={() => setExpanded(!expanded)}
                                sx={{ bgcolor: expanded ? alpha(color, 0.1) : 'transparent' }}
                            >
                                {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">
                            {trip.vehiclePlate} • {trip.driverName.split(' ')[0]}
                        </Typography>
                    </Box>
                </Box>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f0f0f0' }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" fontWeight="800" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, textTransform: 'uppercase' }}>
                                    <AccessTime sx={{ fontSize: 16 }} /> Журнал часу
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Виїзд (План / Факт):</Typography>
                                        <Typography variant="body2" fontWeight="700">
                                            {formatTime(trip.scheduledDepartureTime)} /
                                            <Box component="span" sx={{ ml: 1, color: trip.actualDepartureTime ? 'success.main' : 'text.disabled' }}>
                                                {formatTime(trip.actualDepartureTime)}
                                            </Box>
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Прибуття (План / Факт):</Typography>
                                        <Typography variant="body2" fontWeight="700">
                                            {formatTime(trip.scheduledArrivalTime)} /
                                            <Box component="span" sx={{ ml: 1, color: trip.actualArrivalTime ? 'success.main' : 'text.disabled' }}>
                                                {formatTime(trip.actualArrivalTime)}
                                            </Box>
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" fontWeight="800" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, textTransform: 'uppercase' }}>
                                    <LocalShipping sx={{ fontSize: 16 }} /> Завантаження
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fafafa', borderStyle: 'dashed' }}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary" display="block">Посилок</Typography>
                                            <Typography variant="body2" fontWeight="800">{trip.shipmentsCount} шт</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary" display="block">Вага</Typography>
                                            <Typography variant="body2" fontWeight="800">{trip.totalWeight || 0} кг</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" fontWeight="800" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, textTransform: 'uppercase' }}>
                                    <LocationOn sx={{ fontSize: 16 }} /> Проміжні зупинки
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                    {trip.waypoints?.map((wp, i) => (
                                        <Chip
                                            key={i}
                                            label={wp}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                borderColor: alpha(color, 0.2),
                                                bgcolor: 'white'
                                            }}
                                        />
                                    ))}
                                    {(!trip.waypoints || trip.waypoints.length === 0) && (
                                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                            Прямий маршрут (без зупинок)
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f9f9f9', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                            <Button
                                size="small"
                                startIcon={<MapIcon />}
                                onClick={() => onMap(trip)}
                                sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}
                            >
                                Переглянути шлях
                            </Button>
                            <Button
                                size="small"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => onDelete(trip.id)}
                                sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}
                            >
                                Видалити
                            </Button>
                        </Box>
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

const TripsPage = () => {
    const theme = useTheme();
    const groupName = ITEM_GROUP_MAP['trips'] || 'logistics';
    const mainColor = GROUP_COLORS[groupName] || '#1976d2';

    const [trips, setTrips] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const [statuses, setStatuses] = useState([]);

    const [mapTrip, setMapTrip] = useState(null);
    const [leafletReady, setLeafletReady] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const [filters, setFilters] = useState({
        tripNumber: '',
        tripStatusId: '',
        scheduledDepartureFrom: null,
        scheduledDepartureTo: null,
        actualArrivalFrom: null,
        actualArrivalTo: null,
        // можна додати driverId та vehicleId якщо потрібно
    });

    useEffect(() => {
        if (window.L) { setLeafletReady(true); return; }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setLeafletReady(true);
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        const loadReferences = async () => {
            try {
                const sRes = await DictionaryApi.getAll('trip-statuses', 0, 100);
                setStatuses(sRes.data.content || []);
            } catch (error) {
                console.error("Помилка завантаження статусів", error);
            }
        };
        loadReferences();
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );

            const res = await DictionaryApi.getAll('trips', page, rowsPerPage, activeFilters);
            setTrips(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
        } catch {
            setNotification({ open: true, message: 'Помилка завантаження рейсів', severity: 'error' });
        } finally { setLoading(false); }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const t = setTimeout(loadData, 400);
        return () => clearTimeout(t);
    }, [loadData]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleClearFilters = () => {
        setFilters({
            tripNumber: '',
            tripStatusId: '',
            scheduledDepartureFrom: null,
            scheduledDepartureTo: null,
            actualArrivalFrom: null,
            actualArrivalTo: null
        });
        setPage(0);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Видалити цей рейс?')) return;
        try {
            await DictionaryApi.delete('trips', id);
            loadData();
            setNotification({ open: true, message: 'Рейс видалено', severity: 'success' });
        } catch {
            setNotification({ open: true, message: 'Помилка при видаленні', severity: 'error' });
        }
    };

    const filterFields = [
        { name: 'tripNumber', label: 'Номер рейсу', type: 'text' },
        { name: 'tripStatusId', label: 'Статус', type: 'select', options: statuses },
        { name: 'scheduledDepartureFrom', label: 'Виїзд (з)', type: 'datetime' },
        { name: 'scheduledDepartureTo', label: 'Виїзд (до)', type: 'datetime' },
        { name: 'actualArrivalFrom', label: 'Прибуття (з)', type: 'datetime' },
        { name: 'actualArrivalTo', label: 'Прибуття (до)', type: 'datetime' },
    ];

    const grouped = trips.reduce((acc, trip) => {
        const date = trip.scheduledDepartureTime
            ? new Date(trip.scheduledDepartureTime).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })
            : 'Без дати';
        if (!acc[date]) acc[date] = [];
        acc[date].push(trip);
        return acc;
    }, {});

    return (
        <Box sx={{ px: 2, pb: 4, pt: 0 }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.8)} 100%)`,
                color: 'white', borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.3)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '50%', display: 'flex' }}>
                        <LocalShipping fontSize="medium" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Магістральні рейси</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                            Керування логістичною мережею • {totalElements} рейсів
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained" size="small"
                    sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                    startIcon={<Add />}
                >
                    Новий рейс
                </Button>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
                fields={filterFields}
                searchPlaceholder="Пошук за номером №..."
                quickFilters={['tripStatusId']}
            />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: mainColor }} />
                </Box>
            ) : (
                <Box sx={{ maxWidth: 850, mx: 'auto' }}>
                    {Object.entries(grouped).map(([date, dayTrips]) => (
                        <Box key={date} sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, ml: 6.5 }}>
                                <Typography variant="caption" fontWeight="800"
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1.2, color: 'text.disabled', fontSize: '0.7rem' }}>
                                    {date}
                                </Typography>
                                <Divider sx={{ flex: 1 }} />
                                <Chip
                                    label={`${dayTrips.length} рейсів`}
                                    size="small"
                                    sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(mainColor, 0.05), color: mainColor, fontWeight: 700 }}
                                />
                            </Box>

                            <Stack spacing={0.5}>
                                {dayTrips.map(trip => (
                                    <TripCard
                                        key={trip.id}
                                        trip={trip}
                                        color={mainColor}
                                        onMap={() => setMapTrip(trip)}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    ))}

                    {trips.length === 0 && !loading && (
                        <Box sx={{ textAlign: 'center', py: 12, color: 'text.disabled', bgcolor: 'white', borderRadius: 4, border: '1px dashed #ccc' }}>
                            <LocalShipping sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
                            <Typography variant="h6" fontWeight="700">Рейсів не знайдено</Typography>
                            <Typography variant="body2">Спробуйте змінити параметри фільтрації</Typography>
                        </Box>
                    )}
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <TablePagination
                    component={Paper}
                    elevation={0}
                    variant="outlined"
                    count={totalElements}
                    page={page}
                    onPageChange={(e, n) => setPage(n)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Показувати по:"
                    rowsPerPageOptions={[10, 20, 50]}
                    sx={{ borderRadius: 3, border: '1px solid #eee' }}
                />
            </Box>

            <Dialog
                open={!!mapTrip}
                onClose={() => setMapTrip(null)}
                fullWidth
                maxWidth="md"
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${mainColor}, ${alpha(mainColor, 0.8)})`,
                    color: 'white', py: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <MapIcon />
                        <Box>
                            <Typography fontWeight="800">Маршрут рейсу №{mapTrip?.tripNumber}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {mapTrip?.originCity} — {mapTrip?.destinationCity}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setMapTrip(null)} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: 450 }}>
                    {leafletReady && mapTrip ? (
                        <LeafletMap
                            origin={{ cityName: mapTrip.originCity }}
                            destination={{ cityName: mapTrip.destinationCity }}
                            waypoints={mapTrip.waypoints || []}
                        />
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress sx={{ color: mainColor }} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, bgcolor: '#fafafa' }}>
                    <Button
                        onClick={() => setMapTrip(null)}
                        variant="contained"
                        disableElevation
                        sx={{ bgcolor: mainColor, borderRadius: 2, fontWeight: 'bold', px: 4 }}
                    >
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 2, fontWeight: 600 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TripsPage;