import React, { useState } from 'react';
import {
    TableRow, TableCell, IconButton, Chip, Box, Typography, alpha,
    LinearProgress
} from '@mui/material';
import {
    ListAlt, ExpandMore, ExpandLess,
    Person, Scale, CalendarToday
} from '@mui/icons-material';
import RouteSheetPanel from './RouteSheetPanel';

const RouteListRow = ({ item, mainColor }) => {
    const [expanded, setExpanded] = useState(false);

    const total = item.routeSheetItems?.length || 0;
    const delivered = item.routeSheetItems?.filter(s => s.isDelivered)?.length || 0;
    const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return (
        <>
            <TableRow 
                hover 
                onClick={() => setExpanded(!expanded)} 
                sx={{ cursor: 'pointer' }}
            >
                <TableCell>
                    <IconButton size="small" sx={{ color: mainColor }}>
                        {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Chip icon={<ListAlt sx={{ fontSize: '14px !important' }} />}
                        label={`ML-${item.number}`} size="small"
                        sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700 }} />
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2">{item.courierFullName || 'Не призначено'}</Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Chip 
                        label={item.statusName || 'Сформовано'} 
                        size="small" 
                        variant="outlined"
                        color={item.statusName === 'Завершено' ? 'success' : 'primary'}
                        sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                </TableCell>
                <TableCell sx={{ width: 150 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                            <LinearProgress variant="determinate" value={progress} 
                                sx={{ height: 6, borderRadius: 3, bgcolor: alpha(mainColor, 0.1),
                                      '& .MuiLinearProgress-bar': { bgcolor: mainColor } }} 
                            />
                        </Box>
                        <Typography variant="caption" fontWeight={700}>{delivered}/{total}</Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Scale sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2">{item.totalWeight} кг</Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14, color: '#999' }} />
                        <Typography variant="body2" color="text.secondary">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('uk-UA') : '—'}
                        </Typography>
                    </Box>
                </TableCell>
            </TableRow>

            <RouteSheetPanel
                open={expanded}
                shipments={item.routeSheetItems}
                mainColor={mainColor}
            />
        </>
    );
};

export default RouteListRow;