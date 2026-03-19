import React from 'react';
import { TableRow, TableCell, Chip, Typography, Box, alpha } from '@mui/material';
import { CheckCircle, LocalShipping, PendingActions, Cancel, HelpOutline } from '@mui/icons-material';
import { LocationOn } from '@mui/icons-material';
import { SHIPMENT_STATUS_COLORS, getStatusColor } from '../../constants/statusColors';

const STATUS_ICONS = {
    'Доставлено': <CheckCircle sx={{ fontSize: '16px !important' }} />,
    'Видано кур\'єру': <LocalShipping sx={{ fontSize: '16px !important' }} />,
    'Спроба вручення провалена': <PendingActions sx={{ fontSize: '16px !important' }} />,
    'Відмова': <Cancel sx={{ fontSize: '16px !important' }} />,
    'Втрачено': <Cancel sx={{ fontSize: '16px !important' }} />,
    'Утилізовано': <Cancel sx={{ fontSize: '16px !important' }} />,
    'У процесі доставки': <PendingActions sx={{ fontSize: '16px !important' }} />,
};

const DEFAULT_ICON = <HelpOutline sx={{ fontSize: '16px !important' }} />;

const RouteSheetItemRow = ({ item, idx }) => {
    const statusName = item.shipmentStatusName || (item.isDelivered ? 'Доставлено' : 'У процесі доставки');
    const color = getStatusColor(SHIPMENT_STATUS_COLORS, statusName);
    const icon = STATUS_ICONS[statusName] ?? DEFAULT_ICON;

    return (
        <TableRow sx={{
            bgcolor: 'white',
            '&:hover': { bgcolor: '#fafafa' },
            borderLeft: `3px solid ${alpha(color, 0.5)}`,
        }}>
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

            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="caption" sx={{
                    fontFamily: 'monospace', fontWeight: 700,
                    bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1,
                    color: '#333', fontSize: 11,
                }}>
                    {item.trackingNumber || `#${item.id}`}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                    {item.recipientFullName || '—'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                    <LocationOn sx={{ fontSize: 13, color: '#999' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', display: 'block' }}>
                        {item.deliveryAddress || '—'}
                    </Typography>
                </Box>
            </TableCell>

            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    {item.weight != null ? `${item.weight} кг` : '—'}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.primary">
                    {item.codAmount > 0 ? `${item.codAmount} грн` : 'Оплачено'}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1.5 }}>
                <Chip
                    icon={icon}
                    label={statusName}
                    size="small"
                    sx={{
                        height: 24, fontSize: 11, fontWeight: 700,
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        border: `1px solid ${alpha(color, 0.3)}`,
                    }}
                />
            </TableCell>

            <TableCell sx={{ py: 1.5 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ whiteSpace: 'nowrap' }}>
                    {item.deliveredAt
                        ? new Date(item.deliveredAt).toLocaleString('uk-UA', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        })
                        : '—'}
                </Typography>
            </TableCell>
        </TableRow>
    );
};

export default RouteSheetItemRow;