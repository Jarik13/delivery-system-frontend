import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, Chip, TablePagination,
    useTheme, alpha, MenuItem, Select, FormControl, InputLabel, Autocomplete,
    Grid, Card, CardContent, Divider, FormHelperText, Tooltip
} from '@mui/material';
import {
    Add, Edit, Delete, Inventory, Balance, Sell, Category
} from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import DataPagination from '../components/pagination/DataPagination';

const ParcelsPage = () => {
    const theme = useTheme();
    const groupName = ITEM_GROUP_MAP['parcels'];
    const mainColor = GROUP_COLORS[groupName] || GROUP_COLORS.default;

    const [parcels, setParcels] = useState([]);
    const [parcelTypes, setParcelTypes] = useState([]);
    const [storageConditions, setStorageConditions] = useState([]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [statistics, setStatistics] = useState({
        minWeight: 0,
        maxWeight: 100,
        minDeclaredValue: 0,
        maxDeclaredValue: 50000
    });

    const [filters, setFilters] = useState({
        name: '',
        parcelTypes: [],
        weightMin: 0,
        weightMax: 100,
        declaredValueMin: 0,
        declaredValueMax: 50000
    });

    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [typesRes, conditionsRes, statsRes] = await Promise.all([
                    DictionaryApi.getAll('parcel-types', 0, 100),
                    DictionaryApi.getAll('storage-conditions', 0, 100),
                    DictionaryApi.getStatistics('parcels')
                ]);

                setParcelTypes(typesRes.data.content || []);
                setStorageConditions(conditionsRes.data.content || []);

                const stats = statsRes.data;
                setStatistics({
                    minWeight: stats.minWeight || 0,
                    maxWeight: stats.maxWeight || 100,
                    minDeclaredValue: stats.minDeclaredValue || 0,
                    maxDeclaredValue: stats.maxDeclaredValue || 50000
                });

                setFilters(prev => ({
                    ...prev,
                    weightMin: stats.minWeight || 0,
                    weightMax: stats.maxWeight || 100,
                    declaredValueMin: stats.minDeclaredValue || 0,
                    declaredValueMax: stats.maxDeclaredValue || 50000
                }));
            } catch (error) {
                console.error("Помилка завантаження даних", error);
                setNotification({
                    open: true,
                    message: 'Помилка завантаження початкових даних',
                    severity: 'error'
                });
            }
        };
        loadInitialData();
    }, []);

    const loadTableData = useCallback(async () => {
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) =>
                    v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)
                )
            );

            const response = await DictionaryApi.getAll('parcels', page, rowsPerPage, activeFilters);
            setParcels(response.data.content || []);
            setTotalElements(response.data.totalElements || 0);
        } catch (error) {
            setNotification({ open: true, message: 'Помилка завантаження даних', severity: 'error' });
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const timer = setTimeout(() => { loadTableData(); }, 400);
        return () => clearTimeout(timer);
    }, [loadTableData]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleClearFilters = () => {
        setFilters({
            name: '',
            parcelTypes: [],
            weightMin: statistics.minWeight,
            weightMax: statistics.maxWeight,
            declaredValueMin: statistics.minDeclaredValue,
            declaredValueMax: statistics.maxDeclaredValue
        });
        setPage(0);
    };

    const handleSave = async () => {
        setFieldErrors({});
        try {
            if (currentItem.id) {
                await DictionaryApi.update('parcels', currentItem.id, currentItem);
            } else {
                await DictionaryApi.create('parcels', currentItem);
            }
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Збережено успішно', severity: 'success' });
        } catch (error) {
            const serverData = error.response?.data;
            if (serverData?.validationErrors) setFieldErrors(serverData.validationErrors);
            setNotification({ open: true, message: serverData?.message || 'Помилка збереження', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити цю посилку?')) {
            try {
                await DictionaryApi.delete('parcels', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено успішно', severity: 'success' });
            } catch (error) {
                setNotification({ open: true, message: error.response?.data?.message || 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const openModal = (item = { declaredValue: '', actualWeight: '', contentDescription: '', parcelTypeId: '', storageConditionIds: [] }) => {
        setFieldErrors({});
        setCurrentItem(item);
        setOpen(true);
    };

    const filterFields = [
        {
            name: 'name',
            label: 'Опис вмісту',
            type: 'text'
        },
        {
            name: 'parcelTypes',
            label: 'Тип посилки',
            type: 'checkbox-group',
            options: parcelTypes.map(t => ({ id: t.id, name: t.name }))
        },
        {
            label: 'Вага (кг)',
            type: 'range',
            minName: 'weightMin',
            maxName: 'weightMax',
            min: statistics.minWeight,
            max: statistics.maxWeight,
        },
        {
            label: 'Вартість (грн)',
            type: 'range',
            minName: 'declaredValueMin',
            maxName: 'declaredValueMax',
            min: statistics.minDeclaredValue,
            max: statistics.maxDeclaredValue,
        }
    ];

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                        <Inventory fontSize="medium" color="inherit" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Посилки</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Фізичні параметри та умови зберігання</Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained" size="small"
                    sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                    startIcon={<Add />} onClick={() => openModal()}
                >
                    Додати посилку
                </Button>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
                searchPlaceholder="Опис вмісту..."
                fields={filterFields}
                counts={{ total: totalElements }}
            />

            <Grid
                container
                spacing={3}
                sx={{
                    width: '100%',
                    m: 0,
                    display: 'flex',
                    flexWrap: 'wrap'
                }}
            >
                {parcels.map((parcel) => (
                    <Grid
                        item
                        key={parcel.id}
                        xs={12}
                        sm={6}
                        md={4}
                        lg={3}
                        xl={2.4}
                        sx={{
                            display: 'flex',
                            flexGrow: 1
                        }}
                    >
                        <Card sx={{
                            width: '100%',
                            borderRadius: 4,
                            transition: 'all 0.3s ease',
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: `0 12px 24px ${alpha(mainColor, 0.15)}`,
                                borderColor: mainColor
                            }
                        }} elevation={0}>
                            <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Chip
                                        label={parcel.parcelTypeName}
                                        size="small"
                                        sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.1), color: mainColor, borderRadius: 1.5 }}
                                    />
                                    <Box>
                                        <IconButton size="small" onClick={() => openModal(parcel)} color="primary"><Edit fontSize="small" /></IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(parcel.id)} color="error"><Delete fontSize="small" /></IconButton>
                                    </Box>
                                </Box>

                                <Typography variant="h6" fontWeight="700" sx={{ mb: 1, minHeight: '3.5rem', lineHeight: 1.2 }}>
                                    {parcel.contentDescription || 'Без опису'}
                                </Typography>

                                <Divider sx={{ my: 1.5, opacity: 0.5 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Balance sx={{ fontSize: 14 }} /> Вага
                                        </Typography>
                                        <Typography variant="body1" fontWeight="700">{parcel.actualWeight} кг</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                            <Sell sx={{ fontSize: 14 }} /> Вартість
                                        </Typography>
                                        <Typography variant="body1" fontWeight="700" color="success.main">{parcel.declaredValue} грн</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 'auto' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                        Умови зберігання:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {parcel.storageConditionNames?.length > 0 ? (
                                            parcel.storageConditionNames.map((name, idx) => (
                                                <Chip key={idx} label={name} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                            ))
                                        ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, n) => setPage(n)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Посилок:"
            />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee', pb: 2 }}>
                    <Inventory sx={{ color: mainColor }} />
                    <Typography variant="h6" fontWeight="bold">
                        {currentItem.id ? 'Редагувати параметри' : 'Нова посилка'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <FormControl fullWidth error={!!fieldErrors.parcelTypeId} sx={{ mt: 1.5 }}>
                        <InputLabel id="parcel-type-label">Тип посилки</InputLabel>
                        <Select
                            labelId="parcel-type-label"
                            value={currentItem.parcelTypeId || ''}
                            label="Тип посилки"
                            onChange={(e) => {
                                setCurrentItem({ ...currentItem, parcelTypeId: e.target.value });
                                if (fieldErrors.parcelTypeId) setFieldErrors({ ...fieldErrors, parcelTypeId: null });
                            }}
                        >
                            {parcelTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                        </Select>
                        {fieldErrors.parcelTypeId && <FormHelperText>{fieldErrors.parcelTypeId}</FormHelperText>}
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Вага (кг)"
                            type="number"
                            fullWidth
                            margin="dense"
                            value={currentItem.actualWeight || ''}
                            onChange={(e) => {
                                setCurrentItem({ ...currentItem, actualWeight: e.target.value });
                                if (fieldErrors.actualWeight) setFieldErrors({ ...fieldErrors, actualWeight: null });
                            }}
                            error={!!fieldErrors.actualWeight}
                            helperText={fieldErrors.actualWeight}
                        />
                        <TextField
                            label="Вартість (грн)"
                            type="number"
                            fullWidth
                            margin="dense"
                            value={currentItem.declaredValue || ''}
                            onChange={(e) => {
                                setCurrentItem({ ...currentItem, declaredValue: e.target.value });
                                if (fieldErrors.declaredValue) setFieldErrors({ ...fieldErrors, declaredValue: null });
                            }}
                            error={!!fieldErrors.declaredValue}
                            helperText={fieldErrors.declaredValue}
                        />
                    </Box>

                    <TextField
                        label="Опис вмісту"
                        multiline
                        rows={2}
                        fullWidth
                        margin="dense"
                        value={currentItem.contentDescription || ''}
                        onChange={(e) => {
                            setCurrentItem({ ...currentItem, contentDescription: e.target.value });
                            if (fieldErrors.contentDescription) setFieldErrors({ ...fieldErrors, contentDescription: null });
                        }}
                        error={!!fieldErrors.contentDescription}
                        helperText={fieldErrors.contentDescription}
                    />

                    <Box>
                        <Autocomplete
                            multiple
                            options={storageConditions}
                            getOptionLabel={(option) => option.name}
                            value={storageConditions.filter(sc => currentItem.storageConditionIds?.includes(sc.id))}
                            onChange={(event, newValue) => {
                                setCurrentItem({ ...currentItem, storageConditionIds: newValue.map(v => v.id) });
                                if (fieldErrors.storageConditionIds) setFieldErrors({ ...fieldErrors, storageConditionIds: null });
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Умови зберігання"
                                    error={!!fieldErrors.storageConditionIds}
                                    margin="dense"
                                />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip key={index} label={option.name} {...getTagProps({ index })} size="small" color="info" variant="outlined" />
                                ))
                            }
                        />
                        {fieldErrors.storageConditionIds && <FormHelperText error sx={{ ml: 1.5 }}>{fieldErrors.storageConditionIds}</FormHelperText>}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'none' }}>Скасувати</Button>
                    <Button
                        onClick={handleSave} variant="contained" disableElevation
                        sx={{ bgcolor: mainColor, '&:hover': { bgcolor: mainColor, opacity: 0.9 }, px: 4, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
                    >
                        Зберегти
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ParcelsPage;