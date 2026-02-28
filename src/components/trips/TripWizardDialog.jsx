import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Typography, Button, Stepper, Step, StepLabel,
    IconButton, CircularProgress, alpha
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

const TripWizardDialog = ({ open, onClose, onSuccess, mainColor, references = {}, tripToEdit = null }) => {
    const [stepErrors, setStepErrors] = useState({});
    const { drivers = [], vehicles = [] } = references;

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
    } = form$;

    const handleNext = async (nextStep) => {
        setStepErrors({});

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
                    const step0Keys = ['driverId', 'vehicleId'];
                    const step0Errors = Object.fromEntries(
                        Object.entries(serverErrors).filter(([k]) => step0Keys.includes(k))
                    );
                    if (Object.keys(step0Errors).length > 0) {
                        setStepErrors(step0Errors);
                        return;
                    }
                }
            }
        }

        if (activeStep === 1) {
            const citiesCount = segments.filter(s => s.cityName).length;
            if (citiesCount < 2) {
                setStepErrors({ waypoints: 'Маршрут повинен містити хоча б два міста' });
                return;
            }

            try {
                await DictionaryApi.create('trips', {
                    driverId: form.driverId ?? null,
                    vehicleId: form.vehicleId ?? null,
                    scheduledDepartureTime: null,
                    scheduledArrivalTime: null,
                    waypoints: segments
                        .filter(s => s.cityId)
                        .map((s, idx) => ({ cityId: s.cityId, sequenceNumber: idx }))
                });
            } catch (error) {
                const serverErrors = error.response?.data?.validationErrors;
                if (serverErrors) {
                    const step1Keys = ['waypoints', 'scheduledDepartureTime', 'scheduledArrivalTime'];
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
        }

        go(nextStep);
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
                                    />
                                )}
                                {activeStep === 2 && (
                                    <StepSchedule
                                        direction={direction}
                                        form={form} setForm={setForm}
                                        segments={segments}
                                        drivers={drivers} vehicles={vehicles}
                                        mainColor={mainColor}
                                    />
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </DialogContent>

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
                            onClick={handleSave}
                            startIcon={isEditMode ? <Edit /> : <CheckCircle />}
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