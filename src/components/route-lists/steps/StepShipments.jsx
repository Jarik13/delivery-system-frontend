import React, { useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, Chip, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, alpha, LinearProgress, Tooltip, IconButton,
} from '@mui/material';
import { Search, FilterList, FlashOn, Scale, Inventory2 } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { MAX_WEIGHT, MAX_SHIPMENTS } from '../utils';

const variants = {
    enter:  (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

function CapacityBar({ value, max, color, label, unit }) {
    const pct = Math.min(100, (value / max) * 100);
    const warn = pct >= 80;
    const full = pct >= 100;
    const barColor = full ? '#f44336' : warn ? '#ff9800' : color;

    return (
        <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
                <Typography variant="caption" fontWeight={700} color={full ? 'error.main' : warn ? 'warning.main' : 'text.primary'}>
                    {typeof value === 'number' ? value.toFixed(value % 1 ? 2 : 0) : value} / {max} {unit}
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                    height: 6, borderRadius: 3,
                    bgcolor: alpha(barColor, 0.15),
                    '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 },
                }}
            />
        </Box>
    );
}

export default function StepShipments({
    direction,
    mainColor,
    availableShipments,
    loadingShipments,
    selectedShipmentIds,
    totalWeight,
    totalCount,
    toggleShipment,
    toggleAll,
    shipmentSearch, setShipmentSearch,
    streetFilter,   setStreetFilter,
    errors,
}) {
    const visibleIds = availableShipments.map(s => s.id);
    const allChecked  = visibleIds.length > 0 && visibleIds.every(id => selectedShipmentIds.has(id));
    const someChecked = visibleIds.some(id => selectedShipmentIds.has(id)) && !allChecked;

    const weightFull = totalWeight >= MAX_WEIGHT;
    const countFull  = totalCount  >= MAX_SHIPMENTS;

    const streets = useMemo(() => {
        const set = new Set(
            availableShipments
                .map(s => s.deliveryAddress?.split(',')[0]?.trim())
                .filter(Boolean)
        );
        return [...set].sort();
    }, [availableShipments]);

    return (
        <motion.div
            key="step-shipments"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Capacity indicators */}
                <Box sx={{
                    p: 2, borderRadius: 2.5,
                    border: `1px solid ${alpha(mainColor, 0.2)}`,
                    bgcolor: alpha(mainColor, 0.03),
                    display: 'flex', gap: 3,
                }}>
                    <CapacityBar value={totalWeight} max={MAX_WEIGHT}    color={mainColor} label="Вага"          unit="кг" />
                    <CapacityBar value={totalCount}  max={MAX_SHIPMENTS} color={mainColor} label="Відправлення"  unit="шт" />
                </Box>

                {/* Validation error */}
                {errors?.shipmentIds && (
                    <Box sx={{
                        p: 1.5, borderRadius: 2,
                        bgcolor: alpha('#f44336', 0.06),
                        border: `1px solid ${alpha('#f44336', 0.25)}`,
                    }}>
                        <Typography variant="caption" color="error">{errors.shipmentIds}</Typography>
                    </Box>
                )}

                {/* Filters row */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                        size="small"
                        placeholder="Трек-номер або отримувач…"
                        value={shipmentSearch}
                        onChange={e => setShipmentSearch(e.target.value)}
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        size="small"
                        placeholder="Фільтр за вулицею…"
                        value={streetFilter}
                        onChange={e => setStreetFilter(e.target.value)}
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FilterList fontSize="small" sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Table */}
                {loadingShipments ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress sx={{ color: mainColor }} />
                    </Box>
                ) : availableShipments.length === 0 ? (
                    <Box sx={{
                        py: 6, textAlign: 'center',
                        border: `2px dashed ${alpha(mainColor, 0.2)}`, borderRadius: 3,
                    }}>
                        <Inventory2 sx={{ fontSize: 48, color: alpha(mainColor, 0.3), mb: 1 }} />
                        <Typography color="text.secondary">
                            Немає відправлень зі статусом «Прибуло до відділення»
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer sx={{ maxHeight: 320, borderRadius: 2.5, border: `1px solid ${alpha(mainColor, 0.15)}` }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                                        <Checkbox
                                            size="small"
                                            checked={allChecked}
                                            indeterminate={someChecked}
                                            onChange={() => toggleAll(visibleIds)}
                                            disabled={weightFull && !allChecked}
                                            sx={{ color: mainColor, '&.Mui-checked': { color: mainColor } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }}>Трек-номер</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }}>Отримувач</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }}>Адреса</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }} align="right">Вага, кг</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }}>Тип</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {availableShipments.map(s => {
                                    const checked  = selectedShipmentIds.has(s.id);
                                    const wouldOverWeight = !checked && (totalWeight + (s.weight ?? 0)) > MAX_WEIGHT;
                                    const wouldOverCount  = !checked && totalCount >= MAX_SHIPMENTS;
                                    const disabled = (wouldOverWeight || wouldOverCount) && !checked;

                                    return (
                                        <TableRow
                                            key={s.id}
                                            hover={!disabled}
                                            selected={checked}
                                            onClick={() => !disabled && toggleShipment(s.id)}
                                            sx={{
                                                cursor: disabled ? 'not-allowed' : 'pointer',
                                                opacity: disabled ? 0.45 : 1,
                                                '&.Mui-selected': { bgcolor: alpha(mainColor, 0.07) },
                                                '&.Mui-selected:hover': { bgcolor: alpha(mainColor, 0.11) },
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    checked={checked}
                                                    disabled={disabled}
                                                    sx={{ color: mainColor, '&.Mui-checked': { color: mainColor } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                                                    {s.trackingNumber}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                                                    {s.recipientName ?? '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>
                                                    {s.deliveryAddress ?? '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600}>
                                                    {s.weight?.toFixed(2) ?? '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {s.isExpress ? (
                                                    <Chip
                                                        icon={<FlashOn sx={{ fontSize: '14px !important' }} />}
                                                        label="Експрес"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha('#ff9800', 0.1),
                                                            color: '#e65100',
                                                            border: `1px solid ${alpha('#ff9800', 0.3)}`,
                                                            fontWeight: 600,
                                                            height: 22,
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">Стандарт</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Typography variant="caption" color="text.disabled" textAlign="right">
                    Показано: {availableShipments.length} | Обрано: {totalCount}
                </Typography>
            </Box>
        </motion.div>
    );
}