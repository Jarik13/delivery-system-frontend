import React from 'react';
import {
    Box, Typography, TextField, InputAdornment, CircularProgress,
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    Paper, Chip, Checkbox, alpha, Tabs, Tab,
} from '@mui/material';
import { Search, AutoAwesome, Warning } from '@mui/icons-material';

const statusColor = (status) => {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s.includes('доставлено')) return 'success';
    if (s.includes('дорозі') || s.includes('сортування') || s.includes('завантаження') || s.includes('розвантаження')) return 'warning';
    if (s.includes('відмова') || s.includes('втрат') || s.includes('аварій')) return 'error';
    return 'default';
};

const ShipmentRow = ({ s, selected, onToggle, mainColor }) => (
    <TableRow
        hover
        selected={selected}
        onClick={() => onToggle(s.id)}
        sx={{
            cursor: 'pointer',
            '&.Mui-selected': {
                bgcolor: alpha(mainColor, 0.07),
                '&:hover': { bgcolor: alpha(mainColor, 0.11) },
            },
        }}
    >
        <TableCell padding="checkbox">
            <Checkbox
                size="small"
                checked={selected}
                sx={{ '&.Mui-checked': { color: mainColor } }}
            />
        </TableCell>
        <TableCell>
            <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                {s.trackingNumber}
            </Typography>
        </TableCell>
        <TableCell><Typography variant="caption">{s.senderFullName || '—'}</Typography></TableCell>
        <TableCell><Typography variant="caption">{s.recipientFullName || '—'}</Typography></TableCell>
        <TableCell>
            <Chip label={s.shipmentStatusName || '—'} size="small"
                color={statusColor(s.shipmentStatusName)} variant="outlined" />
        </TableCell>
    </TableRow>
);

