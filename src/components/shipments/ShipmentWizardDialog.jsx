import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogActions, TextField, Box,
    Typography, Button, Stepper, Step, StepLabel, Grid, Autocomplete,
    Divider, FormControlLabel, Checkbox, Chip, Card, CardContent,
    RadioGroup, Radio, InputAdornment, alpha
} from '@mui/material';
import {
    Inventory, Person, Calculate, CheckCircle,
    LocalShipping, Payments, AccountBalanceWallet
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DeliveryPointSelector from './DeliveryPointSelector';
import { DictionaryApi } from '../../api/dictionaries';

const ColorlibStepIcon = (props) => {
    const { active, completed, icon, mainColor } = props;
    const icons = { 1: <Inventory fontSize="small" />, 2: <LocalShipping fontSize="small" />, 3: <Payments fontSize="small" /> };
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
    senderPay: true, partiallyPaid: false, partialAmount: ''
};

const ShipmentWizardDialog = ({ open, onClose, onSuccess, mainColor, references }) => {
    const { clients, shipmentTypes, parcelTypes, storageConditions, boxVariants } = references;
    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (!open) {
            setActiveStep(0);
            setFormData(initialFormData);
            setFieldErrors({});
        }
    }, [open]);

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
        if (activeStep === 2) {
            fetchCalculatedPrice();
        }
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
                    const step0Errors = Object.entries(serverErrors).filter(
                        ([key]) => !STEP1_FIELDS.includes(key)
                    );

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
            if (!formData.origin.cityId) errors['origin.cityId'] = 'Оберіть місто відправлення';
            if (!formData.origin.deliveryPointId && formData.origin.type !== 'address') errors['origin.deliveryPointId'] = 'Оберіть пункт відправлення';
            if (!formData.destination.cityId) errors['destination.cityId'] = 'Оберіть місто призначення';
            if (!formData.destination.deliveryPointId && formData.destination.type !== 'address') errors['destination.deliveryPointId'] = 'Оберіть пункт призначення';

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return;
            }
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
                    streetId: formData.origin.streetId,
                    houseNumber: formData.origin.houseNumber,
                    apartmentNumber: parseInt(formData.origin.apartmentNumber) || null
                },
                destination: {
                    type: formData.destination.type.toUpperCase(),
                    deliveryPointId: formData.destination.deliveryPointId,
                    streetId: formData.destination.streetId,
                    houseNumber: formData.destination.houseNumber,
                    apartmentNumber: parseInt(formData.destination.apartmentNumber) || null
                },
                isSenderPay: formData.senderPay,
                isPartiallyPaid: formData.partiallyPaid,
                partialAmount: formData.partiallyPaid ? parseFloat(formData.partialAmount) : null,
                boxVariantId: formData.box.useBox ? formData.box.boxVariantId : null,
                calculatedPrice: formData.price
            };

            await DictionaryApi.create('shipments', complexData);
            onSuccess("ТТН створено успішно!");
            onClose();
        } catch (error) {
            if (error.response?.data?.validationErrors) {
                setFieldErrors(error.response.data.validationErrors);
            }
        }
    };

    const steps = [{ label: 'Посилка', icon: 1 }, { label: 'Маршрут', icon: 2 }, { label: 'Вартість', icon: 3 }];
    const variants = { enter: (d) => ({ x: d > 0 ? 100 : -100, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d < 0 ? 100 : -100, opacity: 0 }) };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
            <Box sx={{
                p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                borderRadius: '16px 16px 0 0'
            }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px', display: 'flex' }}>
                    <LocalShipping sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Нове відправлення</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Заповніть всі кроки для оформлення ТТН</Typography>
                </Box>
            </Box>

            <DialogContent sx={{ minHeight: 480, pt: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
                    {steps.map((s) => (
                        <Step key={s.label}>
                            <StepLabel StepIconComponent={(p) => <ColorlibStepIcon {...p} mainColor={mainColor} />}>{s.label}</StepLabel>
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
                                            getOptionLabel={(o) => `${o.boxTypeName} ${o.name} - ${o.price} ₴`}
                                            onChange={(_, v) => {
                                                setFormData({ ...formData, box: { ...formData.box, boxVariantId: v?.id ?? null } });
                                                setFieldErrors(prev => ({ ...prev, 'box.boxVariantId': null }));
                                            }}
                                            renderOption={(props, o) => (
                                                <Box component="li" {...props}>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {o.boxTypeName} {o.name} — {o.price} ₴
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {o.width} × {o.length} × {o.height} см
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={(p) => (
                                                <TextField {...p} label="Розмір коробки" size="small"
                                                    error={!!fieldErrors['box.boxVariantId']}
                                                    helperText={fieldErrors['box.boxVariantId']}
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
                                <Grid container spacing={2}>
                                    <Grid size={4}>
                                        <Autocomplete
                                            fullWidth options={clients}
                                            getOptionLabel={(o) => {
                                                const name = o.fullName || `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim();
                                                return name + (o.phoneNumber ? ` (${o.phoneNumber})` : '');
                                            }}
                                            onChange={(_, v) => {
                                                setFormData({ ...formData, senderId: v?.id });
                                                setFieldErrors(prev => ({ ...prev, senderId: null }));
                                            }}
                                            renderInput={(p) => (
                                                <TextField {...p} label="Відправник" size="small"
                                                    error={!!fieldErrors.senderId}
                                                    helperText={fieldErrors.senderId}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={4}>
                                        <Autocomplete
                                            fullWidth options={clients}
                                            getOptionLabel={(o) => {
                                                const name = o.fullName || `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim();
                                                return name + (o.phoneNumber ? ` (${o.phoneNumber})` : '');
                                            }}
                                            onChange={(_, v) => {
                                                setFormData({ ...formData, recipientId: v?.id });
                                                setFieldErrors(prev => ({ ...prev, recipientId: null }));
                                            }}
                                            renderInput={(p) => (
                                                <TextField {...p} label="Отримувач" size="small"
                                                    error={!!fieldErrors.recipientId}
                                                    helperText={fieldErrors.recipientId}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={4}>
                                        <Autocomplete
                                            fullWidth options={shipmentTypes}
                                            getOptionLabel={(o) => o.name || ''}
                                            onChange={(_, v) => {
                                                setFormData({ ...formData, shipmentTypeId: v?.id });
                                                setFieldErrors(prev => ({ ...prev, shipmentTypeId: null }));
                                            }}
                                            renderInput={(p) => (
                                                <TextField {...p} label="Тип доставки" size="small"
                                                    error={!!fieldErrors.shipmentTypeId}
                                                    helperText={fieldErrors.shipmentTypeId}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                                <Divider />
                                <DeliveryPointSelector
                                    point={formData.origin} label="Звідки"
                                    onChange={(v) => setFormData({ ...formData, origin: v })}
                                    errors={{
                                        cityId: fieldErrors['origin.cityId'],
                                        deliveryPointId: fieldErrors['origin.deliveryPointId']
                                    }}
                                    onClearError={() => setFieldErrors(prev => ({ ...prev, 'origin.cityId': null, 'origin.deliveryPointId': null }))}
                                />
                                <DeliveryPointSelector
                                    point={formData.destination} label="Куди"
                                    onChange={(v) => setFormData({ ...formData, destination: v })}
                                    errors={{
                                        cityId: fieldErrors['destination.cityId'],
                                        deliveryPointId: fieldErrors['destination.deliveryPointId']
                                    }}
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
                                <RadioGroup row value={formData.senderPay ? 'sender' : 'recipient'} onChange={(e) => setFormData({ ...formData, senderPay: e.target.value === 'sender' })}>
                                    <FormControlLabel value="sender" control={<Radio sx={{ color: mainColor }} />} label="Оплачує відправник" />
                                    <FormControlLabel value="recipient" control={<Radio sx={{ color: mainColor }} />} label="Оплачує отримувач" />
                                </RadioGroup>
                                <FormControlLabel control={<Checkbox sx={{ color: mainColor }} checked={formData.partiallyPaid} onChange={(e) => setFormData({ ...formData, partiallyPaid: e.target.checked })} />} label="Часткова оплата" />
                                <AnimatePresence>{formData.partiallyPaid && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                        <Box sx={{ p: 2, mt: 1, border: `1px dashed ${mainColor}`, borderRadius: 2, bgcolor: alpha(mainColor, 0.03) }}>
                                            <Typography variant="subtitle2" sx={{ color: mainColor, mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><AccountBalanceWallet fontSize="small" /> Сума авансу</Typography>
                                            <TextField fullWidth size="small" type="number" value={formData.partialAmount} onChange={(e) => setFormData({ ...formData, partialAmount: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">₴</InputAdornment> }} />
                                        </Box>
                                    </motion.div>
                                )}</AnimatePresence>
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
                    <Button variant="contained" color="success" onClick={handleSave} startIcon={<CheckCircle />}>
                        Оформити ТТН
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ShipmentWizardDialog;