import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Typography, Button, Stepper, Step, StepLabel,
    IconButton, CircularProgress, Alert, alpha
} from '@mui/material';
import { DirectionsBus, CheckCircle, ChevronLeft, Edit, Close } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

import { STEPS } from './utils';
import useTripForm from './hooks/useTripForm';
import ColorlibStepIcon from './components/ColorlibStepIcon';
import FullscreenMapOverlay from './components/FullscreenMapOverlay';
import StepCrew from './steps/StepCrew';
import StepRoute from './steps/StepRoute';
import StepSchedule from './steps/StepSchedule';
import { DictionaryApi } from '../../api/dictionaries';

const STEP0_KEYS = ['driverId', 'vehicleId'];
const STEP1_KEYS = ['waypoints'];
const STEP2_KEYS = ['scheduledDepartureTime', 'scheduledArrivalTime'];

const TripWizardDialog = ({ open, onClose, onSuccess, mainColor, references = {}, tripToEdit = null }) => {
    const [stepErrors, setStepErrors] = useState({});
    const [saveLoading, setSaveLoading] = useState(false);
    const [generalError, setGeneralError] = useState(null);
    const { drivers = [], vehicles = [] } = references;

    console.log("TripToEdit in TripWizardDialog:", tripToEdit);

    const form$ = useTripForm({ open, tripToEdit, onSuccess, onClose });
    const {
        isEditMode,
        activeStep, direction,
        form, setForm,
        segments, activeSeg,
        mapSelectMode, setMapSelectMode,
        mapFullscreen, setMapFullscreen,
        loadingTrip,
        segmentsWithCoords, mapCoords,
        sensors,
        go, addSegment, removeSegment,
        handleRegionChange, handleDistrictChange, handleCityChange,
        handleDragStart, handleDragEnd,
        handleMapClick,
        markerRefs,
        fsMarkerRefs,
        draggingSegId,
        handleMarkerDragStart,
        handleMarkerDragEnd,
        handleSave,
        routeSearchQuery,
        setRouteSearchQuery,
        availableRoutes,
        routesLoading,
        routeChain,
        selectedRouteIds,
        addRouteToChain,
        removeRouteFromChain,
        clearRouteChain,
    } = form$;

    const handleNext = async (nextStep) => {
        setStepErrors({});
        setGeneralError(null);

        if (activeStep === 0) {
            try {
                await DictionaryApi.create('trips', {
                    driverId: form.driverId ?? null,
                    vehicleId: form.vehicleId ?? null,
                    scheduledDepartureTime: null,
                    scheduledArrivalTime: null,
                    waypoints: []
                });
            } catch (error) {
                const serverErrors = error.response?.data?.validationErrors;
                if (serverErrors) {
                    const step0Errors = Object.fromEntries(
                        Object.entries(serverErrors).filter(([k]) => STEP0_KEYS.includes(k))
                    );
                    if (Object.keys(step0Errors).length > 0) {
                        setStepErrors(step0Errors);
                        return;
                    }
                }
            }
        }

        if (activeStep === 1) {
            const chainCitiesCount = routeChain.length > 0 ? routeChain.length + 1 : 0;
            const customCitiesCount = segments.filter(s => s.cityName).length;
            const citiesCount = Math.max(chainCitiesCount, customCitiesCount);

            if (citiesCount < 2) {
                setStepErrors({ waypoints: 'Маршрут повинен містити хоча б два міста' });
                return;
            }

            const waypoints = routeChain.length > 0
                ? [
                    { cityId: routeChain[0].originCityId, sequenceNumber: 1 },
                    ...routeChain.map((r, idx) => ({
                        cityId: r.destinationCityId,
                        sequenceNumber: idx + 2,
                    })),
                ]
                : segments
                    .filter(s => s.cityId)
                    .map((s, idx) => ({ cityId: s.cityId, sequenceNumber: idx + 1 }));

            try {
                await DictionaryApi.create('trips', {
                    driverId: form.driverId ?? null,
                    vehicleId: form.vehicleId ?? null,
                    scheduledDepartureTime: null,
                    scheduledArrivalTime: null,
                    waypoints: waypoints,
                });
            } catch (error) {
                const serverErrors = error.response?.data?.validationErrors;
                if (serverErrors) {
                    const step1Errors = Object.fromEntries(
                        Object.entries(serverErrors).filter(([k]) =>
                            k === 'waypoints' || k.startsWith('waypoints[')
                        )
                    );
                    if (Object.keys(step1Errors).length > 0) {
                        setStepErrors(step1Errors);
                        return;
                    }
                }
            }

            go(nextStep);
        }

        go(nextStep);
    };

    const handleSaveWithErrors = async () => {
        setStepErrors({});
        setGeneralError(null);
        setSaveLoading(true);

        try {
            await handleSave();
        } catch (error) {
            const serverErrors = error.response?.data?.validationErrors;

            if (serverErrors) {
                const hasStep0 = Object.keys(serverErrors).some(k => STEP0_KEYS.includes(k));
                const hasStep1 = Object.keys(serverErrors).some(k =>
                    STEP1_KEYS.some(sk => k === sk || k.startsWith(sk + '['))
                );
                const hasStep2 = Object.keys(serverErrors).some(k => STEP2_KEYS.includes(k));

                if (hasStep0) {
                    setStepErrors(serverErrors);
                    go(0);
                } else if (hasStep1) {
                    setStepErrors(serverErrors);
                    go(1);
                } else if (hasStep2) {
                    setStepErrors(serverErrors);
                } else {
                    setGeneralError('Помилка валідації. Перевірте всі поля та спробуйте ще раз.');
                }
            } else {
                setGeneralError('Не вдалося зберегти рейс. Спробуйте ще раз.');
            }
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <>
            <FullscreenMapOverlay
                open={mapFullscreen}
                onClose={() => setMapFullscreen(false)}
                mainColor={mainColor}
                segmentsWithCoords={segmentsWithCoords}
                mapCoords={mapCoords}
                onMapClick={handleMapClick}
                mapSelectMode={mapSelectMode}
                markerRefs={fsMarkerRefs}
                draggingSegId={draggingSegId}
                onMarkerDragStart={handleMarkerDragStart}
                onMarkerDragEnd={handleMarkerDragEnd}
            />

            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
                <Box sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    borderRadius: '16px 16px 0 0',
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px', display: 'flex' }}>
                            {isEditMode ? <Edit sx={{ fontSize: 28, color: 'white' }} /> : <DirectionsBus sx={{ fontSize: 28, color: 'white' }} />}
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="white">
                                {isEditMode ? `Редагування рейсу №${tripToEdit?.tripNumber || ''}` : 'Новий рейс'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                {isEditMode ? 'Внесіть зміни та збережіть' : 'Створення магістрального рейсу'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}><Close /></IconButton>
                </Box>

                <DialogContent sx={{ minHeight: 520, pt: 3, px: 3 }}>
                    {loadingTrip ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 2 }}>
                            <CircularProgress sx={{ color: mainColor }} />
                            <Typography variant="body2" color="text.secondary">Завантаження даних рейсу…</Typography>
                        </Box>
                    ) : (
                        <>
                            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                                {STEPS.map((s) => (
                                    <Step key={s.label}>
                                        <StepLabel StepIconComponent={(p) => <ColorlibStepIcon {...p} mainColor={mainColor} />}>
                                            {s.label}
                                        </StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            <AnimatePresence mode="wait" custom={direction}>
                                {activeStep === 0 && (
                                    <StepCrew
                                        direction={direction}
                                        form={form} setForm={setForm}
                                        drivers={drivers} vehicles={vehicles}
                                        mainColor={mainColor}
                                        errors={stepErrors}
                                        onClearError={(field) => setStepErrors(prev => ({ ...prev, [field]: null }))}
                                    />
                                )}
                                {activeStep === 1 && (
                                    <StepRoute
                                        direction={direction}
                                        mainColor={mainColor}
                                        segments={segments}
                                        activeSeg={activeSeg}
                                        mapSelectMode={mapSelectMode} setMapSelectMode={setMapSelectMode}
                                        mapFullscreen={mapFullscreen} setMapFullscreen={setMapFullscreen}
                                        segmentsWithCoords={segmentsWithCoords}
                                        mapCoords={mapCoords}
                                        sensors={sensors}
                                        addSegment={addSegment}
                                        removeSegment={removeSegment}
                                        handleRegionChange={handleRegionChange}
                                        handleDistrictChange={handleDistrictChange}
                                        handleCityChange={handleCityChange}
                                        handleDragStart={handleDragStart}
                                        handleDragEnd={handleDragEnd}
                                        handleMapClick={handleMapClick}
                                        markerRefs={markerRefs}
                                        draggingSegId={draggingSegId}
                                        handleMarkerDragStart={handleMarkerDragStart}
                                        handleMarkerDragEnd={handleMarkerDragEnd}
                                        errors={stepErrors}
                                        routeSearchQuery={routeSearchQuery}
                                        setRouteSearchQuery={setRouteSearchQuery}
                                        availableRoutes={availableRoutes}
                                        routesLoading={routesLoading}
                                        routeChain={routeChain}
                                        selectedRouteIds={selectedRouteIds}
                                        addRouteToChain={addRouteToChain}
                                        removeRouteFromChain={removeRouteFromChain}
                                        clearRouteChain={clearRouteChain}
                                    />
                                )}
                                {activeStep === 2 && (
                                    <StepSchedule
                                        direction={direction}
                                        form={form} setForm={setForm}
                                        segments={segments}
                                        drivers={drivers} vehicles={vehicles}
                                        mainColor={mainColor}
                                        errors={stepErrors}
                                        onClearError={(field) => setStepErrors(prev => ({ ...prev, [field]: null }))}
                                    />
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </DialogContent>

                {generalError && (
                    <Box sx={{ px: 2.5, pb: 0, pt: 1 }}>
                        <Alert severity="error" onClose={() => setGeneralError(null)}>
                            {generalError}
                        </Alert>
                    </Box>
                )}

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f0f0f0', gap: 1 }}>
                    <Button onClick={onClose} sx={{ color: '#666' }}>Скасувати</Button>
                    <Box sx={{ flexGrow: 1 }} />
                    {activeStep > 0 && (
                        <Button onClick={() => go(activeStep - 1)} startIcon={<ChevronLeft />}>Назад</Button>
                    )}
                    {activeStep < STEPS.length - 1 ? (
                        <Button variant="contained" onClick={() => handleNext(activeStep + 1)} sx={{ bgcolor: mainColor, px: 3 }}>
                            Далі
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleSaveWithErrors}
                            disabled={saveLoading}
                            startIcon={saveLoading
                                ? <CircularProgress size={16} color="inherit" />
                                : isEditMode ? <Edit /> : <CheckCircle />
                            }
                            sx={{ px: 3, bgcolor: mainColor }}
                        >
                            {isEditMode ? 'Зберегти зміни' : 'Створити рейс'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TripWizardDialog;