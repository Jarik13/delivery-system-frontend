import React, { useState } from 'react';
import {
    TableRow, TableCell, IconButton, Chip, Box, Typography, alpha
} from '@mui/material';
import {
    Receipt, ExpandMore, ExpandLess,
    Inventory2, Scale, ViewInAr, Person, CalendarToday
} from '@mui/icons-material';
import WaybillShipmentsPanel from './WaybillShipmentsPanel';

const WaybillRow = ({ waybill, mainColor }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <TableRow hover sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(mainColor, 0.03) },
                ...(expanded ? { bgcolor: alpha(mainColor, 0.04) } : {}),
            }} onClick={() => setExpanded(e => !e)}>
                <TableCell>
                    <IconButton size="small" sx={{ color: mainColor }}>
                        {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Chip icon={<Receipt sx={{ fontSize: '14px !important' }} />}
                        label={`#${waybill.number}`} size="small"
                        sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700 }} />
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Scale sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2">
                            {waybill.totalWeight != null ? `${waybill.totalWeight} кг` : '—'}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ViewInAr sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2">
                            {waybill.volume != null ? `${waybill.volume} м³` : '—'}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Chip icon={<Inventory2 sx={{ fontSize: '14px !important' }} />}
                        label={waybill.shipmentsCount ?? waybill.shipments?.length ?? 0}
                        size="small" variant="outlined"
                        sx={{ fontWeight: 700, borderColor: mainColor, color: mainColor }} />
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2" color="text.secondary">
                            {waybill.createdByName || `ID: ${waybill.createdById}`}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2" color="text.secondary">
                            {waybill.createdAt
                                ? new Date(waybill.createdAt).toLocaleString('uk-UA', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })
                                : '—'}
                        </Typography>
                    </Box>
                </TableCell>
            </TableRow>

            <WaybillShipmentsPanel
                open={expanded}
                shipments={waybill.shipments}
                mainColor={mainColor}
            />
        </>
    );
};

export default WaybillRow;