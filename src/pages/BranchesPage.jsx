import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, MenuItem, Select,
    FormControl, InputLabel, Tooltip, useTheme, alpha, FormHelperText,
    CircularProgress, Chip, Popover,
} from '@mui/material';
import { Add, Edit, Delete, Apartment, Place, Store, AccessTime, Close } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import LocationSelector from '../components/LocationSelector';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import DataPagination from '../components/pagination/DataPagination';

const DAYS_ORDER = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const fmtTime = (t) => (t ? String(t).slice(0, 5) : '—');

const BranchesPage = () => {
    const theme = useTheme();
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['branches']] || theme.palette.primary.main;

    const [branches, setBranches] = useState([]);
    const [branchTypes, setBranchTypes] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);

    const [filters, setFilters] = useState({ name: '', address: '', branchTypes: [] });
    const [open, setOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const [scheduleAnchor, setScheduleAnchor] = useState(null);
    const [scheduleBranch, setScheduleBranch] = useState(null);
    const [scheduleData, setScheduleData] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    useEffect(() => {
        DictionaryApi.getAll('branch-types', 0, 100)
            .then(res => setBranchTypes(res.data.content || []))
            .catch(e => console.error('Помилка завантаження типів', e));
    }, []);

    const loadTableData = useCallback(async () => {
        try {
            const active = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) =>
                    v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)
                )
            );
            const res = await DictionaryApi.getAll('branches', page, rowsPerPage, active);
            setBranches(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
        } catch {
            setNotification({ open: true, message: 'Помилка завантаження даних', severity: 'error' });
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const t = setTimeout(loadTableData, 400);
        return () => clearTimeout(t);
    }, [loadTableData]);

    const handleShowSchedule = async (e, row) => {
        e.stopPropagation();
        setScheduleAnchor(e.currentTarget);
        setScheduleBranch({ id: row.id, name: row.name, cityName: row.cityName });
        setScheduleData([]);
        setScheduleLoading(true);
        try {
            const res = await DictionaryApi.getByParam('work-schedules', 'branchId', row.id);
            setScheduleData(res.data.content ?? res.data ?? []);
        } catch {
            setNotification({ open: true, message: 'Помилка завантаження графіку', severity: 'error' });
        } finally {
            setScheduleLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleClearFilters = () => {
        setFilters({ name: '', address: '', branchTypes: [] });
        setPage(0);
    };

    const handleSave = async () => {
        setFieldErrors({});
        try {
            if (currentItem.id) await DictionaryApi.update('branches', currentItem.id, currentItem);
            else await DictionaryApi.create('branches', currentItem);
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
        if (!window.confirm('Видалити відділення?')) return;
        try {
            await DictionaryApi.delete('branches', id);
            loadTableData();
            setNotification({ open: true, message: 'Видалено', severity: 'success' });
        } catch (error) {
            setNotification({ open: true, message: error.response?.data?.message || 'Помилка видалення', severity: 'error' });
        }
    };

    const openModal = (item = { name: '', address: '', cityId: '', branchTypeId: '' }) => {
        setFieldErrors({});
        setCurrentItem(item);
        setOpen(true);
    };

    const filterFields = [
        { name: 'name', label: 'Назва', type: 'text' },
        { name: 'address', label: 'Вулиця', type: 'text' },
        {
            name: 'branchTypes',
            label: 'Тип відділення',
            type: 'checkbox-group',
            options: branchTypes.map(t => ({ id: t.id, name: t.name })),
        },
    ];

    const scheduleByDay = DAYS_ORDER.reduce((acc, day) => {
        acc[day] = scheduleData.find(s =>
            (s.dayOfWeekName ?? '').toLowerCase() === day.toLowerCase()
        ) ?? null;
        return acc;
    }, {});

    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    const isOpenNow = () => {
        const s = scheduleByDay[DAYS_ORDER[todayIdx]];
        if (!s) return false;
        const [sh, sm] = fmtTime(s.startTime).split(':').map(Number);
        const [eh, em] = fmtTime(s.endTime).split(':').map(Number);
        const now = new Date().getHours() * 60 + new Date().getMinutes();
        return now >= sh * 60 + sm && now <= eh * 60 + em;
    };

    return (
        <Box sx={{ px: 2, pb: 2, pt: 0, maxWidth: '100%' }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                        <Apartment fontSize="medium" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Відділення</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                            Мережа відділень та пунктів обслуговування
                        </Typography>
                    </Box>
                </Box>
                <Button variant="contained" size="small" startIcon={<Add />}
                    onClick={() => openModal()}
                    sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}>
                    Додати відділення
                </Button>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
                searchPlaceholder="Пошук відділення..."
                fields={filterFields}
                accentColor={mainColor}
                counts={{ total: totalElements }}
            />

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
                            {branches.map(row => (
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
                                        <Tooltip title="Переглянути графік роботи">
                                            <IconButton size="small"
                                                onClick={(e) => handleShowSchedule(e, row)}
                                                sx={{
                                                    color: mainColor,
                                                    bgcolor: alpha(mainColor, 0.07),
                                                    '&:hover': { bgcolor: alpha(mainColor, 0.16) },
                                                }}>
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
                                            <Tooltip title="Редагувати">
                                                <IconButton size="small" onClick={() => openModal(row)}
                                                    sx={{ color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Видалити">
                                                <IconButton size="small" onClick={() => handleDelete(row.id)}
                                                    sx={{ color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
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
                <DataPagination
                    count={totalElements}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(e, n) => setPage(n)}
                    onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                />
            </Paper>

            <Popover
                open={Boolean(scheduleAnchor)}
                anchorEl={scheduleAnchor}
                onClose={() => setScheduleAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 0.5,
                            borderRadius: 3,
                            width: 280,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                            overflow: 'hidden',
                        },
                    },
                }}
            >
                <Box sx={{
                    px: 2, py: 1.5,
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                            {scheduleBranch?.name}
                        </Typography>
                        {scheduleBranch?.cityName && (
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {scheduleBranch.cityName}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {!scheduleLoading && scheduleData.length > 0 && (
                            <Chip size="small"
                                label={isOpenNow() ? 'Відчинено' : 'Зачинено'}
                                sx={{
                                    height: 20, fontSize: 10, fontWeight: 800,
                                    bgcolor: isOpenNow()
                                        ? 'rgba(74,222,128,0.22)'
                                        : 'rgba(255,255,255,0.13)',
                                    color: isOpenNow() ? '#4ade80' : 'rgba(255,255,255,0.75)',
                                    border: `1px solid ${isOpenNow()
                                        ? 'rgba(74,222,128,0.45)'
                                        : 'rgba(255,255,255,0.22)'}`,
                                }}
                            />
                        )}
                        <IconButton size="small" onClick={() => setScheduleAnchor(null)}
                            sx={{
                                color: 'white', p: 0.25,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
                            }}>
                            <Close sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ px: 1.5, py: 1.5 }}>
                    {scheduleLoading ? (
                        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress size={24} sx={{ color: mainColor }} />
                        </Box>
                    ) : scheduleData.length === 0 ? (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.disabled">
                                Графік не налаштовано
                            </Typography>
                        </Box>
                    ) : (
                        DAYS_ORDER.map((day, idx) => {
                            const s = scheduleByDay[day];
                            const isToday = idx === todayIdx;

                            return (
                                <Box key={day} sx={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 1, py: 0.6,
                                    borderRadius: 1.5, mb: 0.25,
                                    bgcolor: isToday ? alpha(mainColor, 0.07) : 'transparent',
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                            bgcolor: s ? '#22c55e' : '#e2e8f0',
                                        }} />
                                        <Typography variant="body2" sx={{
                                            fontSize: 12.5,
                                            fontWeight: isToday ? 800 : 400,
                                            color: isToday ? mainColor
                                                : idx < 5 ? 'text.primary' : 'text.secondary',
                                            minWidth: 90,
                                        }}>
                                            {DAY_SHORT[idx]}
                                            <Typography component="span" sx={{ ml: 0.5, fontSize: 12.5 }}>
                                                {day.slice(DAY_SHORT[idx].length)}
                                            </Typography>
                                            {isToday && (
                                                <Typography component="span" sx={{
                                                    ml: 0.5, fontSize: 9,
                                                    fontWeight: 700, color: mainColor,
                                                }}>
                                                    •
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>

                                    {s ? (
                                        <Typography sx={{
                                            fontFamily: 'monospace', fontSize: 12.5,
                                            fontWeight: isToday ? 800 : 500,
                                            color: isToday ? mainColor : 'text.primary',
                                        }}>
                                            {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                                        </Typography>
                                    ) : (
                                        <Typography sx={{ fontSize: 12, color: 'text.disabled', fontWeight: 500 }}>
                                            вихідний
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Popover>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee', pb: 2 }}>
                    <Apartment sx={{ color: mainColor }} />
                    <Typography variant="h6" fontWeight="bold">
                        {currentItem.id ? 'Редагувати відділення' : 'Нове відділення'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3, mt: 1 }}>
                    <TextField label="Назва" fullWidth margin="dense"
                        value={currentItem.name || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                        error={!!fieldErrors.name} helperText={fieldErrors.name}
                    />
                    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Локація</Typography>
                        <LocationSelector
                            selectedCityId={currentItem.cityId}
                            onCityChange={(cityId) => setCurrentItem({ ...currentItem, cityId })}
                            error={!!fieldErrors.cityId}
                        />
                        {fieldErrors.cityId && <FormHelperText error sx={{ ml: 2 }}>{fieldErrors.cityId}</FormHelperText>}
                        <TextField label="Вулиця та номер будинку" fullWidth sx={{ mt: 2 }}
                            value={currentItem.address || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, address: e.target.value })}
                            error={!!fieldErrors.address} helperText={fieldErrors.address}
                        />
                    </Box>
                    <FormControl fullWidth error={!!fieldErrors.branchTypeId}>
                        <InputLabel>Тип відділення</InputLabel>
                        <Select value={currentItem.branchTypeId || ''} label="Тип відділення"
                            onChange={(e) => setCurrentItem({ ...currentItem, branchTypeId: e.target.value })}>
                            {branchTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                        </Select>
                        {fieldErrors.branchTypeId && <FormHelperText>{fieldErrors.branchTypeId}</FormHelperText>}
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                        Скасувати
                    </Button>
                    <Button onClick={handleSave} variant="contained" disableElevation
                        sx={{ bgcolor: mainColor, px: 4, borderRadius: 2, fontWeight: 'bold' }}>
                        Зберегти
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 2 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BranchesPage;