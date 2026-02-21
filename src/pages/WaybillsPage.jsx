import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Chip, alpha, Snackbar, Alert } from '@mui/material';
import { Receipt } from '@mui/icons-material';
import WaybillsTable from '../components/waybills/WaybillsTable';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const filterFields = [
    { name: 'number', label: 'Номер накладної', type: 'text' },
];

const WaybillsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['waybills']] || '#673ab7';

    const [waybills, setWaybills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({ number: '' });
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );
            const res = await DictionaryApi.getAll('waybills', page, rowsPerPage, activeFilters);
            setWaybills(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>

            <Paper elevation={0} sx={{
                p: 2, mb: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Receipt fontSize="large" />
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Транспортні накладні</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Маніфести та перелік відправлень
                        </Typography>
                    </Box>
                </Box>
                <Chip
                    label={`${totalElements} накладних`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
                />
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={() => { setFilters({ number: '' }); setPage(0); }}
                fields={filterFields}
                searchPlaceholder="Номер накладної..."
            />

            <WaybillsTable
                waybills={waybills}
                loading={loading}
                mainColor={mainColor}
            />

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Накладних:"
                rowsPerPageOptions={[10, 15, 25, 50]}
            />

            <Snackbar open={notification.open} autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default WaybillsPage;