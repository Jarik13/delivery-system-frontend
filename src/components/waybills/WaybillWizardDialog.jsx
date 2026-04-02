import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, Box, Typography, Button, alpha,
    Stepper, Step, StepLabel, StepConnector, stepConnectorClasses,
    CircularProgress, Divider, IconButton, Alert, Collapse,
} from '@mui/material';
import {
    Close, DirectionsBus, Route, LocalShipping,
    CheckCircle, ArrowBack, ArrowForward, Add, Receipt,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DictionaryApi } from '../../api/dictionaries';
import StepTrip from './steps/StepTrip';
import StepSegment from './steps/StepSegment';
import StepShipments from './steps/StepShipments';

const ACTIVE_TRIP_STATUSES = [1, 2, 3, 4];
const STEPS = ['Рейс', 'Сегмент маршруту', 'Відправлення'];
const STEP_ICONS = [
    <DirectionsBus fontSize="small" />,
    <Route fontSize="small" />,
    <LocalShipping fontSize="small" />,
];

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

function ColorStepIcon({ active, completed, icon, maincolor }) {
    return (
        <ColorStepIconRoot ownerState={{ active, completed }} maincolor={maincolor}>
            {completed ? <CheckCircle fontSize="small" /> : STEP_ICONS[icon - 1]}
        </ColorStepIconRoot>
    );
}

