import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, Box, Typography, Button, alpha,
    Stepper, Step, StepLabel, StepConnector, stepConnectorClasses,
    TextField, InputAdornment, CircularProgress, Chip, Checkbox,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Paper, Divider, IconButton, Alert, Collapse,
} from '@mui/material';
import {
    Close, Search, DirectionsBus, Route, LocalShipping,
    CheckCircle, ArrowBack, ArrowForward, Add,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DictionaryApi } from '../../api/dictionaries';

// Рейси: тільки активні (Заплановано=1, Завантаження=2, В дорозі=3, Розвантаження=4)
const ACTIVE_TRIP_STATUSES = [1, 2, 3, 4];

// Відправлення: виключаємо фінальні статуси (Доставлено=8, Відмова=9, Втрачено=10, Утилізовано=11)
const EXCLUDE_SHIPMENT_STATUSES = [8, 9, 10, 11];

const ColorConnector = styled(StepConnector)(({ theme, maincolor }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: { borderColor: maincolor },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: { borderColor: maincolor },
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.divider,
        borderTopWidth: 2,
    },
}));

const ColorStepIconRoot = styled('div')(({ ownerState, maincolor }) => ({
    width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', border: '2px solid',
    borderColor: ownerState.active || ownerState.completed ? maincolor : '#e0e0e0',
    backgroundColor: ownerState.completed ? maincolor : ownerState.active ? alpha(maincolor, 0.1) : 'white',
    color: ownerState.completed ? 'white' : ownerState.active ? maincolor : '#9e9e9e',
    transition: 'all 0.3s ease',
}));

const STEP_ICONS = [
    <DirectionsBus fontSize="small" />,
    <Route fontSize="small" />,
    <LocalShipping fontSize="small" />,
];
const STEPS = ['Рейс', 'Сегмент маршруту', 'Відправлення'];

function ColorStepIcon({ active, completed, icon, maincolor }) {
    return (
        <ColorStepIconRoot ownerState={{ active, completed }} maincolor={maincolor}>
            {completed ? <CheckCircle fontSize="small" /> : STEP_ICONS[icon - 1]}
        </ColorStepIconRoot>
    );
}

const statusColor = (status) => {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s.includes('доставлено')) return 'success';
    if (s.includes('дорозі') || s.includes('сортування') || s.includes('завантаження') || s.includes('розвантаження')) return 'warning';
    if (s.includes('відмова') || s.includes('втрат') || s.includes('аварій')) return 'error';
    return 'default';
};

