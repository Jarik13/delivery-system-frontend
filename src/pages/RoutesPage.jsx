import React, { useState, useEffect } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
    TablePagination, Chip, Checkbox, FormControlLabel, Tooltip,
    useTheme, alpha
} from '@mui/material';
import { 
    Add, Edit, Delete, LocalShipping, SwapHoriz, 
    Place, ArrowRightAlt, Map 
} from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';

const RoutesPage = () => {
    const theme = useTheme();
    const [routes, setRoutes] = useState([]);
    const [branches, setBranches] = useState([]); 

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const loadTableData = async () => {
        try {
            const response = await DictionaryApi.getAll('routes', page, rowsPerPage);
            const data = response.data;
            setRoutes(data.content || []);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            setNotification({ open: true, message: 'Помилка завантаження маршрутів', severity: 'error' });
        }
    };

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const res = await DictionaryApi.getAll('branches', 0, 1000);
                setBranches(res.data.content || []);
            } catch (error) {
                console.error("Не вдалося завантажити список відділень");
            }
        };
        loadBranches();
    }, []);

    useEffect(() => {
        loadTableData();
    }, [page, rowsPerPage]);

    const handleSave = async () => {
        if (!currentItem.originBranchId || !currentItem.destinationBranchId) {
            setNotification({ open: true, message: 'Оберіть обидва відділення', severity: 'warning' });
            return;
        }
        if (currentItem.originBranchId === currentItem.destinationBranchId) {
            setNotification({ open: true, message: 'Відділення не можуть співпадати', severity: 'error' });
            return;
        }
        try {
            if (currentItem.id) {
                await DictionaryApi.update('routes', currentItem.id, currentItem);
            } else {
                await DictionaryApi.create('routes', currentItem);
            }
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Маршрут збережено', severity: 'success' });
        } catch (error) {
            setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити цей маршрут?')) {
            try {
                await DictionaryApi.delete('routes', id);
                loadTableData();
                setNotification({ open: true, message: 'Маршрут видалено', severity: 'success' });
            } catch (error) {
                setNotification({ open: true, message: 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const openModal = (item = { originBranchId: '', destinationBranchId: '', isNeedSorting: false }) => {
        setCurrentItem(item);
        setOpen(true);
    };

    const parseLocation = (fullName) => {
        if (!fullName) return { main: 'Не вказано', sub: '' };
        const match = fullName.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
            return { main: match[2], sub: match[1] };
        }
        return { main: fullName, sub: 'Відділення' };
    };

    return (
        <Box sx={{ px: 2, pb: 2, pt: 0, maxWidth: '100%', margin: '0 auto' }}>
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, mb: 2, 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        p: 1.5, borderRadius: '50%', display: 'flex' 
                    }}>
                        <Map fontSize="medium" color="inherit" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Магістральні маршрути</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                            Управління логістичними ланцюжками
                        </Typography>
                    </Box>
                </Box>
                <Button 
                    variant="contained" 
                    size="small"
                    sx={{ 
                        bgcolor: 'white', color: '#1565c0',
                        fontWeight: 'bold', textTransform: 'none',
                        '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                    startIcon={<Add />} 
                    onClick={() => openModal()}
                >
                    Створити маршрут
                </Button>
            </Paper>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }} elevation={0}>
                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600, width: '75%', pl: 3 }}>
                                    МАРШРУТ
                                </TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600, width: '15%' }} align="center">
                                    ЛОГІСТИКА
                                </TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600, width: '10%' }} align="right">
                                    ДІЇ
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {routes.map((row) => {
                                const origin = parseLocation(row.originBranchName);
                                const dest = parseLocation(row.destinationBranchName);

                                return (
                                    <TableRow 
                                        key={row.id} 
                                        hover 
                                        sx={{ 
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <TableCell sx={{ pl: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <Box sx={{ flex: 1, textAlign: 'right', pr: 2 }}>
                                                    <Typography variant="subtitle2" fontWeight="bold" lineHeight={1.3} sx={{ fontSize: '0.95rem' }}>
                                                        {origin.main}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        <Place sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'text-top' }} />
                                                        {origin.sub}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.disabled', px: 1, minWidth: '90px' }}>
                                                    <Typography variant="caption" sx={{ mb: -0.5, fontSize: '0.6rem', letterSpacing: 0.5 }}>КУДИ</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#bdbdbd' }} />
                                                        <Box sx={{ flex: 1, height: 1, borderTop: '2px dashed #e0e0e0', minWidth: '20px' }} />
                                                        <LocalShipping sx={{ color: theme.palette.primary.main, fontSize: 20, mx: 0.5 }} />
                                                        <Box sx={{ flex: 1, height: 1, borderTop: '2px dashed #e0e0e0', minWidth: '20px' }} />
                                                        <ArrowRightAlt sx={{ color: '#bdbdbd', fontSize: 16 }} />
                                                    </Box>
                                                </Box>

                                                <Box sx={{ flex: 1, pl: 2 }}>
                                                    <Typography variant="subtitle2" fontWeight="bold" lineHeight={1.3} sx={{ fontSize: '0.95rem' }}>
                                                        {dest.main}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        <Place sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'text-top' }} />
                                                        {dest.sub}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            {row.isNeedSorting ? (
                                                <Chip 
                                                    icon={<SwapHoriz style={{ fontSize: 16 }} />} 
                                                    label="Сортування" 
                                                    sx={{ 
                                                        bgcolor: alpha(theme.palette.warning.main, 0.1), 
                                                        color: theme.palette.warning.dark,
                                                        fontWeight: 600, border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.2),
                                                        height: 24, fontSize: '0.75rem'
                                                    }}
                                                />
                                            ) : (
                                                <Chip 
                                                    icon={<ArrowRightAlt style={{ fontSize: 16 }} />} 
                                                    label="Прямий" 
                                                    sx={{ 
                                                        bgcolor: alpha(theme.palette.success.main, 0.1), 
                                                        color: theme.palette.success.dark,
                                                        fontWeight: 600, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2),
                                                        height: 24, fontSize: '0.75rem'
                                                    }}
                                                />
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                <Tooltip title="Редагувати">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => openModal(row)}
                                                        sx={{ 
                                                            color: theme.palette.primary.main, 
                                                            bgcolor: alpha(theme.palette.primary.main, 0.05),
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
                                                            bgcolor: alpha(theme.palette.error.main, 0.05),
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Рядків:"
                />
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
               <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #eee' }}>
                    <LocalShipping color="primary" />
                    <Typography variant="h6">{currentItem.id ? 'Редагувати маршрут' : 'Новий маршрут'}</Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
                    <Box sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Відділення відправлення</InputLabel>
                            <Select
                                value={currentItem.originBranchId || ''}
                                label="Відділення відправлення"
                                onChange={(e) => setCurrentItem({ ...currentItem, originBranchId: e.target.value })}
                            >
                                {branches.map(b => (
                                    <MenuItem key={b.id} value={b.id}>{b.name} ({b.cityName})</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: -1 }}>
                        <Box sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: '50%' }}>
                            <ArrowRightAlt sx={{ transform: 'rotate(90deg)', color: 'text.secondary' }} />
                        </Box>
                    </Box>
                    <FormControl fullWidth>
                        <InputLabel>Відділення призначення</InputLabel>
                        <Select
                            value={currentItem.destinationBranchId || ''}
                            label="Відділення призначення"
                            onChange={(e) => setCurrentItem({ ...currentItem, destinationBranchId: e.target.value })}
                        >
                            {branches.map(b => (
                                <MenuItem key={b.id} value={b.id} disabled={b.id === currentItem.originBranchId}>
                                    {b.name} ({b.cityName})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={currentItem.isNeedSorting || false}
                                    onChange={(e) => setCurrentItem({ ...currentItem, isNeedSorting: e.target.checked })}
                                    color="warning"
                                />
                            }
                            label={<Typography fontWeight={500}>Необхідне сортування</Typography>}
                        />
                    </Paper>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>Скасувати</Button>
                    <Button onClick={handleSave} variant="contained" disableElevation sx={{ borderRadius: 2 }}>Зберегти</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 2 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default RoutesPage;