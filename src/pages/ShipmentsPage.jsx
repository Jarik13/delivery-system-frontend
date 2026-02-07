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
    Receipt, ChevronRight, ChevronLeft, Save, EventAvailable, AccessTime
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

// --- КОЛЬОРИ ДЛЯ ВСІХ 11 СТАТУСІВ ---
const STATUS_COLORS = {
    'Створено': '#2196f3',
    'Очікує надходження': '#90caf9',
    'Прийнято у відділенні': '#673ab7',
    'Сортування термінал': '#00bcd4',
    'У дорозі': '#ff9800',
    'Прибув у відділення': '#8bc34a',
    'Видано кур\'єру': '#e91e63',
    'Доставлено': '#2e7d32',
    'Відмова': '#f44336',
    'Втрачено': '#b71c1c',
    'Утилізовано': '#616161',
    'default': '#9e9e9e'
};

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

    const handleSaveShipment = async () => {
        setFieldErrors({});
        try {
            await DictionaryApi.create('shipments', formData);
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Відправлення створено', severity: 'success' });
        } catch (error) {
            const serverData = error.response?.data;
            if (serverData?.validationErrors) setFieldErrors(serverData.validationErrors);
            setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
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
            case 0: return (
                <Box component={motion.div} key="s1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Typography variant="subtitle2" color="primary" fontWeight="700">ФІЗИЧНІ ПАРАМЕТРИ</Typography>
                    <TextField label="Опис вмісту" fullWidth multiline rows={2} value={formData.parcel.contentDescription} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, contentDescription: e.target.value } })} error={!!fieldErrors['parcel.contentDescription']} helperText={fieldErrors['parcel.contentDescription']} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Вага (кг)" fullWidth type="number" value={formData.parcel.actualWeight} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, actualWeight: e.target.value } })} />
                        <TextField label="Цінність (₴)" fullWidth type="number" value={formData.parcel.declaredValue} onChange={(e) => setFormData({ ...formData, parcel: { ...formData.parcel, declaredValue: e.target.value } })} />
                    </Box>
                </Box>
            );
            case 1: return (
                <Box component={motion.div} key="s2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2 }}>
                    <Typography variant="subtitle2" color="primary" fontWeight="700" sx={{ mb: 2 }}>ФІНАНСОВА ДЕТАЛІЗАЦІЯ</Typography>
                    <Grid container spacing={2}>
                        {['delivery', 'weight', 'distance', 'insuranceFee'].map((f) => (
                            <Grid item xs={6} key={f}>
                                <TextField label={f} fullWidth type="number" size="small" value={formData.price[f]} onChange={(e) => {
                                    const p = { ...formData.price, [f]: parseFloat(e.target.value) || 0 };
                                    setFormData({ ...formData, price: { ...p, total: p.delivery + p.weight + p.distance + p.insuranceFee } });
                                }} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            );
            case 2: return (
                <Box component={motion.div} key="s3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Typography variant="subtitle2" color="primary" fontWeight="700">УЧАСНИКИ ТА СЕРВІС</Typography>
                    <Autocomplete options={clients} getOptionLabel={(o) => o.fullName || ''} onChange={(_, v) => setFormData({ ...formData, senderId: v?.id })} renderInput={(p) => <TextField {...p} label="Відправник" />} />
                    <Autocomplete options={clients} getOptionLabel={(o) => o.fullName || ''} onChange={(_, v) => setFormData({ ...formData, recipientId: v?.id })} renderInput={(p) => <TextField {...p} label="Отримувач" />} />
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
                    <LocalShipping fontSize="medium" />
                    <Box>
                        <Typography variant="h6" fontWeight="700">Відправлення</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>Керування логістичними маршрутами</Typography>
                    </Box>
                </Box>
                <Button variant="contained" sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold' }} startIcon={<Add />} onClick={handleOpenWizard}>
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
                {shipments.map((s) => {
                    const statusColor = STATUS_COLORS[s.shipmentStatusName] || STATUS_COLORS.default;
                    
                    return (
                        <Grid item key={s.id} xs={12} sm={6} md={4} lg={3} xl={2.4} sx={{ display: 'flex', flexGrow: 1 }}>
                            <Card sx={{
                                width: '100%', borderRadius: 4, transition: 'all 0.3s ease', border: '1px solid', borderColor: 'divider',
                                display: 'flex', flexDirection: 'column',
                                '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 12px 24px ${alpha(mainColor, 0.15)}`, borderColor: mainColor }
                            }} elevation={0}>
                                <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Chip label={s.trackingNumber} size="small" sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.1), color: mainColor }} />
                                        <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}><Delete fontSize="small" /></IconButton>
                                    </Box>

                                    <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                                        {s.parcelDescription || 'Без опису'}
                                    </Typography>

                                    <Divider sx={{ mt: 0.5, mb: 1.5, opacity: 0.5, borderStyle: 'dashed' }} />

                                    <Box sx={{ display: 'flex', gap: 1.8, mb: 2, height: '110px', alignItems: 'stretch' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5 }}>
                                            <TripOrigin sx={{ fontSize: 10, color: theme.palette.primary.main }} />
                                            <Box sx={{ width: '1px', flexGrow: 1, my: 0.5, borderLeft: '1px dashed #ccc' }} />
                                            <LocationOn sx={{ fontSize: 14, color: theme.palette.secondary.main }} />
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 0.2, flex: 1, overflow: 'hidden' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="700" sx={{ 
                                                    lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                                                }}>
                                                    {s.originLocationName || 'Не вказано'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ lineHeight: 1 }}>
                                                    {s.senderFullName}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight="700" sx={{ 
                                                    lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                                                }}>
                                                    {s.destinationLocationName || 'Не вказано'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ lineHeight: 1 }}>
                                                    {s.recipientFullName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary' }}>
                                                <AccessTime sx={{ fontSize: 14 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Оформлено:</Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                {new Date(s.createdAt).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                        
                                        {s.issuedAt && (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                bgcolor: alpha(theme.palette.success.main, 0.05),
                                                p: 0.5,
                                                px: 1,
                                                borderRadius: 1.5
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'success.main' }}>
                                                    <EventAvailable sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 800 }}>Видано:</Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main' }}>
                                                    {new Date(s.issuedAt).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.2 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Вартість:</Typography>
                                            <Typography variant="body2" fontWeight="800" color="success.main">{s.totalPrice} ₴</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Chip 
                                            label={s.shipmentStatusName} 
                                            size="small" 
                                            variant="outlined" 
                                            sx={{ 
                                                height: 20, fontSize: '0.65rem', fontWeight: 800, 
                                                borderColor: statusColor, color: statusColor, bgcolor: alpha(statusColor, 0.08)
                                            }} 
                                        />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>{s.actualWeight} кг</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', bgcolor: 'white', p: 1, borderRadius: 2 }}>
                <TablePagination component="div" count={totalElements} page={page} onPageChange={(e, n) => setPage(n)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))} />
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                    <Receipt sx={{ color: mainColor, fontSize: 35, mb: 1 }} />
                    <Typography variant="h6" fontWeight="700">Оформлення ТТН</Typography>
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 3 }}>
                        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                    </Stepper>
                </DialogTitle>
                <DialogContent sx={{ minHeight: 380 }}>
                    <AnimatePresence mode="wait">
                        {renderStepContent(activeStep)}
                    </AnimatePresence>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpen(false)} sx={{ fontWeight: 'bold' }}>Скасувати</Button>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {activeStep > 0 && <Button onClick={() => setActiveStep(activeStep - 1)}>Назад</Button>}
                        {activeStep < 2 ? (
                            <Button variant="contained" onClick={() => setActiveStep(activeStep + 1)}>Далі</Button>
                        ) : (
                            <Button variant="contained" color="success" onClick={handleSaveShipment}>Оформити</Button>
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