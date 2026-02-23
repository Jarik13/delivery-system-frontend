import React, { useState } from 'react';
import {
    TableRow, TableCell, IconButton, Chip, Box, Typography, alpha,
    Checkbox, LinearProgress,
} from '@mui/material';
import {
    ListAlt, ExpandMore, ExpandLess,
    Person, Scale, CalendarToday,
} from '@mui/icons-material';
import RouteSheetPanel from './RouteSheetPanel';

const RouteListRow = ({ item, mainColor, selected, onToggle }) => {
    const [expanded, setExpanded] = useState(false);

    const total = item.items?.length || 0;
    const delivered = item.items?.filter(s => s.isDelivered)?.length || 0;
    const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

    const handleExpandClick = (e) => {
        e.stopPropagation();
        setExpanded(prev => !prev);
    };

    return (
        <>
            <TableRow
                onClick={onToggle}
                sx={{
                    cursor: 'pointer',
                    bgcolor: selected ? alpha(mainColor, 0.06) : 'inherit',
                    '&:hover': { bgcolor: alpha(mainColor, 0.02) },
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
                    <Chip
                        icon={<ListAlt sx={{ fontSize: '14px !important' }} />}
                        label={`ML-${item.number}`}
                        size="small"
                        sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700 }}
                    />
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
                        variant="outlined"
                        sx={{
                            fontWeight: 700,
                            borderColor: item.statusName === 'Завершено' ? '#4caf50' : alpha(mainColor, 0.5),
                            color: item.statusName === 'Завершено' ? '#4caf50' : mainColor,
                            fontSize: 11,
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
                shipments={item.items}
                mainColor={mainColor}
            />
        </>
    );
};

export default RouteListRow;