const WaybillWizardDialog = ({ open, onClose, onSuccess, mainColor = '#673ab7' }) => {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Крок 1 — рейс
    const [tripSearch, setTripSearch] = useState('');
    const [trips, setTrips] = useState([]);
    const [tripsLoading, setTripsLoading] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    // Крок 2 — сегмент
    const [segments, setSegments] = useState([]);
    const [segmentsLoading, setSegmentsLoading] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState(null);

    // Крок 3 — відправлення
    const [shipmentSearch, setShipmentSearch] = useState('');
    const [shipments, setShipments] = useState([]);
    const [shipmentsLoading, setShipmentsLoading] = useState(false);
    const [selectedShipmentIds, setSelectedShipmentIds] = useState(new Set());

    const handleClose = () => {
        setStep(0);
        setTripSearch(''); setTrips([]); setSelectedTrip(null);
        setSegments([]); setSelectedSegment(null);
        setShipmentSearch(''); setShipments([]); setSelectedShipmentIds(new Set());
        setError('');
        onClose();
    };

    // ── Крок 1: рейси тільки з активними статусами ────────────────────────────
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(async () => {
            setTripsLoading(true);
            try {
                const res = await DictionaryApi.getAll('trips', 0, 20, {
                    ...(tripSearch ? { tripNumber: tripSearch } : {}),
                    tripStatuses: ACTIVE_TRIP_STATUSES,  // [1,2,3,4]
                });
                setTrips(res.data.content || []);
            } catch {
                setError('Помилка завантаження рейсів');
            } finally {
                setTripsLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [open, tripSearch]);

    // ── Крок 2: сегменти рейсу ────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedTrip) return;
        setSegmentsLoading(true);
        DictionaryApi.getAll('trips/' + selectedTrip.id + '/segments', 0, 50, {})
            .then(res => setSegments(res.data.content || res.data || []))
            .catch(() => setError('Помилка завантаження сегментів'))
            .finally(() => setSegmentsLoading(false));
    }, [selectedTrip]);

    // ── Крок 3: відправлення без фінальних статусів ───────────────────────────
    useEffect(() => {
        if (step !== 2 || !selectedSegment) return;
        const t = setTimeout(async () => {
            setShipmentsLoading(true);
            try {
                const res = await DictionaryApi.getAll('shipments', 0, 100, {
                    ...(shipmentSearch ? { trackingNumber: shipmentSearch } : {}),
                    // Виключаємо: Доставлено(8), Відмова(9), Втрачено(10), Утилізовано(11)
                    // Передаємо як окремі параметри — axios з paramsSerializer: repeat
                    shipmentStatuses: [1, 2, 3, 4, 5, 6, 7],
                });
                setShipments(res.data.content || []);
            } catch {
                setError('Помилка завантаження відправлень');
            } finally {
                setShipmentsLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [step, selectedSegment, shipmentSearch]);

    const handleSave = async () => {
        if (selectedShipmentIds.size === 0) {
            setError('Оберіть хоча б одне відправлення');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await DictionaryApi.create('waybills', {
                tripId: selectedTrip.id,
                routeId: selectedSegment.routeId,
                tripSequenceNumber: selectedSegment.sequenceNumber,
                shipmentIds: [...selectedShipmentIds],
            });
            onSuccess?.(`Накладну для рейсу #${selectedTrip.tripNumber} успішно створено`);
            handleClose();
        } catch (e) {
            setError(e.response?.data?.message || 'Помилка створення накладної');
        } finally {
            setSaving(false);
        }
    };

    const toggleShipment = (id) => {
        setSelectedShipmentIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelectedShipmentIds(prev =>
            prev.size === shipments.length
                ? new Set()
                : new Set(shipments.map(s => s.id))
        );
    };

    const canNext = () => {
        if (step === 0) return !!selectedTrip;
        if (step === 1) return !!selectedSegment;
        return selectedShipmentIds.size > 0;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, overflow: 'hidden', boxShadow: `0 24px 80px ${alpha(mainColor, 0.3)}` }
            }}
        >
            {/* Header */}
            <Box sx={{
                px: 3, py: 2.5,
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.8)} 100%)`,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>Нова транспортна накладна</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>
                        Крок {step + 1} з 3 — {STEPS[step]}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: 'white' }}><Close /></IconButton>
            </Box>

            {/* Stepper */}
            <Box sx={{ px: 3, pt: 2.5, pb: 1, bgcolor: alpha(mainColor, 0.03) }}>
                <Stepper activeStep={step} connector={<ColorConnector maincolor={mainColor} />} alternativeLabel>
                    {STEPS.map((label, idx) => (
                        <Step key={label} completed={idx < step}>
                            <StepLabel StepIconComponent={(props) => <ColorStepIcon {...props} maincolor={mainColor} />}>
                                <Typography variant="caption" fontWeight={idx === step ? 700 : 400}
                                    color={idx === step ? mainColor : 'text.secondary'}>
                                    {label}
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            <Divider />

            <DialogContent sx={{ p: 0, minHeight: 420 }}>
                <Collapse in={!!error}>
                    <Alert severity="error" onClose={() => setError('')} sx={{ m: 2, mb: 0 }}>{error}</Alert>
                </Collapse>

                {/* ── Крок 1: Рейс ──────────────────────────────────────────── */}
                {step === 0 && (
                    <Box sx={{ p: 3 }}>
                        <TextField
                            fullWidth size="small"
                            placeholder="Пошук за номером рейсу..."
                            value={tripSearch}
                            onChange={e => setTripSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>,
                            }}
                            sx={{ mb: 2 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, px: 0.5 }}>
                            Показуються тільки активні рейси (Заплановано, Завантаження, В дорозі, Розвантаження)
                        </Typography>
                        {tripsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={32} sx={{ color: mainColor }} />
                            </Box>
                        ) : (
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                                            <TableCell sx={{ fontWeight: 700, width: 40 }} />
                                            <TableCell sx={{ fontWeight: 700 }}>№ рейсу</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Відправлення</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Прибуття</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Статус</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {trips.map(trip => (
                                            <TableRow key={trip.id} hover selected={selectedTrip?.id === trip.id}
                                                onClick={() => setSelectedTrip(trip)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&.Mui-selected': {
                                                        bgcolor: alpha(mainColor, 0.08),
                                                        '&:hover': { bgcolor: alpha(mainColor, 0.12) },
                                                    },
                                                }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox checked={selectedTrip?.id === trip.id} size="small"
                                                        sx={{ '&.Mui-checked': { color: mainColor } }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>#{trip.tripNumber}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {trip.scheduledDeparture
                                                            ? new Date(trip.scheduledDeparture).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                            : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {trip.scheduledArrival
                                                            ? new Date(trip.scheduledArrival).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                            : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={trip.status || '—'} size="small"
                                                        color={statusColor(trip.status)} variant="outlined" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!tripsLoading && trips.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    Активних рейсів не знайдено
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}

                {/* ── Крок 2: Сегмент маршруту ──────────────────────────────── */}
                {step === 1 && (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{
                            mb: 2, p: 1.5, borderRadius: 2,
                            bgcolor: alpha(mainColor, 0.06), border: `1px solid ${alpha(mainColor, 0.2)}`,
                            display: 'flex', alignItems: 'center', gap: 1,
                        }}>
                            <DirectionsBus sx={{ color: mainColor, fontSize: 18 }} />
                            <Typography variant="body2" fontWeight={600} color={mainColor}>
                                Рейс #{selectedTrip?.tripNumber}
                            </Typography>
                        </Box>
                        {segmentsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={32} sx={{ color: mainColor }} />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {segments.map(seg => {
                                    const isSelected = selectedSegment?.routeId === seg.routeId;
                                    return (
                                        <Paper key={seg.routeId} variant="outlined"
                                            onClick={() => !seg.hasWaybill && setSelectedSegment(seg)}
                                            sx={{
                                                p: 2, borderRadius: 2,
                                                cursor: seg.hasWaybill ? 'not-allowed' : 'pointer',
                                                opacity: seg.hasWaybill ? 0.55 : 1,
                                                borderColor: isSelected ? mainColor : 'divider',
                                                bgcolor: isSelected ? alpha(mainColor, 0.06) : 'white',
                                                transition: 'all 0.2s',
                                                '&:hover': !seg.hasWaybill
                                                    ? { borderColor: mainColor, bgcolor: alpha(mainColor, 0.04) } : {},
                                                display: 'flex', alignItems: 'center', gap: 2,
                                            }}>
                                            <Box sx={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                bgcolor: isSelected ? mainColor : alpha(mainColor, 0.1),
                                                color: isSelected ? 'white' : mainColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 13, flexShrink: 0,
                                            }}>
                                                {seg.sequenceNumber}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {seg.originCity} → {seg.destCity}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {seg.distance ? `${seg.distance} км` : ''}
                                                </Typography>
                                            </Box>
                                            {seg.hasWaybill && (
                                                <Chip label="Вже є накладна" size="small" color="warning" variant="outlined" />
                                            )}
                                            {isSelected && <CheckCircle sx={{ color: mainColor }} />}
                                        </Paper>
                                    );
                                })}
                                {!segmentsLoading && segments.length === 0 && (
                                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                        Сегменти не знайдено
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                )}

                {/* ── Крок 3: Відправлення ──────────────────────────────────── */}
                {step === 2 && (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                            <Box sx={{ p: 1.5, borderRadius: 2, flex: 1, bgcolor: alpha(mainColor, 0.06), border: `1px solid ${alpha(mainColor, 0.2)}` }}>
                                <Typography variant="caption" color="text.secondary">Рейс</Typography>
                                <Typography variant="body2" fontWeight={600}>#{selectedTrip?.tripNumber}</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 2, flex: 2, bgcolor: alpha(mainColor, 0.06), border: `1px solid ${alpha(mainColor, 0.2)}` }}>
                                <Typography variant="caption" color="text.secondary">Сегмент</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {selectedSegment?.originCity} → {selectedSegment?.destCity}
                                </Typography>
                            </Box>
                            {selectedShipmentIds.size > 0 && (
                                <Chip label={`Вибрано: ${selectedShipmentIds.size}`}
                                    sx={{ alignSelf: 'center', bgcolor: mainColor, color: 'white', fontWeight: 700 }} />
                            )}
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, px: 0.5 }}>
                            Показуються відправлення в активних статусах (без Доставлено, Відмова, Втрачено, Утилізовано)
                        </Typography>

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

                        {shipmentsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={32} sx={{ color: mainColor }} />
                            </Box>
                        ) : (
                            <TableContainer component={Paper} variant="outlined"
                                sx={{ borderRadius: 2, maxHeight: 300, overflow: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                                                <Checkbox size="small"
                                                    indeterminate={selectedShipmentIds.size > 0 && selectedShipmentIds.size < shipments.length}
                                                    checked={shipments.length > 0 && selectedShipmentIds.size === shipments.length}
                                                    onChange={toggleAll}
                                                    sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: mainColor } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }}>Трек-номер</TableCell>
                                            <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }}>Відправник</TableCell>
                                            <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }}>Отримувач</TableCell>
                                            <TableCell sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.05) }}>Статус</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {shipments.map(s => (
                                            <TableRow key={s.id} hover selected={selectedShipmentIds.has(s.id)}
                                                onClick={() => toggleShipment(s.id)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&.Mui-selected': {
                                                        bgcolor: alpha(mainColor, 0.07),
                                                        '&:hover': { bgcolor: alpha(mainColor, 0.11) },
                                                    },
                                                }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox size="small" checked={selectedShipmentIds.has(s.id)}
                                                        sx={{ '&.Mui-checked': { color: mainColor } }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                                                        {s.trackingNumber}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">{s.senderName || '—'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">{s.recipientName || '—'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={s.status || '—'} size="small"
                                                        color={statusColor(s.status)} variant="outlined" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!shipmentsLoading && shipments.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    Відправлення в активних статусах не знайдено
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}
            </DialogContent>

            <Divider />

            {/* Footer */}
            <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.50' }}>
                <Button startIcon={<ArrowBack />}
                    onClick={() => step === 0 ? handleClose() : setStep(s => s - 1)}
                    sx={{ color: 'text.secondary' }}>
                    {step === 0 ? 'Скасувати' : 'Назад'}
                </Button>

                {step < 2 ? (
                    <Button variant="contained" endIcon={<ArrowForward />}
                        disabled={!canNext()} onClick={() => setStep(s => s + 1)}
                        sx={{ bgcolor: mainColor, '&:hover': { bgcolor: alpha(mainColor, 0.85) }, fontWeight: 700 }}>
                        Далі
                    </Button>
                ) : (
                    <Button variant="contained"
                        startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Add />}
                        disabled={!canNext() || saving} onClick={handleSave}
                        sx={{ bgcolor: mainColor, '&:hover': { bgcolor: alpha(mainColor, 0.85) }, fontWeight: 700 }}>
                        {saving ? 'Збереження...' : 'Створити накладну'}
                    </Button>
                )}
            </Box>
        </Dialog>
    );
};

export default WaybillWizardDialog;