import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, TablePagination, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, alpha } from '@mui/material';
import { LocalShipping, Add, Map as MapIcon, Close } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import TripsList from '../components/trips/TripsList';
import LeafletMap from '../components/trips/LeafletMap';

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

    const filterFields = [
        {
            name: 'tripNumber',
            label: 'Номер рейсу',
            type: 'text'
        },
        {
            name: 'tripStatusId',
            label: 'Статус',
            type: 'select',
            options: statuses
        }
    ];

    return (
        <Box sx={{ px: 2, pb: 4 }}>
            <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', bgcolor: mainColor, color: 'white', borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocalShipping />
                    <Typography variant="h6" fontWeight="bold">Магістральні рейси ({totalElements})</Typography>
                </Box>
                <Button variant="contained" sx={{ bgcolor: 'white', color: mainColor }} startIcon={<Add />}>Новий рейс</Button>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
                onClear={() => setFilters({ tripNumber: '', tripStatusId: '' })}
                fields={filterFields}
                quickFilters={['tripStatusId']}
                searchPlaceholder="Пошук за номером..."
            />

            {loading ? <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} /> : (
                <TripsList trips={trips} mainColor={mainColor} onMap={setMapTrip} onDelete={(id) => console.log('Delete', id)} />
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={(e, n) => setPage(n)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Показувати по:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}–${to} з ${count !== -1 ? count : `більше ніж ${to}`}`
                    }
                />
            </Box>

            <Dialog open={!!mapTrip} onClose={() => setMapTrip(null)} fullWidth maxWidth="md">
                <DialogTitle sx={{ bgcolor: mainColor, color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Маршрут №{mapTrip?.tripNumber}</Typography>
                    <IconButton onClick={() => setMapTrip(null)} color="inherit"><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: 450 }}>
                    {mapTrip && <LeafletMap trip={mapTrip} />}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default TripsPage;