const ShipmentsTable = ({ list, loading, selectedShipmentIds, toggleShipment, toggleAll, mainColor, showSelectAll = true }) => {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={28} sx={{ color: mainColor }} />
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} variant="outlined"
            sx={{
                borderRadius: 2,
                maxHeight: 320,
                overflow: 'auto',
                position: 'relative'
            }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox" sx={{
                            bgcolor: '#fff',
                            backgroundImage: `linear-gradient(${alpha(mainColor, 0.05)}, ${alpha(mainColor, 0.05)})`,
                            zIndex: 10
                        }}>
                            {showSelectAll && (
                                <Checkbox
                                    size="small"
                                    indeterminate={
                                        list.some(s => selectedShipmentIds.has(s.id)) &&
                                        !list.every(s => selectedShipmentIds.has(s.id))
                                    }
                                    checked={list.length > 0 && list.every(s => selectedShipmentIds.has(s.id))}
                                    onChange={() => toggleAll(list)}
                                    sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: mainColor } }}
                                />
                            )}
                        </TableCell>
                        {['Трек-номер', 'Відправник', 'Отримувач', 'Статус'].map(h => (
                            <TableCell key={h} sx={{
                                fontWeight: 700,
                                bgcolor: '#fff',
                                backgroundImage: `linear-gradient(${alpha(mainColor, 0.05)}, ${alpha(mainColor, 0.05)})`,
                                py: 1.5,
                                zIndex: 10
                            }}>
                                {h}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {list.map(s => (
                        <ShipmentRow
                            key={s.id}
                            s={s}
                            selected={selectedShipmentIds.has(s.id)}
                            onToggle={toggleShipment}
                            mainColor={mainColor}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

const StepShipments = ({
    mainColor,
    selectedTrip,
    selectedSegment,
    shipmentTab, setShipmentTab,
    shipmentSearch, setShipmentSearch,
    shipments, shipmentsLoading,
    suggestedShipments, suggestedLoading,
    selectedShipmentIds,
    toggleShipment, toggleAll,
    fieldErrors,
}) => (
    <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Box sx={{
                p: 1.5, borderRadius: 2, flex: 1,
                bgcolor: alpha(mainColor, 0.06),
                border: `1px solid ${alpha(mainColor, 0.2)}`,
            }}>
                <Typography variant="caption" color="text.secondary">Рейс</Typography>
                <Typography variant="body2" fontWeight={600}>#{selectedTrip?.tripNumber}</Typography>
            </Box>
            <Box sx={{
                p: 1.5, borderRadius: 2, flex: 2,
                bgcolor: alpha(mainColor, 0.06),
                border: `1px solid ${alpha(mainColor, 0.2)}`,
            }}>
                <Typography variant="caption" color="text.secondary">Сегмент</Typography>
                <Typography variant="body2" fontWeight={600}>
                    {selectedSegment?.originCity} → {selectedSegment?.destCity}
                </Typography>
            </Box>
            {selectedShipmentIds.size > 0 && (
                <Chip
                    label={`Вибрано: ${selectedShipmentIds.size}`}
                    sx={{ alignSelf: 'center', bgcolor: mainColor, color: 'white', fontWeight: 700 }}
                />
            )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
                value={shipmentTab}
                onChange={(_, v) => setShipmentTab(v)}
                sx={{
                    '& .MuiTab-root': { minHeight: 40, py: 0.5, textTransform: 'none', fontWeight: 600 },
                    '& .Mui-selected': { color: mainColor },
                    '& .MuiTabs-indicator': { bgcolor: mainColor },
                }}
            >
                <Tab
                    icon={<AutoAwesome sx={{ fontSize: 15 }} />}
                    iconPosition="start"
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            Рекомендовані
                            {suggestedLoading
                                ? <CircularProgress size={12} sx={{ color: mainColor }} />
                                : suggestedShipments.length > 0 && (
                                    <Chip
                                        label={suggestedShipments.length}
                                        size="small"
                                        sx={{
                                            height: 18, fontSize: 10, fontWeight: 800,
                                            bgcolor: mainColor, color: 'white',
                                            '& .MuiChip-label': { px: 0.75 },
                                        }}
                                    />
                                )
                            }
                        </Box>
                    }
                />
                <Tab label="Всі відправлення" />
            </Tabs>
        </Box>

        {shipmentTab === 0 && (
            <>
                {!suggestedLoading && suggestedShipments.length > 0 && (
                    <Box sx={{
                        mb: 1.5, px: 1.5, py: 1, borderRadius: 2,
                        bgcolor: alpha(mainColor, 0.05),
                        border: `1px solid ${alpha(mainColor, 0.15)}`,
                        display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                        <AutoAwesome sx={{ fontSize: 14, color: mainColor }} />
                        <Typography variant="caption" color="text.secondary">
                            Відправлення відповідають маршруту{' '}
                            <strong>{selectedSegment?.originCity} → {selectedSegment?.destCity}</strong>
                            {' '}і ще не прив'язані до жодної накладної
                        </Typography>
                    </Box>
                )}
                <ShipmentsTable
                    list={suggestedShipments}
                    loading={suggestedLoading}
                    emptyText='Рекомендованих відправлень не знайдено. Спробуйте вкладку "Всі відправлення".'
                    selectedShipmentIds={selectedShipmentIds}
                    toggleShipment={toggleShipment}
                    toggleAll={toggleAll}
                    mainColor={mainColor}
                />
            </>
        )}

        {shipmentTab === 1 && (
            <>
                <TextField
                    fullWidth size="small"
                    placeholder="Пошук за трек-номером..."
                    value={shipmentSearch}
                    onChange={e => setShipmentSearch(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>,
                    }}
                    sx={{ mb: 2 }}
                />
                <ShipmentsTable
                    list={shipments}
                    loading={shipmentsLoading}
                    emptyText="Відправлення в активних статусах не знайдено"
                    selectedShipmentIds={selectedShipmentIds}
                    toggleShipment={toggleShipment}
                    toggleAll={toggleAll}
                    mainColor={mainColor}
                />
            </>
        )}

        {fieldErrors?.shipmentIds && (
            <Box sx={{
                mt: 1.5, p: 1.5, borderRadius: 2,
                bgcolor: 'rgba(211,47,47,0.06)',
                border: '1px solid rgba(211,47,47,0.3)',
                display: 'flex', alignItems: 'center', gap: 1,
            }}>
                <Warning sx={{ fontSize: 16, color: 'error.main' }} />
                <Typography variant="caption" color="error" fontWeight={600}>
                    {fieldErrors.shipmentIds}
                </Typography>
            </Box>
        )}
    </Box>
);

export default StepShipments;