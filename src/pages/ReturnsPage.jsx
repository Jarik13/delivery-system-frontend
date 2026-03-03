import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress,
} from '@mui/material';
import { AssignmentReturn, ErrorOutline, Schedule, LocalShipping } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import { RETURN_REASON_COLORS, getTypeColor } from '../constants/typeColors';

const defaultFilters = {
    returnTrackingNumber: '',
    shipmentTrackingNumber: '',
    returnReasons: [],
    initiationDateFrom: '',
    initiationDateTo: '',
};

const buildFilterFields = (returnReasons) => [
    { name: 'returnTrackingNumber',  label: 'Трек-номер повернення', type: 'text', placeholder: 'RET-...' },
    { name: 'shipmentTrackingNumber', label: 'Трек-номер відправлення', type: 'text', placeholder: '590000...' },
    {
        name: 'returnReasons',
        label: 'Причина повернення',
        type: 'checkbox-group',
        options: returnReasons.map(r => ({ id: r.id, name: r.name })),
    },
    { name: 'initiationDateFrom', label: 'Дата ініціації від', type: 'datetime' },
    { name: 'initiationDateTo',   label: 'Дата ініціації до',  type: 'datetime' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleString('uk-UA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
}) : '—';

const ReturnsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['returns']] || '#f44336';

    const [items, setItems]                 = useState([]);
    const [loading, setLoading]             = useState(false);
    const [page, setPage]                   = useState(0);
    const [rowsPerPage, setRowsPerPage]     = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [returnReasons, setReturnReasons] = useState([]);
    const [filters, setFilters]             = useState(defaultFilters);
    const [notification, setNotification]   = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        DictionaryApi.getAll('return-reasons', 0, 100)
            .then(r => setReturnReasons(r.data.content || []))
            .catch(console.error);
    }, []);

    const buildParams = useCallback((f) => {
        const params = {};
        if (f.returnTrackingNumber?.trim())   params.returnTrackingNumber  = f.returnTrackingNumber.trim();
        if (f.shipmentTrackingNumber?.trim()) params.shipmentTrackingNumber = f.shipmentTrackingNumber.trim();
        if (f.returnReasons?.length)          params.returnReasons          = f.returnReasons.join(',');
        if (f.initiationDateFrom)             params.initiationDateFrom     = f.initiationDateFrom;
        if (f.initiationDateTo)               params.initiationDateTo       = f.initiationDateTo;
        return params;
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await DictionaryApi.getAll('returns', page, rowsPerPage, buildParams(filters));
            setItems(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
        } catch {
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters, buildParams]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    }, []);

    const handleFilterClear = useCallback(() => {
        setFilters(defaultFilters);
        setPage(0);
    }, []);

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                mb: 2, borderRadius: 3, overflow: 'hidden',
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                <Box sx={{
                    p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.8)} 100%)`,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                            <AssignmentReturn fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Повернення</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                                Реєстр повернених відправлень
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleFilterClear}
                fields={buildFilterFields(returnReasons)}
                searchPlaceholder="Пошук за трек-номером..."
                accentColor={mainColor}
                counts={{ total: totalElements }}
            />

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                        <CircularProgress sx={{ color: mainColor }} />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Трек-номер повернення</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Відправлення</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Причина</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Сума повернення</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Дата ініціації</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Дата завершення</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#bbb' }}>
                                                <AssignmentReturn sx={{ fontSize: 48 }} />
                                                <Typography variant="body2">Повернень не знайдено</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : items.map(r => {
                                    const reasonColor = getTypeColor(RETURN_REASON_COLORS, r.returnReasonName);
                                    return (
                                        <TableRow key={r.id} hover sx={{
                                            borderLeft: `3px solid ${alpha(reasonColor, 0.5)}`,
                                            '&:hover': { bgcolor: alpha(mainColor, 0.02) },
                                        }}>
                                            <TableCell>
                                                <Typography variant="caption" sx={{
                                                    fontFamily: 'monospace', fontWeight: 700,
                                                    bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1, fontSize: 11,
                                                }}>
                                                    {r.returnTrackingNumber || '—'}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <LocalShipping sx={{ fontSize: 13, color: '#999' }} />
                                                    <Typography variant="caption" sx={{
                                                        fontFamily: 'monospace', fontWeight: 600,
                                                        bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1, fontSize: 11,
                                                    }}>
                                                        {r.shipmentTrackingNumber || `#${r.shipmentId}`}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                {r.returnReasonName ? (
                                                    <Chip
                                                        icon={<ErrorOutline sx={{ fontSize: '13px !important' }} />}
                                                        label={r.returnReasonName}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(reasonColor, 0.1),
                                                            color: reasonColor,
                                                            fontWeight: 700,
                                                            border: `1px solid ${alpha(reasonColor, 0.25)}`,
                                                            '& .MuiChip-icon': { color: reasonColor },
                                                        }}
                                                    />
                                                ) : '—'}
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2" fontWeight={800} sx={{ color: mainColor }}>
                                                    {r.refundAmount != null ? `${r.refundAmount} ₴` : '—'}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Schedule sx={{ fontSize: 13, color: '#999' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {fmtDate(r.initiationDate)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="body2" color={r.completionDate ? 'success.main' : 'text.disabled'}
                                                    fontWeight={r.completionDate ? 700 : 400}>
                                                    {fmtDate(r.completionDate)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <DataPagination
                count={totalElements} page={page} rowsPerPage={rowsPerPage}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Повернень:"
            />

            <Snackbar open={notification.open} autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ReturnsPage;