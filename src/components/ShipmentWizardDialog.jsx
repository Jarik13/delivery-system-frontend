import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, 
    Typography, Button, Stepper, Step, StepLabel, Grid, Autocomplete, 
    Divider, FormControlLabel, Checkbox, Chip, Card, CardContent, 
    RadioGroup, Radio, InputAdornment, useTheme, alpha
} from '@mui/material';
import { 
    Inventory, Person, Calculate, CheckCircle, Receipt 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DeliveryPointSelector from './DeliveryPointSelector';
import { DictionaryApi } from '../api/dictionaries';

const steps = ['Посилка', 'Маршрут', 'Вартість'];

const ShipmentWizardDialog = ({ open, onClose, onSuccess, mainColor, references }) => {
    const { 
        statuses, clients, shipmentTypes, parcelTypes, 
        storageConditions, boxVariants 
    } = references;

    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        parcel: { declaredValue: '', actualWeight: '', contentDescription: '', parcelTypeId: null, storageConditionIds: [] },
        box: { useBox: false, boxVariantId: null },
        origin: { type: 'branch', branchId: null, postomatId: null, cityId: null, streetId: null, houseNumber: '', apartmentNumber: '', floor: '', entrance: '', intercom: '' },
        destination: { type: 'branch', branchId: null, postomatId: null, cityId: null, streetId: null, houseNumber: '', apartmentNumber: '', floor: '', entrance: '', intercom: '' },
        senderId: null, recipientId: null, shipmentTypeId: null, shipmentStatusId: null,
        price: { deliveryPrice: 0, weightPrice: 0, distancePrice: 0, boxVariantPrice: 0, specialPackagingPrice: 0, insuranceFee: 0, totalPrice: 0 },
        senderPay: true, partiallyPaid: false
    });

    const calculatePrice = useCallback(() => {
        const weight = parseFloat(formData.parcel.actualWeight) || 0;
        const declaredValue = parseFloat(formData.parcel.declaredValue) || 0;
        let deliveryPrice = 50;
        let weightPrice = weight > 5 ? (weight - 5) * 10 : 0;
        let boxVariantPrice = 0;
        let specialPackagingPrice = formData.parcel.storageConditionIds.length * 15;
        let insuranceFee = declaredValue * 0.01;

        if (formData.box.useBox && formData.box.boxVariantId) {
            const selectedBox = boxVariants.find(b => b.id === formData.box.boxVariantId);
            if (selectedBox) boxVariantPrice = selectedBox.price || 0;
        }
        const totalPrice = deliveryPrice + weightPrice + boxVariantPrice + specialPackagingPrice + insuranceFee;

        setFormData(prev => ({
            ...prev,
            price: { ...prev.price, deliveryPrice, weightPrice, boxVariantPrice, specialPackagingPrice, insuranceFee, totalPrice }
        }));
    }, [formData.parcel, formData.box, boxVariants]);

    useEffect(() => {
        if (activeStep === 2) calculatePrice();
    }, [activeStep, calculatePrice]);

    const handleSave = async () => {
        setFieldErrors({});
        try {
            let statusId = formData.shipmentStatusId || statuses.find(s => s.name === 'Створено')?.id;
            
            const shipmentData = {
                parcel: formData.parcel,
                price: formData.price,
                senderPay: formData.senderPay,
                partiallyPaid: formData.partiallyPaid,
                senderId: formData.senderId,
                recipientId: formData.recipientId,
                shipmentTypeId: formData.shipmentTypeId,
                shipmentStatusId: statusId,
                originDeliveryPoint: formData.origin.type !== 'address' ? { 
                    branchId: formData.origin.branchId, 
                    postomatId: formData.origin.postomatId 
                } : null,
                destinationDeliveryPoint: formData.destination.type !== 'address' ? { 
                    branchId: formData.destination.branchId, 
                    postomatId: formData.destination.postomatId 
                } : null,
                originAddress: formData.origin.type === 'address' ? formData.origin : null,
                destinationAddress: formData.destination.type === 'address' ? formData.destination : null,
                shipmentBox: formData.box.useBox ? { boxVariantId: formData.box.boxVariantId } : null
            };

            await DictionaryApi.create('shipments', shipmentData);
            onSuccess();
            onClose();
        } catch (error) {
            if (error.response?.data?.validationErrors) setFieldErrors(error.response.data.validationErrors);
        }
    };

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir < 0 ? 100 : -100, opacity: 0 }),
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4, maxHeight: '90vh' } }}>
            <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                <Receipt sx={{ color: mainColor, fontSize: 40, mb: 1 }} />
                <Typography variant="h5" fontWeight="700">Оформлення ТТН</Typography>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 3 }}>
                    {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                </Stepper>
            </DialogTitle>

            <DialogContent sx={{ minHeight: 450, overflowX: 'hidden' }}>
                <AnimatePresence mode="wait" custom={direction}>
                    {activeStep === 0 && (
                        <motion.div key="step0" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                                <Typography variant="subtitle2" color="primary" fontWeight="700">
                                    <Inventory sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} /> ПАРАМЕТРИ ПОСИЛКИ
                                </Typography>
                                <TextField label="Опис вмісту" fullWidth multiline rows={2} value={formData.parcel.contentDescription}
                                    onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, contentDescription: e.target.value}})}
                                    error={!!fieldErrors['parcel.contentDescription']} helperText={fieldErrors['parcel.contentDescription']}
                                />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField label="Вага (кг)" fullWidth type="number" value={formData.parcel.actualWeight}
                                            onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, actualWeight: e.target.value}})}
                                            InputProps={{ startAdornment: <InputAdornment position="start">⚖️</InputAdornment> }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Оголошена вартість" fullWidth type="number" value={formData.parcel.declaredValue}
                                            onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, declaredValue: e.target.value}})}
                                            InputProps={{ endAdornment: <InputAdornment position="end">₴</InputAdornment> }}
                                        />
                                    </Grid>
                                </Grid>
                                <Autocomplete options={parcelTypes} getOptionLabel={(o) => o.name || ''}
                                    onChange={(_, v) => setFormData({...formData, parcel: {...formData.parcel, parcelTypeId: v?.id}})}
                                    renderInput={(p) => <TextField {...p} label="Тип посилки" />}
                                />
                                <Autocomplete multiple options={storageConditions} getOptionLabel={(o) => o.name || ''}
                                    onChange={(_, v) => setFormData({...formData, parcel: {...formData.parcel, storageConditionIds: v.map(i => i.id)}})}
                                    renderInput={(p) => <TextField {...p} label="Умови зберігання" />}
                                    renderTags={(value, getTagProps) => value.map((option, index) => (
                                        <Chip label={option.name} {...getTagProps({ index })} size="small" color="primary" variant="outlined" />
                                    ))}
                                />
                                <Divider />
                                <FormControlLabel control={<Checkbox checked={formData.box.useBox} onChange={(e) => setFormData({...formData, box: {...formData.box, useBox: e.target.checked}})} />} label="Потрібна коробка" />
                                {formData.box.useBox && (
                                    <Autocomplete options={boxVariants} getOptionLabel={(o) => `${o.name} (${o.length}x${o.width}x${o.height}) - ${o.price} ₴`}
                                        onChange={(_, v) => setFormData({...formData, box: {...formData.box, boxVariantId: v?.id}})}
                                        renderInput={(p) => <TextField {...p} label="Розмір коробки" />}
                                    />
                                )}
                            </Box>
                        </motion.div>
                    )}

                    {activeStep === 1 && (
                        <motion.div key="step1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                                <Typography variant="subtitle2" color="primary" fontWeight="700">
                                    <Person sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} /> УЧАСНИКИ ТА МАРШРУТ
                                </Typography>
                                <Autocomplete options={clients} getOptionLabel={(o) => `${o.fullName} (${o.phoneNumber})`}
                                    onChange={(_, v) => setFormData({...formData, senderId: v?.id})}
                                    renderInput={(p) => <TextField {...p} label="Відправник" />}
                                />
                                <Autocomplete options={clients} getOptionLabel={(o) => `${o.fullName} (${o.phoneNumber})`}
                                    onChange={(_, v) => setFormData({...formData, recipientId: v?.id})}
                                    renderInput={(p) => <TextField {...p} label="Отримувач" />}
                                />
                                <Divider />
                                <DeliveryPointSelector point={formData.origin} label="ЗВІДКИ" onChange={(val) => setFormData({...formData, origin: val})} />
                                <Divider />
                                <DeliveryPointSelector point={formData.destination} label="КУДИ" onChange={(val) => setFormData({...formData, destination: val})} />
                                <Autocomplete options={shipmentTypes} getOptionLabel={(o) => o.name || ''}
                                    onChange={(_, v) => setFormData({...formData, shipmentTypeId: v?.id})}
                                    renderInput={(p) => <TextField {...p} label="Тип доставки" />}
                                />
                            </Box>
                        </motion.div>
                    )}

                    {activeStep === 2 && (
                        <motion.div key="step2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                                <Typography variant="subtitle2" color="primary" fontWeight="700">
                                    <Calculate sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} /> ПІДСУМОК
                                </Typography>
                                <Card variant="outlined" sx={{ bgcolor: alpha(mainColor, 0.02) }}>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}><Typography variant="caption">Базовий тариф:</Typography><Typography fontWeight="700">{formData.price.deliveryPrice} ₴</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="caption">За вагу:</Typography><Typography fontWeight="700">{formData.price.weightPrice} ₴</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="caption">Коробка:</Typography><Typography fontWeight="700">{formData.price.boxVariantPrice} ₴</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="caption">Страховка:</Typography><Typography fontWeight="700">{formData.price.insuranceFee} ₴</Typography></Grid>
                                        </Grid>
                                        <Divider sx={{ my: 2 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="h6" fontWeight="800">РАЗОМ:</Typography>
                                            <Typography variant="h6" color="primary" fontWeight="900">{formData.price.totalPrice.toFixed(2)} ₴</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                                <RadioGroup value={formData.senderPay ? 'sender' : 'recipient'} onChange={(e) => setFormData({...formData, senderPay: e.target.value === 'sender'})}>
                                    <FormControlLabel value="sender" control={<Radio />} label="Оплачує відправник" />
                                    <FormControlLabel value="recipient" control={<Radio />} label="Оплачує отримувач" />
                                </RadioGroup>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
                <Button onClick={onClose}>Скасувати</Button>
                <Box sx={{ flexGrow: 1 }} />
                {activeStep > 0 && <Button onClick={() => { setDirection(-1); setActiveStep(activeStep - 1); }}>Назад</Button>}
                {activeStep < steps.length - 1 ? (
                    <Button variant="contained" onClick={() => { setDirection(1); setActiveStep(activeStep + 1); }}>Далі</Button>
                ) : (
                    <Button variant="contained" color="success" onClick={handleSave} startIcon={<CheckCircle />}>Оформити</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ShipmentWizardDialog;