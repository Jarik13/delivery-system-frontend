import React, { useState } from 'react';
import {
    Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Chip, Grid, Card, CardContent, Divider,
    Stepper, Step, StepLabel, Autocomplete, InputAdornment, alpha, 
    MenuItem, Select, FormControl, InputLabel, useTheme, Checkbox, FormControlLabel
} from '@mui/material';
import {
    Add, Edit, Delete, LocalShipping, ConfirmationNumber, 
    CalendarToday, TripOrigin, LocationOn, Inventory2, 
    AttachMoney, Scale, Receipt, ChevronRight, ChevronLeft, Save
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// --- МАКЕТНІ ДАНІ ДЛЯ СПИСКУ ---
const MOCK_SHIPMENTS = [
    {
        id: 1, 
        trackingNumber: "UA-9876543210", 
        createdAt: "2024-02-07T10:30:00",
        parcelDescription: "Кавомашина DeLonghi (крихке)",
        actualWeight: 8.4, 
        totalPrice: 285,
        fromLocation: "Київ, Відділення №1",
        toLocation: "Львів, Відділення №24",
        senderFullName: "Олександр Коваль",
        recipientFullName: "Вікторія Шпак",
        shipmentTypeName: "Експрес",
        shipmentStatusName: "В дорозі"
    },
    {
        id: 2, 
        trackingNumber: "UA-1122334455", 
        createdAt: "2024-02-08T14:20:00",
        parcelDescription: "Набір документів А4",
        actualWeight: 0.5, 
        totalPrice: 95,
        fromLocation: "Одеса, Поштомат №102",
        toLocation: "Дніпро, Відділення №3",
        senderFullName: "Сидоренко Ганна",
        recipientFullName: "Мельник Олег",
        shipmentTypeName: "Стандарт",
        shipmentStatusName: "Доставлено"
    }
];

const steps = ['Вантаж', 'Фінанси', 'Логістика'];

const ShipmentsPage = () => {
    const theme = useTheme();
    const mainColor = '#673ab7'; // Logistics Purple

    // Стейт списку та діалогу
    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [shipments] = useState(MOCK_SHIPMENTS);

    // Стейт форми (повна структура сутностей)
    const [formData, setFormData] = useState({
        parcel: { contentDescription: '', actualWeight: '', declaredValue: '', parcelTypeId: '' },
        price: { delivery: 0, weight: 0, distance: 0, insuranceFee: 0, total: 0 },
        isSenderPay: true,
        isPartiallyPaid: false,
        senderId: null,
        recipientId: null,
        shipmentTypeId: '',
        shipmentStatusId: 1
    });

    // --- ОБРОБНИКИ КНОПОК ---
    const handleNext = () => {
        setDirection(1);
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setDirection(-1);
        setActiveStep((prev) => prev - 1);
    };

    const handleOpen = () => {
        setFormData({
            parcel: { contentDescription: '', actualWeight: '', declaredValue: '', parcelTypeId: '' },
            price: { delivery: 0, weight: 0, distance: 0, insuranceFee: 0, total: 0 },
            isSenderPay: true, isPartiallyPaid: false, senderId: null, recipientId: null, shipmentTypeId: '', shipmentStatusId: 1
        });
        setActiveStep(0);
        setOpen(true);
    };

    const handlePriceChange = (field, val) => {
        const p = { ...formData.price, [field]: parseFloat(val) || 0 };
        const total = p.delivery + p.weight + p.distance + p.insuranceFee;
        setFormData({ ...formData, price: { ...p, total } });
    };

    // --- АНІМАЦІЯ КРОКІВ ---
    const stepVariants = {
        enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir < 0 ? 100 : -100, opacity: 0 }),
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0: // КРОК 1: PARCEL
                return (
                    <Box component={motion.div} key="s1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Опис вмісту" fullWidth multiline rows={2} value={formData.parcel.contentDescription} onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, contentDescription: e.target.value}})} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Вага (кг)" fullWidth type="number" InputProps={{ startAdornment: <Scale fontSize="small" sx={{ mr: 1 }} /> }} value={formData.parcel.actualWeight} onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, actualWeight: e.target.value}})} />
                            <TextField label="Цінність (₴)" fullWidth type="number" InputProps={{ startAdornment: <AttachMoney fontSize="small" sx={{ mr: 1 }} /> }} value={formData.parcel.declaredValue} onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, declaredValue: e.target.value}})} />
                        </Box>
                    </Box>
                );
            case 1: // КРОК 2: PRICE
                return (
                    <Box component={motion.div} key="s2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            {['delivery', 'weight', 'distance', 'insuranceFee'].map((f) => (
                                <Grid item xs={6} key={f}>
                                    <TextField label={f === 'delivery' ? 'Тариф' : f === 'weight' ? 'За вагу' : f === 'distance' ? 'Відстань' : 'Страховка'} fullWidth type="number" size="small" value={formData.price[f]} onChange={(e) => handlePriceChange(f, e.target.value)} />
                                </Grid>
                            ))}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: alpha(mainColor, 0.05), borderRadius: 3, textAlign: 'center', border: `1px dashed ${mainColor}` }}>
                                    <Typography variant="h5" fontWeight="900" color="primary">{formData.price.total.toFixed(2)} ₴</Typography>
                                    <Typography variant="caption">Загальна вартість ТТН</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
                                <FormControlLabel control={<Checkbox checked={formData.isSenderPay} onChange={(e) => setFormData({...formData, isSenderPay: e.target.checked})} />} label="Оплачує відправник" />
                                <FormControlLabel control={<Checkbox checked={formData.isPartiallyPaid} onChange={(e) => setFormData({...formData, isPartiallyPaid: e.target.checked})} />} label="Часткова оплата" />
                            </Grid>
                        </Grid>
                    </Box>
                );
            case 2: // КРОК 3: SHIPMENT
                return (
                    <Box component={motion.div} key="s3" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Autocomplete options={[]} renderInput={(p) => <TextField {...p} label="Відправник (Пошук)" />} />
                        <Autocomplete options={[]} renderInput={(p) => <TextField {...p} label="Отримувач (Пошук)" />} />
                        <Divider />
                        <FormControl fullWidth>
                            <InputLabel>Тип доставки</InputLabel>
                            <Select value={formData.shipmentTypeId} label="Тип доставки" onChange={(e) => setFormData({...formData, shipmentTypeId: e.target.value})}>
                                <MenuItem value={1}>Стандарт</MenuItem>
                                <MenuItem value={2}>Експрес</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                );
            default: return null;
        }
    };

    return (
        <Box sx={{ p: 2, pt: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 2.5, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.8)} 100%)`,
                color: 'white', borderRadius: 4, boxShadow: `0 8px 24px ${alpha(mainColor, 0.25)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocalShipping fontSize="large" />
                    <Typography variant="h6" fontWeight="900">Відправлення</Typography>
                </Box>
                <Button variant="contained" sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold' }} startIcon={<Add />} onClick={handleOpen}>
                    Створити ТТН
                </Button>
            </Paper>

            {/* Shipments Grid */}
            <Grid container spacing={3}>
                {shipments.map((s) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={s.id} sx={{ display: 'flex' }}>
                        <Card sx={{
                            width: '100%', borderRadius: 5, border: '1px solid #eee', transition: '0.3s',
                            display: 'flex', flexDirection: 'column',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 12px 30px ${alpha(mainColor, 0.15)}`, borderColor: mainColor }
                        }} elevation={0}>
                            <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Chip icon={<ConfirmationNumber sx={{ fontSize: 14 }} />} label={s.trackingNumber} size="small" sx={{ fontWeight: 800, bgcolor: alpha(mainColor, 0.1), color: mainColor }} />
                                    <Box>
                                        <IconButton size="small" color="primary"><Edit fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error"><Delete fontSize="small" /></IconButton>
                                    </Box>
                                </Box>

                                <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2, lineHeight: 1.2, minHeight: '2.8rem' }}>
                                    {s.parcelDescription}
                                </Typography>

                                <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

                                {/* Візуальний маршрут */}
                                <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                                        <TripOrigin sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                                        <Box sx={{ width: '2px', flexGrow: 1, my: 0.5, background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, opacity: 0.3 }} />
                                        <LocationOn sx={{ fontSize: 14, color: theme.palette.secondary.main }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Звідки:</Typography>
                                            <Typography variant="body2" fontWeight="700" noWrap>{s.fromLocation}</Typography>
                                            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>{s.senderFullName}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Куди:</Typography>
                                            <Typography variant="body2" fontWeight="700" noWrap>{s.toLocation}</Typography>
                                            <Typography variant="caption" sx={{ color: theme.palette.secondary.main, fontWeight: 700 }}>{s.recipientFullName}</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                        <CalendarToday sx={{ fontSize: 14 }} /> {new Date(s.createdAt).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="h6" fontWeight="900" color="primary">{s.totalPrice} ₴</Typography>
                                </Box>
                                
                                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip label={s.shipmentStatusName} size="small" variant="outlined" sx={{ fontSize: 10, fontWeight: 800, color: mainColor, borderColor: mainColor }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>{s.actualWeight} кг</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Wizard Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
                <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                    <Receipt sx={{ color: mainColor, fontSize: 40, mb: 1 }} />
                    <Typography variant="h5" fontWeight="900">Оформлення ТТН</Typography>
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 3 }}>
                        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                    </Stepper>
                </DialogTitle>
                <DialogContent sx={{ minHeight: 380, overflowX: 'hidden' }}>
                    <AnimatePresence mode="wait" custom={direction}>
                        {renderStepContent(activeStep)}
                    </AnimatePresence>
                </DialogContent>
                <DialogActions sx={{ p: 4, justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpen(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Скасувати</Button>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {activeStep > 0 && <Button onClick={handleBack} startIcon={<ChevronLeft />} sx={{ fontWeight: 'bold' }}>Назад</Button>}
                        {activeStep < 2 ? (
                            <Button variant="contained" onClick={handleNext} endIcon={<ChevronRight />} sx={{ bgcolor: mainColor, px: 4, fontWeight: 'bold' }}>Далі</Button>
                        ) : (
                            <Button variant="contained" color="success" onClick={() => setOpen(false)} startIcon={<Save />} sx={{ px: 4, fontWeight: 'bold' }}>Оформити</Button>
                        )}
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ShipmentsPage;