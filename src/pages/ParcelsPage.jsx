import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, Chip, TablePagination,
    useTheme, alpha, MenuItem, Select, FormControl, InputLabel, Autocomplete,
    Grid, Card, CardContent, Divider, FormHelperText
} from '@mui/material';
import {
    Add, Edit, Delete, Inventory, Balance, Sell,
    Category
} from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const ParcelsPage = () => {
    const theme = useTheme();
    const groupName = ITEM_GROUP_MAP['parcels'];
    const mainColor = GROUP_COLORS[groupName] || GROUP_COLORS.default;

    const [parcels, setParcels] = useState([]);
    const [parcelTypes, setParcelTypes] = useState([]);
    const [storageConditions, setStorageConditions] = useState([]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalElements, setTotalElements] = useState(0);

    const [filters, setFilters] = useState({
        name: '',
        parcelTypeId: '',
        weightMin: 0,
        weightMax: 50,
        declaredValueMin: 0,
        declaredValueMax: 10000
    });

    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const loadDictionaries = async () => {
            try {
                const [typesRes, conditionsRes] = await Promise.all([
                    DictionaryApi.getAll('parcel-types', 0, 100),
                    DictionaryApi.getAll('storage-conditions', 0, 100)
                ]);
                setParcelTypes(typesRes.data.content || []);
                setStorageConditions(conditionsRes.data.content || []);
            } catch (error) {
                console.error("Помилка завантаження довідників", error);
            }
        };
        loadDictionaries();
    }, []);

    const loadTableData = useCallback(async () => {
        try {
            const response = await DictionaryApi.getAll('parcels', page, rowsPerPage, filters);
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
            parcelTypeId: '',
            weightMin: 0,
            weightMax: 50,
            declaredValueMin: 0,
            declaredValueMax: 10000
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
            setNotification({ open: true, message: 'Збережено', severity: 'success' });
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
        if (window.confirm('Видалити цю посилку?')) {
            try {
                await DictionaryApi.delete('parcels', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено успішно', severity: 'success' });
            } catch (error) {
                setNotification({ 
                    open: true, 
                    message: error.response?.data?.message || 'Помилка видалення', 
                    severity: 'error' 
                });
            }
        }
    };

    const openModal = (item = {
        declaredValue: '',
        actualWeight: '',
        contentDescription: '',
        parcelTypeId: '',
        storageConditionIds: []
    }) => {
        setFieldErrors({});
        setCurrentItem(item);
        setOpen(true);
    };

    const filterFields = [
        { name: 'name', label: 'Опис вмісту', type: 'text', md: 2.5 },
        { name: 'parcelTypeId', label: 'Тип посилки', type: 'select', options: parcelTypes, md: 2 },
        {
            label: 'Вага (кг)', type: 'range',
            minName: 'weightMin', maxName: 'weightMax',
            min: 0, max: 100, md: 3.5
        },
        {
            label: 'Вартість (грн)', type: 'range',
            minName: 'declaredValueMin', maxName: 'declaredValueMax',
            min: 0, max: 50000, md: 4
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
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                        <Inventory fontSize="medium" color="inherit" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Керування посилками</Typography>
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

            <DataFilters filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} fields={filterFields} />

            <Grid container spacing={3}>
                {parcels.map((parcel) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={parcel.id}>
                        <Card sx={{ 
                            borderRadius: 4, 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { 
                                transform: 'translateY(-5px)', 
                                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                                borderColor: theme.palette.secondary.light
                            }
                        }} elevation={0}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Chip 
                                        label={parcel.parcelTypeName} 
                                        size="small" 
                                        color="secondary" 
                                        variant="soft"
                                        sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.dark }}
                                    />
                                    <Box>
                                        <IconButton size="small" onClick={() => openModal(parcel)} sx={{ color: 'primary.main' }}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(parcel.id)} sx={{ color: 'error.main' }}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Typography variant="body1" fontWeight="600" gutterBottom noWrap title={parcel.contentDescription}>
                                    {parcel.contentDescription || 'Без опису'}
                                </Typography>

                                <Divider sx={{ my: 1.5, opacity: 0.6 }} />

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Balance sx={{ fontSize: 14 }} /> Вага
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                            <Tooltip title="Вага">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Balance fontSize="small" color="action" />
                                                    <Typography variant="body2" fontWeight="bold">{row.actualWeight} кг</Typography>
                                                </Box>
                                            </Tooltip>
                                            <Tooltip title="Оголошена вартість">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Sell fontSize="small" color="success" />
                                                    <Typography variant="body2" fontWeight="bold">{row.declaredValue} грн</Typography>
                                                </Box>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {row.storageConditionNames?.map((name, index) => (
                                                <Chip
                                                    key={index}
                                                    label={name}
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(theme.palette.info.main, 0.1) }}
                                                />
                                            )) || '—'}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ pr: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <IconButton size="small" onClick={() => openModal(row)} color="primary"><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><Delete fontSize="small" /></IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div" count={totalElements} page={page}
                    onPageChange={(e, n) => setPage(n)} rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Карток на сторінці:"
                />
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee', pb: 2 }}>
                    <Inventory sx={{ color: mainColor }} />
                    <Typography variant="h6" fontWeight="bold">
                        {currentItem.id ? 'Редагувати параметри' : 'Нова посилка'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3, mt: 1 }}>
                    <FormControl fullWidth size="small" error={!!fieldErrors.parcelTypeId}>
                        <InputLabel>Тип посилки</InputLabel>
                        <Select
                            value={currentItem.parcelTypeId || ''}
                            label="Тип посилки"
                            onChange={(e) => {
                                setCurrentItem({ ...currentItem, parcelTypeId: e.target.value });
                                if (fieldErrors.parcelTypeId) setFieldErrors({...fieldErrors, parcelTypeId: null});
                            }}
                        >
                            {parcelTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                        </Select>
                        {fieldErrors.parcelTypeId && <FormHelperText>{fieldErrors.parcelTypeId}</FormHelperText>}
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Вага (кг)" type="number" fullWidth size="small"
                            value={currentItem.actualWeight || ''}
                            onChange={(e) => {
                                setCurrentItem({ ...currentItem, actualWeight: e.target.value });
                                if (fieldErrors.actualWeight) setFieldErrors({...fieldErrors, actualWeight: null});
                            }}
                            error={!!fieldErrors.actualWeight}
                            helperText={fieldErrors.actualWeight}
                        />
                        <TextField
                            label="Вартість (грн)" type="number" fullWidth size="small"
                            value={currentItem.declaredValue || ''}
                            onChange={(e) => {
                                setCurrentItem({ ...currentItem, declaredValue: e.target.value });
                                if (fieldErrors.declaredValue) setFieldErrors({...fieldErrors, declaredValue: null});
                            }}
                            error={!!fieldErrors.declaredValue}
                            helperText={fieldErrors.declaredValue}
                        />
                    </Box>

                    <TextField
                        label="Опис вмісту" multiline rows={2} fullWidth size="small"
                        value={currentItem.contentDescription || ''}
                        onChange={(e) => {
                            setCurrentItem({ ...currentItem, contentDescription: e.target.value });
                            if (fieldErrors.contentDescription) setFieldErrors({...fieldErrors, contentDescription: null});
                        }}
                        error={!!fieldErrors.contentDescription}
                        helperText={fieldErrors.contentDescription}
                    />

                    <Box>
                        <Autocomplete
                            multiple
                            size="small"
                            options={storageConditions}
                            getOptionLabel={(option) => option.name}
                            value={storageConditions.filter(sc => currentItem.storageConditionIds?.includes(sc.id))}
                            onChange={(event, newValue) => {
                                setCurrentItem({
                                    ...currentItem,
                                    storageConditionIds: newValue.map(v => v.id)
                                });
                                if (fieldErrors.storageConditionIds) setFieldErrors({...fieldErrors, storageConditionIds: null});
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Умови зберігання" 
                                    placeholder="Оберіть вимоги..." 
                                    error={!!fieldErrors.storageConditionIds}
                                />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip label={option.name} {...getTagProps({ index })} size="small" color="info" variant="outlined" />
                                ))
                            }
                        />
                        {fieldErrors.storageConditionIds && <FormHelperText error>{fieldErrors.storageConditionIds}</FormHelperText>}
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
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ParcelsPage;