import React from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Typography, Button, Stepper, Step, StepLabel,
    IconButton, CircularProgress, alpha
} from '@mui/material';
import { LocalShipping, CheckCircle, ChevronLeft, Edit, Close } from '@mui/icons-material';
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

const TripWizardDialog = ({ open, onClose, onSuccess, mainColor, references = {}, tripToEdit = null }) => {
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
        handleMarkerDrag,
        handleSave,
    } = form$;

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
            />

            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
                <Box sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.8)} 100%)`,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {isEditMode ? <Edit sx={{ fontSize: 28 }} /> : <LocalShipping sx={{ fontSize: 28 }} />}
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                {isEditMode ? `Редагування рейсу №${tripToEdit?.tripNumber || ''}` : 'Новий рейс'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
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
                                        handleMarkerDrag={handleMarkerDrag}
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
                        <Button variant="contained" onClick={() => go(activeStep + 1)}
                            sx={{ bgcolor: mainColor, px: 3 }}>
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