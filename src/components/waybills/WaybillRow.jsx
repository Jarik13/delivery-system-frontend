import React, { useState } from 'react';
import {
    TableRow, TableCell, IconButton, Chip, Box, Typography, alpha,
    Checkbox
} from '@mui/material';
import {
    Receipt, ExpandMore, ExpandLess,
    Inventory2, Scale, ViewInAr, Person, CalendarToday
} from '@mui/icons-material';
import WaybillShipmentsPanel from './WaybillShipmentsPanel';

const WaybillRow = ({ waybill, mainColor, selected, onToggle }) => {
    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    return (
        <>
            <TableRow
                onClick={onToggle}
                sx={{
                    cursor: 'pointer',
                    bgcolor: selected ? alpha(mainColor, 0.06) : 'inherit',
                    '&:hover': { bgcolor: alpha(mainColor, 0.02) }
                }}
            >
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        size="small"
                        checked={selected}
                        onChange={onToggle}
                        sx={{ color: alpha(mainColor, 0.4), '&.Mui-checked': { color: mainColor } }}
                    />
                </TableCell>
                <TableCell>
                    <IconButton size="small" sx={{ color: mainColor }} onClick={handleExpandClick}>
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