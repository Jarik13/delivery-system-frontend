import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Typography, Snackbar, Alert, TablePagination,
    useTheme, alpha, Autocomplete, Grid, Stepper, Step, StepLabel,
    FormControlLabel, Checkbox, MenuItem, Divider, Chip, RadioGroup, Radio,
    InputAdornment, Card, CardContent, ToggleButton, ToggleButtonGroup,
    Stack,
    FormControl,
    InputLabel,
    Select,
    Grow,
    Collapse
} from '@mui/material';
import {
    Add, LocalShipping, Receipt, Inventory, AttachMoney,
    LocationOn, Person, Home, Apartment, Business,
    DirectionsCar, Calculate, CheckCircle, LocalPostOffice,
    MailOutline, Public, Map, ArrowDownward
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import ShipmentGrid from '../components/ShipmentGrid';
import DeliveryPointSelector from '../components/DeliveryPointSelector';

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

const steps = ['Посилка', 'Маршрут', 'Вартість'];

const ShipmentsPage = () => {
    const theme = useTheme();
    const groupName = ITEM_GROUP_MAP['shipments'] || 'Керування логістикою';
    const mainColor = GROUP_COLORS[groupName] || '#673ab7';

    const [shipments, setShipments] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [stats, setStats] = useState(null);

    const [expandedHistory, setExpandedHistory] = useState({});
    const [expandedFinance, setExpandedFinance] = useState({});
    const [movements, setMovements] = useState({});

    const [filters, setFilters] = useState({
        trackingNumber: '', shipmentStatusId: '', shipmentTypeId: '', parcelDescription: '',
        createdAtFrom: '', createdAtTo: '', issuedAtFrom: '', issuedAtTo: '',
        weightMin: 0, weightMax: 100, totalPriceMin: 0, totalPriceMax: 10000,
        deliveryPriceMin: 0, deliveryPriceMax: 5000, weightPriceMin: 0, weightPriceMax: 2000,
        distancePriceMin: 0, distancePriceMax: 2000, boxVariantPriceMin: 0, boxVariantPriceMax: 1000,
        specialPackagingPriceMin: 0, specialPackagingPriceMax: 1000, insuranceFeeMin: 0, insuranceFeeMax: 1000
    });

    const [statuses, setStatuses] = useState([]);
    const [clients, setClients] = useState([]);
    const [shipmentTypes, setShipmentTypes] = useState([]);
    const [parcelTypes, setParcelTypes] = useState([]);
    const [storageConditions, setStorageConditions] = useState([]);
    const [boxVariants, setBoxVariants] = useState([]);
    const [branches, setBranches] = useState([]);
    const [postomats, setPostomats] = useState([]);
    const [cities, setCities] = useState([]);
    const [streets, setStreets] = useState([]);

    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        parcel: {
            declaredValue: '',
            actualWeight: '',
            contentDescription: '',
            parcelTypeId: null,
            storageConditionIds: []
        },
        box: {
            useBox: false,
            boxVariantId: null
        },
        origin: {
            type: 'branch',
            branchId: null,
            postomatId: null,
            cityId: null,
            streetId: null,
            houseNumber: '',
            apartmentNumber: '',
            floor: '',
            entrance: '',
            intercom: ''
        },
        destination: {
            type: 'branch',
            branchId: null,
            postomatId: null,
            cityId: null,
            streetId: null,
            houseNumber: '',
            apartmentNumber: '',
            floor: '',
            entrance: '',
            intercom: ''
        },
        senderId: null,
        recipientId: null,
        shipmentTypeId: null,
        shipmentStatusId: null,
        price: {
            deliveryPrice: 0,
            weightPrice: 0,
            distancePrice: 0,
            boxVariantPrice: 0,
            specialPackagingPrice: 0,
            insuranceFee: 0,
            totalPrice: 0
        },
        senderPay: true,
        partiallyPaid: false
    });

    const toggleHistory = async (shipmentId) => {
        if (expandedHistory[shipmentId]) {
            setExpandedHistory(prev => ({ ...prev, [shipmentId]: false }));
            return;
        }
        if (!movements[shipmentId]) {
            try {
                const response = await DictionaryApi.getMovement(shipmentId);
                setMovements(prev => ({ ...prev, [shipmentId]: response.data }));
            } catch (error) {
                console.error("Помилка завантаження маршруту", error);
            }
        }
        setExpandedHistory(prev => ({ ...prev, [shipmentId]: true }));
    };

    useEffect(() => {
        const loadReferences = async () => {
            try {
                const [
                    sRes, cRes, tRes, ptRes, scRes, bvRes, brRes, pRes, ctRes, statsRes
                ] = await Promise.all([
                    DictionaryApi.getAll('shipment-statuses', 0, 100),
                    DictionaryApi.getAll('clients', 0, 1000),
                    DictionaryApi.getAll('shipment-types', 0, 100),
                    DictionaryApi.getAll('parcel-types', 0, 100),
                    DictionaryApi.getAll('storage-conditions', 0, 100),
                    DictionaryApi.getAll('box-variants', 0, 100),
                    DictionaryApi.getAll('branches', 0, 500),
                    DictionaryApi.getAll('postomats', 0, 500),
                    DictionaryApi.getAll('cities', 0, 500),
                    DictionaryApi.getStatistics('shipments')
                ]);

                setStatuses(sRes.data.content || []);
                setClients(cRes.data.content || []);
                setShipmentTypes(tRes.data.content || []);
                setParcelTypes(ptRes.data.content || []);
                setStorageConditions(scRes.data.content || []);
                setBoxVariants(bvRes.data.content || []);
                setBranches(brRes.data.content || []);
                setPostomats(pRes.data.content || []);
                setCities(ctRes.data.content || []);

                if (statsRes.data) {
                    const s = statsRes.data;
                    setStats(s);
                    setFilters(prev => ({
                        ...prev,
                        weightMin: s.minWeight, weightMax: s.maxWeight,
                        totalPriceMin: s.minTotalPrice, totalPriceMax: s.maxTotalPrice,
                        deliveryPriceMin: s.minDeliveryPrice, deliveryPriceMax: s.maxDeliveryPrice,
                        weightPriceMin: s.minWeightPrice, weightPriceMax: s.maxWeightPrice,
                        distancePriceMin: s.minDistancePrice, distancePriceMax: s.maxDistancePrice,
                        boxVariantPriceMin: s.minBoxVariantPrice, boxVariantPriceMax: s.maxBoxVariantPrice,
                        specialPackagingPriceMin: s.minSpecialPackagingPrice, specialPackagingPriceMax: s.maxSpecialPackagingPrice,
                        insuranceFeeMin: s.minInsuranceFee, insuranceFeeMax: s.maxInsuranceFee
                    }));
                }
            } catch (error) {
                console.error("Помилка завантаження метаданих", error);
            }
        };
        loadReferences();
    }, []);

    const calculatePrice = useCallback(() => {
        const weight = parseFloat(formData.parcel.actualWeight) || 0;
        const declaredValue = parseFloat(formData.parcel.declaredValue) || 0;

        let deliveryPrice = 50;
        let weightPrice = weight > 5 ? (weight - 5) * 10 : 0;
        let distancePrice = 0;
        let boxVariantPrice = 0;
        let specialPackagingPrice = formData.parcel.storageConditionIds.length * 15;
        let insuranceFee = declaredValue * 0.01;

        if (formData.box.useBox && formData.box.boxVariantId) {
            const selectedBox = boxVariants.find(b => b.id === formData.box.boxVariantId);
            if (selectedBox) boxVariantPrice = selectedBox.price || 0;
        }

        const totalPrice = deliveryPrice + weightPrice + distancePrice + boxVariantPrice + specialPackagingPrice + insuranceFee;

        setFormData(prev => ({
            ...prev,
            price: {
                deliveryPrice,
                weightPrice,
                distancePrice,
                boxVariantPrice,
                specialPackagingPrice,
                insuranceFee,
                totalPrice
            }
        }));
    }, [formData.parcel, formData.box, boxVariants]);

    useEffect(() => {
        if (activeStep === 2) {
            calculatePrice();
        }
    }, [activeStep, formData.parcel.actualWeight, formData.parcel.declaredValue, formData.box, calculatePrice]);

    const loadTableData = useCallback(async () => {
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );
            const response = await DictionaryApi.getAll('shipments', page, rowsPerPage, activeFilters);
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

    const resetFilters = () => {
        if (!stats) return;
        setFilters({
            trackingNumber: '', shipmentStatusId: '', shipmentTypeId: '', parcelDescription: '',
            createdAtFrom: '', createdAtTo: '', issuedAtFrom: '', issuedAtTo: '',
            weightMin: stats.minWeight, weightMax: stats.maxWeight,
            totalPriceMin: stats.minTotalPrice, totalPriceMax: stats.maxTotalPrice,
            deliveryPriceMin: stats.minDeliveryPrice, deliveryPriceMax: stats.maxDeliveryPrice,
            weightPriceMin: stats.minWeightPrice, weightPriceMax: stats.maxWeightPrice,
            distancePriceMin: stats.minDistancePrice, distancePriceMax: stats.maxDistancePrice,
            boxVariantPriceMin: stats.minBoxVariantPrice, boxVariantPriceMax: stats.maxBoxVariantPrice,
            specialPackagingPriceMin: stats.minSpecialPackagingPrice, specialPackagingPriceMax: stats.maxSpecialPackagingPrice,
            insuranceFeeMin: stats.minInsuranceFee, insuranceFeeMax: stats.maxInsuranceFee
        });
    };

    const handleOpenWizard = () => {
        setFieldErrors({});
        setFormData({
            parcel: {
                declaredValue: '',
                actualWeight: '',
                contentDescription: '',
                parcelTypeId: null,
                storageConditionIds: []
            },
            box: {
                useBox: false,
                boxVariantId: null
            },
            origin: {
                type: 'branch',
                branchId: null,
                postomatId: null,
                cityId: null,
                streetId: null,
                houseNumber: '',
                apartmentNumber: '',
                floor: '',
                entrance: '',
                intercom: ''
            },
            destination: {
                type: 'branch',
                branchId: null,
                postomatId: null,
                cityId: null,
                streetId: null,
                houseNumber: '',
                apartmentNumber: '',
                floor: '',
                entrance: '',
                intercom: ''
            },
            senderId: null,
            recipientId: null,
            shipmentTypeId: null,
            shipmentStatusId: null,
            price: {
                deliveryPrice: 0,
                weightPrice: 0,
                distancePrice: 0,
                boxVariantPrice: 0,
                specialPackagingPrice: 0,
                insuranceFee: 0,
                totalPrice: 0
            },
            senderPay: true,
            partiallyPaid: false
        });
        setActiveStep(0);
        setOpen(true);
    };

    const handleSaveShipment = async () => {
        setFieldErrors({});
        try {
            let statusId = formData.shipmentStatusId;
            if (!statusId) {
                const createdStatus = statuses.find(s => s.name === 'Створено');
                statusId = createdStatus?.id;
            }

            const shipmentData = {
                parcel: {
                    declaredValue: formData.parcel.declaredValue,
                    actualWeight: formData.parcel.actualWeight,
                    contentDescription: formData.parcel.contentDescription,
                    parcelTypeId: formData.parcel.parcelTypeId,
                    storageConditionIds: formData.parcel.storageConditionIds
                },
                price: formData.price,
                senderPay: formData.senderPay,
                partiallyPaid: formData.partiallyPaid,
                senderId: formData.senderId,
                recipientId: formData.recipientId,
                shipmentTypeId: formData.shipmentTypeId,
                shipmentStatusId: statusId,
                originDeliveryPoint: formData.origin.type === 'branch' ? {
                    branchId: formData.origin.branchId
                } : formData.origin.type === 'postomat' ? {
                    postomatId: formData.origin.postomatId
                } : null,
                destinationDeliveryPoint: formData.destination.type === 'branch' ? {
                    branchId: formData.destination.branchId
                } : formData.destination.type === 'postomat' ? {
                    postomatId: formData.destination.postomatId
                } : null,
                originAddress: formData.origin.type === 'address' ? {
                    streetId: formData.origin.streetId,
                    houseNumber: formData.origin.houseNumber,
                    apartmentNumber: formData.origin.apartmentNumber,
                    floor: formData.origin.floor,
                    entrance: formData.origin.entrance,
                    intercom: formData.origin.intercom
                } : null,
                destinationAddress: formData.destination.type === 'address' ? {
                    streetId: formData.destination.streetId,
                    houseNumber: formData.destination.houseNumber,
                    apartmentNumber: formData.destination.apartmentNumber,
                    floor: formData.destination.floor,
                    entrance: formData.destination.entrance,
                    intercom: formData.destination.intercom
                } : null,
                shipmentBox: formData.box.useBox ? {
                    boxVariantId: formData.box.boxVariantId
                } : null
            };

            await DictionaryApi.create('shipments', shipmentData);
            setOpen(false);
            loadTableData();
            setNotification({ open: true, message: 'Відправлення створено успішно', severity: 'success' });
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
                    <Box component={motion.div} key="s1" custom={direction} variants={variants}
                        initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                        sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                        <Typography variant="subtitle2" color="primary" fontWeight="700">
                            <Inventory sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                            ПАРАМЕТРИ ПОСИЛКИ
                        </Typography>

                        <TextField
                            label="Опис вмісту"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.parcel.contentDescription}
                            onChange={(e) => setFormData({
                                ...formData,
                                parcel: { ...formData.parcel, contentDescription: e.target.value }
                            })}
                            error={!!fieldErrors['parcel.contentDescription']}
                            helperText={fieldErrors['parcel.contentDescription']}
                            placeholder="Наприклад: Одяг, Документи, Електроніка..."
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Вага (кг)"
                                    fullWidth
                                    type="number"
                                    value={formData.parcel.actualWeight}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        parcel: { ...formData.parcel, actualWeight: e.target.value }
                                    })}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">⚖️</InputAdornment>
                                    }}
                                    error={!!fieldErrors['parcel.actualWeight']}
                                    helperText={fieldErrors['parcel.actualWeight']}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Оголошена вартість"
                                    fullWidth
                                    type="number"
                                    value={formData.parcel.declaredValue}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        parcel: { ...formData.parcel, declaredValue: e.target.value }
                                    })}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">₴</InputAdornment>
                                    }}
                                    error={!!fieldErrors['parcel.declaredValue']}
                                    helperText={fieldErrors['parcel.declaredValue']}
                                />
                            </Grid>
                        </Grid>

                        <Autocomplete
                            options={parcelTypes}
                            getOptionLabel={(o) => o.name || ''}
                            onChange={(_, v) => setFormData({
                                ...formData,
                                parcel: { ...formData.parcel, parcelTypeId: v?.id }
                            })}
                            renderInput={(p) => (
                                <TextField
                                    {...p}
                                    label="Тип посилки"
                                    error={!!fieldErrors['parcel.parcelTypeId']}
                                    helperText={fieldErrors['parcel.parcelTypeId']}
                                />
                            )}
                        />

                        <Autocomplete
                            multiple
                            options={storageConditions}
                            getOptionLabel={(o) => o.name || ''}
                            value={storageConditions.filter(sc => formData.parcel.storageConditionIds.includes(sc.id))}
                            onChange={(_, v) => setFormData({
                                ...formData,
                                parcel: { ...formData.parcel, storageConditionIds: v.map(i => i.id) }
                            })}
                            renderInput={(p) => (
                                <TextField {...p} label="Умови зберігання" placeholder="Крихкий, Холод..." />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={option.name}
                                        {...getTagProps({ index })}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        key={option.id}
                                    />
                                ))
                            }
                        />

                        <Divider sx={{ my: 1 }} />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.box.useBox}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        box: { ...formData.box, useBox: e.target.checked }
                                    })}
                                />
                            }
                            label="Потрібна коробка"
                        />

                        {formData.box.useBox && (
                            <Autocomplete
                                options={boxVariants}
                                getOptionLabel={(o) => `${o.name || ''} (${o.length}x${o.width}x${o.height} см) - ${o.price || 0} ₴`}
                                onChange={(_, v) => setFormData({
                                    ...formData,
                                    box: { ...formData.box, boxVariantId: v?.id }
                                })}
                                renderInput={(p) => <TextField {...p} label="Розмір коробки" />}
                            />
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box component={motion.div} key="s2" custom={direction} variants={variants}
                        initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                        sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>

                        <Typography variant="subtitle2" color="primary" fontWeight="700">
                            <Person sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                            УЧАСНИКИ
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={clients}
                                    getOptionLabel={(o) => `${o.fullName || ''} (${o.phoneNumber || ''})`}
                                    onChange={(_, v) => setFormData({ ...formData, senderId: v?.id })}
                                    renderInput={(p) => (
                                        <TextField
                                            {...p}
                                            label="Відправник (ПІБ та телефон)"
                                            error={!!fieldErrors.senderId}
                                            helperText={fieldErrors.senderId}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={clients}
                                    getOptionLabel={(o) => `${o.fullName || ''} (${o.phoneNumber || ''})`}
                                    onChange={(_, v) => setFormData({ ...formData, recipientId: v?.id })}
                                    renderInput={(p) => (
                                        <TextField
                                            {...p}
                                            label="Отримувач (ПІБ та телефон)"
                                            error={!!fieldErrors.recipientId}
                                            helperText={fieldErrors.recipientId}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        <Divider />

                        <DeliveryPointSelector
                            point={formData.origin}
                            onChange={(newOrigin) => setFormData({ ...formData, origin: newOrigin })}
                            label="ЗВІДКИ (ВІДПРАВЛЕННЯ)"
                        />

                        <Divider />

                        <DeliveryPointSelector
                            point={formData.destination}
                            onChange={(newDest) => setFormData({ ...formData, destination: newDest })}
                            label="КУДИ (ПРИЗНАЧЕННЯ)"
                        />

                        <Divider />

                        <Autocomplete
                            options={shipmentTypes}
                            getOptionLabel={(o) => o.name || ''}
                            onChange={(_, v) => setFormData({ ...formData, shipmentTypeId: v?.id })}
                            renderInput={(p) => (
                                <TextField
                                    {...p}
                                    label="Тип доставки"
                                    error={!!fieldErrors.shipmentTypeId}
                                    helperText={fieldErrors.shipmentTypeId}
                                />
                            )}
                        />
                    </Box>
                );

            case 2:
                return (
                    <Box component={motion.div} key="s3" custom={direction} variants={variants}
                        initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                        sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                        <Typography variant="subtitle2" color="primary" fontWeight="700">
                            <Calculate sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                            РОЗРАХУНОК ВАРТОСТІ
                        </Typography>

                        <Card variant="outlined" sx={{ bgcolor: alpha(mainColor, 0.03) }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Базовий тариф:</Typography>
                                        <Typography variant="body1" fontWeight="700">{formData.price.deliveryPrice.toFixed(2)} ₴</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Доплата за вагу:</Typography>
                                        <Typography variant="body1" fontWeight="700">{formData.price.weightPrice.toFixed(2)} ₴</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Доплата відстань:</Typography>
                                        <Typography variant="body1" fontWeight="700">{formData.price.distancePrice.toFixed(2)} ₴</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Коробка:</Typography>
                                        <Typography variant="body1" fontWeight="700">{formData.price.boxVariantPrice.toFixed(2)} ₴</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Спец. пакування:</Typography>
                                        <Typography variant="body1" fontWeight="700">{formData.price.specialPackagingPrice.toFixed(2)} ₴</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Страховка:</Typography>
                                        <Typography variant="body1" fontWeight="700">{formData.price.insuranceFee.toFixed(2)} ₴</Typography>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6" color="primary" fontWeight="800">ЗАГАЛЬНА ВАРТІСТЬ:</Typography>
                                    <Typography variant="h5" color="primary" fontWeight="900">
                                        {formData.price.totalPrice.toFixed(2)} ₴
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        <Divider />

                        <Typography variant="subtitle2" color="text.secondary" fontWeight="700">УМОВИ ОПЛАТИ</Typography>

                        <RadioGroup
                            value={formData.senderPay ? 'sender' : 'recipient'}
                            onChange={(e) => setFormData({ ...formData, senderPay: e.target.value === 'sender' })}
                        >
                            <FormControlLabel value="sender" control={<Radio />} label="Оплачує відправник" />
                            <FormControlLabel value="recipient" control={<Radio />} label="Оплачує отримувач" />
                        </RadioGroup>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.partiallyPaid}
                                    onChange={(e) => setFormData({ ...formData, partiallyPaid: e.target.checked })}
                                />
                            }
                            label="Часткова оплата"
                        />
                    </Box>
                );

            default:
                return null;
        }
    };

    const filterFields = [
        { name: 'trackingNumber', label: 'Трек-номер', type: 'text', md: 3 },
        { name: 'shipmentStatusId', label: 'Статус', type: 'select', options: statuses, md: 3 },
        { name: 'shipmentTypeId', label: 'Тип доставки', type: 'select', options: shipmentTypes, md: 3 },
        { name: 'parcelDescription', label: 'Опис вмісту', type: 'text', md: 3 },
        { name: 'createdAtFrom', label: 'Створено з', type: 'datetime', md: 3 },
        { name: 'createdAtTo', label: 'Створено до', type: 'datetime', md: 3 },
        { name: 'issuedAtFrom', label: 'Видано з', type: 'datetime', md: 3 },
        { name: 'issuedAtTo', label: 'Видано до', type: 'datetime', md: 3 },
        { label: 'Вага (кг)', type: 'range', minName: 'weightMin', maxName: 'weightMax', min: stats?.minWeight || 0, max: stats?.maxWeight || 100, md: 4 },
        { label: 'Ціна загальна', type: 'range', minName: 'totalPriceMin', maxName: 'totalPriceMax', min: stats?.minTotalPrice || 0, max: stats?.maxTotalPrice || 10000, md: 4 },
        { label: 'Базовий тариф', type: 'range', minName: 'deliveryPriceMin', maxName: 'deliveryPriceMax', min: stats?.minDeliveryPrice || 0, max: stats?.maxDeliveryPrice || 5000, md: 4 },
        { label: 'Доплата вага', type: 'range', minName: 'weightPriceMin', maxName: 'weightPriceMax', min: stats?.minWeightPrice || 0, max: stats?.maxWeightPrice || 2000, md: 3 },
        { label: 'Доплата відст.', type: 'range', minName: 'distancePriceMin', maxName: 'distancePriceMax', min: stats?.minDistancePrice || 0, max: stats?.maxDistancePrice || 2000, md: 3 },
        { label: 'Ціна коробки', type: 'range', minName: 'boxVariantPriceMin', maxName: 'boxVariantPriceMax', min: stats?.minBoxVariantPrice || 0, max: stats?.maxBoxVariantPrice || 1000, md: 3 },
        { label: 'Страховка', type: 'range', minName: 'insuranceFeeMin', maxName: 'insuranceFeeMax', min: stats?.minInsuranceFee || 0, max: stats?.maxInsuranceFee || 1000, md: 3 },
    ];

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                        <LocalShipping fontSize="medium" color="inherit" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Відправлення</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Керування логістичними маршрутами</Typography>
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

            <DataFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={resetFilters}
                searchPlaceholder="Трек-номер..."
                quickFilters={['shipmentStatusId', 'shipmentTypeId']}
                fields={filterFields}
            />

            <ShipmentGrid
                shipments={shipments}
                mainColor={mainColor}
                statusColors={STATUS_COLORS}
                expandedHistory={expandedHistory}
                expandedFinance={expandedFinance}
                movements={movements}
                onDelete={handleDelete}
                onToggleHistory={toggleHistory}
                onToggleFinance={(id) => setExpandedFinance(prev => ({ ...prev, [id]: !prev[id] }))}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', bgcolor: 'white', p: 1, borderRadius: 2 }}>
                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={(e, n) => setPage(n)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                />
            </Box>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth
                maxWidth="md"
                PaperProps={{ sx: { borderRadius: 4, maxHeight: '90vh' } }}
            >
                <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
                    <Receipt sx={{ color: mainColor, fontSize: 40, mb: 1 }} />
                    <Typography variant="body1" fontWeight="700" sx={{ fontSize: '1.5rem' }}>
                        Оформлення ТТН
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Крок {activeStep + 1} з {steps.length}
                    </Typography>
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 3 }}>
                        {steps.map(label => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </DialogTitle>

                <DialogContent sx={{ minHeight: 400, overflow: 'auto' }}>
                    <AnimatePresence mode="wait">
                        {renderStepContent(activeStep)}
                    </AnimatePresence>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpen(false)} sx={{ fontWeight: 'bold' }}>
                        Скасувати
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {activeStep > 0 && (
                            <Button
                                onClick={() => {
                                    setDirection(-1);
                                    setActiveStep(activeStep - 1);
                                }}
                                variant="outlined"
                            >
                                Назад
                            </Button>
                        )}
                        {activeStep < steps.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setDirection(1);
                                    setActiveStep(activeStep + 1);
                                }}
                            >
                                Далі
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleSaveShipment}
                                startIcon={<CheckCircle />}
                            >
                                Оформити ТТН
                            </Button>
                        )}
                    </Box>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    sx={{ borderRadius: 3 }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ShipmentsPage;