import React, { useState } from 'react';
import {
    Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Chip, Grid, Divider,
    Stepper, Step, StepLabel, Checkbox, FormControlLabel, Autocomplete,
    InputAdornment, alpha, MenuItem, Select, FormControl, InputLabel,
    Card, CardContent, IconButton, StepConnector, stepConnectorClasses, styled
} from '@mui/material';
import {
    Add, LocalShipping, Receipt, Inventory2, 
    People, AttachMoney, ChevronRight, ChevronLeft, Save,
    Scale, ConfirmationNumber, LocalAtm, Description,
    LocationOn, Security, InfoOutlined
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// --- СТИЛІЗОВАНИЙ STEPPER (ЯК У PREMIUM APPS) ---
const QontoConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 10, left: 'calc(-50% + 16px)', right: 'calc(50% + 16px)' },
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#eaeaf0', borderTopWidth: 3, borderRadius: 1 },
}));

// --- ХАРДКОДНІ ДАНІ ---
const MOCK_SHIPMENTS = [
    {
        id: 1, trackingNumber: "TTN-240501", createdAt: "2024-05-01T12:00:00",
        parcelDescription: "iPhone 15 Pro Max, 256GB", actualWeight: 0.5, declaredValue: 55000,
        totalPrice: 150.00, senderFullName: "Олександр Коваль", recipientFullName: "Вікторія Шпак",
        shipmentTypeName: "Express", shipmentStatusName: "В дорозі"
    }
];

