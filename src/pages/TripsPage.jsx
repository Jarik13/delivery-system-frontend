import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent,
    IconButton, alpha, Chip, Tabs, Tab
} from '@mui/material';
import { DirectionsBus, Add, Map as MapIcon, Close, FlashOn, Archive } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import TripsList from '../components/trips/TripsList';
import LeafletMap from '../components/trips/LeafletMap';
import DataPagination from '../components/pagination/DataPagination';
import TripWizardDialog from '../components/trips/TripWizardDialog';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import { useSearchParams } from 'react-router-dom';

const ARCHIVE_TRIP_STATUSES = ['Завершено', 'Аварійна зупинка'];

const TripsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['trips']] || '#1976d2';
    const { auth } = useAuth();
    const isDriver = auth?.role === ROLES.DRIVER;

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statuses, setStatuses] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [activeTab, setActiveTab] = useState(0);

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
                setDrivers((driverRes.data.content || driverRes.data || []).map(d => ({
                    ...d,
                    name: `${d.lastName || ''} ${d.firstName || ''} ${d.middleName || ''}`.trim() || `Водій №${d.id}`
                })));
                setVehicles((vehicleRes.data.content || []).map(v => ({
                    ...v,
                    name: `${v.licensePlate} (${v.brandName || 'Без бренду'})`.trim()
                })));
            } catch (err) {
                console.error("Помилка завантаження довідників", err);
            }
        };
        fetchReferences();
    }, []);

    const getTabStatusIds = useCallback(() => {
        if (filters.tripStatuses.length > 0) return null;
        const archiveIds = statuses
            .filter(s => ARCHIVE_TRIP_STATUSES.includes(s.name))
            .map(s => s.id);
        const activeIds = statuses
            .filter(s => !ARCHIVE_TRIP_STATUSES.includes(s.name))
            .map(s => s.id);
        return activeTab === 0 ? activeIds : archiveIds;
    }, [activeTab, statuses, filters.tripStatuses]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...filters };

            const tabStatusIds = getTabStatusIds();
            if (tabStatusIds && tabStatusIds.length > 0) {
                params.tripStatuses = tabStatusIds;
            }

            const res = await DictionaryApi.getAll('trips', page, rowsPerPage, params);
            setTrips(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
        } finally { setLoading(false); }
    }, [page, rowsPerPage, filters, getTabStatusIds]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
        setPage(0);
        setFilters(prev => ({ ...prev, tripStatuses: [] }));
    };

    const tabStatuses = statuses.filter(s =>
        activeTab === 0 ? !ARCHIVE_TRIP_STATUSES.includes(s.name) : ARCHIVE_TRIP_STATUSES.includes(s.name)
    );

    const filterFields = [
        { name: 'tripNumber', label: 'Номер рейсу', type: 'text' },
        { name: 'tripStatuses', label: 'Статус рейсу', type: 'checkbox-group', options: tabStatuses },
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
                mb: 2, borderRadius: 3, overflow: 'hidden',
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                <Box sx={{
                    p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                            <DirectionsBus fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Магістральні рейси</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {activeTab === 0 ? 'Активні та заплановані рейси' : 'Архів завершених рейсів'}
                            </Typography>
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
                        {!isDriver && (
                            <Button variant="contained" size="small"
                                sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                                startIcon={<Add />} onClick={() => setWizardTrip(null)}>
                                Створити новий рейс
                            </Button>
                        )}
                    </Box>
                </Box>

                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        bgcolor: alpha(mainColor, 0.05),
                        borderBottom: `1px solid ${alpha(mainColor, 0.15)}`,
                        '& .MuiTab-root': { fontWeight: 600, minHeight: 48 },
                        '& .Mui-selected': { color: mainColor },
                        '& .MuiTabs-indicator': { bgcolor: mainColor },
                    }}
                >
                    <Tab icon={<FlashOn fontSize="small" />} iconPosition="start" label="Активні" />
                    <Tab icon={<Archive fontSize="small" />} iconPosition="start" label="Архівні" />
                </Tabs>
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
                    onMarkArrived={loadData}
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