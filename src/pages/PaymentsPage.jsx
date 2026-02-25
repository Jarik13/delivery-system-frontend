import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert, Button,
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
    CircularProgress, Chip, Divider, Checkbox, Tooltip, IconButton,
    Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
    Payments, Add, CreditCard, Money, AccountBalanceWallet,
    CalendarToday, Tag, Check, ViewColumn,
} from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const PAYMENT_COLUMNS = [
    { key: 'transactionNumber', label: 'Транзакція', default: true, required: true, minWidth: 150 },
    { key: 'amount', label: 'Сума', default: true, minWidth: 110 },
    { key: 'paymentTypeName', label: 'Тип оплати', default: true, minWidth: 130 },
    { key: 'shipmentId', label: 'Відправлення', default: true, minWidth: 120 },
    { key: 'paymentDate', label: 'Дата оплати', default: true, minWidth: 150 },
];
const DEFAULT_VISIBLE = new Set(PAYMENT_COLUMNS.filter(c => c.default).map(c => c.key));

const PAYMENT_TYPE_ICONS = {
    'Готівка': <Money sx={{ fontSize: 14 }} />,
    'Карта': <CreditCard sx={{ fontSize: 14 }} />,
    'default': <AccountBalanceWallet sx={{ fontSize: 14 }} />,
};
const getPaymentIcon = (name) => PAYMENT_TYPE_ICONS[name] || PAYMENT_TYPE_ICONS['default'];

const PAYMENT_TYPE_COLORS = {
    'Готівка': '#4caf50',
    'Карта': '#2196f3',
    'default': '#9c27b0',
};
const getPaymentColor = (name) => PAYMENT_TYPE_COLORS[name] || PAYMENT_TYPE_COLORS['default'];

