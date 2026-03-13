import React from 'react';
import {
    Box, Typography, FormControl, InputLabel, Select, MenuItem,
    TextField, FormHelperText, alpha, Chip, Avatar,
} from '@mui/material';
import { Person, Schedule, FlashOn } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCourierName } from '../utils';

const variants = {
    enter:  (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

export default function StepCourier({ direction, form, setForm, couriers, mainColor, errors, onClearError }) {
    const activeCouriers = couriers.filter(c => !c.hasActiveRouteList);

    return (
        <motion.div
            key="step-courier"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
        >
            <Box sx={{ maxWidth: 560, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

                <Box sx={{
                    p: 2.5, borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(mainColor, 0.06)}, ${alpha(mainColor, 0.02)})`,
                    border: `1px solid ${alpha(mainColor, 0.15)}`,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{
                            bgcolor: alpha(mainColor, 0.12), p: 1, borderRadius: 2,
                            display: 'flex', color: mainColor,
                        }}>
                            <Person fontSize="small" />
                        </Box>
                        <Typography fontWeight={600} color="text.primary">Призначення кур'єра</Typography>
                    </Box>

                    <FormControl fullWidth error={Boolean(errors?.courierId)}>
                        <InputLabel>Кур'єр *</InputLabel>
                        <Select
                            value={form.courierId ?? ''}
                            label="Кур'єр *"
                            onChange={e => {
                                setForm(p => ({ ...p, courierId: e.target.value || null }));
                                onClearError?.('courierId');
                            }}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value=""><em>— Оберіть кур'єра —</em></MenuItem>
                            {couriers.map(c => (
                                <MenuItem key={c.id} value={c.id} disabled={c.hasActiveRouteList}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(mainColor, 0.15), color: mainColor, fontSize: 12 }}>
                                            {(c.firstName?.[0] ?? '') + (c.lastName?.[0] ?? '')}
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="body2" fontWeight={500}>{formatCourierName(c)}</Typography>
                                            {c.phone && (
                                                <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
                                            )}
                                        </Box>
                                        {c.hasActiveRouteList && (
                                            <Chip label="Зайнятий" size="small" color="warning" variant="outlined" />
                                        )}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                        {errors?.courierId && <FormHelperText>{errors.courierId}</FormHelperText>}
                    </FormControl>

                    {activeCouriers.length === 0 && (
                        <Box sx={{
                            mt: 1.5, p: 1.5, borderRadius: 2,
                            bgcolor: alpha('#ff9800', 0.08),
                            border: `1px solid ${alpha('#ff9800', 0.25)}`,
                        }}>
                            <Typography variant="caption" color="warning.main">
                                ⚠️ Усі кур'єри наразі зайняті активними маршрутами
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Box sx={{
                    p: 2.5, borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(mainColor, 0.06)}, ${alpha(mainColor, 0.02)})`,
                    border: `1px solid ${alpha(mainColor, 0.15)}`,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{
                            bgcolor: alpha(mainColor, 0.12), p: 1, borderRadius: 2,
                            display: 'flex', color: mainColor,
                        }}>
                            <Schedule fontSize="small" />
                        </Box>
                        <Typography fontWeight={600} color="text.primary">Планований виїзд</Typography>
                    </Box>

                    <TextField
                        fullWidth
                        label="Дата та час виїзду *"
                        type="datetime-local"
                        value={form.plannedDepartureTime ?? ''}
                        onChange={e => {
                            setForm(p => ({ ...p, plannedDepartureTime: e.target.value || null }));
                            onClearError?.('plannedDepartureTime');
                        }}
                        InputLabelProps={{ shrink: true }}
                        error={Boolean(errors?.plannedDepartureTime)}
                        helperText={errors?.plannedDepartureTime}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </Box>

                <Box sx={{
                    p: 2, borderRadius: 2.5,
                    bgcolor: alpha('#2196f3', 0.06),
                    border: `1px solid ${alpha('#2196f3', 0.2)}`,
                    display: 'flex', gap: 1,
                }}>
                    <FlashOn sx={{ color: '#2196f3', fontSize: 18, mt: 0.1, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
                        На наступному кроці ви оберете відправлення. Система автоматично виділить посилки типу <strong>«Експрес»</strong> на початку списку. Максимальна вага: <strong>30 кг</strong>, максимальна кількість: <strong>13 відправлень</strong>.
                    </Typography>
                </Box>
            </Box>
        </motion.div>
    );
}