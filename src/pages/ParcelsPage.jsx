import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, Chip, Tooltip, TablePagination,
    useTheme, alpha, MenuItem, Select, FormControl, InputLabel, Autocomplete
} from '@mui/material';
import {
    Add, Edit, Delete, Inventory, Balance, Sell,
    Description, Category, AcUnit, Settings
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
    const [rowsPerPage, setRowsPerPage] = useState(10);
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
        if (!currentItem.parcelTypeId || !currentItem.actualWeight) {
            setNotification({ open: true, message: 'Заповніть обов\'язкові поля', severity: 'warning' });
            return;
        }
        try {
            if (currentItem.id) {
                await DictionaryApi.update('parcels', currentItem.id, currentItem);
            } else {
                await DictionaryApi.create('parcels', currentItem);
            }
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Дані посилки збережено', severity: 'success' });
        } catch (error) {
            setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити цю посилку?')) {
            try {
                await DictionaryApi.delete('parcels', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено', severity: 'success' });
            } catch (error) {
                setNotification({ open: true, message: 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const openModal = (item = {
        declaredValue: 0,
        actualWeight: 0,
        contentDescription: '',
        parcelTypeId: '',
        storageConditionIds: []
    }) => {
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
                color: 'white',
                borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '50%', display: 'flex' }}>
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

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }} elevation={0}>
                <TableContainer>
                    <Table sx={{ minWidth: 1000 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', pl: 3 }}>ТИП</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>ОПИС ВМІСТУ</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>ПАРАМЕТРИ</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>УМОВИ ЗБЕРІГАННЯ</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', pr: 3 }}>ДІЇ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {parcels.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell sx={{ pl: 3 }}>
                                        <Chip
                                            label={row.parcelTypeName}
                                            size="small"
                                            variant="outlined"
                                            icon={<Category style={{ fontSize: 14 }} />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {row.contentDescription || '—'}
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
                />
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #eee' }}>
                    <Inventory color="secondary" />
                    <Typography variant="h6">{currentItem.id ? 'Редагувати посилку' : 'Нова посилка'}</Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Тип посилки</InputLabel>
                        <Select
                            value={currentItem.parcelTypeId || ''}
                            label="Тип посилки"
                            onChange={(e) => setCurrentItem({ ...currentItem, parcelTypeId: e.target.value })}
                        >
                            {parcelTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Вага (кг)" type="number" fullWidth size="small"
                            value={currentItem.actualWeight || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, actualWeight: e.target.value })}
                        />
                        <TextField
                            label="Вартість (грн)" type="number" fullWidth size="small"
                            value={currentItem.declaredValue || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, declaredValue: e.target.value })}
                        />
                    </Box>

                    <TextField
                        label="Опис вмісту" multiline rows={2} fullWidth size="small"
                        value={currentItem.contentDescription || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, contentDescription: e.target.value })}
                    />

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
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Умови зберігання" placeholder="Оберіть вимоги..." />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option.name} {...getTagProps({ index })} size="small" color="info" variant="outlined" />
                            ))
                        }
                    />
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
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 2 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ParcelsPage;