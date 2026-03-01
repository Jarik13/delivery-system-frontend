import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent,
    IconButton, alpha, Chip
} from '@mui/material';
import { DirectionsBus, Add, Map as MapIcon, Close } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import TripsList from '../components/trips/TripsList';
import LeafletMap from '../components/trips/LeafletMap';
import DataPagination from '../components/pagination/DataPagination';
import TripWizardDialog from '../components/trips/TripWizardDialog';
import { useSearchParams } from 'react-router-dom';

const TripsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['trips']] || '#1976d2';

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statuses, setStatuses] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [mapTrip, setMapTrip] = useState(null);
    const [wizardTrip, setWizardTrip] = useState(undefined);

    const defaultFilters = {
        tripNumber: '',
        tripStatuses: [],
        driverId: '',
        vehicleId: '',
        originCity: '',
        destinationCity: '',
        anyCity: '',
        scheduledDepartureFrom: '',
        scheduledDepartureTo: '',
        scheduledArrivalFrom: '',
        scheduledArrivalTo: '',
        actualDepartureFrom: '',
        actualDepartureTo: '',
        actualArrivalFrom: '',
        actualArrivalTo: '',
    };

    const [filters, setFilters] = useState(defaultFilters);

    const [searchParams, setSearchParams] = useSearchParams();
    const highlightId = searchParams.get('highlight') ? Number(searchParams.get('highlight')) : null;
    const highlightRowRef = useRef(null);

    useEffect(() => {
        if (!highlightId || loading) return;
        const timer = setTimeout(() => {
            highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        return () => clearTimeout(timer);
    }, [highlightId, loading, trips]);

    useEffect(() => {
        const fetchReferences = async () => {
            try {
                const [statusRes, driverRes, vehicleRes] = await Promise.all([
                    DictionaryApi.getAll('trip-statuses', 0, 100),
                    DictionaryApi.getAll('drivers', 0, 1000),
                    DictionaryApi.getAll('vehicles', 0, 1000),
                ]);

                setStatuses(statusRes.data.content || []);

                const mappedDrivers = (driverRes.data.content || []).map(d => ({
                    ...d,
                    name: `${d.lastName || ''} ${d.firstName || ''} ${d.middleName || ''}`.trim() || `Водій №${d.id}`
                }));
                setDrivers(mappedDrivers);

                const mappedVehicles = (vehicleRes.data.content || []).map(v => ({
                    ...v,
                    name: `${v.licensePlate} (${v.brandName || 'Без бренду'})`.trim()
                }));
                setVehicles(mappedVehicles);

            } catch (err) {
                console.error("Помилка завантаження довідників", err);
            }
        };
        fetchReferences();
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            const res = await DictionaryApi.getAll('trips', page, rowsPerPage, params);
            setTrips(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
        } finally { setLoading(false); }
    }, [page, rowsPerPage, filters]);

    useEffect(() => { loadData(); }, [loadData]);

    const filterFields = [
        { name: 'tripNumber', label: 'Номер рейсу', type: 'text' },
        {
            name: 'tripStatuses',
            label: 'Статус рейсу',
            type: 'checkbox-group',
            options: statuses,
        },
        {
            name: 'driverId',
            label: 'Водій',
            type: 'select',
            options: drivers.map(d => ({ ...d, name: d.name }))
        },
        {
            name:
                'vehicleId',
            label: 'Транспортний засіб',
            type: 'select',
            options: vehicles.map(v => ({ ...v, name: v.name }))
        },
        { name: 'originCity', label: 'Місто відправлення', type: 'text' },
        { name: 'destinationCity', label: 'Місто призначення', type: 'text' },
        { name: 'anyCity', label: 'Будь-яке місто маршруту', type: 'text' },
        { name: 'scheduledDepartureFrom', label: 'Плановий виїзд (від)', type: 'datetime' },
        { name: 'scheduledDepartureTo', label: 'Плановий виїзд (до)', type: 'datetime' },
        { name: 'scheduledArrivalFrom', label: 'Планове прибуття (від)', type: 'datetime' },
        { name: 'scheduledArrivalTo', label: 'Планове прибуття (до)', type: 'datetime' },
        { name: 'actualDepartureFrom', label: 'Фактичний виїзд (від)', type: 'datetime' },
        { name: 'actualDepartureTo', label: 'Фактичний виїзд (до)', type: 'datetime' },
        { name: 'actualArrivalFrom', label: 'Фактичне прибуття (від)', type: 'datetime' },
        { name: 'actualArrivalTo', label: 'Фактичне прибуття (до)', type: 'datetime' },
    ];

    return (
        <Box sx={{ px: 2, pb: 4 }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                        <DirectionsBus fontSize="medium" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Магістральні рейси</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Схеми доставки між відділеннями</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {highlightId && !loading && (
                        <Chip
                            label={`↓ Рейс #${highlightId}`}
                            size="small"
                            onDelete={() => setSearchParams({})}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.25)', color: 'white',
                                fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)',
                                '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' },
                            }}
                        />
                    )}
                    <Button variant="contained" size="small"
                        sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                        startIcon={<Add />} onClick={() => setWizardTrip(null)}>
                        Створити новий рейс
                    </Button>
                </Box>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={() => { setFilters(defaultFilters); setPage(0); }}
                fields={filterFields}
                searchPlaceholder="Пошук за номером..."
                accentColor={mainColor}
                counts={{ total: totalElements }}
            />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: mainColor }} />
                </Box>
            ) : (
                <TripsList
                    trips={trips}
                    mainColor={mainColor}
                    onMap={setMapTrip}
                    onEdit={(trip) => setWizardTrip(trip)}
                    onDelete={(id) => console.log('Delete', id)}
                    highlightId={highlightId}
                    highlightRowRef={highlightRowRef}
                    onClearHighlight={() => setSearchParams({})}
                />
            )}

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, n) => setPage(n)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Рейсів:"
            />

            <TripWizardDialog
                open={wizardTrip !== undefined}
                onClose={() => setWizardTrip(undefined)}
                mainColor={mainColor}
                references={{ drivers, vehicles }}
                tripToEdit={wizardTrip ?? null}
                onSuccess={() => loadData()}
            />

            <Dialog open={!!mapTrip} onClose={() => setMapTrip(null)} fullWidth maxWidth="md">
                <DialogTitle sx={{
                    bgcolor: mainColor, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <MapIcon />
                        <Typography fontWeight="bold">Маршрут рейсу №{mapTrip?.tripNumber}</Typography>
                    </Box>
                    <IconButton onClick={() => setMapTrip(null)} color="inherit"><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: 450, position: 'relative', overflow: 'hidden' }}>
                    {mapTrip && <LeafletMap trip={mapTrip} mainColor={mainColor} />}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default TripsPage;