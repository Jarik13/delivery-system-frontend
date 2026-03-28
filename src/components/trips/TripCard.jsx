import React, { useState } from 'react';
import {
    Box, Card, CardContent, Typography, Divider, Stack,
    IconButton, Collapse, Grid, Button, Chip, alpha, Paper, Tooltip,
} from '@mui/material';
import {
    ExpandMore, ExpandLess, Scale,
    Straighten, LocationOn, AccessTime,
    Map as MapIcon, Delete, Person, DirectionsCar,
    Inventory2, Room, History, Edit,
} from '@mui/icons-material';
import StatusChip from './StatusChip';

const TripCard = ({ trip, color, onMap, onDelete, onEdit, isHighlighted = false, highlightRowRef = null, editable = true }) => {
    const [expanded, setExpanded] = useState(false);

    const formatTime = (dateStr) => dateStr
        ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—';

    const formatDate = (dateStr) => dateStr
        ? new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    return (
        <Card
            ref={highlightRowRef}
            sx={{
                mb: 2,
                ml: { xs: 0, sm: 6.5 },
                borderRadius: 4,
                border: '1px solid',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                ...(isHighlighted ? {
                    borderColor: `${alpha(color, 0.6)} !important`,
                    outline: `2px solid ${alpha(color, 0.45)}`,
                    outlineOffset: '2px',
                    animation: 'highlightPulse 1.6s ease-in-out 2',
                    '@keyframes highlightPulse': {
                        '0%': { boxShadow: `0 0 0 0 ${alpha(color, 0.15)}` },
                        '50%': { boxShadow: `0 8px 32px ${alpha(color, 0.4)}` },
                        '100%': { boxShadow: `0 0 0 0 ${alpha(color, 0.15)}` },
                    },
                } : {
                    borderColor: 'divider',
                    '&:hover': {
                        boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
                        borderColor: alpha(color, 0.4),
                        transform: 'translateY(-2px)',
                    },
                }),
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: 4,
                    bgcolor: color,
                    opacity: isHighlighted ? 1 : 0.8,
                },
            }}
            elevation={0}
        >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                            <Typography variant="caption" fontWeight="bold" color="text.disabled"
                                sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                Рейс
                            </Typography>
                            <Typography variant="h5" fontWeight="900" sx={{ color, lineHeight: 1.1 }}>
                                {trip.tripNumber}
                            </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed', my: 0.5 }} />

                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${color}` }} />
                                    <Box sx={{ width: 2, height: 15, bgcolor: 'divider', my: 0.3 }} />
                                    <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '2px' }} />
                                </Box>
                                <Box>
                                    <Typography variant="body1" fontWeight="800" sx={{ lineHeight: 1.2 }}>
                                        {trip.originCity}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="800" sx={{ lineHeight: 1.8 }}>
                                        {trip.destinationCity}
                                    </Typography>
                                </Box>
                            </Box>

                            <Stack direction="row" spacing={1} sx={{ mb: trip.waypoints?.length > 0 ? 1 : 0 }}>
                                <Chip
                                    icon={<Scale sx={{ fontSize: '14px !important' }} />}
                                    label={`${trip.totalWeight?.toLocaleString()} кг`}
                                    size="small"
                                    sx={{ bgcolor: alpha(color, 0.05), fontWeight: 600, fontSize: '0.7rem' }}
                                />
                                <Chip
                                    icon={<Straighten sx={{ fontSize: '14px !important' }} />}
                                    label={`${trip.distanceKm} км`}
                                    size="small"
                                    sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '0.7rem' }}
                                />
                                <Chip
                                    icon={<LocationOn sx={{ fontSize: '14px !important' }} />}
                                    label={`${trip.waypoints?.length || 0} точок`}
                                    size="small"
                                    sx={{ bgcolor: '#f5f5f5', fontWeight: 600, fontSize: '0.7rem' }}
                                />
                            </Stack>

                            {trip.waypoints?.length > 0 && (
                                <Box sx={{
                                    mt: 0.5, p: 0.75, borderRadius: 1.5,
                                    bgcolor: alpha(color, 0.03),
                                    border: `1px solid ${alpha(color, 0.08)}`,
                                }}>
                                    <Typography sx={{
                                        fontSize: '0.58rem', fontWeight: 800,
                                        color: 'text.disabled',
                                        textTransform: 'uppercase', letterSpacing: 0.6, mb: 0.6,
                                    }}>
                                        Проміжні пункти
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                        {trip.waypoints.map((wp, i) => (
                                            <React.Fragment key={i}>
                                                <Chip
                                                    icon={<Room sx={{ fontSize: '11px !important' }} />}
                                                    label={wp}
                                                    size="small"
                                                    sx={{
                                                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                                                        bgcolor: 'white',
                                                        border: `1px solid ${alpha(color, 0.2)}`,
                                                        color: 'text.primary',
                                                        '& .MuiChip-icon': { color },
                                                    }}
                                                />
                                                {i < trip.waypoints.length - 1 && (
                                                    <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1 }}>
                                                        →
                                                    </Typography>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'flex-end', justifyContent: 'space-between',
                        height: '100%', minHeight: 80,
                    }}>
                        <StatusChip status={trip.status} />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                            <Box sx={{ textAlign: 'right', mr: 1 }}>
                                <Typography variant="caption" display="block" fontWeight="700" color="text.primary">
                                    {trip.vehiclePlate}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.disabled" fontWeight="600">
                                    {trip.driverName?.split(' ')[0]}
                                </Typography>
                            </Box>
                            <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{
                                bgcolor: expanded ? alpha(color, 0.1) : '#f8f9fa',
                                color: expanded ? color : 'inherit',
                                '&:hover': { bgcolor: alpha(color, 0.2) },
                            }}>
                                {expanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </Box>
                    </Box>
                </Box>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 3 }}>
                        <Paper variant="outlined" sx={{
                            p: 2.5, borderRadius: 3,
                            bgcolor: alpha('#f8f9fa', 0.5), borderStyle: 'dashed',
                        }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <AccessTime sx={{ color, fontSize: 18 }} />
                                            <Typography variant="subtitle2" fontWeight="800" color="text.secondary"
                                                sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                                Відправлення
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.disabled">План:</Typography>
                                            <Typography variant="body2" fontWeight="700">
                                                {formatDate(trip.scheduledDepartureTime)} {formatTime(trip.scheduledDepartureTime)}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.disabled">Факт:</Typography>
                                            <Typography variant="body2" fontWeight="700"
                                                color={trip.actualDepartureTime ? 'success.main' : 'text.secondary'}>
                                                {trip.actualDepartureTime
                                                    ? `${formatDate(trip.actualDepartureTime)} ${formatTime(trip.actualDepartureTime)}`
                                                    : 'Очікується'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <History sx={{ color, fontSize: 18 }} />
                                            <Typography variant="subtitle2" fontWeight="800" color="text.secondary"
                                                sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                                Прибуття
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.disabled">План:</Typography>
                                            <Typography variant="body2" fontWeight="700">
                                                {formatDate(trip.scheduledArrivalTime)} {formatTime(trip.scheduledArrivalTime)}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.disabled">Факт:</Typography>
                                            <Typography variant="body2" fontWeight="700"
                                                color={trip.actualArrivalTime ? 'success.main' : 'text.secondary'}>
                                                {trip.actualArrivalTime
                                                    ? `${formatDate(trip.actualArrivalTime)} ${formatTime(trip.actualArrivalTime)}`
                                                    : 'У дорозі'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <DirectionsCar sx={{ color, fontSize: 18 }} />
                                            <Typography variant="subtitle2" fontWeight="800" color="text.secondary"
                                                sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                                Ресурси
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Person sx={{ fontSize: 16, color: 'text.disabled' }} />
                                            <Typography variant="body2" fontWeight="600">{trip.driverName}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Inventory2 sx={{ fontSize: 16, color: 'text.disabled' }} />
                                            <Typography variant="body2" fontWeight="600">
                                                {trip.shipmentsCount?.toLocaleString()} відправлень
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Room sx={{ color, fontSize: 18 }} />
                                            <Typography variant="subtitle2" fontWeight="800" color="text.secondary"
                                                sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                                Зупинки
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                                            {trip.waypoints?.length > 0 ? (
                                                trip.waypoints.map((wp, i) => (
                                                    <Chip key={i} label={wp} size="small" sx={{
                                                        fontSize: '0.65rem', height: 22,
                                                        bgcolor: 'white', border: '1px solid #e0e0e0', fontWeight: 600,
                                                    }} />
                                                ))
                                            ) : (
                                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                    Прямий рейс
                                                </Typography>
                                            )}
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Paper>

                        <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                            <Tooltip title={editable ? 'Редагувати' : `Редагування недоступне для статусу "${trip.status}"`}>
                                <span>
                                    <Button
                                        variant="outlined" size="small"
                                        startIcon={<Edit />}
                                        onClick={() => editable && onEdit?.(trip)}
                                        disabled={!editable}
                                        sx={{
                                            fontWeight: 800, borderRadius: 2, px: 2.5,
                                            borderColor: editable ? color : '#ccc',
                                            color: editable ? color : '#ccc',
                                            '&:hover': { bgcolor: editable ? alpha(color, 0.06) : 'transparent', borderColor: editable ? color : '#ccc' },
                                            '&.Mui-disabled': { borderColor: '#ddd', color: '#bbb' }
                                        }}
                                    >
                                        Редагувати
                                    </Button>
                                </span>
                            </Tooltip>

                            <Tooltip title={editable ? 'Видалити' : 'Видалення недоступне'}>
                                <span>
                                    <Button
                                        variant="text" size="small"
                                        startIcon={<Delete />}
                                        color="error"
                                        onClick={() => editable && onDelete(trip.id)}
                                        disabled={!editable}
                                        sx={{ fontWeight: 800, borderRadius: 2 }}
                                    >
                                        Видалити
                                    </Button>
                                </span>
                            </Tooltip>
                            <Button variant="contained" size="small" startIcon={<MapIcon />}
                                onClick={() => onMap(trip)}
                                sx={{
                                    bgcolor: color, fontWeight: 800, borderRadius: 2, px: 3,
                                    '&:hover': { bgcolor: alpha(color, 0.85) },
                                }}>
                                Карта маршруту
                            </Button>
                        </Box>
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default TripCard;