import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress,
    Snackbar, Alert, Dialog, DialogTitle, DialogContent,
    IconButton, alpha
} from '@mui/material';
import { LocalShipping, Add, Map as MapIcon, Close } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import TripsList from '../components/trips/TripsList';
import LeafletMap from '../components/trips/LeafletMap';
import DataPagination from '../components/pagination/DataPagination';

const TripsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['trips']] || '#1976d2';

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statuses, setStatuses] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [mapTrip, setMapTrip] = useState(null);

    const [filters, setFilters] = useState({ tripNumber: '', tripStatusId: '' });

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const res = await DictionaryApi.getAll('trip-statuses', 0, 100);
                setStatuses(res.data.content || []);
            } catch (err) {
                console.error("Помилка завантаження статусів", err);
            }
        };
        fetchStatuses();
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

    const handleCloseMap = () => {
        setMapTrip(null);
    };

    const filterFields = [
        { name: 'tripNumber', label: 'Номер рейсу', type: 'text' },
        { name: 'tripStatusId', label: 'Статус', type: 'select', options: statuses }
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
                <Button variant="contained" sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold' }}
                    startIcon={<Add />}>
                    Новий рейс
                </Button>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
                onClear={() => setFilters({ tripNumber: '', tripStatusId: '' })}
                fields={filterFields}
                quickFilters={['tripStatusId']}
                searchPlaceholder="Пошук за номером..."
            />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: mainColor }} />
                </Box>
            ) : (
                <TripsList trips={trips} mainColor={mainColor} onMap={setMapTrip} onDelete={(id) => console.log('Delete', id)} />
            )}

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, n) => setPage(n)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Рейсів:"
            />

            <Dialog
                open={!!mapTrip}
                onClose={handleCloseMap}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle sx={{
                    bgcolor: mainColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <MapIcon />
                        <Typography fontWeight="bold">Маршрут рейсу №{mapTrip?.tripNumber}</Typography>
                    </Box>
                    <IconButton onClick={handleCloseMap} color="inherit">
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: 450, position: 'relative', overflow: 'hidden' }}>
                    {mapTrip && (
                        <LeafletMap trip={mapTrip} />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default TripsPage;