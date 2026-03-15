import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogActions,
    Box, Typography, Button, Stepper, Step, StepLabel,
    IconButton, CircularProgress, Alert, alpha,
} from '@mui/material';
import { Assignment, CheckCircle, ChevronLeft, Edit, Close } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';

import { STEPS } from './utils';
import useRouteListForm from './hooks/useRouteListForm';
import ColorlibStepIcon from './components/ColorlibStepIcon';
import StepCourier from './steps/StepCourier';
import StepShipments from './steps/StepShipments';
import { DictionaryApi } from '../../api/dictionaries';

const STEP0_KEYS = ['courierId', 'plannedDepartureTime'];
const STEP1_KEYS = ['shipmentIds'];

const RouteListWizardDialog = ({
    open,
    onClose,
    onSuccess,
    mainColor,
    references = {},
    routeListToEdit = null,
}) => {
    const [stepErrors, setStepErrors] = useState({});
    const [saveLoading, setSaveLoading] = useState(false);
    const [nextLoading, setNextLoading] = useState(false);
    const [generalError, setGeneralError] = useState(null);

    const { couriers = [] } = references;

    const form$ = useRouteListForm({ open, routeListToEdit, onSuccess, onClose });
    const {
        isEditMode,
        activeStep, direction,
        form, setForm,
        loadingData,
        availableShipments,
        loadingShipments,
        selectedShipmentIds,
        selectedShipments,
        totalWeight,
        totalCount,
        toggleShipment,
        toggleAll,
        shipmentSearch, setShipmentSearch,
        streetFilter,   setStreetFilter,
        go,
        handleSave,
    } = form$;

    const handleNext = async (nextStep) => {
        setStepErrors({});
        setGeneralError(null);

        if (activeStep === 0) {
            setNextLoading(true);
            try {
                await DictionaryApi.create('route-lists', {
                    courierId:            form.courierId ?? null,
                    plannedDepartureTime: form.plannedDepartureTime ?? null,
                    shipmentIds:          [],
                });
            } catch (error) {
                const serverErrors = error.response?.data?.validationErrors;
                if (serverErrors) {
                    const step0Errors = Object.fromEntries(
                        Object.entries(serverErrors).filter(([k]) => STEP0_KEYS.includes(k))
                    );
                    if (Object.keys(step0Errors).length > 0) {
                        setStepErrors(step0Errors);
                        setNextLoading(false);
                        return;
                    }
                }
            } finally {
                setNextLoading(false);
            }
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
                if (hasStep0) { setStepErrors(serverErrors); go(0); }
                else if (hasStep1) { setStepErrors(serverErrors); }
                else setGeneralError('Помилка валідації. Перевірте всі поля та спробуйте ще раз.');
            } else {
                setGeneralError('Не вдалося зберегти маршрутний лист. Спробуйте ще раз.');
            }
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
        >
            <Box sx={{
                p: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px', display: 'flex',
                    }}>
                        {isEditMode
                            ? <Edit sx={{ fontSize: 28, color: 'white' }} />
                            : <Assignment sx={{ fontSize: 28, color: 'white' }} />
                        }
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="white">
                            {isEditMode
                                ? `Редагування листа №${routeListToEdit?.routeListNumber || ''}`
                                : 'Новий маршрутний лист'
                            }
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {isEditMode ? 'Внесіть зміни та збережіть' : 'Формування маршруту кур\'єрської доставки'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ minHeight: 500, pt: 3, px: 3 }}>
                {loadingData ? (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        height: 400, gap: 2,
                    }}>
                        <CircularProgress sx={{ color: mainColor }} />
                        <Typography variant="body2" color="text.secondary">
                            Завантаження даних маршрутного листа…
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                            {STEPS.map((s) => (
                                <Step key={s.label}>
                                    <StepLabel
                                        StepIconComponent={(p) =>
                                            <ColorlibStepIcon {...p} mainColor={mainColor} />
                                        }
                                    >
                                        {s.label}
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <AnimatePresence mode="wait" custom={direction}>
                            {activeStep === 0 && (
                                <StepCourier
                                    direction={direction}
                                    form={form}
                                    setForm={setForm}
                                    couriers={couriers}
                                    mainColor={mainColor}
                                    errors={stepErrors}
                                    onClearError={(field) =>
                                        setStepErrors(prev => ({ ...prev, [field]: null }))
                                    }
                                />
                            )}
                            {activeStep === 1 && (
                                <StepShipments
                                    direction={direction}
                                    mainColor={mainColor}
                                    availableShipments={availableShipments}
                                    loadingShipments={loadingShipments}
                                    selectedShipmentIds={selectedShipmentIds}
                                    totalWeight={totalWeight}
                                    totalCount={totalCount}
                                    toggleShipment={toggleShipment}
                                    toggleAll={toggleAll}
                                    shipmentSearch={shipmentSearch}
                                    setShipmentSearch={setShipmentSearch}
                                    streetFilter={streetFilter}
                                    setStreetFilter={setStreetFilter}
                                    errors={stepErrors}
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
                    <Button onClick={() => go(activeStep - 1)} startIcon={<ChevronLeft />}>
                        Назад
                    </Button>
                )}
                {activeStep < STEPS.length - 1 ? (
                    <Button
                        variant="contained"
                        onClick={() => handleNext(activeStep + 1)}
                        disabled={nextLoading}
                        startIcon={nextLoading
                            ? <CircularProgress size={16} color="inherit" />
                            : null
                        }
                        sx={{ bgcolor: mainColor, px: 3 }}
                    >
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
                        {isEditMode ? 'Зберегти зміни' : 'Сформувати лист'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default RouteListWizardDialog;