const ColumnSelector = ({ visible, onChange, mainColor }) => {
    const [anchor, setAnchor] = useState(null);
    const toggle = (key) => {
        const col = PAYMENT_COLUMNS.find(c => c.key === key);
        if (col?.required) return;
        const next = new Set(visible);
        next.has(key) ? next.delete(key) : next.add(key);
        onChange(next);
    };
    return (
        <>
            <Tooltip title="Вибрати колонки">
                <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}
                    sx={{ color: mainColor, bgcolor: alpha(mainColor, 0.08), border: `1px solid ${alpha(mainColor, 0.2)}`, borderRadius: 1.5, '&:hover': { bgcolor: alpha(mainColor, 0.15) } }}>
                    <ViewColumn fontSize="small" />
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 200, boxShadow: 4, mt: 0.5 } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                        Відображати колонки
                    </Typography>
                </Box>
                <Divider />
                {PAYMENT_COLUMNS.map(col => (
                    <MenuItem key={col.key} onClick={() => toggle(col.key)} disabled={col.required} dense
                        sx={{ py: 0.75, '&:hover': { bgcolor: alpha(mainColor, 0.06) } }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            {visible.has(col.key) ? <Check sx={{ fontSize: 16, color: mainColor }} /> : <Box sx={{ width: 16 }} />}
                        </ListItemIcon>
                        <ListItemText primary={col.label}
                            primaryTypographyProps={{ fontSize: 13, fontWeight: visible.has(col.key) ? 700 : 400 }} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

const PaymentRow = ({ payment, mainColor, selected, onToggle, visibleCols }) => {
    const typeColor = getPaymentColor(payment.paymentTypeName);
    const show = (key) => visibleCols.has(key);

    return (
        <TableRow onClick={onToggle} sx={{
            cursor: 'pointer',
            bgcolor: selected ? alpha(mainColor, 0.06) : 'inherit',
            '&:hover': { bgcolor: alpha(mainColor, 0.03) },
        }}>
            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                <Checkbox size="small" checked={selected} onChange={onToggle}
                    sx={{ color: alpha(mainColor, 0.4), '&.Mui-checked': { color: mainColor } }} />
            </TableCell>

            {show('transactionNumber') && (
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tag sx={{ fontSize: 13, color: '#999' }} />
                        <Typography variant="caption" sx={{
                            fontFamily: 'monospace', fontWeight: 700,
                            bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1, fontSize: 11,
                        }}>
                            {payment.transactionNumber}
                        </Typography>
                    </Box>
                </TableCell>
            )}

            {show('amount') && (
                <TableCell>
                    <Typography variant="body2" fontWeight={800} sx={{ color: mainColor }}>
                        {payment.amount != null ? `${payment.amount} ₴` : '—'}
                    </Typography>
                </TableCell>
            )}

            {show('paymentTypeName') && (
                <TableCell>
                    <Chip
                        icon={getPaymentIcon(payment.paymentTypeName)}
                        label={payment.paymentTypeName || '—'}
                        size="small"
                        sx={{
                            bgcolor: alpha(typeColor, 0.1),
                            color: typeColor,
                            fontWeight: 700,
                            border: `1px solid ${alpha(typeColor, 0.25)}`,
                            '& .MuiChip-icon': { color: typeColor },
                        }}
                    />
                </TableCell>
            )}

            {show('shipmentId') && (
                <TableCell>
                    <Chip
                        label={`#${payment.shipmentId}`}
                        size="small" variant="outlined"
                        sx={{ fontWeight: 700, borderColor: alpha(mainColor, 0.35), color: mainColor, fontSize: 11 }}
                    />
                </TableCell>
            )}

            {show('paymentDate') && (
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 13, color: '#999' }} />
                        <Typography variant="body2" color="text.secondary">
                            {payment.paymentDate
                                ? new Date(payment.paymentDate).toLocaleString('uk-UA', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                }) : '—'}
                        </Typography>
                    </Box>
                </TableCell>
            )}
        </TableRow>
    );
};

const PaymentsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['payments']] || '#673ab7';

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE);
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

    const handleToggle = (id) => setSelectedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const handleToggleAll = () => setSelectedIds(prev =>
        prev.size === items.length ? new Set() : new Set(items.map(i => i.id))
    );

    const visibleDefs = PAYMENT_COLUMNS.filter(c => visibleCols.has(c.key));
    const allSelected = items.length > 0 && selectedIds.size === items.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

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
                                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' }
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

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Box sx={{
                    px: 1.5, py: 0.75, display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                    borderBottom: `1px solid ${alpha(mainColor, 0.08)}`,
                    bgcolor: alpha(mainColor, 0.02), borderRadius: '8px 8px 0 0',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                            {visibleDefs.length} з {PAYMENT_COLUMNS.length} колонок
                        </Typography>
                        <ColumnSelector visible={visibleCols} onChange={setVisibleCols} mainColor={mainColor} />
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                        <CircularProgress sx={{ color: mainColor }} />
                    </Box>
                ) : (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table size="small" sx={{ minWidth: visibleDefs.reduce((s, c) => s + c.minWidth, 48) }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                                    <TableCell padding="checkbox" width={48}>
                                        <Tooltip title={allSelected ? 'Зняти всі' : 'Вибрати всі'}>
                                            <Checkbox size="small" checked={allSelected} indeterminate={someSelected}
                                                onChange={handleToggleAll}
                                                sx={{ color: alpha(mainColor, 0.5), '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: mainColor } }} />
                                        </Tooltip>
                                    </TableCell>
                                    {visibleDefs.map(col => (
                                        <TableCell key={col.key} sx={{ fontWeight: 700, minWidth: col.minWidth }}>
                                            {col.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleDefs.length + 1} align="center" sx={{ py: 6 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#bbb' }}>
                                                <Payments sx={{ fontSize: 48 }} />
                                                <Typography variant="body2">Платежів не знайдено</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map(p => (
                                        <PaymentRow
                                            key={p.id} payment={p} mainColor={mainColor}
                                            selected={selectedIds.has(p.id)}
                                            onToggle={() => handleToggle(p.id)}
                                            visibleCols={visibleCols}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <Divider />
            </Paper>

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