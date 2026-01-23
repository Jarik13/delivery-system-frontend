import React, { useState, useEffect } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Snackbar, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { DictionaryApi } from '../api/dictionaries';

const DEFAULT_COLUMNS = [{ id: 'name', label: 'Назва' }];

const GenericTable = ({ endpoint, title, columns = DEFAULT_COLUMNS }) => {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const loadData = () => {
        DictionaryApi.getAll(endpoint, 0, 100).then(resp => {
            const list = resp.data.content ? resp.data.content : resp.data;
            setData(list || []);
        }).catch(() => showNotification('Помилка завантаження', 'error'));
    };

    useEffect(() => {
        loadData();
    }, [endpoint]);

    const showNotification = (msg, severity = 'success') => {
        setNotification({ open: true, message: msg, severity });
    };

    const handleCloseNotification = () => setNotification({ ...notification, open: false });

    const handleDelete = (id) => {
        if(window.confirm('Видалити запис?')) {
            DictionaryApi.delete(endpoint, id)
                .then(() => {
                    showNotification('Запис видалено');
                    loadData();
                })
                .catch(() => showNotification('Помилка видалення', 'error'));
        }
    };

    const handleSave = () => {
        const mainField = columns[0].id;
        if (!currentItem[mainField]) {
            showNotification(`Поле "${columns[0].label}" обов'язкове`, 'warning');
            return;
        }

        const action = currentItem.id 
            ? DictionaryApi.update(endpoint, currentItem.id, currentItem)
            : DictionaryApi.create(endpoint, currentItem);

        action.then(() => {
            setOpen(false);
            showNotification('Збережено успішно');
            loadData();
        }).catch(() => showNotification('Помилка збереження', 'error'));
    };

    const openModal = (item = {}) => {
        if (!item.id) {
            const emptyItem = {};
            columns.forEach(col => emptyItem[col.id] = '');
            setCurrentItem(emptyItem);
        } else {
            setCurrentItem(item);
        }
        setOpen(true);
    };

    const handleChange = (fieldId, value) => {
        setCurrentItem(prev => ({ ...prev, [fieldId]: value }));
    };

    return (
        <Paper sx={{ width: '100%', mb: 2, p: 2, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{title}</Typography>
                <Button 
                    variant="contained" 
                    color="secondary"
                    startIcon={<AddIcon />} 
                    onClick={() => openModal()}
                >
                    Додати
                </Button>
            </Box>

            <TableContainer sx={{ maxHeight: '75vh' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {columns.map(col => (
                                <TableCell key={col.id} sx={{ fontWeight: 'bold' }}>
                                    {col.label}
                                </TableCell>
                            ))}
                            <TableCell align="right" sx={{ fontWeight: 'bold', width: '120px' }}>Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow hover key={row.id}>
                                {columns.map(col => (
                                    <TableCell key={col.id}>
                                        {row[col.id]}
                                    </TableCell>
                                ))}
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => openModal(row)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(row.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} align="center">Дані відсутні</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{currentItem.id ? 'Редагувати' : 'Створити'}</DialogTitle>
                <DialogContent>
                    {columns.map((col, index) => (
                        <TextField
                            key={col.id}
                            autoFocus={index === 0}
                            margin="dense"
                            label={col.label}
                            fullWidth
                            variant="outlined"
                            value={currentItem[col.id] || ''}
                            onChange={(e) => handleChange(col.id, e.target.value)}
                            multiline={col.id === 'description'}
                            rows={col.id === 'description' ? 3 : 1}
                        />
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Скасувати</Button>
                    <Button onClick={handleSave} variant="contained">Зберегти</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default GenericTable;