import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog, DialogContent, DialogActions, TextField, Box,
    Typography, Button, Stepper, Step, StepLabel, Grid, Autocomplete,
    Divider, FormControlLabel, Checkbox, Chip, Card, CardContent,
    RadioGroup, Radio, InputAdornment, alpha, IconButton, Tooltip,
    Collapse
} from '@mui/material';
import {
    Inventory, Person, Calculate, CheckCircle, Edit,
    LocalShipping, Payments, AccountBalanceWallet, PersonAdd,
    CreditCard,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DeliveryPointSelector from './DeliveryPointSelector';
import CreateClientDialog from './CreateClientDialog';
import { DictionaryApi } from '../../api/dictionaries';

const ColorlibStepIcon = (props) => {
    const { active, completed, icon, mainColor } = props;
    const icons = {
        1: <Inventory fontSize="small" />,
        2: <LocalShipping fontSize="small" />,
        3: <Payments fontSize="small" />
    };
    return (
        <Box sx={{
            bgcolor: active || completed ? mainColor : '#eee',
            color: active || completed ? 'white' : '#999',
            width: 32, height: 32, display: 'flex', borderRadius: '50%',
            justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease'
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
    const listboxRef = useRef(null);

    const [createClientOpen, setCreateClientOpen] = useState(false);
    const [createClientFor, setCreateClientFor] = useState(null);

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
                        }
                    }));
                }
            })
            .catch(console.error)
            .finally(() => setProfileLoading(false));
    }, [open, isEditMode]);

    useEffect(() => {
        setLocalClients(clients);
    }, [clients]);

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
        }
    }, [open, shipmentToEdit, parcelTypes, storageConditions]);

    const fetchCalculatedPrice = useCallback(async () => {
        if (!formData.parcel.actualWeight || !formData.parcel.parcelTypeId || !formData.shipmentTypeId) return;
        try {
            const calculationRequest = {
                contentDescription: formData.parcel.contentDescription,
                actualWeight: parseFloat(formData.parcel.actualWeight),
                declaredValue: parseFloat(formData.parcel.declaredValue) || 0,
                parcelTypeId: formData.parcel.parcelTypeId,
                storageConditionIds: formData.parcel.storageConditionIds ?? [],
                boxVariantId: formData.box.useBox ? formData.box.boxVariantId : null,
                shipmentTypeId: formData.shipmentTypeId,
                originCityId: formData.origin.cityId,
                destinationCityId: formData.destination.cityId
            };
            const response = await DictionaryApi.calculatePrices(calculationRequest);
            setFormData(prev => ({ ...prev, price: response.data }));
        } catch (error) {
            console.error("Помилка тарифікації", error);
        }
    }, [formData.parcel, formData.box, formData.shipmentTypeId, formData.origin.cityId, formData.destination.cityId]);

    useEffect(() => {
        if (activeStep === 2) fetchCalculatedPrice();
    }, [activeStep, fetchCalculatedPrice]);

    const STEP1_FIELDS = ['shipmentTypeId', 'originCityId', 'destinationCityId', 'senderId', 'recipientId'];

    const handleNext = async () => {
        setFieldErrors({});

        if (activeStep === 0) {
            try {
                const req = {
                    actualWeight: formData.parcel.actualWeight ? parseFloat(formData.parcel.actualWeight) : null,
                    declaredValue: formData.parcel.declaredValue ? parseFloat(formData.parcel.declaredValue) : null,
                    contentDescription: formData.parcel.contentDescription || null,
                    parcelTypeId: formData.parcel.parcelTypeId,
                    storageConditionIds: formData.parcel.storageConditionIds ?? [],
                    boxVariantId: formData.box.useBox ? formData.box.boxVariantId : null,
                    shipmentTypeId: formData.shipmentTypeId || null,
                    originCityId: formData.origin.cityId || null,
                    destinationCityId: formData.destination.cityId || null,
                };
                await DictionaryApi.calculatePrices(req);
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
            if (!formData.senderId) errors['senderId'] = 'Оберіть відправника';
            if (!formData.recipientId) errors['recipientId'] = 'Оберіть отримувача';
            if (!formData.shipmentTypeId) errors['shipmentTypeId'] = 'Оберіть тип доставки';
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
            const complexData = {
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
                    apartmentNumber: parseInt(formData.origin.apartmentNumber) || null
                },
                destination: {
                    type: formData.destination.type.toUpperCase(),
                    deliveryPointId: formData.destination.deliveryPointId,
                    cityId: formData.destination.cityId,
                    streetId: formData.destination.streetId,
                    houseNumber: formData.destination.houseNumber,
                    apartmentNumber: parseInt(formData.destination.apartmentNumber) || null
                },
                isSenderPay: formData.senderPay,
                isPartiallyPaid: formData.partiallyPaid && !formData.fullyPaid,
                partialAmount: formData.partiallyPaid && !formData.fullyPaid ? parseFloat(formData.partialAmount) : null,
                isFullyPaid: formData.fullyPaid,
                paymentTypeId: formData.paymentTypeId,
                boxVariantId: formData.box.useBox ? formData.box.boxVariantId : null,
                calculatedPrice: formData.price
            };

            if (isEditMode) {
                await DictionaryApi.update('shipments', shipmentToEdit.id, complexData);
                onSuccess("ТТН оновлено успішно!");
            } else {
                await DictionaryApi.create('shipments', complexData);
                onSuccess("ТТН створено успішно!");
            }
            onClose();
        } catch (error) {
            if (error.response?.data?.validationErrors) {
                setFieldErrors(error.response.data.validationErrors);
            }
        }
    };

    const isBoxSuitable = (box, weight) => {
        const w = parseFloat(weight) || 0;
        if (w === 0) return true;
        const maxW = parseFloat(box.maxWeight);
        return isNaN(maxW) || w <= maxW;
    };

    const getOptimalBoxId = (weight) => {
        const w = parseFloat(weight) || 0;
        if (w === 0) return null;
        const suitable = boxVariants.filter(b => isBoxSuitable(b, weight) && b.maxWeight != null);
        if (suitable.length === 0) return null;
        return suitable.reduce((best, b) =>
            parseFloat(b.maxWeight) < parseFloat(best.maxWeight) ? b : best
        ).id;
    };

    const handleBoxListboxOpen = useCallback(() => {
        const optimalId = getOptimalBoxId(formData.parcel.actualWeight);
        if (!optimalId) return;
        setTimeout(() => {
            const optimalEl = document.querySelector(`[data-optimal-box="true"]`);
            if (optimalEl) optimalEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 100);
    }, [formData.parcel.actualWeight, boxVariants]);

    const addClientButton = (forRole) => (
        <Tooltip title="Створити нового клієнта">
            <IconButton
                size="small"
                onClick={() => { setCreateClientFor(forRole); setCreateClientOpen(true); }}
                sx={{
                    mt: 0.5, flexShrink: 0,
                    color: mainColor,
                    bgcolor: alpha(mainColor, 0.08),
                    border: `1px solid ${alpha(mainColor, 0.2)}`,
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: alpha(mainColor, 0.15) }
                }}
            >
                <PersonAdd fontSize="small" />
            </IconButton>
        </Tooltip>
    );

    const steps = [{ label: 'Посилка', icon: 1 }, { label: 'Маршрут', icon: 2 }, { label: 'Вартість', icon: 3 }];
    const variants = {
        enter: (d) => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d) => ({ x: d < 0 ? 100 : -100, opacity: 0 })
    };

    const selectedParcelType = parcelTypes.find(p => p.id === formData.parcel.parcelTypeId) ?? null;
    const selectedStorageConditions = storageConditions.filter(sc => formData.parcel.storageConditionIds.includes(sc.id));
    const selectedBoxVariant = boxVariants.find(b => b.id === formData.box.boxVariantId) ?? null;
    const selectedSender = localClients.find(c => c.id === formData.senderId) ?? null;
    const selectedRecipient = localClients.find(c => c.id === formData.recipientId) ?? null;
    const selectedShipmentType = shipmentTypes.find(t => t.id === formData.shipmentTypeId) ?? null;
    const selectedPaymentType = paymentTypes.find(p => p.id === formData.paymentTypeId) ?? null;

    const clientOptionLabel = (o) => {
        const name = o.fullName || `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim();
        return name + (o.phoneNumber ? ` (${o.phoneNumber})` : '');
    };

    const originLocked = !isEditMode && !profileLoading && employeeProfile !== null;

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
                <Box sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    borderRadius: '16px 16px 0 0'
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
                        {steps.map((s) => (
                            <Step key={s.label}>
                                <StepLabel StepIconComponent={(p) => <ColorlibStepIcon {...p} mainColor={mainColor} />}>
                                    {s.label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <AnimatePresence mode="wait" custom={direction}>
                        {activeStep === 0 && (
                            <motion.div key="s0" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase' }}>
                                        <Inventory sx={{ color: mainColor, fontSize: 18 }} /> Параметри посилки
                                    </Typography>

                                    <TextField
                                        label="Опис вмісту" fullWidth multiline rows={2}
                                        value={formData.parcel.contentDescription}
                                        onChange={(e) => {
                                            setFormData({ ...formData, parcel: { ...formData.parcel, contentDescription: e.target.value } });
                                            setFieldErrors(prev => ({ ...prev, 'parcel.contentDescription': null }));
                                        }}
                                        error={!!fieldErrors['parcel.contentDescription']}
                                        helperText={fieldErrors['parcel.contentDescription']}
                                    />

                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Вага (кг)" fullWidth type="number"
                                                value={formData.parcel.actualWeight}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, parcel: { ...formData.parcel, actualWeight: e.target.value } });
                                                    setFieldErrors(prev => ({ ...prev, 'parcel.actualWeight': null }));
                                                }}
                                                error={!!fieldErrors['parcel.actualWeight']}
                                                helperText={fieldErrors['parcel.actualWeight']}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Оголошена вартість" fullWidth type="number"
                                                value={formData.parcel.declaredValue}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, parcel: { ...formData.parcel, declaredValue: e.target.value } });
                                                    setFieldErrors(prev => ({ ...prev, 'parcel.declaredValue': null }));
                                                }}
                                                error={!!fieldErrors['parcel.declaredValue']}
                                                helperText={fieldErrors['parcel.declaredValue']}
                                            />
                                        </Grid>
                                    </Grid>

                                    <Autocomplete
                                        options={parcelTypes}
                                        value={selectedParcelType}
                                        getOptionLabel={(o) => o.name || ''}
                                        onChange={(_, v) => {
                                            setFormData({ ...formData, parcel: { ...formData.parcel, parcelTypeId: v?.id ?? null } });
                                            setFieldErrors(prev => ({ ...prev, 'parcel.parcelTypeId': null }));
                                        }}
                                        renderInput={(p) => (
                                            <TextField {...p} label="Тип посилки"
                                                error={!!fieldErrors['parcel.parcelTypeId']}
                                                helperText={fieldErrors['parcel.parcelTypeId']}
                                            />
                                        )}
                                    />

                                    <Autocomplete
                                        multiple
                                        options={storageConditions}
                                        value={selectedStorageConditions}
                                        getOptionLabel={(o) => o.name || ''}
                                        onChange={(_, v) => {
                                            setFormData({ ...formData, parcel: { ...formData.parcel, storageConditionIds: v.map(i => i.id) } });
                                            setFieldErrors(prev => ({ ...prev, 'parcel.storageConditionIds': null }));
                                        }}
                                        renderInput={(p) => (
                                            <TextField {...p} label="Умови зберігання"
                                                error={!!fieldErrors['parcel.storageConditionIds']}
                                                helperText={fieldErrors['parcel.storageConditionIds']}
                                            />
                                        )}
                                        renderTags={(val, getTagProps) => val.map((opt, idx) => (
                                            <Chip label={opt.name} {...getTagProps({ idx })} size="small"
                                                sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700 }} key={opt.id} />
                                        ))}
                                    />

                                    <Box sx={{
                                        mt: 1, p: 2, borderRadius: 2,
                                        bgcolor: formData.box.useBox ? alpha(mainColor, 0.03) : 'transparent',
                                        border: formData.box.useBox ? `1px dashed ${mainColor}` : '1px solid #eee'
                                    }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox sx={{ '&.Mui-checked': { color: mainColor } }}
                                                    checked={formData.box.useBox}
                                                    onChange={(e) => setFormData({ ...formData, box: { ...formData.box, useBox: e.target.checked, boxVariantId: null } })}
                                                />
                                            }
                                            label="Потрібна коробка"
                                        />
                                        {formData.box.useBox && (
                                            <Autocomplete
                                                sx={{ mt: 2 }}
                                                options={boxVariants}
                                                value={selectedBoxVariant}
                                                getOptionLabel={(o) => `${o.boxTypeName} ${o.name} - ${o.price} ₴`}
                                                getOptionKey={(o) => o.id}
                                                getOptionDisabled={(o) => !isBoxSuitable(o, formData.parcel.actualWeight)}
                                                onOpen={handleBoxListboxOpen}
                                                ListboxProps={{ ref: listboxRef }}
                                                onChange={(_, v) => {
                                                    setFormData({ ...formData, box: { ...formData.box, boxVariantId: v?.id ?? null } });
                                                    setFieldErrors(prev => ({ ...prev, 'box.boxVariantId': null }));
                                                }}
                                                renderOption={({ key, ...props }, o) => {
                                                    const suitable = isBoxSuitable(o, formData.parcel.actualWeight);
                                                    const optimalId = getOptimalBoxId(formData.parcel.actualWeight);
                                                    const isOptimal = suitable && o.id === optimalId;
                                                    return (
                                                        <li key={key} {...props}
                                                            data-optimal-box={isOptimal ? "true" : undefined}
                                                            style={{
                                                                borderLeft: isOptimal ? '3px solid #4caf50' : '3px solid transparent',
                                                                backgroundColor: isOptimal ? 'rgba(76, 175, 80, 0.1)' : undefined,
                                                            }}
                                                        >
                                                            <Box sx={{ width: '100%' }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <Typography variant="body2" fontWeight={600}
                                                                        color={suitable ? (isOptimal ? '#2e7d32' : 'text.primary') : 'text.disabled'}>
                                                                        {o.boxTypeName} {o.name} — {o.price} ₴
                                                                        {isOptimal && (
                                                                            <Chip label="Оптимально" size="small"
                                                                                sx={{ ml: 1, height: 18, fontSize: 10, fontWeight: 800, bgcolor: '#4caf50', color: 'white', '& .MuiChip-label': { px: 0.75 } }}
                                                                            />
                                                                        )}
                                                                    </Typography>
                                                                    {!suitable && (
                                                                        <Typography variant="caption" color="error" sx={{ ml: 1, fontSize: 10 }}>
                                                                            {o.weightCategoryName ?? `макс. ${o.maxWeight} кг`}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {o.width} × {o.length} × {o.height} см
                                                                    {o.weightCategoryName ? ` · ${o.weightCategoryName}` : o.maxWeight != null ? ` · до ${o.maxWeight} кг` : ''}
                                                                </Typography>
                                                            </Box>
                                                        </li>
                                                    );
                                                }}
                                                renderInput={(p) => (
                                                    <TextField {...p} label="Розмір коробки" size="small"
                                                        error={!!fieldErrors['box.boxVariantId']}
                                                        helperText={fieldErrors['box.boxVariantId'] || (parseFloat(formData.parcel.actualWeight) > 0 ? 'Недоступні коробки перевищені за допустимою вагою' : 'Введіть вагу для фільтрації підходящих коробок')}
                                                    />
                                                )}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </motion.div>
                        )}

                        {activeStep === 1 && (
                            <motion.div key="s1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase' }}>
                                        <Person sx={{ color: mainColor, fontSize: 18 }} /> Учасники та тип доставки
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start', flex: '1 1 260px', minWidth: 0 }}>
                                            <Autocomplete
                                                fullWidth
                                                options={localClients}
                                                value={selectedSender}
                                                getOptionLabel={clientOptionLabel}
                                                onChange={(_, v) => {
                                                    setFormData({ ...formData, senderId: v?.id ?? null });
                                                    setFieldErrors(prev => ({ ...prev, senderId: null }));
                                                }}
                                                renderInput={(p) => (
                                                    <TextField {...p} label="Відправник" size="small"
                                                        error={!!fieldErrors.senderId}
                                                        helperText={fieldErrors.senderId}
                                                    />
                                                )}
                                            />
                                            {addClientButton('sender')}
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start', flex: '1 1 260px', minWidth: 0 }}>
                                            <Autocomplete
                                                fullWidth
                                                options={localClients}
                                                value={selectedRecipient}
                                                getOptionLabel={clientOptionLabel}
                                                onChange={(_, v) => {
                                                    setFormData({ ...formData, recipientId: v?.id ?? null });
                                                    setFieldErrors(prev => ({ ...prev, recipientId: null }));
                                                }}
                                                renderInput={(p) => (
                                                    <TextField {...p} label="Отримувач" size="small"
                                                        error={!!fieldErrors.recipientId}
                                                        helperText={fieldErrors.recipientId}
                                                    />
                                                )}
                                            />
                                            {addClientButton('recipient')}
                                        </Box>

                                        <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
                                            <Autocomplete
                                                fullWidth
                                                options={shipmentTypes}
                                                value={selectedShipmentType}
                                                getOptionLabel={(o) => o.name || ''}
                                                onChange={(_, v) => {
                                                    setFormData({ ...formData, shipmentTypeId: v?.id ?? null });
                                                    setFieldErrors(prev => ({ ...prev, shipmentTypeId: null }));
                                                }}
                                                renderInput={(p) => (
                                                    <TextField {...p} label="Тип доставки" size="small"
                                                        error={!!fieldErrors.shipmentTypeId}
                                                        helperText={fieldErrors.shipmentTypeId}
                                                    />
                                                )}
                                            />
                                        </Box>
                                    </Box>

                                    <Divider />

                                    <DeliveryPointSelector
                                        point={formData.origin}
                                        label="Звідки"
                                        locked={originLocked}
                                        lockedLabel={employeeProfile?.branch?.name}
                                        onChange={(v) => setFormData({ ...formData, origin: v })}
                                        errors={{ cityId: fieldErrors['origin.cityId'], deliveryPointId: fieldErrors['origin.deliveryPointId'] }}
                                        onClearError={() => setFieldErrors(prev => ({ ...prev, 'origin.cityId': null, 'origin.deliveryPointId': null }))}
                                    />

                                    <DeliveryPointSelector
                                        point={formData.destination}
                                        label="Куди"
                                        onChange={(v) => setFormData({ ...formData, destination: v })}
                                        errors={{ cityId: fieldErrors['destination.cityId'], deliveryPointId: fieldErrors['destination.deliveryPointId'] }}
                                        onClearError={() => setFieldErrors(prev => ({ ...prev, 'destination.cityId': null, 'destination.deliveryPointId': null }))}
                                    />
                                </Box>
                            </motion.div>
                        )}

                        {activeStep === 2 && (
                            <motion.div key="s2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase' }}>
                                        <Calculate sx={{ color: mainColor, fontSize: 18 }} /> Розрахунок вартості
                                    </Typography>

                                    <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#fafafa' }}>
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Доставка:</Typography><Typography fontWeight="700">{formData.price.deliveryPrice.toFixed(2)} ₴</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">За вагу:</Typography><Typography fontWeight="700">{formData.price.weightPrice.toFixed(2)} ₴</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Коробка:</Typography><Typography fontWeight="700">{formData.price.boxVariantPrice.toFixed(2)} ₴</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Страховка:</Typography><Typography fontWeight="700">{formData.price.insuranceFee.toFixed(2)} ₴</Typography></Grid>
                                            </Grid>
                                            <Divider sx={{ my: 2 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="h6" fontWeight="700">РАЗОМ:</Typography>
                                                <Typography variant="h5" sx={{ color: mainColor, fontWeight: 900 }}>{formData.price.totalPrice.toFixed(2)} ₴</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    <Box sx={{
                                        p: 1.5, borderRadius: 2,
                                        bgcolor: alpha('#607d8b', 0.05),
                                        border: `1px solid ${alpha('#607d8b', 0.15)}`,
                                    }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}
                                            sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                            Як розраховується вартість
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {[
                                                { label: 'Базовий тариф', value: `${formData.price.deliveryPrice.toFixed(2)} ₴`, hint: 'Стандарт — 60 ₴, Експрес — 85 ₴' },
                                                { label: 'За вагу', value: `${formData.price.weightPrice.toFixed(2)} ₴`, hint: `${formData.parcel.actualWeight} кг × 3.5 ₴` },
                                                { label: 'За відстань', value: `${formData.price.distancePrice.toFixed(2)} ₴`, hint: 'Відстань × 0.8 ₴/км (макс. 500 ₴)' },
                                                { label: 'Коробка', value: `${formData.price.boxVariantPrice.toFixed(2)} ₴`, hint: 'Вартість обраної коробки' },
                                                { label: 'Спец. пакування', value: `${formData.price.specialPackagingPrice.toFixed(2)} ₴`, hint: 'Надбавка за умови зберігання — 45 ₴' },
                                                { label: 'Страховий збір', value: `${formData.price.insuranceFee.toFixed(2)} ₴`, hint: `${formData.parcel.declaredValue} × 0.5% (мін. 5 ₴)` },
                                            ].map(({ label, value, hint }) => (
                                                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="caption" fontWeight={600} color="text.primary">{label}</Typography>
                                                        <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>{hint}</Typography>
                                                    </Box>
                                                    <Typography variant="caption" fontWeight={700}>{value}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>

                                    <RadioGroup row value={formData.senderPay ? 'sender' : 'recipient'}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            senderPay: e.target.value === 'sender',
                                            fullyPaid: false,
                                            partiallyPaid: false,
                                            partialAmount: '',
                                            paymentTypeId: e.target.value === 'recipient' ? null : prev.paymentTypeId,
                                        }))}>
                                        <FormControlLabel value="sender" control={<Radio sx={{ color: mainColor }} />} label="Оплачує відправник" />
                                        <FormControlLabel value="recipient" control={<Radio sx={{ color: mainColor }} />} label="Оплачує отримувач" />
                                    </RadioGroup>

                                    {(formData.senderPay || formData.partiallyPaid) && (
                                        <Autocomplete
                                            options={paymentTypes}
                                            value={selectedPaymentType}
                                            getOptionLabel={(o) => o.name || ''}
                                            onChange={(_, v) => {
                                                setFormData(prev => ({ ...prev, paymentTypeId: v?.id ?? null }));
                                                setFieldErrors(prev => ({ ...prev, paymentTypeId: null }));
                                            }}
                                            renderInput={(p) => (
                                                <TextField {...p} label="Спосіб оплати"
                                                    error={!!fieldErrors.paymentTypeId}
                                                    helperText={fieldErrors.paymentTypeId}
                                                    InputProps={{
                                                        ...p.InputProps,
                                                        startAdornment: <CreditCard sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} />,
                                                    }}
                                                />
                                            )}
                                        />
                                    )}

                                    <Box sx={{
                                        p: 2, borderRadius: 2,
                                        border: `1px solid ${alpha(mainColor, 0.2)}`,
                                        bgcolor: alpha(mainColor, 0.02),
                                    }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}
                                            sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                            Статус оплати
                                        </Typography>

                                        {formData.senderPay && (
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        sx={{ color: '#4caf50', '&.Mui-checked': { color: '#4caf50' } }}
                                                        checked={formData.fullyPaid}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            fullyPaid: e.target.checked,
                                                            partiallyPaid: e.target.checked ? false : prev.partiallyPaid,
                                                            partialAmount: e.target.checked ? '' : prev.partialAmount,
                                                        }))}
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <Typography variant="body2" fontWeight={600} color={formData.fullyPaid ? '#2e7d32' : 'text.primary'}>
                                                            Повністю оплачено
                                                        </Typography>
                                                        {formData.fullyPaid && (
                                                            <Chip label={`${formData.price.totalPrice.toFixed(2)} ₴`} size="small"
                                                                sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: alpha('#4caf50', 0.1), color: '#2e7d32' }} />
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        )}

                                        {!formData.fullyPaid && (
                                            <FormControlLabel
                                                sx={{ mt: formData.senderPay ? 0.5 : 0 }}
                                                control={
                                                    <Checkbox
                                                        sx={{ color: mainColor, '&.Mui-checked': { color: mainColor } }}
                                                        checked={formData.partiallyPaid}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            partiallyPaid: e.target.checked,
                                                            partialAmount: e.target.checked ? prev.partialAmount : '',
                                                        }))}
                                                    />
                                                }
                                                label="Часткова оплата"
                                            />
                                        )}

                                        <Collapse in={formData.partiallyPaid && !formData.fullyPaid}>
                                            <Box sx={{ mt: 1.5, pl: 1 }}>
                                                <TextField fullWidth size="small" type="number"
                                                    label="Сума авансу"
                                                    value={formData.partialAmount}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, partialAmount: e.target.value }))}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <AccountBalanceWallet sx={{ fontSize: 18, color: mainColor }} />
                                                                <Typography sx={{ ml: 0.5 }}>₴</Typography>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                />
                                                {formData.partialAmount && formData.price.totalPrice > 0 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                        Залишок: {(formData.price.totalPrice - parseFloat(formData.partialAmount || 0)).toFixed(2)} ₴
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
                    <Button onClick={onClose}>Скасувати</Button>
                    <Box sx={{ flexGrow: 1 }} />
                    {activeStep > 0 && <Button onClick={handleBack}>Назад</Button>}
                    {activeStep < 2 ? (
                        <Button variant="contained" onClick={handleNext} sx={{ bgcolor: mainColor }}>Далі</Button>
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