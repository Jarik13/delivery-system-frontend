import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TableRow, TableCell, IconButton, Chip, Box, Typography, alpha,
    Checkbox, Tooltip,
} from '@mui/material';
import {
    Receipt, ExpandMore, ExpandLess,
    Inventory2, Scale, ViewInAr, Person, CalendarToday,
    Route, AltRoute, LocationOn, CheckCircleOutline, LocalShipping,
} from '@mui/icons-material';
import WaybillShipmentsPanel from './WaybillShipmentsPanel';
import { WAYBILL_COLUMNS } from './WaybillsTable';

const CellContent = ({ colKey, waybill, mainColor }) => {
    const navigate = useNavigate();
    const secondary = { fontSize: 14, color: '#999' };

    switch (colKey) {
        case 'number':
            return (
                <Chip
                    icon={<Receipt sx={{ fontSize: '14px !important' }} />}
                    label={`#${waybill.number}`}
                    size="small"
                    sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700 }}
                />
            );
        case 'totalWeight':
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Scale sx={secondary} />
                    <Typography variant="body2" noWrap>
                        {waybill.totalWeight != null ? `${parseFloat(waybill.totalWeight).toFixed(2)} кг` : '—'}
                    </Typography>
                </Box>
            );
        case 'volume':
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                    <ViewInAr sx={secondary} />
                    <Typography variant="body2" noWrap>
                        {waybill.volume != null ? `${parseFloat(waybill.volume).toFixed(2)} м³` : '—'}
                    </Typography>
                </Box>
            );
        case 'shipmentsCount':
            return (
                <Chip
                    icon={<Inventory2 sx={{ fontSize: '14px !important' }} />}
                    label={waybill.shipmentsCount ?? waybill.shipments?.length ?? 0}
                    size="small" variant="outlined"
                    sx={{ fontWeight: 700, borderColor: mainColor, color: mainColor }}
                />
            );
        case 'totalDistanceKm':
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                    <AltRoute sx={secondary} />
                    <Typography variant="body2" noWrap>
                        {waybill.totalDistanceKm != null ? `${parseFloat(waybill.totalDistanceKm).toFixed(2)} км` : '—'}
                    </Typography>
                </Box>
            );
        case 'statusSummary':
            return waybill.statusSummary ? (
                <Chip label={waybill.statusSummary} size="small" variant="outlined"
                    sx={{ fontSize: 11, fontWeight: 700, borderColor: alpha(mainColor, 0.4), color: mainColor }} />
            ) : <Typography variant="body2" color="text.disabled">—</Typography>;
        case 'deliveredCount':
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleOutline sx={{ ...secondary, color: '#4caf50' }} />
                    <Typography variant="body2">
                        {waybill.deliveredCount != null
                            ? `${waybill.deliveredCount} / ${waybill.shipmentsCount ?? '?'}`
                            : '—'}
                    </Typography>
                </Box>
            );
        case 'tripNumber':
            return waybill.tripNumber ? (
                <Tooltip title="Перейти до рейсу">
                    <Chip
                        label={`Рейс #${waybill.tripNumber}`}
                        size="small"
                        clickable
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/trips?highlight=${waybill.tripId}`);
                        }}
                        sx={{
                            fontSize: 11, fontWeight: 700,
                            bgcolor: alpha('#607d8b', 0.1), color: '#607d8b',
                            '&:hover': { bgcolor: alpha('#607d8b', 0.2) },
                            cursor: 'pointer',
                        }}
                    />
                </Tooltip>
            ) : <Typography variant="body2" color="text.disabled">—</Typography>;
        case 'scheduledDeparture':
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                    <LocalShipping sx={secondary} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {waybill.scheduledDeparture
                            ? new Date(waybill.scheduledDeparture).toLocaleString('uk-UA', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            }) : '—'}
                    </Typography>
                </Box>
            );
        case 'scheduledArrival':
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                    <LocalShipping sx={secondary} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {waybill.scheduledArrival
                            ? new Date(waybill.scheduledArrival).toLocaleString('uk-UA', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            }) : '—'}
                    </Typography>
                </Box>
            );
        case 'createdByName':
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                    <Person sx={secondary} />
                    <Typography variant="body2" color="text.secondary">
                        {waybill.createdByName || `ID: ${waybill.createdById}`}
                    </Typography>
                </Box>
            );
        case 'createdAt':
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                    <CalendarToday sx={secondary} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {waybill.createdAt
                            ? new Date(waybill.createdAt).toLocaleString('uk-UA', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            }) : '—'}
                    </Typography>
                </Box>
            );
        default:
            return <Typography variant="body2" color="text.disabled">—</Typography>;
    }
};

const WaybillRow = ({
    waybill, mainColor, selected, onToggle,
    visibleCols, colSpan,
    isHighlighted = false,
    highlightRowRef = null,
}) => {
    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    const orderedCols = WAYBILL_COLUMNS.filter(c => visibleCols.has(c.key));

    return (
        <>
            <TableRow
                ref={highlightRowRef}
                onClick={onToggle}
                sx={{
                    cursor: 'pointer',
                    ...(isHighlighted
                        ? {
                            bgcolor: `${alpha(mainColor, 0.08)} !important`,
                            outline: `2px solid ${alpha(mainColor, 0.45)}`,
                            outlineOffset: '-2px',
                            animation: 'highlightPulse 1.6s ease-in-out 2',
                            '@keyframes highlightPulse': {
                                '0%': { backgroundColor: alpha(mainColor, 0.08) },
                                '50%': { backgroundColor: alpha(mainColor, 0.2) },
                                '100%': { backgroundColor: alpha(mainColor, 0.08) },
                            },
                        }
                        : {
                            bgcolor: selected ? alpha(mainColor, 0.06) : 'inherit',
                            '&:hover': { bgcolor: alpha(mainColor, 0.02) },
                        }
                    ),
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

                {orderedCols.map(col => (
                    <TableCell key={col.key}>
                        <Tooltip
                            title={isHighlighted && col.key === 'number' ? 'Перейдено з відправлення' : ''}
                            placement="top"
                        >
                            <span>
                                <CellContent colKey={col.key} waybill={waybill} mainColor={mainColor} />
                            </span>
                        </Tooltip>
                    </TableCell>
                ))}
            </TableRow>

            <WaybillShipmentsPanel
                open={expanded}
                shipments={waybill.shipments}
                mainColor={mainColor}
                colSpan={colSpan}
            />
        </>
    );
};

export default WaybillRow;