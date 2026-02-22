import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent,
    IconButton, alpha
} from '@mui/material';
import { LocalShipping, Add, Map as MapIcon, Close } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import TripsList from '../components/trips/TripsList';
import LeafletMap from '../components/trips/LeafletMap';
import DataPagination from '../components/pagination/DataPagination';
import TripWizardDialog from '../components/trips/TripWizardDialog';

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

    useEffect(() => {
        const fetchReferences = async () => {
            try {
                const [statusRes, driverRes, vehicleRes] = await Promise.all([
                    DictionaryApi.getAll('trip-statuses', 0, 100),
                    DictionaryApi.getAll('drivers', 0, 1000),
                    DictionaryApi.getAll('vehicles', 0, 1000),
                ]);
                setStatuses(statusRes.data.content || []);
                setDrivers(driverRes.data.content || []);
                setVehicles(vehicleRes.data.content || []);
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
        { name: 'driverId', label: 'Водій', type: 'select', options: drivers },
        { name: 'vehicleId', label: 'Транспортний засіб', type: 'select', options: vehicles },
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
                color: 'white', borderRadius: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocalShipping fontSize="large" />
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Магістральні рейси</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Керування маршрутами та рейсами</Typography>
                    </Box>
                </Box>
                <Button onClick={() => setWizardTrip(null)} variant="contained"
                    sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold' }}
                    startIcon={<Add />}>
                    Новий рейс
                </Button>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={() => { setFilters(defaultFilters); setPage(0); }}
                fields={filterFields}
                searchPlaceholder="Пошук за номером..."
                accentColor={mainColor}
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
                    {mapTrip && <LeafletMap trip={mapTrip} />}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default TripsPage;