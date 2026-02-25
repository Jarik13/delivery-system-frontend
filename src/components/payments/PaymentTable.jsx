import React, { useState } from 'react';
import {
    Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    Box, Typography, CircularProgress, Divider, alpha,
    Checkbox, Tooltip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import { Payments, ViewColumn, Check } from '@mui/icons-material';
import PaymentRow from './PaymentRow';

export const PAYMENT_COLUMNS = [
    { key: 'transactionNumber', label: 'Транзакція', default: true, required: true, minWidth: 160 },
    { key: 'amount', label: 'Сума', default: true, minWidth: 110 },
    { key: 'paymentTypeName', label: 'Тип оплати', default: true, minWidth: 130 },
    { key: 'shipmentTrackingNumber', label: 'Відправлення', default: true, minWidth: 170 },
    { key: 'paymentDate', label: 'Дата оплати', default: true, minWidth: 150 },
];

const DEFAULT_VISIBLE = new Set(PAYMENT_COLUMNS.filter(c => c.default).map(c => c.key));

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
                    sx={{
                        color: mainColor, bgcolor: alpha(mainColor, 0.08),
                        border: `1px solid ${alpha(mainColor, 0.2)}`, borderRadius: 1.5,
                        '&:hover': { bgcolor: alpha(mainColor, 0.15) },
                    }}>
                    <ViewColumn fontSize="small" />
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 200, boxShadow: 4, mt: 0.5 } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                        sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                        Відображати колонки
                    </Typography>
                </Box>
                <Divider />
                {PAYMENT_COLUMNS.map(col => (
                    <MenuItem key={col.key} onClick={() => toggle(col.key)} disabled={col.required} dense
                        sx={{ py: 0.75, '&:hover': { bgcolor: alpha(mainColor, 0.06) } }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            {visible.has(col.key)
                                ? <Check sx={{ fontSize: 16, color: mainColor }} />
                                : <Box sx={{ width: 16 }} />}
                        </ListItemIcon>
                        <ListItemText primary={col.label}
                            primaryTypographyProps={{ fontSize: 13, fontWeight: visible.has(col.key) ? 700 : 400 }} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

const PaymentTable = ({ payments, loading, mainColor, selected, onToggle, onToggleAll }) => {
    const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE);

    const allSelected = payments.length > 0 && selected.length === payments.length;
    const someSelected = selected.length > 0 && selected.length < payments.length;
    const visibleDefs = PAYMENT_COLUMNS.filter(c => visibleCols.has(c.key));

    return (
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
                                            onChange={onToggleAll}
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
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleDefs.length + 1} align="center" sx={{ py: 6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#bbb' }}>
                                            <Payments sx={{ fontSize: 48 }} />
                                            <Typography variant="body2">Платежів не знайдено</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map(p => (
                                    <PaymentRow
                                        key={p.id} payment={p} mainColor={mainColor}
                                        selected={selected.includes(p.id)}
                                        onToggle={() => onToggle(p.id)}
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
    );
};

export default PaymentTable;