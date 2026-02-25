import React from 'react';
import { TableRow, TableCell, Chip, Typography, Box, alpha } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

const STATUS_COLORS = {
    'Створено': '#2196f3',
    'Очікує надходження': '#90caf9',
    'Прийнято у відділенні': '#673ab7',
    'Сортування термінал': '#00bcd4',
    'У дорозі': '#ff9800',
    'Прибув у відділення': '#8bc34a',
    "Видано кур'єру": '#e91e63',
    'Доставлено': '#2e7d32',
    'Відмова': '#f44336',
    'Втрачено': '#b71c1c',
    'Утилізовано': '#616161',
    'default': '#9e9e9e',
};

const getStatusColor = (name) => STATUS_COLORS[name] || STATUS_COLORS['default'];

const WaybillShipmentRow = ({ shipment }) => {
    const statusColor = getStatusColor(shipment.shipmentStatusName);

    return (
        <TableRow sx={{
            bgcolor: 'white',
            '&:hover': { bgcolor: '#fafafa' },
            borderLeft: `3px solid ${alpha(statusColor, 0.4)}`,
        }}>
            <TableCell sx={{ pl: 3, py: 1, width: 48 }}>
                <Box sx={{
                    width: 24, height: 24, borderRadius: '50%',
                    bgcolor: '#f0f0f0', color: '#666',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                }}>
                    {shipment.sequenceNumber ?? '—'}
                </Box>
            </TableCell>

            <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                <Typography variant="caption" sx={{
                    fontFamily: 'monospace', fontWeight: 700,
                    bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1,
                    color: '#333', fontSize: 11,
                }}>
                    {shipment.trackingNumber || `#${shipment.id}`}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                <Typography variant="caption" fontWeight={600} noWrap>
                    {shipment.senderFullName || '—'}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                <Typography variant="caption" fontWeight={600} noWrap>
                    {shipment.recipientFullName || '—'}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {shipment.originCityName || '—'}
                    </Typography>
                    <ArrowForward sx={{ fontSize: 12, color: '#bbb', flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {shipment.destinationCityName || '—'}
                    </Typography>
                </Box>
            </TableCell>

            <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                <Typography variant="caption" color="text.secondary">
                    {shipment.actualWeight != null ? `${shipment.actualWeight} кг` : '—'}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                <Typography variant="caption" fontWeight={700} color="text.primary">
                    {shipment.totalPrice != null ? `${shipment.totalPrice} грн` : '—'}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                {shipment.shipmentStatusName ? (
                    <Chip
                        label={shipment.shipmentStatusName}
                        size="small"
                        sx={{
                            bgcolor: alpha(statusColor, 0.12),
                            color: statusColor,
                            fontWeight: 700,
                            fontSize: 11,
                            height: 22,
                            border: `1px solid ${alpha(statusColor, 0.3)}`,
                        }}
                    />
                ) : '—'}
            </TableCell>
        </TableRow>
    );
};

export default WaybillShipmentRow;