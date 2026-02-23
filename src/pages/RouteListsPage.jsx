import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert,
    Button, Chip, LinearProgress, Tooltip, Avatar
} from '@mui/material';
import {
    Assignment, LocalShipping, CheckCircle, 
    AccessTime, Person, FilterList
} from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import RouteListsTable from '../components/route-lists/RouteListsTable';
// import RouteListWizardDialog from '../components/courier/RouteListWizardDialog';

const filterFields = [
    { name: 'number', label: 'Номер листа', type: 'text' },
    { name: 'courierId', label: 'Кур\'єр', type: 'select', options: [] },
    { name: 'statusId', label: 'Статус', type: 'select', options: [] },
];

const RouteListsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['route-lists']] || GROUP_COLORS[GROUPS.LOGISTICS];

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    
    const [filters, setFilters] = useState({ number: '', courierId: '', statusId: '' });
    const [openWizard, setOpenWizard] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );
            const res = await DictionaryApi.getAll('route-lists', page, rowsPerPage, activeFilters);
            setItems(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
        } catch (e) {
            console.error(e);
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    const handleWizardSuccess = (message) => {
        load();
        setNotification({ open: true, message, severity: 'success' });
    };

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                mb: 2, borderRadius: 3, overflow: 'hidden', position: 'relative',
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                <Box sx={{
                    p: 2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                            <Assignment fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Маршрутні листи</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                                Керування чергою доставки та кур'єрами
                            </Typography>
                        </Box>
                    </Box>

                    <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<LocalShipping />}
                        onClick={() => setOpenWizard(true)}
                        sx={{ 
                            bgcolor: 'white', 
                            color: mainColor, 
                            fontWeight: 'bold', 
                            '&:hover': { bgcolor: '#f5f5f5' } 
                        }}
                    >
                        Сформувати маршрут
                    </Button>
                </Box>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={() => { setFilters({ number: '', courierId: '', statusId: '' }); setPage(0); }}
                fields={filterFields}
                searchPlaceholder="Пошук листа за номером..."
                accentColor={mainColor}
                counts={{ total: totalElements }}
            />

            <RouteListsTable
                items={items}
                loading={loading}
                mainColor={mainColor}
                onRefresh={load}
            />

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Рядів:"
            />

            <Snackbar
                open={notification.open} autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {notification.message}
                </Alert>
            </Snackbar>

            {/* <RouteListWizardDialog
                open={openWizard}
                onClose={() => setOpenWizard(false)}
                mainColor={mainColor}
                onSuccess={handleWizardSuccess}
            /> */}
        </Box>
    );
};

export default RouteListsPage;