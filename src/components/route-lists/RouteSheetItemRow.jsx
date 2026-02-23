import React from 'react';
import { TableRow, TableCell, Chip, Typography, Box, alpha } from '@mui/material';
import { CheckCircle, PendingActions, LocationOn } from '@mui/icons-material';

const RouteSheetItemRow = ({ item, idx, mainColor }) => {
    const isDone = item.isDelivered;

    return (
        <TableRow sx={{
            bgcolor: 'white',
            '&:hover': { bgcolor: '#fafafa' },
            borderLeft: `4px solid ${isDone ? '#4caf50' : '#ff9800'}`,
        }}>
            <TableCell sx={{ pl: 4, py: 1 }}>{idx + 1}</TableCell>
            
            <TableCell sx={{ py: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {item.trackingNumber}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1 }}>
                <Typography variant="body2" fontWeight={600}>{item.recipientFullName}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 12, color: '#999' }} />
                    <Typography variant="caption" color="text.secondary">{item.deliveryAddress}</Typography>
                </Box>
            </TableCell>

            <TableCell sx={{ py: 1 }}>
                <Typography variant="caption">{item.weight} кг</Typography>
            </TableCell>

            <TableCell sx={{ py: 1 }}>
                <Typography variant="caption" fontWeight={700}>
                    {item.codAmount > 0 ? `${item.codAmount} грн` : 'Оплачено'}
                </Typography>
            </TableCell>

            <TableCell sx={{ py: 1 }}>
                <Chip 
                    icon={isDone ? <CheckCircle /> : <PendingActions />}
                    label={isDone ? "Доставлено" : "В черзі"} 
                    size="small" 
                    color={isDone ? "success" : "warning"}
                    variant={isDone ? "filled" : "outlined"}
                    sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                />
            </TableCell>

            <TableCell sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    {item.deliveredAt ? new Date(item.deliveredAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </Typography>
            </TableCell>
        </TableRow>
    );
};

export default RouteSheetItemRow;