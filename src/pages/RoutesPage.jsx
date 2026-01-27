import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Snackbar, Alert, Chip, Checkbox, FormControlLabel,
    TablePagination, useTheme, alpha
} from '@mui/material';
import {
    Add, Edit, Delete, LocalShipping, SwapHoriz,
    ArrowRightAlt, Map, TripOrigin, LocationOn, Place
} from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import RouteBranchSelector from '../components/RouteBranchSelector';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const RoutesPage = () => {
    const theme = useTheme();
    const groupName = ITEM_GROUP_MAP['routes'];
    const mainColor = GROUP_COLORS[groupName] || GROUP_COLORS.default;

    const [routes, setRoutes] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [filters, setFilters] = useState({
        originBranchName: '',
        destinationBranchName: '',
        needSorting: ''
    });

    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [originCityId, setOriginCityId] = useState(null);
    const [destCityId, setDestCityId] = useState(null);

    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const loadTableData = useCallback(async () => {
        try {
            const response = await DictionaryApi.getAll('routes', page, rowsPerPage, filters);
            setRoutes(response.data.content || []);
            setTotalElements(response.data.totalElements || 0);
        } catch (error) {
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const timer = setTimeout(() => { loadTableData(); }, 400);
        return () => clearTimeout(timer);
    }, [loadTableData]);

    const openModal = async (item = { originBranchId: '', destinationBranchId: '', needSorting: false }) => {
        if (item.id) {
            try {
                const oRes = await DictionaryApi.getById('branches', item.originBranchId);
                const dRes = await DictionaryApi.getById('branches', item.destinationBranchId);
                setOriginCityId(oRes.data.cityId);
                setDestCityId(dRes.data.cityId);
            } catch (e) { console.error(e); }
        } else {
            setOriginCityId(null);
            setDestCityId(null);
        }
        setCurrentItem(item);
        setOpen(true);
    };

    const handleSave = async () => {
        if (!currentItem.originBranchId || !currentItem.destinationBranchId) {
            setNotification({ open: true, message: 'Оберіть обидва відділення', severity: 'warning' });
            return;
        }
        try {
            if (currentItem.id) await DictionaryApi.update('routes', currentItem.id, currentItem);
            else await DictionaryApi.create('routes', currentItem);
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Збережено успішно', severity: 'success' });
        } catch (error) {
            setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити цей маршрут?')) {
            try {
                await DictionaryApi.delete('routes', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено', severity: 'success' });
            } catch (error) { console.error(error); }
        }
    };

    return (
        <Box sx={{ px: 2, pb: 2, pt: 0, maxWidth: '100%', margin: '0 auto' }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '50%', display: 'flex' }}>
                        <Map fontSize="medium" color="inherit" />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">Магістральні маршрути</Typography>
                </Box>
                <Button
                    variant="contained" size="small"
                    sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                    startIcon={<Add />} onClick={() => openModal()}
                >
                    Створити маршрут
                </Button>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(0); }}
                onClear={() => setFilters({ originBranchName: '', destinationBranchName: '', needSorting: '' })}
                fields={[
                    { name: 'originBranchName', label: 'Звідки (назва)', type: 'text' },
                    { name: 'destinationBranchName', label: 'Куди (назва)', type: 'text' },
                    { name: 'needSorting', label: 'Тип логістики', type: 'select', options: [{ id: 'true', name: 'Сортування' }, { id: 'false', name: 'Прямий' }] }
                ]}
            />

            <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                <Table sx={{ minWidth: 800 }}>
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary', pl: 3 }}>МАРШРУТ</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>ЛОГІСТИКА</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', pr: 3 }}>ДІЇ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {routes.map((row) => (
                            <TableRow key={row.id} hover>
                                <TableCell sx={{ pl: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {row.originBranchName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                                <Place sx={{ fontSize: 12 }} />
                                                {row.originCityName || 'Невідомо'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120, px: 1 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', mb: 0.5, letterSpacing: 1 }}>КУДИ</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
                                                <Box sx={{ flex: 1, height: 0, borderTop: '1px dashed', borderColor: 'divider' }} />
                                                <LocalShipping color="primary" sx={{ fontSize: 20, mx: 0.5 }} />
                                                <Box sx={{ flex: 1, height: 0, borderTop: '1px dashed', borderColor: 'divider' }} />
                                                <ArrowRightAlt sx={{ color: 'divider', fontSize: 18, ml: -0.5 }} />
                                            </Box>
                                        </Box>

                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {row.destinationBranchName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Place sx={{ fontSize: 12 }} />
                                                {row.destinationCityName || 'Невідомо'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>

                                <TableCell align="center">
                                    <Chip
                                        icon={row.needSorting ? <SwapHoriz /> : <ArrowRightAlt />}
                                        label={row.needSorting ? "Сортування" : "Прямий"}
                                        color={row.needSorting ? "warning" : "success"}
                                        size="small" variant="outlined" sx={{ fontWeight: 600 }}
                                    />
                                </TableCell>

                                <TableCell align="right" sx={{ pr: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                        <IconButton onClick={() => openModal(row)} color="primary" size="small">
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(row.id)} color="error" size="small">
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination component="div" count={totalElements} page={page} onPageChange={(e, n) => setPage(n)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))} labelRowsPerPage="Рядків:" />
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 4, maxWidth: '1050px', width: '100%' } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee', pb: 2 }}>
                    <LocalShipping sx={{ color: mainColor }} />
                    <Typography variant="h6" fontWeight="bold">
                        {currentItem.id ? 'Редагувати магістральний маршрут' : 'Новий маршрут'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 3, overflowX: 'hidden', mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <RouteBranchSelector
                                title="Точка відправлення" icon={TripOrigin} color="primary.main"
                                cityId={originCityId} branchId={currentItem.originBranchId}
                                onCityChange={(id) => { setOriginCityId(id); setCurrentItem(prev => ({ ...prev, originBranchId: '' })); }}
                                onBranchChange={(id) => setCurrentItem(prev => ({ ...prev, originBranchId: id }))}
                            />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <RouteBranchSelector
                                title="Точка призначення" icon={LocationOn} color="success.main"
                                cityId={destCityId} branchId={currentItem.destinationBranchId}
                                onCityChange={(id) => { setDestCityId(id); setCurrentItem(prev => ({ ...prev, destinationBranchId: '' })); }}
                                onBranchChange={(id) => setCurrentItem(prev => ({ ...prev, destinationBranchId: id }))}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', bgcolor: 'transparent', borderColor: '#e0e0e0' }}>
                            <FormControlLabel
                                control={<Checkbox checked={!!currentItem.needSorting} onChange={(e) => setCurrentItem(p => ({ ...p, needSorting: e.target.checked }))} color="warning" />}
                                label={<Typography fontWeight={500}>Маршрут потребує додаткового сортування на терміналі</Typography>}
                                sx={{ width: '100%', ml: 0 }}
                            />
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'none' }}>
                        Скасувати
                    </Button>
                    <Button
                        onClick={handleSave} variant="contained" disableElevation
                        sx={{ bgcolor: mainColor, '&:hover': { bgcolor: mainColor, opacity: 0.9 }, px: 4, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
                    >
                        Зберегти
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default RoutesPage;