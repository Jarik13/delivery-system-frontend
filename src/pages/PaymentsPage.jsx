import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert, Button, Chip,
} from '@mui/material';
import { Payments, Add } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import PaymentTable from '../components/payments/PaymentTable';

const DEFAULT_AMOUNT_MIN = 0;
const DEFAULT_AMOUNT_MAX = 50000;

const defaultFilters = {
    transactionNumber: '',
    shipmentTrackingNumber: '',
    paymentTypes: [],
    amountMin: DEFAULT_AMOUNT_MIN,
    amountMax: DEFAULT_AMOUNT_MAX,
    paymentDateFrom: '',
    paymentDateTo: '',
};

const buildFilterFields = (paymentTypes, statistics) => [
    {
        name: 'transactionNumber',
        label: 'Номер транзакції',
        type: 'text',
        placeholder: 'TXN-...',
    },
    {
        name: 'shipmentTrackingNumber',
        label: 'Трек-номер відправлення',
        type: 'text',
        placeholder: '590000...',
    },
    {
        name: 'paymentTypes',
        label: 'Тип оплати',
        type: 'checkbox-group',
        options: paymentTypes.map(t => ({ id: t.id, name: t.name })),
    },
    {
        label: 'Сума (₴)',
        type: 'range',
        minName: 'amountMin',
        maxName: 'amountMax',
        min: statistics.amountMin,
        max: statistics.amountMax,
        step: 50,
    },
    {
        name: 'paymentDateFrom',
        label: 'Дата оплати від',
        type: 'datetime',
    },
    {
        name: 'paymentDateTo',
        label: 'Дата оплати до',
        type: 'datetime',
    },
];

const PaymentsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['payments']] || '#673ab7';

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [filters, setFilters] = useState(defaultFilters);

    const [statistics, setStatistics] = useState({
        amountMin: DEFAULT_AMOUNT_MIN,
        amountMax: DEFAULT_AMOUNT_MAX,
    });

    useEffect(() => {
        DictionaryApi.getAll('payment-types', 0, 100)
            .then(r => setPaymentTypes(r.data.content || []))
            .catch(console.error);

        DictionaryApi.getStatistics('payments')
            .then(r => {
                const { amountMin, amountMax } = r.data;
                const min = amountMin ?? DEFAULT_AMOUNT_MIN;
                const max = amountMax ?? DEFAULT_AMOUNT_MAX;
                setStatistics({ amountMin: min, amountMax: max });
                setFilters(prev => ({ ...prev, amountMin: min, amountMax: max }));
            })
            .catch(console.error);
    }, []);

    const buildParams = useCallback((f) => {
        const params = {};
        if (f.transactionNumber?.trim()) params.transactionNumber = f.transactionNumber.trim();
        if (f.shipmentTrackingNumber?.trim()) params.shipmentTrackingNumber = f.shipmentTrackingNumber.trim();
        if (f.paymentTypes?.length) params.paymentTypes = f.paymentTypes.join(',');
        if (f.amountMin !== statistics.amountMin) params.amountMin = f.amountMin;
        if (f.amountMax !== statistics.amountMax) params.amountMax = f.amountMax;
        if (f.paymentDateFrom) params.paymentDateFrom = f.paymentDateFrom;
        if (f.paymentDateTo) params.paymentDateTo = f.paymentDateTo;
        return params;
    }, [statistics]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await DictionaryApi.getAll('payments', page, rowsPerPage, buildParams(filters));
            setItems(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters, buildParams]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    const handleFilterClear = useCallback(() => {
        setFilters({
            ...defaultFilters,
            amountMin: statistics.amountMin,
            amountMax: statistics.amountMax,
        });
        setPage(0);
    }, [statistics]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    }, []);

    const handleToggle = useCallback((id) => setSelectedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    }), []);

    const handleToggleAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.size === items.length ? new Set() : new Set(items.map(i => i.id))
        );
    }, [items]);

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
                            <Payments fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Платежі</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                                Транзакції та оплати за відправлення
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {selectedIds.size > 0 && (
                            <Chip
                                label={`Вибрано: ${selectedIds.size}`}
                                size="small"
                                onDelete={() => setSelectedIds(new Set())}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700,
                                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' },
                                }}
                            />
                        )}
                        <Button variant="contained" size="small" startIcon={<Add />}
                            sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}>
                            Додати платіж
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleFilterClear}
                fields={buildFilterFields(paymentTypes, statistics)}
                searchPlaceholder="Пошук за номером транзакції..."
                accentColor={mainColor}
                counts={{ total: totalElements }}
            />

            <PaymentTable
                payments={items}
                loading={loading}
                mainColor={mainColor}
                selected={[...selectedIds]}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
            />

            <DataPagination
                count={totalElements} page={page} rowsPerPage={rowsPerPage}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Платежів:"
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

export default PaymentsPage;