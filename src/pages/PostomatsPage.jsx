import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert,
    Checkbox, FormControlLabel, Chip, Tooltip, TablePagination, useTheme, alpha
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, Cancel, AllInbox, Place, GridView } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import LocationSelector from '../components/LocationSelector';
import DataFilters from '../components/DataFilters';

const PostomatsPage = () => {
    const theme = useTheme();
    const [postomats, setPostomats] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [filters, setFilters] = useState({
        name: '',
        code: '',
        address: '',
        isActive: '',
        cellsCountMin: 0,
        cellsCountMax: 100
    });

    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const loadTableData = useCallback(async () => {
        try {
            const response = await DictionaryApi.getAll('postomats', page, rowsPerPage, filters);
            const data = response.data;
            setPostomats(data.content || []);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadTableData();
        }, 400);
        return () => clearTimeout(timer);
    }, [loadTableData]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleClearFilters = () => {
        setFilters({
            name: '',
            code: '',
            address: '',
            isActive: '',
            cellsCountMin: 0,
            cellsCountMax: 100
        });
        setPage(0);
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSave = async () => {
        if (!currentItem.cityId) {
            setNotification({ open: true, message: 'Оберіть населений пункт', severity: 'warning' });
            return;
        }
        try {
            if (currentItem.id) {
                await DictionaryApi.update('postomats', currentItem.id, currentItem);
            } else {
                await DictionaryApi.create('postomats', currentItem);
            }
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Збережено успішно', severity: 'success' });
        } catch (error) {
            setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити поштомат?')) {
            try {
                await DictionaryApi.delete('postomats', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено', severity: 'success' });
            } catch (e) {
                setNotification({ open: true, message: 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const openModal = (item = { name: '', code: '', address: '', cityId: '', cellsCount: 0, isActive: true }) => {
        setCurrentItem(item);
        setOpen(true);
    };

    const filterFields = [
        { name: 'name', label: 'Назва', type: 'text' },
        { name: 'code', label: 'Код', type: 'text' },
        { name: 'address', label: 'Адреса', type: 'text' },
        { 
            name: 'isActive', label: 'Статус', type: 'select', 
            options: [{ id: 'true', name: 'Активний' }, { id: 'false', name: 'Неактивний' }] 
        },
        { 
            label: 'Кількість комірок', 
            type: 'range', 
            minName: 'cellsCountMin', 
            maxName: 'cellsCountMax',
            min: 0, 
            max: 200 
        }
    ];

    return (
        <Box sx={{ px: 2, pb: 2, pt: 0, maxWidth: '100%', margin: '0 auto' }}>
            <Paper elevation={0} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '50%', display: 'flex' }}><AllInbox fontSize="medium" color="inherit" /></Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Поштомати</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Мережа автоматизованих терміналів</Typography>
                    </Box>
                </Box>
                <Button variant="contained" size="small" sx={{ bgcolor: 'white', color: '#f57c00', fontWeight: 'bold', '&:hover': { bgcolor: '#fff3e0' } }} startIcon={<Add />} onClick={() => openModal()}>Додати поштомат</Button>
            </Paper>

            <DataFilters filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} fields={filterFields} />

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }} elevation={0}>
                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', pl: 3 }}>ПОШТОМАТ</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>АДРЕСА</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>КОМІРОК</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>СТАТУС</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', pr: 3 }}>ДІЇ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {postomats.map((row) => (
                                <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ pl: 3 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="subtitle2" fontWeight="bold">{row.name}</Typography>
                                            <Chip label={`Код: ${row.code || '---'}`} size="small" sx={{ width: 'fit-content', height: 20, fontSize: '0.65rem', mt: 0.5, bgcolor: '#f5f5f5', color: 'text.secondary' }} />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{row.address}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                                            <Place sx={{ fontSize: 12 }} />
                                            <Typography variant="caption">{row.cityName || '-'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                            <GridView fontSize="small" color="action" />
                                            <Typography variant="body2">{row.cellsCount}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        {row.isActive ? 
                                            <Chip icon={<CheckCircle style={{fontSize: 14}}/>} label="Активний" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.dark, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2), height: 24 }} /> : 
                                            <Chip icon={<Cancel style={{fontSize: 14}}/>} label="Неактивний" size="small" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.dark, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2), height: 24 }} />
                                        }
                                    </TableCell>
                                    <TableCell align="right" sx={{ pr: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="Редагувати"><IconButton size="small" onClick={() => openModal(row)} sx={{ color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) }}><Edit fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="Видалити"><IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.05) }}><Delete fontSize="small" /></IconButton></Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination component="div" count={totalElements} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Рядків:" />
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ borderBottom: '1px solid #eee' }}><AllInbox color="primary" /> {currentItem.id ? 'Редагувати' : 'Новий поштомат'}</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                    <TextField label="Назва" value={currentItem.name || ''} onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })} fullWidth margin="dense" />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Код" value={currentItem.code || ''} disabled fullWidth variant="filled" />
                        <TextField label="Комірок" type="number" value={currentItem.cellsCount || ''} onChange={(e) => setCurrentItem({ ...currentItem, cellsCount: e.target.value })} fullWidth />
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                        <LocationSelector selectedCityId={currentItem.cityId} onCityChange={(cityId) => setCurrentItem({ ...currentItem, cityId: cityId })} />
                        <TextField label="Вулиця та номер" value={currentItem.address || ''} onChange={(e) => setCurrentItem({ ...currentItem, address: e.target.value })} fullWidth sx={{ mt: 2 }} />
                    </Box>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <FormControlLabel control={<Checkbox checked={!!currentItem.isActive} onChange={(e) => setCurrentItem({ ...currentItem, isActive: e.target.checked })} color="success" />} label="Поштомат активний" />
                    </Paper>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpen(false)}>Скасувати</Button>
                    <Button onClick={handleSave} variant="contained">Зберегти</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default PostomatsPage;