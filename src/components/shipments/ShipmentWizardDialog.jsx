import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog, DialogContent, DialogActions, Box,
    Typography, Button, Stepper, Step, StepLabel, alpha,
} from '@mui/material';
import {
    Edit, LocalShipping, CheckCircle,
    Inventory, Person, Payments,
} from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import ParcelStep from './steps/ParcelStep';
import RouteStep from './steps/RouteStep';
import PriceStep from './steps/PriceStep';
import CreateClientDialog from './CreateClientDialog';
import { DictionaryApi } from '../../api/dictionaries';

const ColorlibStepIcon = ({ active, completed, icon, mainColor }) => {
    const icons = {
        1: <Inventory fontSize="small" />,
        2: <Person fontSize="small" />,
        3: <Payments fontSize="small" />,
    };
    return (
        <Box sx={{
            bgcolor: active || completed ? mainColor : '#eee',
            color: active || completed ? 'white' : '#999',
            width: 32, height: 32, display: 'flex', borderRadius: '50%',
            justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease',
        }}>
            {icons[String(icon)]}
        </Box>
    );
};

const initialFormData = {
    parcel: { declaredValue: '', actualWeight: '', contentDescription: '', parcelTypeId: null, storageConditionIds: [] },
    box: { useBox: false, boxVariantId: null },
    origin: { type: 'branch', deliveryPointId: null, cityId: null, streetId: null, houseNumber: '', apartmentNumber: '' },
    destination: { type: 'branch', deliveryPointId: null, cityId: null, streetId: null, houseNumber: '', apartmentNumber: '' },
    senderId: null, recipientId: null, shipmentTypeId: null,
    price: { deliveryPrice: 0, weightPrice: 0, distancePrice: 0, boxVariantPrice: 0, specialPackagingPrice: 0, insuranceFee: 0, totalPrice: 0 },
    senderPay: true, partiallyPaid: false, partialAmount: '',
    paymentTypeId: null, fullyPaid: false,
};

const STEP_LABELS = ['Посилка', 'Маршрут', 'Вартість'];
const STEP1_FIELDS = ['shipmentTypeId', 'originCityId', 'destinationCityId', 'senderId', 'recipientId'];

const variants = {
    enter: d => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: d => ({ x: d < 0 ? 100 : -100, opacity: 0 }),
};

