import React from 'react';
import {
    Box, Typography, Autocomplete, TextField,
    alpha, Chip, Avatar
} from '@mui/material';
import { Person, Schedule, FlashOn, Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCourierName } from '../utils';

const variants = {
    enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

export default function StepCourier({ direction, form, setForm, couriers, mainColor, errors, onClearError }) {
    const activeCouriers = couriers.filter(c => !c.hasActiveRouteList);
console.log('couriers prop:', couriers);
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

                    <Autocomplete
                        options={couriers}
                        value={couriers.find(c => c.id === form.courierId) || null}
                        getOptionDisabled={(o) => !!o.hasActiveRouteList}
                        getOptionLabel={(o) => formatCourierName(o)}
                        filterOptions={(options, state) => {
                            const input = state.inputValue.toLowerCase();
                            return options.filter(o =>
                                formatCourierName(o).toLowerCase().includes(input) ||
                                (o.phoneNumber && o.phoneNumber.includes(input))
                            );
                        }}
                        onChange={(_, v) => {
                            setForm(p => ({ ...p, courierId: v?.id ?? null }));
                            onClearError?.('courierId');
                        }}
                        renderOption={(props, option) => (
                            <Box component="li" {...props}
                                sx={{
                                    ...props.sx,
                                    opacity: option.hasActiveRouteList ? 0.6 : 1,
                                    cursor: option.hasActiveRouteList ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(mainColor, 0.15), color: mainColor, fontSize: 12 }}>
                                            {(option.firstName?.[0] ?? '') + (option.lastName?.[0] ?? '')}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {formatCourierName(option)}
                                            </Typography>
                                            {option.phoneNumber && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.phoneNumber}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    {option.hasActiveRouteList && (
                                        <Chip
                                            icon={<Warning sx={{ fontSize: '12px !important' }} />}
                                            label="Має активний маршрутний лист"
                                            size="small"
                                            sx={{
                                                height: 20, fontSize: 10, fontWeight: 700,
                                                bgcolor: alpha('#f44336', 0.1),
                                                color: '#f44336',
                                                border: `1px solid ${alpha('#f44336', 0.3)}`,
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}
                        renderInput={(p) => (
                            <TextField
                                {...p}
                                label="Кур'єр *"
                                fullWidth
                                error={Boolean(errors?.courierId)}
                                helperText={errors?.courierId}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        )}
                    />

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