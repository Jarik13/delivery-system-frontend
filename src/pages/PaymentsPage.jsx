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

const PaymentsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['payments']] || '#673ab7';

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [references, setReferences] = useState({ paymentTypes: [] });

    const defaultFilters = { transactionNumber: '', paymentTypeId: '', shipmentId: '' };
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        DictionaryApi.getAll('payment-types', 0, 100)
            .then(r => setReferences({ paymentTypes: r.data.content || [] }))
            .catch(console.error);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const active = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            const res = await DictionaryApi.getAll('payments', page, rowsPerPage, active);
            setItems(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
            setSelectedIds(new Set());
        } catch (e) {
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

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

    const filterFields = [
        { name: 'transactionNumber', label: 'Номер транзакції', type: 'text' },
        { name: 'paymentTypeId', label: 'Тип оплати', type: 'select', options: references.paymentTypes },
        { name: 'shipmentId', label: 'ID відправлення', type: 'text' },
    ];

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
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={() => { setFilters(defaultFilters); setPage(0); }}
                fields={filterFields}
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