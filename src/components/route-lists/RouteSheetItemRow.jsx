import React from 'react';
import { TableRow, TableCell, Chip, Typography, Box, alpha } from '@mui/material';
import { CheckCircle, PendingActions, LocationOn } from '@mui/icons-material';

const RouteSheetItemRow = ({ item, idx, mainColor }) => {
    const isDone = item.isDelivered;
    const borderColor = isDone ? '#4caf50' : '#ff9800';

    return (
        <TableRow sx={{
            bgcolor: 'white',
            '&:hover': { bgcolor: '#fafafa' },
            borderLeft: `3px solid ${alpha(borderColor, 0.5)}`,
        }}>
            {/* # */}
            <TableCell sx={{ pl: 4, py: 1.5, width: 48 }}>
                <Box sx={{
                    width: 24, height: 24, borderRadius: '50%',
                    bgcolor: '#f0f0f0', color: '#666',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                }}>
                    {idx + 1}
                </Box>
            </TableCell>

            {/* Трек-номер */}
            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="caption" sx={{
                    fontFamily: 'monospace', fontWeight: 700,
                    bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1,
                    color: '#333', fontSize: 11,
                }}>
                    {item.trackingNumber || `#${item.id}`}
                </Typography>
            </TableCell>

            {/* Отримувач та адреса */}
            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                    {item.recipientFullName || '—'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                    <LocationOn sx={{ fontSize: 13, color: '#999' }} />
                    <Typography variant="caption" color="text.secondary">
                        {item.deliveryAddress || '—'}
                    </Typography>
                </Box>
            </TableCell>

            {/* Вага */}
            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    {item.weight != null ? `${item.weight} кг` : '—'}
                </Typography>
            </TableCell>

            {/* Оплата */}
            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.primary">
                    {item.codAmount > 0 ? `${item.codAmount} грн` : 'Оплачено'}
                </Typography>
            </TableCell>

            {/* Статус доставки */}
            <TableCell sx={{ py: 1.5 }}>
                <Chip
                    icon={isDone
                        ? <CheckCircle sx={{ fontSize: '16px !important' }} />
                        : <PendingActions sx={{ fontSize: '16px !important' }} />
                    }
                    label={isDone ? 'Доставлено' : 'В черзі'}
                    size="small"
                    sx={{
                        height: 24, fontSize: 11, fontWeight: 700,
                        bgcolor: alpha(borderColor, 0.1),
                        color: isDone ? '#2e7d32' : '#ed6c02',
                        border: `1px solid ${alpha(borderColor, 0.3)}`,
                    }}
                />
            </TableCell>

            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {item.deliveredAt
                        ? new Date(item.deliveredAt).toLocaleString('uk-UA', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                        })
                        : '—'}
                </Typography>
            </TableCell>
        </TableRow>
    );
};

export default RouteSheetItemRow;