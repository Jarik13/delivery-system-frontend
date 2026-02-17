import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogActions, TextField, Box, 
    Typography, Button, Stepper, Step, StepLabel, Grid, Autocomplete, 
    Divider, FormControlLabel, Checkbox, Chip, Card, CardContent, 
    RadioGroup, Radio, InputAdornment, alpha
} from '@mui/material';
import { 
    Inventory, Person, Calculate, CheckCircle, 
    LocalShipping, ChevronRight, ChevronLeft, Payments 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DeliveryPointSelector from './DeliveryPointSelector';
import { DictionaryApi } from '../api/dictionaries';

const ColorlibStepIcon = (props) => {
    const { active, completed, icon, mainColor } = props;
    const icons = {
        1: <Inventory fontSize="small" />,
        2: <LocalShipping fontSize="small" />,
        3: <Payments fontSize="small" />,
    };

    return (
        <Box sx={{
            bgcolor: active || completed ? mainColor : '#eee',
            color: active || completed ? 'white' : '#999',
            width: 32,
            height: 32,
            display: 'flex',
            borderRadius: '50%',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.3s ease'
        }}>
            {icons[String(icon)]}
        </Box>
    );
};

const ShipmentWizardDialog = ({ open, onClose, onSuccess, mainColor, references }) => {
    const { statuses, clients, shipmentTypes, parcelTypes, storageConditions, boxVariants } = references;

    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        parcel: { declaredValue: '', actualWeight: '', contentDescription: '', parcelTypeId: null, storageConditionIds: [] },
        box: { useBox: false, boxVariantId: null },
        origin: { type: 'branch', branchId: null, postomatId: null, cityId: null, streetId: null, houseNumber: '', apartmentNumber: '' },
        destination: { type: 'branch', branchId: null, postomatId: null, cityId: null, streetId: null, houseNumber: '', apartmentNumber: '' },
        senderId: null, recipientId: null, shipmentTypeId: null, shipmentStatusId: null,
        price: { deliveryPrice: 0, weightPrice: 0, distancePrice: 0, boxVariantPrice: 0, specialPackagingPrice: 0, insuranceFee: 0, totalPrice: 0 },
        senderPay: true, partiallyPaid: false
    });

    const calculatePrice = useCallback(() => {
        const weight = parseFloat(formData.parcel.actualWeight) || 0;
        const declaredValue = parseFloat(formData.parcel.declaredValue) || 0;
        
        // Базова логіка розрахунку (можна коригувати залежно від типу доставки)
        let deliveryPrice = 50;
        let weightPrice = weight > 5 ? (weight - 5) * 10 : 0;
        let boxVariantPrice = 0;
        let insuranceFee = declaredValue * 0.01;

        if (formData.box.useBox && formData.box.boxVariantId) {
            const selectedBox = boxVariants.find(b => b.id === formData.box.boxVariantId);
            if (selectedBox) boxVariantPrice = selectedBox.price || 0;
        }

        // Якщо обрано специфічний тип доставки, можна додати логіку зміни ціни тут
        if (formData.shipmentTypeId) {
            const type = shipmentTypes.find(t => t.id === formData.shipmentTypeId);
            if (type?.name?.toLowerCase().includes('експрес')) deliveryPrice += 30;
        }

        const totalPrice = deliveryPrice + weightPrice + boxVariantPrice + insuranceFee;

        setFormData(prev => ({
            ...prev,
            price: { ...prev.price, deliveryPrice, weightPrice, boxVariantPrice, insuranceFee, totalPrice }
        }));
    }, [formData.parcel, formData.box, formData.shipmentTypeId, boxVariants, shipmentTypes]);

    useEffect(() => {
        if (activeStep === 2) calculatePrice();
    }, [activeStep, calculatePrice]);

    const handleSave = async () => {
        try {
            let statusId = formData.shipmentStatusId || statuses.find(s => s.name === 'Створено')?.id;
            await DictionaryApi.create('shipments', { ...formData, shipmentStatusId: statusId });
            onSuccess("ТТН створено!");
            onClose();
        } catch (error) {
            if (error.response?.data?.validationErrors) setFieldErrors(error.response.data.validationErrors);
        }
    };

    const steps = [
        { label: 'Посилка', icon: 1 },
        { label: 'Маршрут', icon: 2 },
        { label: 'Вартість', icon: 3 }
    ];

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir < 0 ? 100 : -100, opacity: 0 }),
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                <LocalShipping sx={{ color: mainColor, fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    Нове відправлення
                </Typography>
            </Box>

            <DialogContent sx={{ minHeight: 480, pt: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
                    {steps.map((step) => (
                        <Step key={step.label}>
                            <StepLabel StepIconComponent={(p) => <ColorlibStepIcon {...p} mainColor={mainColor} />}>
                                {step.label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <AnimatePresence mode="wait" custom={direction}>
                    {activeStep === 0 && (
                        <motion.div key="step0" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    <Inventory sx={{ color: mainColor, fontSize: 18 }} /> Параметри посилки
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
                                        <Chip label={option.name} {...getTagProps({ index })} size="small" sx={{ bgcolor: alpha(mainColor, 0.08), color: mainColor, fontWeight: 700 }} />
                                    ))}
                                />
                                <FormControlLabel control={<Checkbox sx={{ '&.Mui-checked': { color: mainColor } }} checked={formData.box.useBox} onChange={(e) => setFormData({...formData, box: {...formData.box, useBox: e.target.checked}})} />} label="Потрібна коробка" />
                                {formData.box.useBox && (
                                    <Autocomplete options={boxVariants} getOptionLabel={(o) => `${o.boxTypeName || 'Коробка'} (${o.length}x${o.width}x${o.height} см) - ${o.price} ₴`}
                                        onChange={(_, v) => setFormData({...formData, box: {...formData.box, boxVariantId: v?.id}})}
                                        renderInput={(p) => <TextField {...p} label="Розмір коробки" />}
                                    />
                                )}
                            </Box>
                        </motion.div>
                    )}

                    {activeStep === 1 && (
                        <motion.div key="step1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase' }}>
                                    <Person sx={{ color: mainColor, fontSize: 18 }} /> Учасники та маршрут
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
                                <DeliveryPointSelector point={formData.origin} label="Звідки" onChange={(val) => setFormData({...formData, origin: val})} />
                                <DeliveryPointSelector point={formData.destination} label="Куди" onChange={(val) => setFormData({...formData, destination: val})} />
                                
                                {/* ТИП ВІДПРАВЛЕННЯ (Експрес / Стандарт тощо) */}
                                <Autocomplete 
                                    options={shipmentTypes} 
                                    getOptionLabel={(o) => o.name || ''}
                                    value={shipmentTypes.find(t => t.id === formData.shipmentTypeId) || null}
                                    onChange={(_, v) => setFormData({...formData, shipmentTypeId: v?.id})}
                                    renderInput={(p) => <TextField {...p} label="Тип доставки" />}
                                />
                            </Box>
                        </motion.div>
                    )}

                    {activeStep === 2 && (
                        <motion.div key="step2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase' }}>
                                    <Calculate sx={{ color: mainColor, fontSize: 18 }} /> Розрахунок вартості
                                </Typography>
                                <Card variant="outlined" sx={{ border: `1px solid #eee`, bgcolor: '#fafafa', borderRadius: 3 }}>
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

                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>Хто оплачує:</Typography>
                                    <RadioGroup row value={formData.senderPay ? 'sender' : 'recipient'} onChange={(e) => setFormData({...formData, senderPay: e.target.value === 'sender'})}>
                                        <FormControlLabel value="sender" control={<Radio sx={{ color: mainColor, '&.Mui-checked': { color: mainColor } }} />} label="Відправник" />
                                        <FormControlLabel value="recipient" control={<Radio sx={{ color: mainColor, '&.Mui-checked': { color: mainColor } }} />} label="Отримувач" />
                                    </RadioGroup>
                                </Box>

                                {/* ЧАСТКОВА ОПЛАТА */}
                                <FormControlLabel 
                                    control={
                                        <Checkbox 
                                            sx={{ '&.Mui-checked': { color: mainColor } }} 
                                            checked={formData.partiallyPaid} 
                                            onChange={(e) => setFormData({...formData, partiallyPaid: e.target.checked})} 
                                        />
                                    } 
                                    label="Дозволити часткову оплату (кредит / аванс)" 
                                />
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
                <Button onClick={onClose} sx={{ color: '#666', fontWeight: 700 }}>Скасувати</Button>
                <Box sx={{ flexGrow: 1 }} />
                {activeStep > 0 && (
                    <Button startIcon={<ChevronLeft />} onClick={() => { setDirection(-1); setActiveStep(activeStep - 1); }} sx={{ fontWeight: 700, color: mainColor }}>
                        Назад
                    </Button>
                )}
                {activeStep < steps.length - 1 ? (
                    <Button variant="contained" endIcon={<ChevronRight />} onClick={() => { setDirection(1); setActiveStep(activeStep + 1); }} 
                        sx={{ bgcolor: mainColor, '&:hover': { bgcolor: mainColor, filter: 'brightness(0.9)' }, fontWeight: 700, borderRadius: 2, px: 3 }}>
                        Далі
                    </Button>
                ) : (
                    <Button variant="contained" color="success" onClick={handleSave} startIcon={<CheckCircle />}
                        sx={{ fontWeight: 700, borderRadius: 2, px: 4 }}>
                        Оформити ТТН
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ShipmentWizardDialog;