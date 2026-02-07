import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
    TablePagination, Tooltip, useTheme, alpha, FormHelperText, Popover, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { Add, Edit, Delete, Apartment, Place, Store, AccessTime, CalendarMonth } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import LocationSelector from '../components/LocationSelector';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const BranchesPage = () => {
    const theme = useTheme();
    const groupName = ITEM_GROUP_MAP['branches'];
    const mainColor = GROUP_COLORS[groupName] || GROUP_COLORS.default;

    const [branches, setBranches] = useState([]);
    const [branchTypes, setBranchTypes] = useState([]);
    
    const [scheduleAnchorEl, setScheduleAnchorEl] = useState(null);
    const [currentSchedule, setCurrentSchedule] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [filters, setFilters] = useState({ name: '', address: '', branchTypeId: '' });
    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const handleShowSchedule = async (event, branchId) => {
        setScheduleAnchorEl(event.currentTarget);
        setLoadingSchedule(true);
        try {
            const res = await DictionaryApi.getByParam('work-schedules/branchId', 'branchId', branchId);
            
            const scheduleData = res.data.content || res.data;
            const sortedData = [...scheduleData].sort((a, b) => a.dayOfWeekId - b.dayOfWeekId);
            
            setCurrentSchedule(sortedData);
        } catch (error) {
            console.error("Помилка завантаження графіку", error);
        } finally {
            setLoadingSchedule(false);
        }
    };

    const handleCloseSchedule = () => {
        setScheduleAnchorEl(null);
        setCurrentSchedule([]);
    };

    const scheduleOpen = Boolean(scheduleAnchorEl);

    useEffect(() => {
        const loadTypes = async () => {
            try {
                const typesRes = await DictionaryApi.getAll('branch-types', 0, 100);
                setBranchTypes(typesRes.data.content || []);
            } catch (error) {
                console.error("Помилка завантаження типів", error);
            }
        };
        loadTypes();
    }, []);

    const loadTableData = useCallback(async () => {
        try {
            const response = await DictionaryApi.getAll('branches', page, rowsPerPage, filters);
            setBranches(response.data.content || []);
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
        setFilters({ name: '', address: '', branchTypeId: '' });
        setPage(0);
    };

    const handleSave = async () => {
        setFieldErrors({});
        try {
            if (currentItem.id) {
                await DictionaryApi.update('branches', currentItem.id, currentItem);
            } else {
                await DictionaryApi.create('branches', currentItem);
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
        if (window.confirm('Видалити відділення?')) {
            try {
                await DictionaryApi.delete('branches', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено', severity: 'success' });
            } catch (error) {
                setNotification({ open: true, message: error.response?.data?.message || 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const openModal = (item = { name: '', address: '', cityId: '', branchTypeId: '' }) => {
        setFieldErrors({});
        setCurrentItem(item);
        setOpen(true);
    };

    return (
        <Box sx={{ px: 2, pb: 2, pt: 0, maxWidth: '100%' }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3, boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '50%', display: 'flex' }}>
                        <Apartment fontSize="medium" color="inherit" />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">Відділення</Typography>
                </Box>
                <Button
                    variant="contained" size="small"
                    sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                    startIcon={<Add />} onClick={() => openModal()}
                >
                    Додати відділення
                </Button>
            </Paper>

            <DataFilters filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} fields={[
                { name: 'name', label: 'Назва відділення', type: 'text' },
                { name: 'address', label: 'Адреса', type: 'text' },
                { name: 'branchTypeId', label: 'Тип відділення', type: 'select', options: branchTypes }
            ]} />

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }} elevation={0}>
                <TableContainer>
                    <Table sx={{ minWidth: 700 }}>
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', pl: 3 }}>НАЗВА</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>АДРЕСА</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>ГРАФІК</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>ТИП</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', pr: 3 }}>ДІЇ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {branches.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell sx={{ pl: 3 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">{row.name}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                                            <Place sx={{ fontSize: 14 }} />
                                            <Typography variant="caption">{row.cityName || 'Невідомо'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{row.address}</Typography></TableCell>
                                    
                                    <TableCell>
                                        <Tooltip title="Переглянути графік">
                                            <IconButton 
                                                size="small" 
                                                color="primary" 
                                                onClick={(e) => handleShowSchedule(e, row.id)}
                                                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                                            >
                                                <AccessTime fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Store color="action" fontSize="small" />
                                            <Typography variant="body2">{row.branchTypeName || '-'}</Typography>
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
                <TablePagination component="div" count={totalElements} page={page} onPageChange={(e, n) => setPage(n)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Рядків:" />
            </Paper>

            <Popover
                open={scheduleOpen}
                anchorEl={scheduleAnchorEl}
                onClose={handleCloseSchedule}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[5], minWidth: 220 } }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                        <CalendarMonth fontSize="small" color="primary" /> Графік роботи
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    {loadingSchedule ? (
                        <Typography variant="caption">Завантаження...</Typography>
                    ) : currentSchedule.length > 0 ? (
                        <List size="small" disablePadding>
                            {currentSchedule.map((s) => (
                                <ListItem key={s.id} sx={{ px: 0, py: 0.5 }}>
                                    <ListItemText 
                                        primary={s.dayOfWeekName} 
                                        secondary={s.startTime && s.endTime ? `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}` : "Вихідний"}
                                        primaryTypographyProps={{ variant: 'caption', fontWeight: 'bold' }}
                                        secondaryTypographyProps={{ variant: 'caption', color: 'primary' }}
                                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="caption" color="text.disabled">Графік не встановлено</Typography>
                    )}
                </Box>
            </Popover>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee', pb: 2 }}>
                    <Apartment sx={{ color: mainColor }} />
                    <Typography variant="h6" fontWeight="bold">{currentItem.id ? 'Редагувати' : 'Нове відділення'}</Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                    <TextField 
                        label="Назва" 
                        fullWidth 
                        value={currentItem.name || ''} 
                        onChange={(e) => {
                            setCurrentItem({ ...currentItem, name: e.target.value });
                            if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null});
                        }} 
                        error={!!fieldErrors.name} 
                        helperText={fieldErrors.name}
                        InputLabelProps={{ shrink: true }}
                    />
                    
                    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Локація</Typography>
                        <LocationSelector selectedCityId={currentItem.cityId} onCityChange={(cityId) => setCurrentItem({ ...currentItem, cityId })} error={!!fieldErrors.cityId} />
                        <TextField 
                            label="Вулиця та номер будинку" 
                            fullWidth 
                            value={currentItem.address || ''} 
                            onChange={(e) => setCurrentItem({ ...currentItem, address: e.target.value })} 
                            sx={{ mt: 2 }} 
                            error={!!fieldErrors.address} 
                            helperText={fieldErrors.address} 
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    <FormControl fullWidth error={!!fieldErrors.branchTypeId}>
                        <InputLabel id="branch-type-label" shrink>Тип відділення</InputLabel>
                        <Select 
                            labelId="branch-type-label"
                            value={currentItem.branchTypeId || ''} 
                            label="Тип відділення" 
                            notched={true}
                            onChange={(e) => setCurrentItem({ ...currentItem, branchTypeId: e.target.value })}
                        >
                            {branchTypes.map(type => (<MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>))}
                        </Select>
                        {fieldErrors.branchTypeId && <FormHelperText>{fieldErrors.branchTypeId}</FormHelperText>}
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Скасувати</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ bgcolor: mainColor }}>Зберегти</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 2 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BranchesPage;