import React from 'react';
import { TableRow, TableCell, Chip, Typography, alpha } from '@mui/material';

const WaybillShipmentRow = ({ shipment, idx, mainColor }) => (
    <TableRow sx={{ bgcolor: alpha(mainColor, 0.015) }}>
        <TableCell sx={{ pl: 4, py: 0.75, color: '#888', fontSize: 12 }}>{idx + 1}</TableCell>
        <TableCell sx={{ py: 0.75 }}>
            <Chip label={shipment.trackingNumber || `#${shipment.id}`} size="small"
                sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700, fontSize: 11 }} />
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
            <Typography variant="caption" fontWeight={600}>
                {shipment.senderFullName || '—'}
            </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
            <Typography variant="caption" fontWeight={600}>
                {shipment.recipientFullName || '—'}
            </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
            <Typography variant="caption" color="text.secondary">
                {shipment.originCityName || '—'} → {shipment.destinationCityName || '—'}
            </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
            <Typography variant="caption">
                {shipment.actualWeight != null ? `${shipment.actualWeight} кг` : '—'}
            </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
            <Typography variant="caption" fontWeight={600}>
                {shipment.totalPrice != null ? `${shipment.totalPrice} грн` : '—'}
            </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
            {shipment.shipmentStatusName
                ? <Chip label={shipment.shipmentStatusName} size="small" variant="outlined"
                    sx={{ fontSize: 11, height: 20 }} />
                : '—'}
        </TableCell>
    </TableRow>
);

export default WaybillShipmentRow;