const ShipmentsPage = () => {
    const mainColor = '#673ab7';
    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    const [formData, setFormData] = useState({
        parcel: { declaredValue: '', actualWeight: '', contentDescription: '', parcelTypeId: '', storageConditionIds: [] },
        price: { delivery: 0, weight: 0, distance: 0, boxVariant: 0, specialPackaging: 0, insuranceFee: 0, total: 0 },
        isSenderPay: true, isPartiallyPaid: false, senderId: '', recipientId: '', shipmentTypeId: '', shipmentStatusId: 1
    });

    const updatePrice = (field, val) => {
        const p = { ...formData.price, [field]: parseFloat(val) || 0 };
        const total = p.delivery + p.weight + p.distance + p.boxVariant + p.specialPackaging + p.insuranceFee;
        setFormData({ ...formData, price: { ...p, total } });
    };

    const renderStep = (step) => {
        const variants = {
            initial: { opacity: 0, scale: 0.98, y: 10 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 1.02, y: -10 }
        };

        switch (step) {
            case 0: return (
                <motion.div key="s1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                    <Box sx={{ bgcolor: alpha(mainColor, 0.03), p: 3, borderRadius: 6, border: '1px solid', borderColor: alpha(mainColor, 0.1) }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Inventory2 sx={{ color: mainColor }} /> Вміст відправлення
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField 
                                    label="Детальний опис товару" multiline rows={2} fullWidth variant="standard"
                                    placeholder="Що саме всередині пакунка?"
                                    value={formData.parcel.contentDescription}
                                    onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, contentDescription: e.target.value}})}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField 
                                    label="Вага вантажу" fullWidth type="number"
                                    InputProps={{ endAdornment: <InputAdornment position="end">кг</InputAdornment>, startAdornment: <Scale sx={{ mr: 1, color: alpha(mainColor, 0.4) }} /> }}
                                    value={formData.parcel.actualWeight} onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, actualWeight: e.target.value}})}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField 
                                    label="Оголошена цінність" fullWidth type="number"
                                    InputProps={{ endAdornment: <InputAdornment position="end">₴</InputAdornment>, startAdornment: <Security sx={{ mr: 1, color: alpha(mainColor, 0.4) }} /> }}
                                    value={formData.parcel.declaredValue} onChange={(e) => setFormData({...formData, parcel: {...formData.parcel, declaredValue: e.target.value}})}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </motion.div>
            );
            case 1: return (
                <motion.div key="s2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, textAlign: 'center' }}>Розрахунок вартості</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={8}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                {[
                                    { f: 'delivery', l: 'Тариф', i: <LocalShipping fontSize="small"/> },
                                    { f: 'weight', l: 'Вага', i: <Scale fontSize="small"/> },
                                    { f: 'distance', l: 'Дистанція', i: <LocationOn fontSize="small"/> },
                                    { f: 'insuranceFee', l: 'Страховка', i: <Security fontSize="small"/> },
                                    { f: 'boxVariant', l: 'Коробка', i: <Inventory2 fontSize="small"/> },
                                    { f: 'specialPackaging', l: 'Спец. пак', i: <InfoOutlined fontSize="small"/> }
                                ].map((item) => (
                                    <TextField 
                                        key={item.f} label={item.l} type="number" size="small"
                                        InputProps={{ startAdornment: <InputAdornment position="start">{item.i}</InputAdornment> }}
                                        value={formData.price[item.f]} onChange={(e) => updatePrice(item.f, e.target.value)}
                                    />
                                ))}
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: '#212121', color: 'white', borderRadius: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ opacity: 0.6, letterSpacing: 1 }}>РАЗОМ ДО ОПЛАТИ</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>{formData.price.total.toFixed(0)} <small style={{fontSize: 14}}>₴</small></Typography>
                                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />
                                <FormControlLabel 
                                    control={<Checkbox size="small" sx={{ color: 'white' }} checked={formData.isSenderPay} onChange={(e) => setFormData({...formData, isSenderPay: e.target.checked})} />} 
                                    label={<Typography variant="caption">Відправник платить</Typography>} 
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </motion.div>
            );
            case 2: return (
                <motion.div key="s3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 6, position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: -12, left: 24, bgcolor: 'white', px: 1 }}><Chip label="Відправник" size="small" color="primary" /></Box>
                            <Autocomplete options={[]} renderInput={(p) => <TextField {...p} placeholder="Почніть вводити ПІБ або телефон..." variant="standard" />} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}><IconButton sx={{ bgcolor: '#f5f5f5' }}><ChevronRight sx={{ transform: 'rotate(90deg)' }} /></IconButton></Box>
                        <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 6, position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: -12, left: 24, bgcolor: 'white', px: 1 }}><Chip label="Отримувач" size="small" color="secondary" /></Box>
                            <Autocomplete options={[]} renderInput={(p) => <TextField {...p} placeholder="Кому доставити?" variant="standard" />} />
                        </Box>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                                <FormControl fullWidth variant="filled">
                                    <InputLabel>Тип доставки</InputLabel>
                                    <Select value={formData.shipmentTypeId} onChange={(e) => setFormData({...formData, shipmentTypeId: e.target.value})}>
                                        <MenuItem value={1}>Стандартна</MenuItem>
                                        <MenuItem value={2}>Експрес (Авіа)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth variant="filled">
                                    <InputLabel>Статус</InputLabel>
                                    <Select value={formData.shipmentStatusId} onChange={(e) => setFormData({...formData, shipmentStatusId: e.target.value})}>
                                        <MenuItem value={1}>Нове відправлення</MenuItem>
                                        <MenuItem value={2}>В дорозі</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                </motion.div>
            );
            default: return null;
        }
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#f0f2f5', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h3" fontWeight="900" sx={{ color: '#1a237e', mb: 1, letterSpacing: -1 }}>Shipments</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label="Активні: 12" size="small" sx={{ bgcolor: 'white', fontWeight: 'bold' }} />
                        <Chip label="Сьогодні: +3" size="small" sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 'bold' }} />
                    </Box>
                </Box>
                <Button 
                    variant="contained" size="large" 
                    sx={{ bgcolor: mainColor, px: 5, py: 2, borderRadius: 5, fontWeight: 800, textTransform: 'none', boxShadow: `0 20px 40px ${alpha(mainColor, 0.3)}` }} 
                    startIcon={<Add />} onClick={() => { setOpen(true); setActiveStep(0); }}
                >
                    Створити ТТН
                </Button>
            </Box>

            {/* List */}
            <Grid container spacing={4}>
                {MOCK_SHIPMENTS.map((s) => (
                    <Grid item xs={12} md={6} key={s.id}>
                        <Card sx={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', transition: '0.4s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 30px 60px rgba(0,0,0,0.08)' } }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                    <Typography variant="h6" fontWeight="900">{s.trackingNumber}</Typography>
                                    <Chip label={s.shipmentStatusName} sx={{ fontWeight: 800, borderRadius: 2 }} color="primary" />
                                </Box>
                                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>{s.parcelDescription}</Typography>
                                <Divider sx={{ mb: 3, opacity: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>ОДЕРЖУВАЧ</Typography>
                                        <Typography variant="subtitle1" fontWeight="bold">{s.recipientFullName}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h4" fontWeight="900" color="primary">{s.totalPrice} ₴</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modern Wizard Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 10, p: 2, boxShadow: '0 50px 100px rgba(0,0,0,0.2)' } }}>
                <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
                    <Typography variant="h4" fontWeight="900" sx={{ mb: 1 }}>Нова ТТН</Typography>
                    <Stepper activeStep={activeStep} alternativeLabel connector={<QontoConnector />} sx={{ mt: 3, mb: 2 }}>
                        {['Параметри', 'Фінанси', 'Логістика'].map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
                    </Stepper>
                </DialogTitle>
                <DialogContent sx={{ minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                        {renderStep(activeStep)}
                    </AnimatePresence>
                </DialogContent>
                <DialogActions sx={{ p: 4, justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: 'text.disabled', fontWeight: 900 }}>Скасувати</Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {activeStep > 0 && <Button onClick={() => setActiveStep(s => s - 1)} sx={{ color: mainColor, fontWeight: 800 }}>Назад</Button>}
                        {activeStep < 2 ? (
                            <Button variant="contained" onClick={() => setActiveStep(s => s + 1)} sx={{ bgcolor: mainColor, borderRadius: 4, px: 5, py: 1.5, fontWeight: 900 }}>Далі</Button>
                        ) : (
                            <Button variant="contained" color="success" onClick={() => setOpen(false)} sx={{ borderRadius: 4, px: 5, py: 1.5, fontWeight: 900 }}>Підтвердити</Button>
                        )}
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ShipmentsPage;