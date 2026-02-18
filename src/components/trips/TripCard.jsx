import React, { useState } from 'react';
import { 
    Box, Card, CardContent, Typography, Divider, Stack, 
    IconButton, Collapse, Grid, Button, Chip, alpha 
} from '@mui/material';
import { 
    ExpandMore, ExpandLess, ArrowRightAlt, Scale, 
    Straighten, LocationOn, AccessTime, LocalShipping, 
    Map as MapIcon, Delete 
} from '@mui/icons-material';
import StatusChip from './StatusChip';

const TripCard = ({ trip, color, onMap, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <Card sx={{
            mb: 2, ml: { xs: 0, sm: 6.5 }, borderRadius: 4, border: '1px solid #eee',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.08)', borderColor: alpha(color, 0.3) }
        }} elevation={0}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1 }}>
                        <Box sx={{ minWidth: 65, textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight="900" sx={{ color, lineHeight: 1 }}>№{trip.tripNumber}</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" display="block" fontWeight="800" sx={{ fontSize: '0.7rem' }}>{formatTime(trip.scheduledDepartureTime)}</Typography>
                                <Typography variant="caption" display="block" color="text.disabled" fontWeight="600" sx={{ fontSize: '0.6rem' }}>{formatTime(trip.scheduledArrivalTime)}</Typography>
                            </Box>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {trip.originCity} <ArrowRightAlt sx={{ fontSize: 16, color: 'text.disabled' }} /> {trip.destinationCity}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}><Scale sx={{ fontSize: 13 }} /><Typography variant="caption" fontWeight="600">{trip.totalWeight} кг</Typography></Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}><Straighten sx={{ fontSize: 13 }} /><Typography variant="caption" fontWeight="600">{trip.distanceKm} км</Typography></Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}><LocationOn sx={{ fontSize: 13 }} /><Typography variant="caption" fontWeight="600">{trip.waypoints?.length || 0} точок</Typography></Box>
                            </Stack>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusChip status={trip.status} />
                            <IconButton size="small" onClick={() => setExpanded(!expanded)}>{expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}</IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">{trip.vehiclePlate} • {trip.driverName?.split(' ')[0]}</Typography>
                    </Box>
                </Box>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f0f0f0' }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" fontWeight="800" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, textTransform: 'uppercase' }}><AccessTime sx={{ fontSize: 16 }} /> Час</Typography>
                                <Typography variant="body2">Виїзд: {formatTime(trip.actualDepartureTime) || '—'}</Typography>
                                <Typography variant="body2">Прибуття: {formatTime(trip.actualArrivalTime) || '—'}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" fontWeight="800" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, textTransform: 'uppercase' }}><LocalShipping sx={{ fontSize: 16 }} /> Вантаж</Typography>
                                <Typography variant="body2">{trip.shipmentsCount} посилок / {trip.totalWeight} кг</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" fontWeight="800" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, textTransform: 'uppercase' }}><LocationOn sx={{ fontSize: 16 }} /> Зупинки</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {trip.waypoints?.map((wp, i) => <Chip key={i} label={wp} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />)}
                                </Box>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button size="small" startIcon={<MapIcon />} onClick={() => onMap(trip)}>Карта</Button>
                            <Button size="small" color="error" startIcon={<Delete />} onClick={() => onDelete(trip.id)}>Видалити</Button>
                        </Box>
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default TripCard;