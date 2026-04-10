import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Divider, Stack,
    IconButton, Collapse, Grid, Button, Chip, alpha, Paper, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import {
    ExpandMore, ExpandLess, Scale,
    Straighten, LocationOn, AccessTime,
    Map as MapIcon, Delete, Person, DirectionsCar,
    Inventory2, Room, History, Edit, CheckCircle, FlightLand, Warning,
} from '@mui/icons-material';
import StatusChip from './StatusChip';
import { DictionaryApi } from '../../api/dictionaries';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

const TripCard = ({ trip, color, onMap, onDelete, onEdit, isHighlighted = false, highlightRowRef = null, editable = true, onMarkArrived }) => {
    const [expanded, setExpanded] = useState(false);
    const [segments, setSegments] = useState([]);
    const [segmentsLoading, setSegmentsLoading] = useState(false);

    const [arriveDialog, setArriveDialog] = useState(null);
    const [arriving, setArriving] = useState(false);

    const [departDialog, setDepartDialog] = useState(null);
    const [departing, setDeparting] = useState(false);

    const [emergencyDialog, setEmergencyDialog] = useState(false);
    const [emergencyStopping, setEmergencyStopping] = useState(false);

    const { auth } = useAuth();
    const isDriver = auth?.role === ROLES.DRIVER;

    const canEmergencyStop = isDriver && trip.status === 'В дорозі';

    useEffect(() => {
        if (!expanded || !isDriver) return;
        setSegmentsLoading(true);
        DictionaryApi.getAll(`trips/${trip.id}/segments`, 0, 50, {})
            .then(res => setSegments(res.data.content || res.data || []))
            .catch(console.error)
            .finally(() => setSegmentsLoading(false));
    }, [expanded, trip.id, isDriver]);

    const handleMarkArrived = async () => {
        if (!arriveDialog) return;
        setArriving(true);
        try {
            await DictionaryApi.patch(`trips/waybill-routes/${arriveDialog.waybillRouteId}/arrive`, {});
            setSegments(prev => prev.map(s =>
                s.waybillRouteId === arriveDialog.waybillRouteId
                    ? { ...s, isCompleted: true }
                    : s
            ));
            setArriveDialog(null);
            onMarkArrived?.();
        } catch (e) {
            console.error(e);
        } finally {
            setArriving(false);
        }
    };

    const handleMarkDeparted = async () => {
        if (!departDialog) return;
        setDeparting(true);
        try {
            await DictionaryApi.patch(`trips/waybill-routes/${departDialog.waybillRouteId}/depart`, {});
            setSegments(prev => prev.map(s =>
                s.waybillRouteId === departDialog.waybillRouteId
                    ? { ...s, isDeparted: true }
                    : s
            ));
            setDepartDialog(null);
            onMarkArrived?.();
        } catch (e) {
            console.error(e);
        } finally {
            setDeparting(false);
        }
    };

    const handleEmergencyStop = async () => {
        setEmergencyStopping(true);
        try {
            await DictionaryApi.patch(`trips/${trip.id}/emergency-stop`, {});
            setEmergencyDialog(false);
            onMarkArrived?.();
        } catch (e) {
            console.error(e);
        } finally {
            setEmergencyStopping(false);
        }
    };

    const formatTime = (dateStr) => dateStr
        ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—';

    const formatDate = (dateStr) => dateStr
        ? new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    return (
        <>
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
                            {isDriver && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" fontWeight={800} color="text.secondary"
                                        sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1.5 }}>
                                        Проміжні точки маршруту
                                    </Typography>
                                    {segmentsLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                            <CircularProgress size={20} sx={{ color }} />
                                        </Box>
                                    ) : (
                                        <Stack spacing={1}>
                                            {segments.map((seg, idx) => {
                                                const isPreviousCompleted = idx === 0 || segments[idx - 1].isCompleted;
                                                const isLocked = !isPreviousCompleted;

                                                const isDone = seg.isCompleted;
                                                const isDeparted = seg.isDeparted;

                                                return (
                                                    <Box key={seg.waybillRouteId} sx={{
                                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                                        p: 1.25, borderRadius: 2,
                                                        opacity: isLocked ? 0.5 : 1,
                                                        bgcolor: isDone
                                                            ? alpha('#4caf50', 0.06)
                                                            : isDeparted
                                                                ? alpha('#2196f3', 0.06)
                                                                : alpha(color, 0.04),
                                                        border: `1px solid ${isDone
                                                            ? alpha('#4caf50', 0.2)
                                                            : isDeparted
                                                                ? alpha('#2196f3', 0.2)
                                                                : alpha(color, 0.12)}`,
                                                        pointerEvents: isLocked ? 'none' : 'auto',
                                                    }}>
                                                        <Box sx={{
                                                            width: 24, height: 24, borderRadius: '50%',
                                                            bgcolor: isDone ? '#4caf50' : isDeparted ? '#2196f3' : alpha(color, 0.15),
                                                            color: isDone || isDeparted ? 'white' : color,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, fontSize: 11, flexShrink: 0,
                                                        }}>
                                                            {isDone ? <CheckCircle sx={{ fontSize: 14 }} /> : isDeparted ? <DirectionsCar sx={{ fontSize: 14 }} /> : idx + 1}
                                                        </Box>

                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                                                                {seg.originCity} → {seg.destCity}
                                                            </Typography>
                                                            {seg.distance != null && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {Number(seg.distance).toFixed(2)} км
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        {isDone ? (
                                                            <Chip
                                                                label="Прибуто"
                                                                size="small"
                                                                sx={{
                                                                    height: 22, fontSize: '0.65rem', fontWeight: 700,
                                                                    bgcolor: alpha('#4caf50', 0.1), color: '#2e7d32',
                                                                    border: `1px solid ${alpha('#4caf50', 0.3)}`,
                                                                }}
                                                            />
                                                        ) : isDeparted ? (
                                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                <Chip
                                                                    label="В дорозі"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 22, fontSize: '0.65rem', fontWeight: 700,
                                                                        bgcolor: alpha('#2196f3', 0.1), color: '#1565c0',
                                                                        border: `1px solid ${alpha('#2196f3', 0.3)}`,
                                                                    }}
                                                                />
                                                                <Tooltip title={isLocked ? "Завершіть попередній етап" : "Позначити прибуття"}>
                                                                    <span>
                                                                        <Button
                                                                            size="small"
                                                                            variant="outlined"
                                                                            startIcon={<FlightLand sx={{ fontSize: '14px !important' }} />}
                                                                            onClick={() => setArriveDialog(seg)}
                                                                            disabled={arriving || isLocked}
                                                                            sx={{
                                                                                fontSize: '0.7rem', fontWeight: 700,
                                                                                borderRadius: 2, py: 0.5, px: 1.5,
                                                                                borderColor: '#4caf50', color: '#4caf50',
                                                                                '&:hover': { bgcolor: alpha('#4caf50', 0.06) },
                                                                            }}
                                                                        >
                                                                            Прибув
                                                                        </Button>
                                                                    </span>
                                                                </Tooltip>
                                                            </Box>
                                                        ) : (
                                                            <Tooltip title={isLocked ? "Завершіть попередній етап" : "Позначити виїзд"}>
                                                                <span>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        startIcon={<DirectionsCar sx={{ fontSize: '14px !important' }} />}
                                                                        onClick={() => setDepartDialog(seg)}
                                                                        disabled={departing || isLocked}
                                                                        sx={{
                                                                            fontSize: '0.7rem', fontWeight: 700,
                                                                            borderRadius: 2, py: 0.5, px: 1.5,
                                                                            borderColor: color, color,
                                                                            '&:hover': { bgcolor: alpha(color, 0.06) },
                                                                        }}
                                                                    >
                                                                        Виїхав
                                                                    </Button>
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                            {segments.length === 0 && (
                                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                    Сегменти маршруту не знайдено
                                                </Typography>
                                            )}
                                        </Stack>
                                    )}
                                    <Divider sx={{ mt: 2, mb: 2 }} />
                                </Box>
                            )}

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

                            {!isDriver && (
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
                            )}

                            {isDriver && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {canEmergencyStop && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<Warning fontSize="small" />}
                                            onClick={() => setEmergencyDialog(true)}
                                            sx={{
                                                fontWeight: 800,
                                                borderRadius: 2,
                                                px: 2.5,
                                                borderColor: '#d32f2f',
                                                color: '#d32f2f',
                                                borderWidth: 2,
                                                '&:hover': {
                                                    bgcolor: alpha('#d32f2f', 0.06),
                                                    borderColor: '#b71c1c',
                                                    borderWidth: 2,
                                                },
                                            }}
                                        >
                                            Аварійна зупинка
                                        </Button>
                                    )}

                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<MapIcon />}
                                        onClick={() => onMap(trip)}
                                        sx={{
                                            bgcolor: color,
                                            fontWeight: 800,
                                            borderRadius: 2,
                                            px: 3,
                                            ml: 'auto',
                                            '&:hover': { bgcolor: alpha(color, 0.85) },
                                        }}
                                    >
                                        Карта маршруту
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </CardContent>
            </Card>

            <Dialog
                open={!!arriveDialog}
                onClose={() => setArriveDialog(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    Підтвердити прибуття
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Підтвердити прибуття до точки{' '}
                        <strong>{arriveDialog?.destCity}</strong>?
                    </Typography>
                    {arriveDialog?.distance != null && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                            Сегмент: {arriveDialog.originCity} → {arriveDialog.destCity} · {Number(arriveDialog.distance).toFixed(2)} км
                        </Typography>
                    )}
                    <Box sx={{
                        mt: 2, p: 1.5, borderRadius: 2,
                        bgcolor: alpha('#ff9800', 0.06),
                        border: `1px solid ${alpha('#ff9800', 0.2)}`,
                    }}>
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                            Цю дію неможливо скасувати. Час прибуття буде зафіксовано автоматично.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setArriveDialog(null)} sx={{ color: 'text.secondary' }}>
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleMarkArrived}
                        disabled={arriving}
                        startIcon={arriving
                            ? <CircularProgress size={16} color="inherit" />
                            : <FlightLand fontSize="small" />
                        }
                        sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' }, fontWeight: 700 }}
                    >
                        {arriving ? 'Збереження...' : 'Підтвердити'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!departDialog}
                onClose={() => setDepartDialog(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    Підтвердити виїзд
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Підтвердити виїзд з точки{' '}
                        <strong>{departDialog?.originCity}</strong>?
                    </Typography>
                    {departDialog?.distance != null && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                            Сегмент: {departDialog.originCity} → {departDialog.destCity} · {Number(departDialog.distance).toFixed(2)} км
                        </Typography>
                    )}
                    <Box sx={{
                        mt: 2, p: 1.5, borderRadius: 2,
                        bgcolor: alpha('#ff9800', 0.06),
                        border: `1px solid ${alpha('#ff9800', 0.2)}`,
                    }}>
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                            Цю дію неможливо скасувати. Час виїзду буде зафіксовано автоматично.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setDepartDialog(null)} sx={{ color: 'text.secondary' }}>
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleMarkDeparted}
                        disabled={departing}
                        startIcon={departing
                            ? <CircularProgress size={16} color="inherit" />
                            : <DirectionsCar fontSize="small" />
                        }
                        sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1565c0' }, fontWeight: 700 }}
                    >
                        {departing ? 'Збереження...' : 'Підтвердити виїзд'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={emergencyDialog}
                onClose={() => !emergencyStopping && setEmergencyDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ color: '#d32f2f', fontSize: 22 }} />
                    Аварійна зупинка
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Підтвердити аварійну зупинку рейсу{' '}
                        <strong>{trip.tripNumber}</strong>?
                    </Typography>
                    <Box sx={{
                        mt: 2, p: 1.5, borderRadius: 2,
                        bgcolor: alpha('#d32f2f', 0.05),
                        border: `1px solid ${alpha('#d32f2f', 0.25)}`,
                    }}>
                        <Typography variant="caption" color="error" fontWeight={600}>
                            Цю дію неможливо скасувати. Рейс буде зупинено, диспетчер отримає сповіщення.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        onClick={() => setEmergencyDialog(false)}
                        disabled={emergencyStopping}
                        sx={{ color: 'text.secondary' }}
                    >
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleEmergencyStop}
                        disabled={emergencyStopping}
                        startIcon={emergencyStopping
                            ? <CircularProgress size={16} color="inherit" />
                            : <Warning fontSize="small" />
                        }
                        sx={{
                            bgcolor: '#d32f2f',
                            '&:hover': { bgcolor: '#b71c1c' },
                            fontWeight: 700,
                        }}
                    >
                        {emergencyStopping ? 'Збереження...' : 'Підтвердити зупинку'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TripCard;