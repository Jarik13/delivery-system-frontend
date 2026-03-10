import React from 'react';
import { Box, Typography, TextField, Grid, Paper, Divider, alpha } from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { stepVariants } from '../utils';

const StepSchedule = ({ direction, form, setForm, segments, drivers, vehicles, mainColor, errors = {}, onClearError }) => {
    const driver = drivers.find(d => d.id === form.driverId);
    const vehicle = vehicles.find(v => v.id === form.vehicleId);
    const routeNames = segments.filter(s => s.cityName).map(s => s.cityName).join(' → ');

    const duration = (() => {
        if (!form.scheduledDeparture || !form.scheduledArrival) return null;
        const diff = (new Date(form.scheduledArrival) - new Date(form.scheduledDeparture)) / 3600000;
        return diff > 0 ? `~${diff.toFixed(1)} год` : null;
    })();

    return (
        <motion.div key="s2" custom={direction} variants={stepVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="subtitle2" sx={{
                    color: '#666', fontWeight: 800, textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 1,
                }}>
                    <AccessTime sx={{ color: mainColor, fontSize: 18 }} /> Плановий розклад
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="Плановий час виїзду"
                            type="datetime-local"
                            fullWidth
                            value={form.scheduledDeparture}
                            onChange={(e) => {
                                setForm(f => ({ ...f, scheduledDeparture: e.target.value }));
                                onClearError?.('scheduledDepartureTime');
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: new Date().toISOString().slice(0, 16) }}
                            error={Boolean(errors.scheduledDepartureTime)}
                            helperText={errors.scheduledDepartureTime || ''}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Очікуваний час прибуття"
                            type="datetime-local"
                            fullWidth
                            value={form.scheduledArrival}
                            onChange={(e) => {
                                setForm(f => ({ ...f, scheduledArrival: e.target.value }));
                                onClearError?.('scheduledArrivalTime');
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: form.scheduledDeparture || new Date().toISOString().slice(0, 16) }}
                            error={Boolean(errors.scheduledArrivalTime)}
                            helperText={errors.scheduledArrivalTime || ''}
                        />
                    </Grid>
                </Grid>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(mainColor, 0.03) }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mainColor, mb: 2 }}>
                        Підсумок рейсу
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Водій:</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {driver ? `${driver.lastName} ${driver.firstName} ${driver.middleName}` : '—'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">ТЗ:</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {vehicle?.licensePlate || '—'}
                            </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="body2" color="text.secondary">Маршрут:</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', maxWidth: '60%' }}>
                                {routeNames || '—'}
                            </Typography>
                        </Box>
                        {duration && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Тривалість:</Typography>
                                <Typography variant="body2" fontWeight={600}>{duration}</Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>
        </motion.div>
    );
};

export default StepSchedule;