const ShipmentWizardDialog = ({ open, onClose, onSuccess, mainColor, references, shipmentToEdit = null }) => {
    const { clients, shipmentTypes, parcelTypes, storageConditions, boxVariants, paymentTypes = [] } = references;
    const isEditMode = !!shipmentToEdit;

    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formData, setFormData] = useState(initialFormData);
    const [localClients, setLocalClients] = useState([]);
    const [employeeProfile, setEmployeeProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [createClientOpen, setCreateClientOpen] = useState(false);
    const [createClientFor, setCreateClientFor] = useState(null);
    const [selectedExistingParcelId, setSelectedExistingParcelId] = useState(null);
    const listboxRef = useRef(null);

    useEffect(() => {
        if (!open || isEditMode) return;
        setProfileLoading(true);
        setEmployeeProfile(null);
        DictionaryApi.getProfile()
            .then(res => {
                const profile = res.data;
                setEmployeeProfile(profile);
                if (profile?.branch?.deliveryPointId) {
                    setFormData(prev => ({
                        ...prev,
                        origin: {
                            type: 'branch',
                            deliveryPointId: profile.branch.deliveryPointId,
                            branchId: profile.branch.id,
                            cityId: profile.branch.cityId,
                            streetId: null,
                            houseNumber: '',
                            apartmentNumber: '',
                        },
                    }));
                }
            })
            .catch(console.error)
            .finally(() => setProfileLoading(false));
    }, [open, isEditMode]);

    useEffect(() => { setLocalClients(clients); }, [clients]);

    useEffect(() => {
        if (open && shipmentToEdit && parcelTypes.length > 0 && storageConditions.length > 0) {
            setFormData({
                parcel: {
                    declaredValue: shipmentToEdit.declaredValue ?? '',
                    actualWeight: shipmentToEdit.actualWeight ?? '',
                    contentDescription: shipmentToEdit.parcelDescription ?? '',
                    parcelTypeId: shipmentToEdit.parcelTypeId ?? null,
                    storageConditionIds: shipmentToEdit.storageConditionIds ?? [],
                },
                box: {
                    useBox: !!shipmentToEdit.boxVariantId,
                    boxVariantId: shipmentToEdit.boxVariantId ?? null,
                },
                origin: {
                    type: shipmentToEdit.originType?.toLowerCase() ?? 'branch',
                    deliveryPointId: shipmentToEdit.originDeliveryPointId ?? null,
                    cityId: shipmentToEdit.originCityId ?? null,
                    streetId: shipmentToEdit.originStreetId ?? null,
                    houseNumber: shipmentToEdit.originHouseNumber ?? '',
                    apartmentNumber: shipmentToEdit.originApartmentNumber ?? '',
                },
                destination: {
                    type: shipmentToEdit.destinationType?.toLowerCase() ?? 'branch',
                    deliveryPointId: shipmentToEdit.destinationDeliveryPointId ?? null,
                    cityId: shipmentToEdit.destinationCityId ?? null,
                    streetId: shipmentToEdit.destinationStreetId ?? null,
                    houseNumber: shipmentToEdit.destinationHouseNumber ?? '',
                    apartmentNumber: shipmentToEdit.destinationApartmentNumber ?? '',
                },
                senderId: shipmentToEdit.senderId ?? null,
                recipientId: shipmentToEdit.recipientId ?? null,
                shipmentTypeId: shipmentToEdit.shipmentTypeId ?? null,
                price: {
                    deliveryPrice: shipmentToEdit.deliveryPrice ?? 0,
                    weightPrice: shipmentToEdit.weightPrice ?? 0,
                    distancePrice: shipmentToEdit.distancePrice ?? 0,
                    boxVariantPrice: shipmentToEdit.boxVariantPrice ?? 0,
                    specialPackagingPrice: shipmentToEdit.specialPackagingPrice ?? 0,
                    insuranceFee: shipmentToEdit.insuranceFee ?? 0,
                    totalPrice: shipmentToEdit.totalPrice ?? 0,
                },
                senderPay: shipmentToEdit.isSenderPay ?? true,
                partiallyPaid: shipmentToEdit.isPartiallyPaid ?? false,
                partialAmount: shipmentToEdit.partialAmount ?? '',
                paymentTypeId: shipmentToEdit.paymentTypeId ?? null,
                fullyPaid: shipmentToEdit.isFullyPaid ?? false,
            });
            setActiveStep(0);
            setFieldErrors({});
        } else if (open && !shipmentToEdit) {
            setActiveStep(0);
            setFormData(initialFormData);
            setFieldErrors({});
            setSelectedExistingParcelId(null);
        }
    }, [open, shipmentToEdit, parcelTypes, storageConditions]);

    const fetchCalculatedPrice = useCallback(async () => {
        if (!formData.parcel.actualWeight || !formData.parcel.parcelTypeId || !formData.shipmentTypeId) return;
        try {
            const res = await DictionaryApi.calculatePrices({
                contentDescription: formData.parcel.contentDescription,
                actualWeight: parseFloat(formData.parcel.actualWeight),
                declaredValue: parseFloat(formData.parcel.declaredValue) || 0,
                parcelTypeId: formData.parcel.parcelTypeId,
                storageConditionIds: formData.parcel.storageConditionIds ?? [],
                boxVariantId: formData.box.useBox ? formData.box.boxVariantId : null,
                shipmentTypeId: formData.shipmentTypeId,
                originCityId: formData.origin.cityId,
                destinationCityId: formData.destination.cityId,
                originType: formData.origin.type?.toUpperCase() ?? null,
                destinationType: formData.destination.type?.toUpperCase() ?? null,
            });
            setFormData(prev => ({ ...prev, price: res.data }));
        } catch (e) {
            console.error('Помилка тарифікації', e);
        }
    }, [formData.parcel, formData.box, formData.shipmentTypeId, formData.origin.cityId, formData.destination.cityId]);

    useEffect(() => {
        if (activeStep === 2) fetchCalculatedPrice();
    }, [activeStep, fetchCalculatedPrice]);

    const handleNext = async () => {
        setFieldErrors({});

        if (activeStep === 0) {
            if (selectedExistingParcelId) {
                setDirection(1);
                setActiveStep(1);
                return;
            }
            try {
                await DictionaryApi.calculatePrices({
                    actualWeight: formData.parcel.actualWeight ? parseFloat(formData.parcel.actualWeight) : null,
                    declaredValue: formData.parcel.declaredValue ? parseFloat(formData.parcel.declaredValue) : null,
                    contentDescription: formData.parcel.contentDescription || null,
                    parcelTypeId: formData.parcel.parcelTypeId,
                    storageConditionIds: formData.parcel.storageConditionIds ?? [],
                    boxVariantId: formData.box.useBox ? formData.box.boxVariantId : null,
                    shipmentTypeId: formData.shipmentTypeId || null,
                    originCityId: formData.origin.cityId || null,
                    destinationCityId: formData.destination.cityId || null,
                    originType: formData.origin.type?.toUpperCase() ?? null,
                    destinationType: formData.destination.type?.toUpperCase() ?? null,
                });
            } catch (error) {
                const serverErrors = error.response?.data?.validationErrors;
                if (serverErrors) {
                    const step0Errors = Object.entries(serverErrors).filter(([key]) => !STEP1_FIELDS.includes(key));
                    if (step0Errors.length > 0) {
                        const mapped = {};
                        for (const [key, val] of step0Errors) {
                            if (['actualWeight', 'declaredValue', 'parcelTypeId', 'storageConditionIds', 'contentDescription'].includes(key)) {
                                mapped[`parcel.${key}`] = val;
                            } else if (key === 'boxVariantId') {
                                mapped['box.boxVariantId'] = val;
                            } else {
                                mapped[key] = val;
                            }
                        }
                        setFieldErrors(mapped);
                        return;
                    }
                }
            }
        }

        if (activeStep === 1) {
            const errors = {};
            if (!formData.senderId) errors.senderId = 'Оберіть відправника';
            if (!formData.recipientId) errors.recipientId = 'Оберіть отримувача';
            if (!formData.shipmentTypeId) errors.shipmentTypeId = 'Оберіть тип доставки';
            if (!isEditMode && !formData.origin.deliveryPointId) errors['origin.deliveryPointId'] = 'Оберіть пункт відправлення';
            if (!formData.destination.cityId) errors['destination.cityId'] = 'Оберіть місто призначення';
            if (!formData.destination.deliveryPointId && formData.destination.type !== 'address') errors['destination.deliveryPointId'] = 'Оберіть пункт призначення';
            if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
        }

        setDirection(1);
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => {
        setDirection(-1);
        setActiveStep(prev => prev - 1);
    };

    const handleSave = async () => {
        try {
            const payload = {
                existingParcelId: selectedExistingParcelId ?? null,
                declaredValue: parseFloat(formData.parcel.declaredValue),
                actualWeight: parseFloat(formData.parcel.actualWeight),
                contentDescription: formData.parcel.contentDescription,
                parcelTypeId: formData.parcel.parcelTypeId,
                storageConditionIds: formData.parcel.storageConditionIds,
                senderId: formData.senderId,
                recipientId: formData.recipientId,
                shipmentTypeId: formData.shipmentTypeId,
                origin: {
                    type: formData.origin.type.toUpperCase(),
                    deliveryPointId: formData.origin.deliveryPointId,
                    cityId: formData.origin.cityId,
                    streetId: formData.origin.streetId,
                    houseNumber: formData.origin.houseNumber,
                    apartmentNumber: parseInt(formData.origin.apartmentNumber) || null,
                },
                destination: {
                    type: formData.destination.type.toUpperCase(),
                    deliveryPointId: formData.destination.deliveryPointId,
                    cityId: formData.destination.cityId,
                    streetId: formData.destination.streetId,
                    houseNumber: formData.destination.houseNumber,
                    apartmentNumber: parseInt(formData.destination.apartmentNumber) || null,
                },
                isSenderPay: formData.senderPay,
                isPartiallyPaid: formData.partiallyPaid && !formData.fullyPaid,
                partialAmount: formData.partiallyPaid && !formData.fullyPaid ? parseFloat(formData.partialAmount) : null,
                isFullyPaid: formData.fullyPaid,
                paymentTypeId: formData.paymentTypeId,
                boxVariantId: formData.box.useBox ? formData.box.boxVariantId : null,
                calculatedPrice: formData.price,
            };

            if (isEditMode) {
                await DictionaryApi.update('shipments', shipmentToEdit.id, payload);
                onSuccess('ТТН оновлено успішно!');
            } else {
                await DictionaryApi.create('shipments', payload);
                onSuccess('ТТН створено успішно!');
            }
            onClose();
        } catch (error) {
            if (error.response?.data?.validationErrors)
                setFieldErrors(error.response.data.validationErrors);
        }
    };

    const handleClientCreated = (newClient) => {
        setLocalClients(prev => [...prev, newClient]);
        if (createClientFor === 'sender') {
            setFormData(prev => ({ ...prev, senderId: newClient.id }));
            setFieldErrors(prev => ({ ...prev, senderId: null }));
        } else if (createClientFor === 'recipient') {
            setFormData(prev => ({ ...prev, recipientId: newClient.id }));
            setFieldErrors(prev => ({ ...prev, recipientId: null }));
        }
        setCreateClientFor(null);
    };

    const handleBoxListboxOpen = useCallback(() => {
        setTimeout(() => {
            const el = document.querySelector('[data-optimal-box="true"]');
            if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 100);
    }, []);

    const commonStepProps = { formData, setFormData, fieldErrors, setFieldErrors, mainColor, direction, variants };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
                <Box sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    borderRadius: '16px 16px 0 0',
                }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px', display: 'flex' }}>
                        {isEditMode
                            ? <Edit sx={{ color: 'white', fontSize: 28 }} />
                            : <LocalShipping sx={{ color: 'white', fontSize: 28 }} />}
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                            {isEditMode ? `Редагування ТТН ${shipmentToEdit?.trackingNumber ?? ''}` : 'Нове відправлення'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {isEditMode ? 'Внесіть зміни та збережіть' : 'Заповніть всі кроки для оформлення ТТН'}
                        </Typography>
                    </Box>
                </Box>

                <DialogContent sx={{ minHeight: 480, pt: 3 }}>
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
                        {STEP_LABELS.map((label, idx) => (
                            <Step key={label}>
                                <StepLabel StepIconComponent={p => (
                                    <ColorlibStepIcon {...p} icon={idx + 1} mainColor={mainColor} />
                                )}>
                                    {label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <AnimatePresence mode="wait" custom={direction}>
                        {activeStep === 0 && (
                            <ParcelStep
                                {...commonStepProps}
                                parcelTypes={parcelTypes}
                                storageConditions={storageConditions}
                                boxVariants={boxVariants}
                                listboxRef={listboxRef}
                                handleBoxListboxOpen={handleBoxListboxOpen}
                                onSelectExistingParcel={setSelectedExistingParcelId}
                                selectedExistingParcelId={selectedExistingParcelId}
                            />
                        )}
                        {activeStep === 1 && (
                            <RouteStep
                                {...commonStepProps}
                                localClients={localClients}
                                shipmentTypes={shipmentTypes}
                                employeeProfile={employeeProfile}
                                profileLoading={profileLoading}
                                isEditMode={isEditMode}
                                onOpenCreateClient={(role) => {
                                    setCreateClientFor(role);
                                    setCreateClientOpen(true);
                                }}
                            />
                        )}
                        {activeStep === 2 && (
                            <PriceStep
                                {...commonStepProps}
                                paymentTypes={paymentTypes}
                            />
                        )}
                    </AnimatePresence>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
                    <Button onClick={onClose}>Скасувати</Button>
                    <Box sx={{ flexGrow: 1 }} />
                    {activeStep > 0 && <Button onClick={handleBack}>Назад</Button>}
                    {activeStep < 2 ? (
                        <Button variant="contained" onClick={handleNext} sx={{ bgcolor: mainColor }}>
                            Далі
                        </Button>
                    ) : (
                        <Button variant="contained" color="success" onClick={handleSave}
                            startIcon={isEditMode ? <Edit /> : <CheckCircle />}>
                            {isEditMode ? 'Зберегти зміни' : 'Оформити ТТН'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <CreateClientDialog
                open={createClientOpen}
                onClose={() => setCreateClientOpen(false)}
                onCreated={handleClientCreated}
                mainColor={mainColor}
            />
        </>
    );
};

export default ShipmentWizardDialog;