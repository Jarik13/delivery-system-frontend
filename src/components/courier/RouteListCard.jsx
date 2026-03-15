import React, { useState } from 'react';
import {
    Box, Typography, Chip, Collapse, IconButton,
    alpha, Divider, LinearProgress,
} from '@mui/material';
import { ExpandMore, ExpandLess, Inventory2, Scale, Schedule } from '@mui/icons-material';
import { ROUTE_LIST_STATUS_COLORS, getStatusColor } from '../../constants/statusColors';
import ShipmentCard from './ShipmentCard';

const RouteListCard = ({ routeList }) => {
    const [open, setOpen] = useState(false);

    const statusColor = getStatusColor(ROUTE_LIST_STATUS_COLORS, routeList.statusName);
    const items = routeList.items || [];
    const delivered = items.filter(i => i.isDelivered).length;
    const total = items.length;
    const progress = total > 0 ? (delivered / total) * 100 : 0;
    const isActive = ['Видано кур\'єру', 'У процесі доставки'].includes(routeList.statusName);

    return (
        <Box sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: `1.5px solid ${alpha(statusColor, isActive ? 0.4 : 0.2)}`,
            bgcolor: 'background.paper',
            boxShadow: isActive
                ? `0 4px 16px ${alpha(statusColor, 0.15)}`
                : `0 2px 8px ${alpha('#000', 0.06)}`,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
        }}>
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{
                    p: 2, cursor: 'pointer',
                    background: isActive
                        ? `linear-gradient(135deg, ${alpha(statusColor, 0.08)}, ${alpha(statusColor, 0.03)})`
                        : alpha('#000', 0.01),
                    userSelect: 'none',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: 15 }}>
                                ML-{routeList.number}
                            </Typography>
                            <Chip
                                label={routeList.statusName}
                                size="small"
                                sx={{
                                    height: 20, fontSize: 10, fontWeight: 700,
                                    bgcolor: alpha(statusColor, 0.12), color: statusColor,
                                    border: `1px solid ${alpha(statusColor, 0.3)}`,
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Inventory2 sx={{ fontSize: 13, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {delivered}/{total} відправлень
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Scale sx={{ fontSize: 13, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {routeList.totalWeight} кг
                                </Typography>
                            </Box>
                            {routeList.plannedDepartureTime && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Schedule sx={{ fontSize: 13, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(routeList.plannedDepartureTime).toLocaleString('uk-UA', {
                                            day: '2-digit', month: '2-digit',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <IconButton size="small" sx={{ ml: 1, color: 'text.secondary', flexShrink: 0 }}>
                        {open ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </Box>

                {total > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 4, borderRadius: 2,
                                bgcolor: alpha(statusColor, 0.12),
                                '& .MuiLinearProgress-bar': { bgcolor: statusColor, borderRadius: 2 },
                            }}
                        />
                        <Typography variant="caption" color="text.disabled" sx={{
                            fontSize: 10, mt: 0.25, display: 'block', textAlign: 'right',
                        }}>
                            {Math.round(progress)}% виконано
                        </Typography>
                    </Box>
                )}
            </Box>

            <Collapse in={open}>
                <Divider />
                <Box sx={{ p: 1.5 }}>
                    {items.length === 0 ? (
                        <Typography variant="caption" color="text.disabled"
                            sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                            Відправлень немає
                        </Typography>
                    ) : (
                        items.map(item => <ShipmentCard key={item.id} item={item} />)
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

export default RouteListCard;