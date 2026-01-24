import React, { useState, useEffect } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
    TablePagination, Tooltip, useTheme, alpha
} from '@mui/material';
import { Add, Edit, Delete, Apartment, Place, Store } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import LocationSelector from '../components/LocationSelector';

const BranchesPage = () => {
    const theme = useTheme();
    const [branches, setBranches] = useState([]);
    const [branchTypes, setBranchTypes] = useState([]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const loadTypes = async () => {
            try {
                const typesRes = await DictionaryApi.getAll('branch-types', 0, 100);
                setBranchTypes(typesRes.data.content || typesRes.data || []);
            } catch (error) {
                console.error("Помилка завантаження типів", error);
            }
        };
        loadTypes();
    }, []);

    const loadTableData = async () => {
        try {
            const response = await DictionaryApi.getAll('branches', page, rowsPerPage);
            const data = response.data;
            setBranches(data.content || []);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            setNotification({ open: true, message: 'Помилка завантаження даних', severity: 'error' });
        }
    };

    useEffect(() => {
        loadTableData();
    }, [page, rowsPerPage]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

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
                await DictionaryApi.update('branches', currentItem.id, currentItem);
            } else {
                await DictionaryApi.create('branches', currentItem);
            }
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Збережено успішно', severity: 'success' });
        } catch (error) {
            setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити відділення?')) {
            try {
                await DictionaryApi.delete('branches', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено', severity: 'success' });
            } catch (error) {
                setNotification({ open: true, message: 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const openModal = (item = { name: '', address: '', cityId: '', branchTypeId: '' }) => {
        setCurrentItem(item);
        setOpen(true);
    };

    return (
        <Box sx={{ px: 2, pb: 2, pt: 0, maxWidth: '100%', margin: '0 auto' }}>
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, mb: 2, 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '50%', display: 'flex' }}>
                        <Apartment fontSize="medium" color="inherit" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Відділення</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                            Пункти прийому та видачі вантажів
                        </Typography>
                    </Box>
                </Box>
                <Button 
                    variant="contained" 
                    size="small"
                    sx={{ 
                        bgcolor: 'white', color: '#2e7d32',
                        fontWeight: 'bold', textTransform: 'none',
                        '&:hover': { bgcolor: '#f1f8e9' }
                    }}
                    startIcon={<Add />} 
                    onClick={() => openModal()}
                >
                    Додати відділення
                </Button>
            </Paper>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }} elevation={0}>
                <TableContainer>
                    <Table sx={{ minWidth: 700 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', pl: 3 }}>НАЗВА</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>АДРЕСА</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>ТИП</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', pr: 3 }}>ДІЇ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {branches.map((row) => (
                                <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ pl: 3 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">{row.name}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                                            <Place sx={{ fontSize: 14 }} />
                                            <Typography variant="caption">{row.cityName || 'Невідомо'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{row.address}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Store color="action" fontSize="small" />
                                            <Typography variant="body2">{row.branchTypeName || '-'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ pr: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="Редагувати">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => openModal(row)}
                                                    sx={{ 
                                                        color: theme.palette.primary.main, 
                                                        bgcolor: alpha(theme.palette.primary.main, 0.05) 
                                                    }}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Видалити">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleDelete(row.id)}
                                                    sx={{ 
                                                        color: theme.palette.error.main, 
                                                        bgcolor: alpha(theme.palette.error.main, 0.05) 
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Рядків:"
                />
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #eee' }}>
                    <Apartment color="primary" />
                    <Typography variant="h6">{currentItem.id ? 'Редагувати' : 'Нове відділення'}</Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                    <TextField
                        label="Назва"
                        fullWidth
                        value={currentItem.name || ''} 
                        onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                        margin="dense"
                    />
                    
                    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Локація</Typography>
                        <LocationSelector 
                            selectedCityId={currentItem.cityId}
                            onCityChange={(cityId) => setCurrentItem({ ...currentItem, cityId: cityId })}
                        />
                        <TextField
                            label="Вулиця та номер будинку"
                            fullWidth
                            value={currentItem.address}
                            onChange={(e) => setCurrentItem({ ...currentItem, address: e.target.value })}
                            sx={{ mt: 2 }}
                        />
                    </Box>

                    <FormControl fullWidth>
                        <InputLabel>Тип відділення</InputLabel>
                        <Select
                            value={currentItem.branchTypeId || ''}
                            label="Тип відділення"
                            onChange={(e) => setCurrentItem({ ...currentItem, branchTypeId: e.target.value })}
                        >
                            {branchTypes.map(type => (
                                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>Скасувати</Button>
                    <Button onClick={handleSave} variant="contained" disableElevation sx={{ borderRadius: 2 }}>Зберегти</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 2 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BranchesPage;