const WaybillWizardDialog = ({ open, onClose, onSuccess, mainColor = '#673ab7' }) => {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const [tripSearch, setTripSearch] = useState('');
    const [trips, setTrips] = useState([]);
    const [tripsLoading, setTripsLoading] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    const [segments, setSegments] = useState([]);
    const [segmentsLoading, setSegmentsLoading] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState(null);

    const [shipmentTab, setShipmentTab] = useState(0);
    const [shipmentSearch, setShipmentSearch] = useState('');
    const [shipments, setShipments] = useState([]);
    const [shipmentsLoading, setShipmentsLoading] = useState(false);
    const [suggestedShipments, setSuggestedShipments] = useState([]);
    const [suggestedLoading, setSuggestedLoading] = useState(false);
    const [selectedShipmentIds, setSelectedShipmentIds] = useState(new Set());

    const [justCreated, setJustCreated] = useState(false);
    const [lastCreatedInfo, setLastCreatedInfo] = useState(null);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(async () => {
            setTripsLoading(true);
            try {
                const res = await DictionaryApi.getAll('trips/by-branch', 0, 20, {
                    ...(tripSearch ? { tripNumber: tripSearch } : {}),
                    tripStatuses: ACTIVE_TRIP_STATUSES,
                    hasMissingWaybills: true,
                });
                setTrips(res.data.content || []);
            } catch (err) {
                console.error(err);
                setError('Помилка завантаження рейсів вашого відділення');
            } finally {
                setTripsLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [open, tripSearch]);

    useEffect(() => {
        if (!selectedTrip) return;
        setSegmentsLoading(true);
        DictionaryApi.getAll('trips/' + selectedTrip.id + '/segments', 0, 50, {})
            .then(res => setSegments(res.data.content || res.data || []))
            .catch(() => setError('Помилка завантаження сегментів'))
            .finally(() => setSegmentsLoading(false));
    }, [selectedTrip]);

    useEffect(() => {
        if (step !== 2 || !selectedSegment?.routeId) return;
        setSuggestedLoading(true);
        setSuggestedShipments([]);
        DictionaryApi.getByParam('shipments/suggested', 'routeId', selectedSegment.routeId)
            .then(res => {
                const data = res.data?.content ?? res.data ?? [];
                setSuggestedShipments(data);
                setSelectedShipmentIds(new Set(data.map(s => s.id)));
            })
            .catch(() => setError('Помилка завантаження рекомендованих відправлень'))
            .finally(() => setSuggestedLoading(false));
    }, [step, selectedSegment]);

    useEffect(() => {
        if (step !== 2 || shipmentTab !== 1 || !selectedSegment?.routeId || !selectedTrip?.id) return;

        const t = setTimeout(async () => {
            setShipmentsLoading(true);
            try {
                const res = await DictionaryApi.getAll('shipments/available-for-segment', 0, 100, {
                    tripId: selectedTrip.id,
                    routeId: selectedSegment.routeId,
                    trackingNumber: shipmentSearch,
                });
                setShipments(res.data.content || []);
            } catch (err) {
                setError('Помилка завантаження транзитних відправлень');
            } finally {
                setShipmentsLoading(false);
            }
        }, 300);

        return () => clearTimeout(t);
    }, [step, shipmentTab, shipmentSearch, selectedSegment, selectedTrip]);

    const handleSave = async () => {
        if (selectedShipmentIds.size === 0) {
            setError('Оберіть хоча б одне відправлення');
            return;
        }
        setSaving(true);
        setError('');
        setFieldErrors({});
        try {
            const payload = {
                tripId: selectedTrip.id,
                routeId: selectedSegment.routeId,
                tripSequenceNumber: selectedSegment.sequenceNumber,
                shipmentIds: [...selectedShipmentIds],
            };
            await DictionaryApi.create('waybills', payload);
            onSuccess?.(`Накладну для рейсу #${selectedTrip.tripNumber} успішно створено`);
            setLastCreatedInfo({ tripNumber: selectedTrip.tripNumber });
            setJustCreated(true);
        } catch (e) {
            const validationErrors = e.response?.data?.validationErrors;
            if (validationErrors) {
                setFieldErrors(validationErrors);
                if (validationErrors.tripId) {
                    setStep(0);
                    setError(validationErrors.tripId);
                } else if (validationErrors.routeId || validationErrors.tripSequenceNumber) {
                    setStep(1);
                    setError(validationErrors.routeId || validationErrors.tripSequenceNumber);
                } else if (validationErrors.shipmentIds) {
                    setError(validationErrors.shipmentIds);
                }
            } else {
                setError(e.response?.data?.message || 'Помилка створення накладної');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setStep(0);
        setTripSearch('');
        setTrips([]);
        setSelectedTrip(null);
        setSegments([]);
        setSelectedSegment(null);
        setShipmentSearch('');
        setShipments([]);
        setSuggestedShipments([]);
        setSelectedShipmentIds(new Set());
        setShipmentTab(0);
        setError('');
        setFieldErrors({});
        setJustCreated(false);
        setLastCreatedInfo(null);
        onClose();
    };

    const handleCreateAnother = () => {
        setStep(0);
        setSelectedTrip(null);
        setSegments([]);
        setSelectedSegment(null);
        setShipmentSearch('');
        setShipments([]);
        setSuggestedShipments([]);
        setSelectedShipmentIds(new Set());
        setShipmentTab(0);
        setError('');
        setFieldErrors({});
        setJustCreated(false);
        setLastCreatedInfo(null);
    };

    const toggleShipment = (id) => {
        setSelectedShipmentIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = (list) => {
        const allIds = list.map(s => s.id);
        const allSelected = allIds.every(id => selectedShipmentIds.has(id));
        setSelectedShipmentIds(prev => {
            const next = new Set(prev);
            if (allSelected) allIds.forEach(id => next.delete(id));
            else allIds.forEach(id => next.add(id));
            return next;
        });
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
                sx: {
                    borderRadius: 3, overflow: 'hidden',
                    boxShadow: `0 24px 80px ${alpha(mainColor, 0.3)}`,
                }
            }}
        >
            <Box sx={{
                p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px', display: 'flex' }}>
                        <Receipt sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="white">
                            Нова транспортна накладна
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Оформлення накладної для магістрального рейсу
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                    <Close />
                </IconButton>
            </Box>

            <Box sx={{ px: 3, pt: 2.5, pb: 1, bgcolor: alpha(mainColor, 0.03) }}>
                <Stepper
                    activeStep={step}
                    connector={<ColorConnector maincolor={mainColor} />}
                    alternativeLabel
                >
                    {STEPS.map((label, idx) => (
                        <Step key={label} completed={idx < step}>
                            <StepLabel
                                StepIconComponent={(props) =>
                                    <ColorStepIcon {...props} maincolor={mainColor} />
                                }
                            >
                                <Typography
                                    variant="caption"
                                    fontWeight={idx === step ? 700 : 400}
                                    color={idx === step ? mainColor : 'text.secondary'}
                                >
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
                    <Alert severity="error" onClose={() => setError('')} sx={{ m: 2, mb: 0 }}>
                        {error}
                    </Alert>
                </Collapse>

                {justCreated ? (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', minHeight: 420, gap: 3, p: 4,
                    }}>
                        <Box sx={{
                            width: 72, height: 72, borderRadius: '50%',
                            bgcolor: alpha('#4caf50', 0.1),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <CheckCircle sx={{ fontSize: 44, color: '#4caf50' }} />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Накладну успішно створено!
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Накладна для рейсу #{lastCreatedInfo?.tripNumber} оформлена
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleClose}
                                sx={{ borderColor: mainColor, color: mainColor }}
                            >
                                Закрити
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={handleCreateAnother}
                                sx={{ bgcolor: mainColor, '&:hover': { bgcolor: alpha(mainColor, 0.85) } }}
                            >
                                Створити ще одну
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <>
                        {step === 0 && (
                            <StepTrip
                                mainColor={mainColor}
                                tripSearch={tripSearch}
                                setTripSearch={setTripSearch}
                                trips={trips}
                                tripsLoading={tripsLoading}
                                selectedTrip={selectedTrip}
                                setSelectedTrip={setSelectedTrip}
                            />
                        )}
                        {step === 1 && (
                            <StepSegment
                                mainColor={mainColor}
                                selectedTrip={selectedTrip}
                                segments={segments}
                                segmentsLoading={segmentsLoading}
                                selectedSegment={selectedSegment}
                                setSelectedSegment={setSelectedSegment}
                            />
                        )}
                        {step === 2 && (
                            <StepShipments
                                mainColor={mainColor}
                                selectedTrip={selectedTrip}
                                selectedSegment={selectedSegment}
                                shipmentTab={shipmentTab}
                                setShipmentTab={setShipmentTab}
                                shipmentSearch={shipmentSearch}
                                setShipmentSearch={setShipmentSearch}
                                shipments={shipments}
                                shipmentsLoading={shipmentsLoading}
                                suggestedShipments={suggestedShipments}
                                suggestedLoading={suggestedLoading}
                                selectedShipmentIds={selectedShipmentIds}
                                toggleShipment={toggleShipment}
                                toggleAll={toggleAll}
                                fieldErrors={fieldErrors}
                            />
                        )}
                    </>
                )}
            </DialogContent>

            {!justCreated && (
                <>
                    <Divider />
                    <Box sx={{
                        px: 3, py: 2,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        bgcolor: 'grey.50',
                    }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => step === 0 ? handleClose() : setStep(s => s - 1)}
                            sx={{ color: 'text.secondary' }}
                        >
                            {step === 0 ? 'Скасувати' : 'Назад'}
                        </Button>

                        {step < 2 ? (
                            <Button
                                variant="contained"
                                endIcon={<ArrowForward />}
                                disabled={!canNext()}
                                onClick={() => setStep(s => s + 1)}
                                sx={{
                                    bgcolor: mainColor,
                                    '&:hover': { bgcolor: alpha(mainColor, 0.85) },
                                    fontWeight: 700,
                                }}
                            >
                                Далі
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={saving
                                    ? <CircularProgress size={16} sx={{ color: 'white' }} />
                                    : <Add />
                                }
                                disabled={!canNext() || saving}
                                onClick={handleSave}
                                sx={{
                                    bgcolor: mainColor,
                                    '&:hover': { bgcolor: alpha(mainColor, 0.85) },
                                    fontWeight: 700,
                                }}
                            >
                                {saving ? 'Збереження...' : 'Створити накладну'}
                            </Button>
                        )}
                    </Box>
                </>
            )}
        </Dialog>
    );
};

export default WaybillWizardDialog;