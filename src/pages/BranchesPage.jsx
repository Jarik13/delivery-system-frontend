import React, { useState, useEffect } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
    TablePagination
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import LocationSelector from '../components/LocationSelector';

const BranchesPage = () => {
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
            setNotification({ open: true, message: 'Будь ласка, оберіть населений пункт', severity: 'error' });
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
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Відділення</Typography>
                <Button variant="contained" color="secondary" startIcon={<Add />} onClick={() => openModal()}>
                    Додати відділення
                </Button>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><b>Назва</b></TableCell>
                            <TableCell><b>Адреса</b></TableCell>
                            <TableCell><b>Місто</b></TableCell>
                            <TableCell><b>Тип</b></TableCell>
                            <TableCell align="right"><b>Дії</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {branches.map((row) => (
                            <TableRow key={row.id} hover>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.address}</TableCell>
                                <TableCell>{row.cityName || 'Невідомо'}</TableCell>
                                <TableCell>{row.branchTypeName || 'Невідомо'}</TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <IconButton color="primary" size="small" onClick={() => openModal(row)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton color="error" size="small" onClick={() => handleDelete(row.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
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
                labelRowsPerPage="Рядків на сторінці:"
            />

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{currentItem.id ? 'Редагувати' : 'Нове відділення'}</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                        label="Назва"
                        fullWidth
                        value={currentItem.name || ''} 
                        onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                        margin="dense"
                    />

                    <Typography variant="subtitle2" sx={{ mt: 1, color: 'text.secondary' }}>Локація:</Typography>

                    <LocationSelector 
                        selectedCityId={currentItem.cityId}
                        onCityChange={(cityId) => setCurrentItem({ ...currentItem, cityId: cityId })}
                    />

                    <TextField
                        label="Адреса (вулиця та номер)"
                        fullWidth
                        value={currentItem.address}
                        onChange={(e) => setCurrentItem({ ...currentItem, address: e.target.value })}
                    />

                    <FormControl fullWidth>
                        <InputLabel id="branch-type-label">Тип відділення</InputLabel>
                        <Select
                            labelId="branch-type-label"
                            id="branch-type-select"
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
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Скасувати</Button>
                    <Button onClick={handleSave} variant="contained">Зберегти</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity}>{notification.message}</Alert>
            </Snackbar>
        </Paper>
    );
};

export default BranchesPage;