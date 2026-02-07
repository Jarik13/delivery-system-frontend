import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, Chip, TablePagination,
    useTheme, alpha, MenuItem, Select, FormControl, InputLabel, Autocomplete,
    Grid, Card, CardContent, Divider, Stepper, Step, StepLabel,
    Checkbox, FormControlLabel
} from '@mui/material';
import {
    Add, Delete, LocalShipping, ConfirmationNumber,
    CalendarToday, TripOrigin, LocationOn, Scale, AttachMoney,
    Receipt, ChevronRight, ChevronLeft, Save
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const steps = ['Вантаж', 'Фінанси', 'Логістика'];

const ShipmentsPage = () => {
    const theme = useTheme();
    const groupName = ITEM_GROUP_MAP['shipments'] || 'Керування логістикою';
    const mainColor = GROUP_COLORS[groupName] || '#673ab7';

    const [shipments, setShipments] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({ trackingNumber: '', shipmentStatusId: '' });

    const [statuses, setStatuses] = useState([]);
    const [clients, setClients] = useState([]);
    const [parcelTypes, setParcelTypes] = useState([]);
    const [shipmentTypes, setShipmentTypes] = useState([]);

    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        parcel: { contentDescription: '', actualWeight: '', declaredValue: '', parcelTypeId: '' },
        price: { delivery: 0, weight: 0, distance: 0, insuranceFee: 0, total: 0 },
        isSenderPay: true, isPartiallyPaid: false, senderId: null, recipientId: null,
        shipmentTypeId: '', shipmentStatusId: ''
    });

    useEffect(() => {
        const loadReferences = async () => {
            try {
                const [sRes, cRes, pRes, tRes] = await Promise.all([
                    DictionaryApi.getAll('shipment-statuses', 0, 100),
                    DictionaryApi.getAll('clients', 0, 1000),
                    DictionaryApi.getAll('parcel-types', 0, 100),
                    DictionaryApi.getAll('shipment-types', 0, 100)
                ]);
                setStatuses(sRes.data.content || []);
                setClients(cRes.data.content || []);
                setParcelTypes(pRes.data.content || []);
                setShipmentTypes(tRes.data.content || []);
            } catch (error) {
                console.error("Помилка завантаження довідників", error);
            }
        };
        loadReferences();
    }, []);

    const loadTableData = useCallback(async () => {
        try {
            const response = await DictionaryApi.getAll('shipments', page, rowsPerPage, filters);
            setShipments(response.data.content || []);
            setTotalElements(response.data.totalElements || 0);
        } catch (error) {
            setNotification({ open: true, message: 'Помилка завантаження даних', severity: 'error' });
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const timer = setTimeout(() => { loadTableData(); }, 400);
        return () => clearTimeout(timer);
    }, [loadTableData]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleOpenWizard = () => {
        setFieldErrors({});
        setFormData({
            parcel: { contentDescription: '', actualWeight: '', declaredValue: '', parcelTypeId: '' },
            price: { delivery: 0, weight: 0, distance: 0, insuranceFee: 0, total: 0 },
            isSenderPay: true, isPartiallyPaid: false, senderId: null, recipientId: null, shipmentTypeId: '', shipmentStatusId: ''
        });
        setActiveStep(0);
        setOpen(true);
    };

    const handleNext = () => {
        setDirection(1);
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setDirection(-1);
        setActiveStep((prev) => prev - 1);
    };

    const handlePriceChange = (field, val) => {
        const p = { ...formData.price, [field]: parseFloat(val) || 0 };
        const total = p.delivery + p.weight + p.distance + p.insuranceFee;
        setFormData({ ...formData, price: { ...p, total } });
    };

    const handleSaveShipment = async () => {
        setFieldErrors({});
        try {
            await DictionaryApi.create('shipments', formData);
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Відправлення успішно створено', severity: 'success' });
        } catch (error) {
            const serverData = error.response?.data;
            if (serverData?.validationErrors) setFieldErrors(serverData.validationErrors);
            setNotification({ open: true, message: serverData?.message || 'Помилка збереження', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити це відправлення?')) {
            try {
                await DictionaryApi.delete('shipments', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено успішно', severity: 'success' });
            } catch (error) {
                setNotification({ open: true, message: 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const renderStepContent = (step) => {
        const variants = {
            enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (dir) => ({ x: dir < 0 ? 100 : -100, opacity: 0 }),
        };

        switch (step) {
            case 0:
                return (
                    <Box component={motion.div} key="s1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Typography variant="subtitle2" color="primary" fontWeight="700">ФІЗИЧНІ ПАРАМЕТРИ</Typography>
                        <TextField label="Опис вмісту" fullWidth multiline rows={2} value={formData.parcel.contentDescription} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, contentDescription: e.target.value } })} error={!!fieldErrors['parcel.contentDescription']} helperText={fieldErrors['parcel.contentDescription']} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Вага (кг)" fullWidth type="number" InputProps={{ startAdornment: <Scale fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }} value={formData.parcel.actualWeight} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, actualWeight: e.target.value } })} error={!!fieldErrors['parcel.actualWeight']} helperText={fieldErrors['parcel.actualWeight']} />
                            <TextField label="Цінність (₴)" fullWidth type="number" InputProps={{ startAdornment: <AttachMoney fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }} value={formData.parcel.declaredValue} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, declaredValue: e.target.value } })} error={!!fieldErrors['parcel.declaredValue']} helperText={fieldErrors['parcel.declaredValue']} />
                        </Box>
                        <FormControl fullWidth size="small">
                            <InputLabel shrink>Тип вантажу</InputLabel>
                            <Select notched label="Тип вантажу" value={formData.parcel.parcelTypeId} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, parcelTypeId: e.target.value } })}>
                                {parcelTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                );
            case 1:
                return (
                    <Box component={motion.div} key="s2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2 }}>
                        <Typography variant="subtitle2" color="primary" fontWeight="700" sx={{ mb: 2 }}>ФІНАНСОВА ДЕТАЛІЗАЦІЯ</Typography>
                        <Grid container spacing={2}>
                            {['delivery', 'weight', 'distance', 'insuranceFee'].map((f) => (
                                <Grid item xs={6} key={f}>
                                    <TextField label={f === 'delivery' ? 'Тариф' : f === 'weight' ? 'Вага' : f === 'distance' ? 'Відстань' : 'Страховка'} fullWidth type="number" size="small" value={formData.price[f]} onChange={(e) => handlePriceChange(f, e.target.value)} />
                                </Grid>
                            ))}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: alpha(mainColor, 0.05), borderRadius: 3, textAlign: 'center', border: `1px dashed ${mainColor}` }}>
                                    <Typography variant="h5" fontWeight="700" color="primary">{formData.price.total.toFixed(2)} ₴</Typography>
                                    <Typography variant="caption" fontWeight="600" color="text.secondary">Підсумок до оплати</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                <FormControlLabel control={<Checkbox checked={formData.isSenderPay} onChange={(e) => setFormData({ ...formData, isSenderPay: e.target.checked })} />} label={<Typography variant="body2" fontWeight="600">Відправник платить</Typography>} />
                                <FormControlLabel control={<Checkbox checked={formData.isPartiallyPaid} onChange={(e) => setFormData({ ...formData, isPartiallyPaid: e.target.checked })} />} label={<Typography variant="body2" fontWeight="600">Часткова оплата</Typography>} />
                            </Grid>
                        </Grid>
                    </Box>
                );
            case 2:
                return (
                    <Box component={motion.div} key="s3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Typography variant="subtitle2" color="primary" fontWeight="700">УЧАСНИКИ ТА СЕРВІС</Typography>
                        <Autocomplete options={clients} getOptionLabel={(o) => o.fullName || ''} onChange={(_, v) => setFormData({ ...formData, senderId: v?.id })} renderInput={(p) => <TextField {...p} label="Відправник" error={!!fieldErrors.senderId} helperText={fieldErrors.senderId} />} />
                        <Autocomplete options={clients} getOptionLabel={(o) => o.fullName || ''} onChange={(_, v) => setFormData({ ...formData, recipientId: v?.id })} renderInput={(p) => <TextField {...p} label="Отримувач" error={!!fieldErrors.recipientId} helperText={fieldErrors.recipientId} />} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Тип доставки</InputLabel>
                                <Select notched label="Тип доставки" value={formData.shipmentTypeId} onChange={(e) => setFormData({ ...formData, shipmentTypeId: e.target.value })}>
                                    {shipmentTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Початковий статус</InputLabel>
                                <Select notched label="Початковий статус" value={formData.shipmentStatusId} onChange={(e) => setFormData({ ...formData, shipmentStatusId: e.target.value })}>
                                    {statuses.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                );
            default: return null;
        }
    };

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3, boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                        <LocalShipping fontSize="medium" color="inherit" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="700">Відправлення</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Керування накладними та маршрутами</Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained" size="small"
                    sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                    startIcon={<Add />} onClick={handleOpenWizard}
                >
                    Створити ТТН
                </Button>
            </Paper>

            <DataFilters filters={filters} onChange={handleFilterChange} onClear={() => setFilters({ trackingNumber: '', shipmentStatusId: '' })}
                fields={[
                    { name: 'trackingNumber', label: 'Трек-номер', type: 'text', md: 6 },
                    { name: 'shipmentStatusId', label: 'Статус', type: 'select', options: statuses, md: 6 },
                ]}
            />

            <Grid container spacing={3} sx={{ m: 0, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                {shipments.map((s) => (
                    <Grid item key={s.id} xs={12} sm={6} md={4} lg={3} xl={2.4} sx={{ display: 'flex', flexGrow: 1 }}>
                        <Card sx={{
                            width: '100%', borderRadius: 4, transition: 'all 0.3s ease', border: '1px solid', borderColor: 'divider',
                            display: 'flex', flexDirection: 'column',
                            '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 12px 24px ${alpha(mainColor, 0.15)}`, borderColor: mainColor }
                        }} elevation={0}>
                            <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                    <Chip
                                        icon={<ConfirmationNumber sx={{ fontSize: '14px !important' }} />}
                                        label={s.trackingNumber} size="small"
                                        sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.1), color: mainColor, borderRadius: 1.5 }}
                                    />
                                    <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}><Delete fontSize="small" /></IconButton>
                                </Box>

                                <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                                    {s.parcelDescription || 'Без опису'}
                                </Typography>

                                <Divider sx={{ mt: 0.5, mb: 1.5, opacity: 0.5, borderStyle: 'dashed' }} />

                                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.6 }}>
                                        <TripOrigin sx={{ fontSize: 10, color: theme.palette.primary.main }} />
                                        {/* Збільшив my до 0.8 для більшої висоти лінії */}
                                        <Box sx={{ width: '1px', flexGrow: 1, my: 0.8, borderLeft: '1px dashed #ccc' }} />
                                        <LocationOn sx={{ fontSize: 12, color: theme.palette.secondary.main }} />
                                    </Box>
                                    {/* Збільшив gap до 1.5, щоб пункти розійшлися, а лінія розтягнулася */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
                                        <Box sx={{ lineHeight: 1 }}>
                                            <Typography variant="body2" fontWeight="700" noWrap sx={{ lineHeight: 1.1 }}>
                                                {s.originLocationName || 'Забір вантажу'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ lineHeight: 1 }}>
                                                {s.senderFullName}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ lineHeight: 1 }}>
                                            <Typography variant="body2" fontWeight="700" noWrap sx={{ lineHeight: 1.1 }}>
                                                {s.destinationLocationName || 'Точка видачі'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ lineHeight: 1 }}>
                                                {s.recipientFullName}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                        <CalendarToday sx={{ fontSize: 14 }} />
                                        <Typography variant="caption" fontWeight="600">{new Date(s.createdAt).toLocaleDateString()}</Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight="700" color="success.main">{s.totalPrice} ₴</Typography>
                                </Box>

                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip label={s.shipmentStatusName} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>{s.actualWeight} кг</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', bgcolor: 'white', borderRadius: 2, p: 1 }}>
                <TablePagination component="div" count={totalElements} page={page} onPageChange={(e, n) => setPage(n)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage="Записів:" />
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ textAlign: 'center', pt: 4, borderBottom: '1px solid #eee' }}>
                    <Receipt sx={{ color: mainColor, fontSize: 35, mb: 1 }} />
                    <Typography variant="h6" fontWeight="700">Оформлення ТТН</Typography>
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 3 }}>
                        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                    </Stepper>
                </DialogTitle>
                <DialogContent sx={{ minHeight: 380, overflowX: 'hidden' }}>
                    <AnimatePresence mode="wait" custom={direction}>
                        {renderStepContent(activeStep)}
                    </AnimatePresence>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Скасувати</Button>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {activeStep > 0 && <Button onClick={handleBack} startIcon={<ChevronLeft />} sx={{ fontWeight: 'bold' }}>Назад</Button>}
                        {activeStep < 2 ? (
                            <Button variant="contained" onClick={handleNext} endIcon={<ChevronRight />} sx={{ bgcolor: mainColor, px: 4, fontWeight: 'bold' }}>Далі</Button>
                        ) : (
                            <Button variant="contained" color="success" onClick={handleSaveShipment} startIcon={<Save />} sx={{ px: 4, fontWeight: 'bold' }}>Оформити</Button>
                        )}
                    </Box>
                </DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ShipmentsPage;