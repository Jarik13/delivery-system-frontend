import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogActions, TextField, Box,
    Typography, Button, Stepper, Step, StepLabel, Grid, Autocomplete,
    Divider, FormControlLabel, Checkbox, Chip, Card, CardContent,
    RadioGroup, Radio, InputAdornment, alpha
} from '@mui/material';
import {
    Inventory, Person, Calculate, CheckCircle,
    LocalShipping, ChevronRight, ChevronLeft, Payments, AccountBalanceWallet
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DeliveryPointSelector from './DeliveryPointSelector';
import { DictionaryApi } from '../api/dictionaries';

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
                actualWeight: parseFloat(formData.parcel.actualWeight),
                declaredValue: parseFloat(formData.parcel.declaredValue) || 0,
                parcelTypeId: formData.parcel.parcelTypeId,
                storageConditionIds: formData.parcel.storageConditionIds,
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
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                <LocalShipping sx={{ color: mainColor, fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Нове відправлення</Typography>
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
                                <TextField label="Опис вмісту" fullWidth multiline rows={2} value={formData.parcel.contentDescription} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, contentDescription: e.target.value } })} />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}><TextField label="Вага (кг)" fullWidth type="number" value={formData.parcel.actualWeight} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, actualWeight: e.target.value } })} /></Grid>
                                    <Grid item xs={6}><TextField label="Оголошена вартість" fullWidth type="number" value={formData.parcel.declaredValue} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, declaredValue: e.target.value } })} /></Grid>
                                </Grid>
                                <Autocomplete options={parcelTypes} getOptionLabel={(o) => o.name || ''} onChange={(_, v) => setFormData({ ...formData, parcel: { ...formData.parcel, parcelTypeId: v?.id } })} renderInput={(p) => <TextField {...p} label="Тип посилки" />} />
                                <Autocomplete multiple options={storageConditions} getOptionLabel={(o) => o.name || ''} onChange={(_, v) => setFormData({ ...formData, parcel: { ...formData.parcel, storageConditionIds: v.map(i => i.id) } })}
                                    renderInput={(p) => <TextField {...p} label="Умови зберігання" />} renderTags={(val, getTagProps) => val.map((opt, idx) => <Chip label={opt.name} {...getTagProps({ idx })} size="small" sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700 }} key={opt.id} />)} />
                                <Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: formData.box.useBox ? alpha(mainColor, 0.03) : 'transparent', border: formData.box.useBox ? `1px dashed ${mainColor}` : '1px solid #eee' }}>
                                    <FormControlLabel control={<Checkbox sx={{ '&.Mui-checked': { color: mainColor } }} checked={formData.box.useBox} onChange={(e) => setFormData({ ...formData, box: { ...formData.box, useBox: e.target.checked } })} />} label="Потрібна коробка" />
                                    {formData.box.useBox && <Autocomplete sx={{ mt: 2 }} options={boxVariants} getOptionLabel={(o) => `${o.boxTypeName || 'Коробка'} - ${o.price} ₴`} onChange={(_, v) => setFormData({ ...formData, box: { ...formData.box, boxVariantId: v?.id } })} renderInput={(p) => <TextField {...p} label="Розмір коробки" size="small" />} />}
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
                                            fullWidth
                                            options={clients}
                                            getOptionLabel={(o) => {
                                                const name = o.fullName || `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim();
                                                const phone = o.phoneNumber ? ` (${o.phoneNumber})` : '';
                                                return name + phone || '';
                                            }}
                                            onChange={(_, v) => setFormData({ ...formData, senderId: v?.id })}
                                            renderInput={(p) => (
                                                <TextField {...p} label="Відправник" size="small" />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={4}>
                                        <Autocomplete
                                            fullWidth
                                            options={clients}
                                            getOptionLabel={(o) => {
                                                const name = o.fullName || `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim();
                                                const phone = o.phoneNumber ? ` (${o.phoneNumber})` : '';
                                                return name + phone || '';
                                            }}
                                            onChange={(_, v) => setFormData({ ...formData, recipientId: v?.id })}
                                            renderInput={(p) => (
                                                <TextField {...p} label="Отримувач" size="small" />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={4}>
                                        <Autocomplete
                                            fullWidth
                                            options={shipmentTypes}
                                            getOptionLabel={(o) => o.name || ''}
                                            onChange={(_, v) => setFormData({ ...formData, shipmentTypeId: v?.id })}
                                            renderInput={(p) => (
                                                <TextField {...p} label="Тип доставки" size="small" />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                                <Divider />
                                <DeliveryPointSelector point={formData.origin} label="Звідки" onChange={(v) => setFormData({ ...formData, origin: v })} />
                                <DeliveryPointSelector point={formData.destination} label="Куди" onChange={(v) => setFormData({ ...formData, destination: v })} />
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
                {activeStep > 0 && <Button onClick={() => setActiveStep(activeStep - 1)}>Назад</Button>}
                {activeStep < 2 ? (
                    <Button variant="contained" onClick={() => setActiveStep(activeStep + 1)} sx={{ bgcolor: mainColor }}>Далі</Button>
                ) : (
                    <Button variant="contained" color="success" onClick={handleSave} startIcon={<CheckCircle />}>Оформити ТТН</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ShipmentWizardDialog;