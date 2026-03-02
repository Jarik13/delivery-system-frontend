import React from 'react';
import {
    TableRow, TableCell, Chip, Box, Typography, alpha, Checkbox,
} from '@mui/material';
import { CalendarToday, Tag, LocalShipping } from '@mui/icons-material';
import { PAYMENT_TYPE_CONFIG, getTypeConfig } from '../../constants/typeColors';

const PaymentRow = ({ payment, mainColor, selected, onToggle, visibleCols }) => {
    const cfg = getTypeConfig(PAYMENT_TYPE_CONFIG, payment.paymentTypeName);
    const Icon = cfg.icon;
    const show = (key) => visibleCols.has(key);

    return (
        <TableRow
            onClick={onToggle}
            sx={{
                cursor: 'pointer',
                bgcolor: selected ? alpha(mainColor, 0.06) : 'inherit',
                '&:hover': { bgcolor: alpha(mainColor, 0.03) },
            }}
        >
            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    size="small" checked={selected} onChange={onToggle}
                    sx={{ color: alpha(mainColor, 0.4), '&.Mui-checked': { color: mainColor } }}
                />
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
                        icon={<Icon sx={{ fontSize: 14 }} />}
                        label={payment.paymentTypeName || '—'}
                        size="small"
                        sx={{
                            bgcolor: alpha(cfg.color, 0.1),
                            color: cfg.color,
                            fontWeight: 700,
                            border: `1px solid ${alpha(cfg.color, 0.25)}`,
                            '& .MuiChip-icon': { color: cfg.color },
                        }}
                    />
                </TableCell>
            )}

            {show('shipmentTrackingNumber') && (
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocalShipping sx={{ fontSize: 13, color: '#999' }} />
                        <Typography variant="caption" sx={{
                            fontFamily: 'monospace', fontWeight: 600,
                            bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1, fontSize: 11,
                        }}>
                            {payment.shipmentTrackingNumber || `#${payment.shipmentId}`}
                        </Typography>
                    </Box>
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

export default PaymentRow;