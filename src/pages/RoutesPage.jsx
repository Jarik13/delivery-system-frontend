import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Snackbar, Alert, Chip, Checkbox, FormControlLabel,
    TablePagination, useTheme, alpha, FormHelperText,
    Grid,
    TextField
} from '@mui/material';
import {
    Add, Edit, Delete, LocalShipping, SwapHoriz,
    ArrowRightAlt, Map, TripOrigin, LocationOn, Place,
    Straighten
} from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import RouteBranchSelector from '../components/RouteBranchSelector';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import DataPagination from '../components/pagination/DataPagination';

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
        needSorting: '',
        distanceKmMin: 0,
        distanceKmMax: 3000
    });

    const [statistics, setStatistics] = useState({
        minDistance: 0,
        maxDistance: 3000
    });

    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [originCityId, setOriginCityId] = useState(null);
    const [destCityId, setDestCityId] = useState(null);

    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await DictionaryApi.getStatistics('routes');
                const { distanceKmMin, distanceKmMax } = res.data;

                setStatistics({
                    minDistance: distanceKmMin || 0,
                    maxDistance: distanceKmMax || 3000
                });

                setFilters(prev => ({
                    ...prev,
                    distanceKmMin: distanceKmMin || 0,
                    distanceKmMax: distanceKmMax || 3000
                }));
            } catch (error) {
                console.error("Помилка завантаження статистики маршрутів", error);
            }
        };
        loadStats();
    }, []);

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

    const handleFieldChange = (key, value) => {
        setCurrentItem(prev => ({ ...prev, [key]: value }));
        if (fieldErrors[key]) {
            setFieldErrors(prev => ({ ...prev, [key]: null }));
        }
    };

    const openModal = async (item = { originBranchId: '', destinationBranchId: '', needSorting: false }) => {
        setFieldErrors({});
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
        setFieldErrors({});
        try {
            if (currentItem.id) await DictionaryApi.update('routes', currentItem.id, currentItem);
            else await DictionaryApi.create('routes', currentItem);
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Збережено успішно', severity: 'success' });
        } catch (error) {
            const serverData = error.response?.data;
            if (serverData?.validationErrors) {
                setFieldErrors(serverData.validationErrors);
            }
            setNotification({
                open: true,
                message: serverData?.message || 'Помилка збереження',
                severity: 'error'
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити цей маршрут?')) {
            try {
                await DictionaryApi.delete('routes', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено', severity: 'success' });
            } catch (error) {
                setNotification({
                    open: true,
                    message: error.response?.data?.message || 'Помилка видалення',
                    severity: 'error'
                });
            }
        }
    };

    const filterFields = [
        { name: 'originBranchName', label: 'Звідки', type: 'text' },
        { name: 'destinationBranchName', label: 'Куди', type: 'text' },
        {
            name: 'needSorting',
            label: 'Логістика',
            type: 'select',
            options: [{ id: 'true', name: 'Сортування' }, { id: 'false', name: 'Прямий' }]
        },
        {
            name: 'distanceRange',
            label: 'Відстань (км)',
            type: 'range',
            minName: 'distanceKmMin',
            maxName: 'distanceKmMax',
            min: statistics.minDistance,
            max: statistics.maxDistance,
        }
    ];

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
                onClear={() => setFilters({
                    originBranchName: '',
                    destinationBranchName: '',
                    needSorting: '',
                    distanceKmMin: statistics.minDistance,
                    distanceKmMax: statistics.maxDistance
                })}
                searchPlaceholder="Пошук маршруту..."
                quickFilters={['needSorting']}
                fields={filterFields}
                accentColor={mainColor}
                counts={{ total: totalElements }}
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
                                <TableCell sx={{ pl: 3, pr: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 3 }}>
                                        <Box sx={{ textAlign: 'left', minWidth: 'fit-content' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {row.originBranchName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Place sx={{ fontSize: 12 }} />
                                                {row.originCityName || 'Невідомо'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ color: mainColor, fontWeight: 800, mb: 0.5 }}>
                                                {row.distanceKm ? `${row.distanceKm} км` : '—'}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'divider' }} />
                                                <Box sx={{ flex: 1, height: 0, borderTop: '2px dashed', borderColor: 'divider' }} />
                                                <LocalShipping color="primary" sx={{ fontSize: 24, mx: 1 }} />
                                                <Box sx={{ flex: 1, height: 0, borderTop: '2px dashed', borderColor: 'divider' }} />
                                                <ArrowRightAlt sx={{ color: 'divider', fontSize: 24, ml: -1 }} />
                                            </Box>
                                        </Box>

                                        <Box sx={{ textAlign: 'right', minWidth: 'fit-content' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {row.destinationBranchName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
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
                                        <IconButton onClick={() => openModal(row)} color="primary" size="small"><Edit fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleDelete(row.id)} color="error" size="small"><Delete fontSize="small" /></IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <DataPagination
                    count={totalElements}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(e, n) => setPage(n)}
                    onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                    label="Маршрутів:"
                />
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 4, maxWidth: '1050px', width: '100%' } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee', pb: 2 }}>
                    <LocalShipping sx={{ color: mainColor }} />
                    <Typography variant="h6" fontWeight="bold">
                        {currentItem.id ? 'Редагувати магістральний маршрут' : 'Новий маршрут'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <RouteBranchSelector
                                title="Точка відправлення" icon={TripOrigin} color="primary.main"
                                cityId={originCityId} branchId={currentItem.originBranchId}
                                onCityChange={(id) => { setOriginCityId(id); handleFieldChange('originBranchId', ''); }}
                                onBranchChange={(id) => handleFieldChange('originBranchId', id)}
                                error={!!fieldErrors.originBranchId}
                            />
                            {fieldErrors.originBranchId && (
                                <FormHelperText error sx={{ ml: 2 }}>{fieldErrors.originBranchId}</FormHelperText>
                            )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <RouteBranchSelector
                                title="Точка призначення" icon={LocationOn} color="success.main"
                                cityId={destCityId} branchId={currentItem.destinationBranchId}
                                onCityChange={(id) => { setDestCityId(id); handleFieldChange('destinationBranchId', ''); }}
                                onBranchChange={(id) => handleFieldChange('destinationBranchId', id)}
                                error={!!fieldErrors.destinationBranchId}
                            />
                            {fieldErrors.destinationBranchId && (
                                <FormHelperText error sx={{ ml: 2 }}>{fieldErrors.destinationBranchId}</FormHelperText>
                            )}
                        </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Відстань (км)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={currentItem.distanceKm || ''}
                                onChange={(e) => handleFieldChange('distanceKm', e.target.value)}
                                error={!!fieldErrors.distanceKm}
                                helperText={fieldErrors.distanceKm}
                                InputProps={{
                                    startAdornment: <Straighten sx={{ color: 'action.active', mr: 1, fontSize: 20 }} />,
                                }}
                                sx={{ mt: 1 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper variant="outlined" sx={{
                                p: 1, px: 2, mt: 1, height: '56px', display: 'flex', alignItems: 'center',
                                borderRadius: 2, bgcolor: 'transparent', borderColor: '#ccc'
                            }}>
                                <FormControlLabel
                                    control={<Checkbox checked={!!currentItem.needSorting} onChange={(e) => handleFieldChange('needSorting', e.target.checked)} color="warning" />}
                                    label={<Typography fontWeight={500}>Потребує сортування на терміналі</Typography>}
                                    sx={{ width: '100%', ml: 0 }}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Скасувати</Button>
                    <Button onClick={handleSave} variant="contained" disableElevation
                        sx={{ bgcolor: mainColor, px: 4, borderRadius: 2, fontWeight: 'bold' }}
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