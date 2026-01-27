import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Snackbar, Alert, useTheme, alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';
import { DictionaryApi } from '../api/dictionaries';
import { GROUP_COLORS, ITEM_GROUP_MAP, itemIcons } from '../constants/menuConfig';

const DEFAULT_COLUMNS = [{ id: 'name', label: 'Назва' }];

const GenericTable = ({ endpoint, title, columns = DEFAULT_COLUMNS }) => {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const groupName = ITEM_GROUP_MAP[endpoint];
    const mainColor = GROUP_COLORS[groupName] || GROUP_COLORS.default;
    const Icon = itemIcons[endpoint] || <CategoryIcon />;

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
        if (window.confirm('Видалити запис?')) {
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
        <Box sx={{ px: 2, pb: 2, pt: 0 }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3, boxShadow: `0 4px 20px ${alpha(mainColor, 0.3)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '50%', display: 'flex' }}>
                        {React.cloneElement(Icon, { sx: { color: 'inherit' } })}
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">{title}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                            Керування довідником: {title}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    size="small"
                    sx={{
                        bgcolor: 'white',
                        color: mainColor,
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                    startIcon={<AddIcon />}
                    onClick={() => openModal()}
                >
                    Додати
                </Button>
            </Paper>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }} elevation={0}>
                <TableContainer sx={{ maxHeight: '70vh' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                {columns.map(col => (
                                    <TableCell key={col.id} sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa' }}>
                                        {col.label}
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: 'bold', width: '120px', bgcolor: '#f8f9fa' }}>ДІЇ</TableCell>
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
                                        <IconButton color="primary" size="small" onClick={() => openModal(row)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton color="error" size="small" onClick={() => handleDelete(row.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ borderBottom: '1px solid #eee', mb: 2 }}>
                    {currentItem.id ? 'Редагувати запис' : 'Створити новий запис'}
                </DialogTitle>
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
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee' }}>
                    <Button
                        onClick={() => setOpen(false)}
                        sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'none' }}
                    >
                        Скасувати
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disableElevation
                        sx={{
                            bgcolor: mainColor,
                            '&:hover': { bgcolor: mainColor, opacity: 0.9 },
                            px: 4,
                            borderRadius: 2,
                            fontWeight: 'bold',
                            textTransform: 'none'
                        }}
                    >
                        Зберегти
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification}>
                <Alert variant="filled" severity={notification.severity} sx={{ width: '100%', borderRadius: 2 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default GenericTable;