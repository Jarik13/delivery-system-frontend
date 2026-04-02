import React, { useState } from 'react';
import {
    TableRow, TableCell, IconButton, Chip, Box, Typography, alpha,
    Checkbox, LinearProgress, Tooltip,
} from '@mui/material';
import {
    ListAlt, ExpandMore, ExpandLess,
    Person, Scale, CalendarToday, Schedule,
    Inventory2, CheckCircle, Add, Edit, Delete
} from '@mui/icons-material';
import RouteSheetPanel from './RouteSheetPanel';
import { ROUTE_LIST_STATUS_COLORS, getStatusColor } from '../../constants/statusColors';
import { isRouteListEditable } from '../../constants/routeListConstants';

const RouteListRow = ({
    item, mainColor, selected, onToggle,
    isHighlighted = false,
    highlightRowRef = null,
    visibleCols = new Set(),
    onAddShipment,
    onEdit,
    onDelete,
}) => {
    const [expanded, setExpanded] = useState(false);

    const shipmentsList = item?.items ?? item?.shipments ?? item?.routeSheetItems ?? item?.sheets ?? [];
    const total = shipmentsList.length;
    const delivered = shipmentsList.filter(s => s?.isDelivered)?.length || 0;
    const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

    const statusColor = getStatusColor(ROUTE_LIST_STATUS_COLORS, item.statusName);

    const show = (key) => visibleCols.has(key);

    const handleExpandClick = (e) => {
        e.stopPropagation();
        setExpanded(prev => !prev);
    };

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
                <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                    <Checkbox
                        size="small"
                        checked={selected}
                        onChange={onToggle}
                        sx={{ color: alpha(mainColor, 0.4), '&.Mui-checked': { color: mainColor } }}
                    />
                </TableCell>

                <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                    <IconButton size="small" sx={{ color: mainColor }} onClick={handleExpandClick}>
                        {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                </TableCell>

                {show('number') && (
                    <TableCell>
                        <Tooltip title={isHighlighted ? 'Перейдено з відправлення' : ''} placement="top">
                            <Chip
                                icon={<ListAlt sx={{ fontSize: '14px !important' }} />}
                                label={`ML-${item.number}`}
                                size="small"
                                sx={{
                                    bgcolor: alpha(mainColor, isHighlighted ? 0.18 : 0.1),
                                    color: mainColor, fontWeight: 700,
                                    ...(isHighlighted && { border: `1px solid ${alpha(mainColor, 0.4)}` }),
                                }}
                            />
                        </Tooltip>
                    </TableCell>
                )}

                {show('courier') && (
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                            <Person sx={{ fontSize: 14, color: '#999' }} />
                            <Typography variant="body2" fontWeight={500}>
                                {item.courierFullName || '—'}
                            </Typography>
                        </Box>
                    </TableCell>
                )}

                {show('status') && (
                    <TableCell>
                        <Chip
                            label={item.statusName || 'Сформовано'}
                            size="small"
                            sx={{
                                fontWeight: 700, fontSize: 11,
                                bgcolor: alpha(statusColor, 0.12),
                                color: statusColor,
                                border: `1px solid ${alpha(statusColor, 0.35)}`,
                            }}
                        />
                    </TableCell>
                )}

                {show('progress') && (
                    <TableCell sx={{ minWidth: 130 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{
                                        height: 6, borderRadius: 3,
                                        bgcolor: alpha(mainColor, 0.1),
                                        '& .MuiLinearProgress-bar': { bgcolor: mainColor },
                                    }}
                                />
                            </Box>
                            <Typography variant="caption" fontWeight={700} sx={{ minWidth: 36 }}>
                                {progress}%
                            </Typography>
                        </Box>
                    </TableCell>
                )}

                {show('totalWeight') && (
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                            <Scale sx={{ fontSize: 14, color: '#999' }} />
                            <Typography variant="body2">
                                {item.totalWeight != null ? `${item.totalWeight} кг` : '—'}
                            </Typography>
                        </Box>
                    </TableCell>
                )}

                {show('shipmentsCount') && (
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Inventory2 sx={{ fontSize: 14, color: '#999' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {total}
                            </Typography>
                        </Box>
                    </TableCell>
                )}

                {show('delivered') && (
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircle sx={{ fontSize: 14, color: delivered === total && total > 0 ? '#4caf50' : '#ccc' }} />
                            <Typography variant="body2" fontWeight={600}
                                sx={{ color: delivered === total && total > 0 ? '#4caf50' : 'text.primary' }}>
                                {delivered}/{total}
                            </Typography>
                        </Box>
                    </TableCell>
                )}

                {show('createdAt') && (
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                            <CalendarToday sx={{ fontSize: 14, color: '#999' }} />
                            <Typography variant="body2" color="text.secondary">
                                {item.createdAt
                                    ? new Date(item.createdAt).toLocaleString('uk-UA', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })
                                    : '—'}
                            </Typography>
                        </Box>
                    </TableCell>
                )}

                {show('plannedDepart') && (
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                            <Schedule sx={{ fontSize: 14, color: '#999' }} />
                            <Typography variant="body2" color="text.secondary">
                                {item.plannedDepartureTime
                                    ? new Date(item.plannedDepartureTime).toLocaleString('uk-UA', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })
                                    : '—'}
                            </Typography>
                        </Box>
                    </TableCell>
                )}

                <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', pr: 1 }}>
                        {isRouteListEditable(item.statusName) && (
                            <>
                                <Tooltip title="Редагувати дані" placement="top">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
                                        sx={{
                                            color: 'text.secondary',
                                            '&:hover': { bgcolor: alpha('#000', 0.04) }
                                        }}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Видалити маршрутний лист" placement="top">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); onDelete?.(item); }}
                                        sx={{
                                            color: 'error.main',
                                            '&:hover': { bgcolor: alpha('#d32f2f', 0.08) }
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}

                        <Tooltip title="Додати відправлення" placement="left">
                            <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onAddShipment?.(item); }}
                                sx={{
                                    color: mainColor,
                                    '&:hover': {
                                        bgcolor: alpha(mainColor, 0.1),
                                    },
                                }}
                            >
                                <Add fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </TableCell>
            </TableRow>

            <RouteSheetPanel
                open={expanded}
                shipments={shipmentsList}
                mainColor={mainColor}
            />
        </>
    );
};

export default RouteListRow;