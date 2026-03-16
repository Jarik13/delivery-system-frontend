import React, { useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, Chip, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, alpha, LinearProgress, Button,
} from '@mui/material';
import { Search, FilterList, FlashOn, Inventory2, LocationOn } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { MAX_WEIGHT, MAX_SHIPMENTS } from '../utils';

const variants = {
    enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
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
    streetFilter, setStreetFilter,
    errors,
}) {
    const visibleIds = availableShipments.map(s => s.id);
    const allChecked = visibleIds.length > 0 && visibleIds.every(id => selectedShipmentIds.has(id));
    const someChecked = visibleIds.some(id => selectedShipmentIds.has(id)) && !allChecked;

    const weightFull = totalWeight >= MAX_WEIGHT;

    const headerBg = `color-mix(in srgb, ${mainColor} 8%, white)`;
    const headCellSx = {
        fontWeight: 700,
        bgcolor: headerBg,
        position: 'sticky',
        top: 0,
        zIndex: 2,
        borderBottom: `2px solid ${alpha(mainColor, 0.2)}`,
    };

    const grouped = useMemo(() => {
        const map = new Map();
        availableShipments.forEach(s => {
            const key = s.streetGroup || s.deliveryAddress?.split(',').slice(0, 2).join(',').trim() || 'Самовивіз з відділення';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(s);
        });

        map.forEach((arr, key) => {
            map.set(key, [...arr].sort((a, b) => {
                if (a.isExpress && !b.isExpress) return -1;
                if (!a.isExpress && b.isExpress) return 1;
                return 0;
            }));
        });
        return map;
    }, [availableShipments]);

    const toggleGroup = (groupShipments) => {
        const groupIds = groupShipments.map(s => s.id);
        const allGroupSelected = groupIds.every(id => selectedShipmentIds.has(id));
        toggleAll(allGroupSelected ? [] : groupIds);
    };

    const toggleGroupIds = (groupIds) => {
        const allSelected = groupIds.every(id => selectedShipmentIds.has(id));
        const next = new Set(selectedShipmentIds);
        if (allSelected) {
            groupIds.forEach(id => next.delete(id));
        } else {
            groupIds.forEach(id => {
                const s = availableShipments.find(s => s.id === id);
                const wouldOverWeight = !next.has(id) && (totalWeight + (s?.weight ?? 0)) > MAX_WEIGHT;
                const wouldOverCount = !next.has(id) && next.size >= MAX_SHIPMENTS;
                if (!wouldOverWeight && !wouldOverCount) next.add(id);
            });
        }
        toggleAll([...next]);
    };

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
                <Box sx={{
                    p: 2, borderRadius: 2.5,
                    border: `1px solid ${alpha(mainColor, 0.2)}`,
                    bgcolor: alpha(mainColor, 0.03),
                    display: 'flex', gap: 3,
                }}>
                    <CapacityBar value={totalWeight} max={MAX_WEIGHT} color={mainColor} label="Вага" unit="кг" />
                    <CapacityBar value={totalCount} max={MAX_SHIPMENTS} color={mainColor} label="Відправлення" unit="шт" />
                </Box>

                {errors?.shipmentIds && (
                    <Box sx={{
                        p: 1.5, borderRadius: 2,
                        bgcolor: alpha('#f44336', 0.06),
                        border: `1px solid ${alpha('#f44336', 0.25)}`,
                    }}>
                        <Typography variant="caption" color="error">{errors.shipmentIds}</Typography>
                    </Box>
                )}

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
                    <TableContainer sx={{
                        maxHeight: 380,
                        borderRadius: 2.5,
                        border: `1px solid ${alpha(mainColor, 0.15)}`,
                        overflow: 'auto',
                    }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ ...headCellSx }}>
                                        <Checkbox
                                            size="small"
                                            checked={allChecked}
                                            indeterminate={someChecked}
                                            onChange={() => toggleAll(visibleIds)}
                                            disabled={weightFull && !allChecked}
                                            sx={{ color: mainColor, '&.Mui-checked': { color: mainColor } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={headCellSx}>Трек-номер</TableCell>
                                    <TableCell sx={headCellSx}>Отримувач</TableCell>
                                    <TableCell sx={headCellSx}>Адреса</TableCell>
                                    <TableCell sx={headCellSx} align="right">Вага, кг</TableCell>
                                    <TableCell sx={headCellSx}>Тип</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...grouped.entries()].map(([groupName, groupShipments]) => {
                                    const groupIds = groupShipments.map(s => s.id);
                                    const allGroupChecked = groupIds.every(id => selectedShipmentIds.has(id));
                                    const someGroupChecked = groupIds.some(id => selectedShipmentIds.has(id)) && !allGroupChecked;

                                    return (
                                        <React.Fragment key={groupName}>
                                            <TableRow sx={{ bgcolor: alpha(mainColor, 0.04) }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        size="small"
                                                        checked={allGroupChecked}
                                                        indeterminate={someGroupChecked}
                                                        onChange={() => toggleGroupIds(groupIds)}
                                                        sx={{ color: mainColor, '&.Mui-checked': { color: mainColor } }}
                                                    />
                                                </TableCell>
                                                <TableCell colSpan={5}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <LocationOn sx={{ fontSize: 14, color: mainColor }} />
                                                        <Typography variant="caption" fontWeight={700} color={mainColor}>
                                                            {groupName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                                                            ({groupShipments.length} відправлень
                                                            {' · '}
                                                            {groupShipments.reduce((acc, s) => acc + (s.weight ?? 0), 0).toFixed(2)} кг)
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>

                                            {groupShipments.map(s => {
                                                const checked = selectedShipmentIds.has(s.id);
                                                const wouldOverWeight = !checked && (totalWeight + (s.weight ?? 0)) > MAX_WEIGHT;
                                                const wouldOverCount = !checked && totalCount >= MAX_SHIPMENTS;
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
                                        </React.Fragment>
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