import React, { useState } from 'react';
import {
    Box, Typography, Chip, Collapse, IconButton,
    alpha, Divider, LinearProgress, CircularProgress,
} from '@mui/material';
import { ExpandMore, ExpandLess, Inventory2, Scale, Schedule, CheckCircle } from '@mui/icons-material';
import { ROUTE_LIST_STATUS_COLORS, getStatusColor } from '../../constants/statusColors';
import ShipmentCard from './ShipmentCard';

const RouteListCard = ({ routeList, paymentTypes, onStatusChange, onNotify, onAccept }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const statusColor = getStatusColor(ROUTE_LIST_STATUS_COLORS, routeList.statusName);
    const items = routeList.items || [];
    const delivered = items.filter(i => i.isDelivered).length;
    const total = items.length;
    const progress = total > 0 ? (delivered / total) * 100 : 0;
    
    const isActive = ['Видано кур\'єру', 'У процесі доставки'].includes(routeList.statusName);
    const isFormed = routeList.statusName === 'Сформовано';

    const handleAcceptClick = async (e) => {
        e.stopPropagation();
        if (onAccept) {
            setLoading(true);
            await onAccept(routeList.id);
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            borderRadius: 4, overflow: 'hidden',
            border: `1px solid ${alpha(statusColor, isActive ? 0.4 : 0.15)}`,
            bgcolor: 'background.paper',
            boxShadow: isActive ? `0 4px 16px ${alpha(statusColor, 0.12)}` : `0 2px 8px ${alpha('#000', 0.04)}`,
            display: 'flex', flexDirection: 'column', width: '100%',
        }}>
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{
                    p: 2, cursor: 'pointer',
                    background: isActive
                        ? `linear-gradient(135deg, ${alpha(statusColor, 0.06)}, ${alpha(statusColor, 0.02)})`
                        : alpha('#000', 0.01),
                    userSelect: 'none',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ fontSize: 15, color: 'text.primary' }}>
                                ML-{routeList.number}
                            </Typography>
                            <Chip
                                label={routeList.statusName}
                                size="small"
                                sx={{
                                    height: 20, fontSize: 10, fontWeight: 700,
                                    bgcolor: alpha(statusColor, 0.1), color: statusColor,
                                    border: `1px solid ${alpha(statusColor, 0.2)}`,
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Inventory2 sx={{ fontSize: 14, color: 'text.disabled' }} />
                                <Typography variant="caption" fontWeight={500} color="text.secondary">
                                    {delivered}/{total} відправлень
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Scale sx={{ fontSize: 14, color: 'text.disabled' }} />
                                <Typography variant="caption" fontWeight={500} color="text.secondary">
                                    {routeList.totalWeight} кг
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule sx={{ fontSize: 14, color: 'text.disabled' }} />
                                <Typography variant="caption" fontWeight={500} color="text.secondary">
                                    {routeList.plannedDepartureTime ? new Date(routeList.plannedDepartureTime).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }) : ''}, {routeList.plannedDepartureTime ? new Date(routeList.plannedDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {isFormed && (
                            <IconButton 
                                size="small" 
                                onClick={handleAcceptClick}
                                disabled={loading}
                                sx={{ 
                                    color: statusColor, 
                                    bgcolor: alpha(statusColor, 0.1),
                                    '&:hover': { bgcolor: alpha(statusColor, 0.2) },
                                    mr: 0.5
                                }}
                            >
                                {loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle sx={{ fontSize: 22 }} />}
                            </IconButton>
                        )}
                        
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                            {open ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 4, borderRadius: 2,
                            bgcolor: alpha(statusColor, 0.1),
                            '& .MuiLinearProgress-bar': { bgcolor: statusColor, borderRadius: 2 },
                        }}
                    />
                    <Typography variant="caption" color="text.disabled" sx={{
                        fontSize: 10, mt: 0.5, display: 'block', textAlign: 'right', fontWeight: 600
                    }}>
                        {Math.round(progress)}% виконано
                    </Typography>
                </Box>
            </Box>

            <Collapse in={open}>
                <Divider />
                <Box sx={{ p: 1.5, bgcolor: alpha('#F4F6F8', 0.4) }}>
                    {items.length === 0 ? (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                            Відправлень немає
                        </Typography>
                    ) : (
                        items.map(item => (
                            <ShipmentCard
                                key={item.id}
                                item={item}
                                routeListId={routeList.id}
                                paymentTypes={paymentTypes}
                                onStatusChange={onStatusChange}
                                onNotify={onNotify}
                            />
                        ))
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

export default RouteListCard;