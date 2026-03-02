import React, { useState } from 'react';
import {
    TableRow, TableCell, IconButton, Chip, Box, Typography, alpha,
    Checkbox, LinearProgress, Tooltip,
} from '@mui/material';
import {
    ListAlt, ExpandMore, ExpandLess,
    Person, Scale, CalendarToday,
} from '@mui/icons-material';
import RouteSheetPanel from './RouteSheetPanel';
import { ROUTE_LIST_STATUS_COLORS, getStatusColor } from '../../constants/statusColors';

const RouteListRow = ({
    item, mainColor, selected, onToggle,
    isHighlighted = false,
    highlightRowRef = null,
}) => {
    const [expanded, setExpanded] = useState(false);

    const shipmentsList = item?.items ?? item?.shipments ?? item?.routeSheetItems ?? item?.sheets ?? [];
    const total = shipmentsList.length;
    const delivered = shipmentsList.filter(s => s?.isDelivered)?.length || 0;
    const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

    const statusColor = getStatusColor(ROUTE_LIST_STATUS_COLORS, item.statusName);

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

                <TableCell>
                    <IconButton size="small" sx={{ color: mainColor }} onClick={handleExpandClick}>
                        {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                </TableCell>

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

                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2" fontWeight={500}>
                            {item.courierFullName || 'Не призначено'}
                        </Typography>
                    </Box>
                </TableCell>

                <TableCell>
                    <Chip
                        label={item.statusName || 'Сформовано'}
                        size="small"
                        sx={{
                            fontWeight: 700,
                            fontSize: 11,
                            bgcolor: alpha(statusColor, 0.12),
                            color: statusColor,
                            border: `1px solid ${alpha(statusColor, 0.35)}`,
                        }}
                    />
                </TableCell>

                <TableCell sx={{ width: 140 }}>
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
                        <Typography variant="caption" fontWeight={700} sx={{ minWidth: 28 }}>
                            {delivered}/{total}
                        </Typography>
                    </Box>
                </TableCell>

                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Scale sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2">
                            {item.totalWeight != null ? `${item.totalWeight} кг` : '—'}
                        </Typography>
                    </Box>
                </TableCell>

                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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