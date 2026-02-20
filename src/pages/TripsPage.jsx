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

    const [filters, setFilters] = useState({
        tripNumber: '',
        tripStatusId: '',
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
    });

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
            const res = await DictionaryApi.getAll('trips', page, rowsPerPage, filters);
            setTrips(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
        } finally { setLoading(false); }
    }, [page, rowsPerPage, filters]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCloseMap = () => setMapTrip(null);

    const handleOpenCreate = () => setWizardTrip(null);

    const handleOpenEdit = (trip) => setWizardTrip(trip);

    const handleCloseWizard = () => setWizardTrip(undefined);

    const wizardOpen = wizardTrip !== undefined;

    const filterFields = [
        { name: 'tripNumber', label: 'Номер рейсу', type: 'text', md: 3 },
        { name: 'tripStatusId', label: 'Статус', type: 'select', options: statuses, md: 3 },
        { name: 'driverId', label: 'Водій', type: 'select', options: drivers, md: 3 },
        { name: 'vehicleId', label: 'Транспортний засіб', type: 'select', options: vehicles, md: 3 },
        { name: 'originCity', label: 'Місто відправлення', type: 'text', md: 3 },
        { name: 'destinationCity', label: 'Місто призначення', type: 'text', md: 3 },
        { name: 'anyCity', label: 'Будь-яке місто маршруту', type: 'text', md: 3 },
        { name: 'scheduledDepartureFrom', label: 'Плановий виїзд (від)', type: 'datetime', md: 3 },
        { name: 'scheduledDepartureTo', label: 'Плановий виїзд (до)', type: 'datetime', md: 3 },
        { name: 'scheduledArrivalFrom', label: 'Планове прибуття (від)', type: 'datetime', md: 3 },
        { name: 'scheduledArrivalTo', label: 'Планове прибуття (до)', type: 'datetime', md: 3 },
        { name: 'actualDepartureFrom', label: 'Фактичний виїзд (від)', type: 'datetime', md: 3 },
        { name: 'actualDepartureTo', label: 'Фактичний виїзд (до)', type: 'datetime', md: 3 },
        { name: 'actualArrivalFrom', label: 'Фактичне прибуття (від)', type: 'datetime', md: 3 },
        { name: 'actualArrivalTo', label: 'Фактичне прибуття (до)', type: 'datetime', md: 3 },
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
                <Button onClick={handleOpenCreate} variant="contained"
                    sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold' }}
                    startIcon={<Add />}>
                    Новий рейс
                </Button>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
                onClear={() => setFilters({
                    tripNumber: '', tripStatusId: '', driverId: '', vehicleId: '',
                    scheduledDepartureFrom: '', scheduledDepartureTo: '',
                    scheduledArrivalFrom: '', scheduledArrivalTo: '',
                    actualDepartureFrom: '', actualDepartureTo: '',
                    actualArrivalFrom: '', actualArrivalTo: ''
                })}
                fields={filterFields}
                quickFilters={['tripStatusId']}
                searchPlaceholder="Пошук за номером..."
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
                    onEdit={handleOpenEdit}
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
                open={wizardOpen}
                onClose={handleCloseWizard}
                mainColor={mainColor}
                references={{ drivers, vehicles }}
                tripToEdit={wizardTrip ?? null}
                onSuccess={(msg) => { loadData(); }}
            />

            <Dialog open={!!mapTrip} onClose={handleCloseMap} fullWidth maxWidth="md">
                <DialogTitle sx={{
                    bgcolor: mainColor, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <MapIcon />
                        <Typography fontWeight="bold">Маршрут рейсу №{mapTrip?.tripNumber}</Typography>
                    </Box>
                    <IconButton onClick={handleCloseMap} color="inherit"><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: 450, position: 'relative', overflow: 'hidden' }}>
                    {mapTrip && <LeafletMap trip={mapTrip} />}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default TripsPage;