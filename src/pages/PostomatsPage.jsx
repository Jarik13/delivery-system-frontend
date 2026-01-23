import React, { useState, useEffect } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
    Checkbox, FormControlLabel, Chip,
    TablePagination
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, Cancel } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';

const PostomatsPage = () => {
    const [postomats, setPostomats] = useState([]);
    const [cities, setCities] = useState([]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const loadDictionaries = async () => {
            try {
                const citiesRes = await DictionaryApi.getAll('cities', 0, 1000);
                setCities(citiesRes.data.content || citiesRes.data || []);
            } catch (error) {
                console.error("Помилка завантаження міст");
            }
        };
        loadDictionaries();
    }, []);

    const loadTableData = async () => {
        try {
            const response = await DictionaryApi.getAll('postomats', page, rowsPerPage);
            const data = response.data;
            
            setPostomats(data.content || []);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
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
        try {
            if (currentItem.id) {
                await DictionaryApi.update('postomats', currentItem.id, currentItem);
            } else {
                await DictionaryApi.create('postomats', currentItem);
            }
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Збережено', severity: 'success' });
        } catch (error) {
            setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити поштомат?')) {
            try {
                await DictionaryApi.delete('postomats', id);
                loadTableData();
            } catch (e) {
                setNotification({ open: true, message: 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const openModal = (item = { name: '', code: '', address: '', cityId: '', cellsCount: 0, isActive: true }) => {
        setCurrentItem(item);
        setOpen(true);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Поштомати</Typography>
                <Button variant="contained" color="secondary" startIcon={<Add />} onClick={() => openModal()}>
                    Додати поштомат
                </Button>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><b>Код</b></TableCell>
                            <TableCell><b>Назва</b></TableCell>
                            <TableCell><b>Адреса</b></TableCell>
                            <TableCell><b>Місто</b></TableCell>
                            <TableCell><b>Комірок</b></TableCell>
                            <TableCell align="center"><b>Статус</b></TableCell>
                            <TableCell align="right"><b>Дії</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {postomats.map((row) => (
                            <TableRow key={row.id} hover>
                                <TableCell><b>{row.code}</b></TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.address}</TableCell>
                                <TableCell>{row.cityName}</TableCell>
                                <TableCell>{row.cellsCount}</TableCell>
                                <TableCell align="center">
                                    {row.isActive
                                        ? <Chip icon={<CheckCircle />} label="Активний" color="success" size="small" variant="outlined" />
                                        : <Chip icon={<Cancel />} label="Неактивний" color="default" size="small" variant="outlined" />
                                    }
                                </TableCell>
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
                <DialogTitle>{currentItem.id ? 'Редагувати' : 'Новий поштомат'}</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField label="Технічний код" value={currentItem.code} onChange={(e) => setCurrentItem({ ...currentItem, code: e.target.value })} fullWidth />
                    <TextField label="Назва" value={currentItem.name} onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })} fullWidth />
                    <TextField label="Адреса" value={currentItem.address} onChange={(e) => setCurrentItem({ ...currentItem, address: e.target.value })} fullWidth />

                    <FormControl fullWidth>
                        <InputLabel>Місто</InputLabel>
                        <Select
                            value={currentItem.cityId || ''}
                            label="Місто"
                            onChange={(e) => setCurrentItem({ ...currentItem, cityId: e.target.value })}
                        >
                            {cities.map(city => <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Кількість комірок"
                        type="number"
                        value={currentItem.cellsCount}
                        onChange={(e) => setCurrentItem({ ...currentItem, cellsCount: e.target.value })}
                        fullWidth
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!currentItem.isActive}
                                onChange={(e) => setCurrentItem({ ...currentItem, isActive: e.target.checked })}
                            />
                        }
                        label="Поштомат активний"
                    />
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

export default PostomatsPage;