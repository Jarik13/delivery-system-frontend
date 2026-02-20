import React from 'react';
import { Box, Typography, Autocomplete, TextField, Paper, alpha } from '@mui/material';
import { DirectionsCar, LocalShipping } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { stepVariants } from '../utils';

const StepCrew = ({ direction, form, setForm, drivers, vehicles, mainColor }) => (
    <motion.div key="s0" custom={direction} variants={stepVariants}
        initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="subtitle2" sx={{
                color: '#666', fontWeight: 800, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 1,
            }}>
                <DirectionsCar sx={{ color: mainColor, fontSize: 18 }} /> Водій та транспортний засіб
            </Typography>

            <Autocomplete
                options={drivers}
                value={drivers.find(d => d.id === form.driverId) || null}
                getOptionLabel={(o) =>
                    `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim()
                    + (o.licenseNumber ? ` — ${o.licenseNumber}` : '')}
                onChange={(_, v) => setForm(f => ({ ...f, driverId: v?.id ?? null }))}
                renderInput={(p) => (
                    <TextField {...p} label="Водій" fullWidth
                        InputProps={{ ...p.InputProps, startAdornment: <DirectionsCar sx={{ mr: 1, color: mainColor }} /> }} />
                )}
            />

            <Autocomplete
                options={vehicles}
                value={vehicles.find(v => v.id === form.vehicleId) || null}
                getOptionLabel={(o) =>
                    `${o.licensePlate || ''}` +
                    (o.brandName ? ` — ${o.brandName}` : '') +
                    (o.bodyTypeName ? `, ${o.bodyTypeName}` : '') +
                    (o.loadCapacity ? `, ${o.loadCapacity} т` : '') +
                    (o.activityStatusName ? ` [${o.activityStatusName}]` : '')}
                onChange={(_, v) => setForm(f => ({ ...f, vehicleId: v?.id ?? null }))}
                renderInput={(p) => (
                    <TextField {...p} label="Транспортний засіб" fullWidth
                        InputProps={{ ...p.InputProps, startAdornment: <LocalShipping sx={{ mr: 1, color: mainColor }} /> }} />
                )}
            />

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(mainColor, 0.03) }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Примітка</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Водій та транспортний засіб будуть закріплені за рейсом. Розклад та маршрут можна налаштувати на наступних кроках.
                </Typography>
            </Paper>
        </Box>
    </motion.div>
);

export default StepCrew;