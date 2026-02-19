import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogActions, TextField, Box,
    Typography, Button, Stepper, Step, StepLabel, Grid,
    Autocomplete, Divider, Chip, IconButton, Tooltip,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    alpha, Paper
} from '@mui/material';
import {
    LocalShipping, CheckCircle, ChevronLeft,
    DirectionsCar, AccessTime, Map as MapIcon,
    Add, Delete, DragIndicator, MyLocation, Close,
    Schedule, Route
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeColoredIcon = (color, label) => L.divIcon({
    className: '',
    html: `<div style="
        background:${color};color:white;width:28px;height:28px;
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-weight:bold;font-size:12px;border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({ click: (e) => onMapClick(e.latlng) });
    return null;
};

const ColorlibStepIcon = ({ active, completed, icon, mainColor }) => {
    const icons = {
        1: <DirectionsCar fontSize="small" />,
        2: <Route fontSize="small" />,
        3: <Schedule fontSize="small" />,
    };
    return (
        <Box sx={{
            bgcolor: active || completed ? mainColor : '#e0e0e0',
            color: active || completed ? 'white' : '#aaa',
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: active ? `0 0 0 4px ${alpha(mainColor, 0.2)}` : 'none'
        }}>
            {icons[String(icon)]}
        </Box>
    );
};

const initialForm = {
    driverId: null,
    vehicleId: null,
    scheduledDeparture: '',
    scheduledArrival: '',
    waypoints: [],
};

const STEPS = [
    { label: 'Екіпаж', icon: 1 },
    { label: 'Маршрут', icon: 2 },
    { label: 'Розклад', icon: 3 },
];

const variants = {
    enter: (d) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d < 0 ? 80 : -80, opacity: 0 }),
};

const TripWizardDialog = ({ open, onClose, onSuccess, mainColor, references = {} }) => {
    const { drivers = [], vehicles = [] } = references;

    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [mapSelectMode, setMapSelectMode] = useState(false);
    const [manualInput, setManualInput] = useState({ lat: '', lng: '', label: '' });
    const [inputMode, setInputMode] = useState('manual');

    useEffect(() => {
        if (!open) {
            setActiveStep(0);
            setForm(initialForm);
            setMapSelectMode(false);
            setManualInput({ lat: '', lng: '', label: '' });
            setInputMode('manual');
        }
    }, [open]);

    const go = (next) => {
        setDirection(next > activeStep ? 1 : -1);
        setActiveStep(next);
    };

    const handleMapClick = useCallback((latlng) => {
        if (!mapSelectMode) return;
        const newPoint = {
            lat: latlng.lat,
            lng: latlng.lng,
            label: `Точка ${form.waypoints.length + 1}`
        };
        setForm(prev => ({ ...prev, waypoints: [...prev.waypoints, newPoint] }));
    }, [mapSelectMode, form.waypoints.length]);

    const addManualWaypoint = () => {
        const lat = parseFloat(manualInput.lat);
        const lng = parseFloat(manualInput.lng);
        if (isNaN(lat) || isNaN(lng)) return;
        setForm(prev => ({
            ...prev,
            waypoints: [...prev.waypoints, {
                lat, lng,
                label: manualInput.label || `Точка ${prev.waypoints.length + 1}`
            }]
        }));
        setManualInput({ lat: '', lng: '', label: '' });
    };

    const removeWaypoint = (idx) => {
        setForm(prev => ({
            ...prev,
            waypoints: prev.waypoints.filter((_, i) => i !== idx)
        }));
    };

    const handleSave = async () => {
        try {
            onSuccess?.('Рейс створено успішно!');
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    const mapCenter = form.waypoints.length > 0
        ? [form.waypoints[0].lat, form.waypoints[0].lng]
        : [49.0, 31.0];

    const polylinePoints = form.waypoints.map(w => [w.lat, w.lng]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
            <Box sx={{
                p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.8)} 100%)`,
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LocalShipping sx={{ fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Новий рейс</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Створення магістрального рейсу</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}><Close /></IconButton>
            </Box>

            <DialogContent sx={{ minHeight: 520, pt: 3, px: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {STEPS.map((s) => (
                        <Step key={s.label}>
                            <StepLabel StepIconComponent={(p) =>
                                <ColorlibStepIcon {...p} mainColor={mainColor} />
                            }>{s.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <AnimatePresence mode="wait" custom={direction}>
                    {activeStep === 0 && (
                        <motion.div key="s0" custom={direction} variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.25 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="subtitle2" sx={{
                                    color: '#666', fontWeight: 800, textTransform: 'uppercase',
                                    display: 'flex', alignItems: 'center', gap: 1
                                }}>
                                    <DirectionsCar sx={{ color: mainColor, fontSize: 18 }} /> Водій та транспортний засіб
                                </Typography>

                                <Autocomplete
                                    options={drivers}
                                    getOptionLabel={(o) =>
                                        `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim()
                                        + (o.licenseNumber ? ` — ${o.licenseNumber}` : '')
                                    }
                                    onChange={(_, v) => setForm(f => ({ ...f, driverId: v?.id }))}
                                    renderInput={(p) => (
                                        <TextField {...p} label="Водій" fullWidth
                                            InputProps={{ ...p.InputProps, startAdornment: <DirectionsCar sx={{ mr: 1, color: mainColor }} /> }}
                                        />
                                    )}
                                />

                                <Autocomplete
                                    options={vehicles}
                                    getOptionLabel={(o) =>
                                        `${o.licensePlate || ''}` +
                                        (o.brandName ? ` — ${o.brandName}` : '') +
                                        (o.bodyTypeName ? `, ${o.bodyTypeName}` : '') +
                                        (o.loadCapacity ? `, ${o.loadCapacity} т` : '') +
                                        (o.activityStatusName ? ` [${o.activityStatusName}]` : '')
                                    }
                                    onChange={(_, v) => setForm(f => ({ ...f, vehicleId: v?.id }))}
                                    renderInput={(p) => (
                                        <TextField {...p} label="Транспортний засіб" fullWidth
                                            InputProps={{ ...p.InputProps, startAdornment: <LocalShipping sx={{ mr: 1, color: mainColor }} /> }}
                                        />
                                    )}
                                />

                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(mainColor, 0.03) }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                        Примітка
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Водій та транспортний засіб будуть закріплені за рейсом. Розклад та маршрут можна налаштувати на наступних кроках.
                                    </Typography>
                                </Paper>
                            </Box>
                        </motion.div>
                    )}

                    {activeStep === 1 && (
                        <motion.div key="s1" custom={direction} variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.25 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#666', fontWeight: 800, textTransform: 'uppercase',
                                        display: 'flex', alignItems: 'center', gap: 1
                                    }}>
                                        <Route sx={{ color: mainColor, fontSize: 18 }} /> Проміжні точки маршруту
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant={inputMode === 'manual' ? 'contained' : 'outlined'}
                                            onClick={() => { setInputMode('manual'); setMapSelectMode(false); }}
                                            sx={{ bgcolor: inputMode === 'manual' ? mainColor : undefined }}
                                        >
                                            Вручну
                                        </Button>
                                        <Button
                                            size="small"
                                            variant={inputMode === 'map' ? 'contained' : 'outlined'}
                                            startIcon={<MapIcon />}
                                            onClick={() => { setInputMode('map'); setMapSelectMode(true); }}
                                            sx={{ bgcolor: inputMode === 'map' ? mainColor : undefined }}
                                        >
                                            На карті
                                        </Button>
                                    </Box>
                                </Box>

                                {inputMode === 'manual' && (
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                        <TextField
                                            label="Назва точки"
                                            size="small"
                                            value={manualInput.label}
                                            onChange={(e) => setManualInput(m => ({ ...m, label: e.target.value }))}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            label="Широта"
                                            size="small"
                                            type="number"
                                            value={manualInput.lat}
                                            onChange={(e) => setManualInput(m => ({ ...m, lat: e.target.value }))}
                                            sx={{ flex: 1 }}
                                        />
                                        <TextField
                                            label="Довгота"
                                            size="small"
                                            type="number"
                                            value={manualInput.lng}
                                            onChange={(e) => setManualInput(m => ({ ...m, lng: e.target.value }))}
                                            sx={{ flex: 1 }}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={addManualWaypoint}
                                            sx={{ bgcolor: mainColor, minWidth: 40, px: 1.5 }}
                                        >
                                            <Add />
                                        </Button>
                                    </Box>
                                )}

                                <Box sx={{
                                    height: 280, borderRadius: 2, overflow: 'hidden',
                                    border: mapSelectMode ? `2px solid ${mainColor}` : '1px solid #e0e0e0',
                                    position: 'relative'
                                }}>
                                    {mapSelectMode && (
                                        <Box sx={{
                                            position: 'absolute', top: 8, left: '50%',
                                            transform: 'translateX(-50%)', zIndex: 1000,
                                            bgcolor: mainColor, color: 'white',
                                            px: 2, py: 0.5, borderRadius: 2,
                                            fontSize: 12, fontWeight: 700,
                                            boxShadow: 2
                                        }}>
                                            🗺️ Клікніть на карті щоб додати точку
                                        </Box>
                                    )}
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={6}
                                        style={{ height: '100%', width: '100%' }}
                                        zoomControl={true}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution="© OpenStreetMap"
                                        />
                                        <MapClickHandler onMapClick={handleMapClick} />

                                        {form.waypoints.map((wp, idx) => (
                                            <Marker
                                                key={idx}
                                                position={[wp.lat, wp.lng]}
                                                icon={makeColoredIcon(
                                                    idx === 0 ? '#4caf50'
                                                        : idx === form.waypoints.length - 1 ? '#f44336'
                                                            : mainColor,
                                                    idx === 0 ? 'А'
                                                        : idx === form.waypoints.length - 1 ? 'Б'
                                                            : String(idx)
                                                )}
                                            >
                                                <Popup>{wp.label}</Popup>
                                            </Marker>
                                        ))}

                                        {polylinePoints.length > 1 && (
                                            <Polyline
                                                positions={polylinePoints}
                                                pathOptions={{ color: mainColor, weight: 3, dashArray: '6 4' }}
                                            />
                                        )}
                                    </MapContainer>
                                </Box>

                                {form.waypoints.length > 0 ? (
                                    <Box sx={{ maxHeight: 140, overflowY: 'auto' }}>
                                        <List dense disablePadding>
                                            {form.waypoints.map((wp, idx) => (
                                                <ListItem key={idx} sx={{
                                                    bgcolor: idx % 2 === 0 ? '#fafafa' : 'white',
                                                    borderRadius: 1, mb: 0.5
                                                }}>
                                                    <DragIndicator sx={{ color: '#ccc', mr: 1, fontSize: 18 }} />
                                                    <Chip
                                                        label={idx === 0 ? 'А' : idx === form.waypoints.length - 1 ? 'Б' : idx}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: idx === 0 ? '#4caf50' : idx === form.waypoints.length - 1 ? '#f44336' : mainColor,
                                                            color: 'white', mr: 1, fontWeight: 700, minWidth: 28
                                                        }}
                                                    />
                                                    <ListItemText
                                                        primary={wp.label}
                                                        secondary={`${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}`}
                                                        primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
                                                        secondaryTypographyProps={{ fontSize: 11 }}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton size="small" onClick={() => removeWaypoint(idx)}
                                                            sx={{ color: '#f44336' }}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                ) : (
                                    <Box sx={{
                                        p: 2, textAlign: 'center', borderRadius: 2,
                                        border: '1px dashed #ddd', color: '#aaa'
                                    }}>
                                        <MyLocation sx={{ fontSize: 32, mb: 1, opacity: 0.4 }} />
                                        <Typography variant="body2">
                                            Додайте точки маршруту вручну або тикаючи на карті
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </motion.div>
                    )}

                    {activeStep === 2 && (
                        <motion.div key="s2" custom={direction} variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.25 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="subtitle2" sx={{
                                    color: '#666', fontWeight: 800, textTransform: 'uppercase',
                                    display: 'flex', alignItems: 'center', gap: 1
                                }}>
                                    <AccessTime sx={{ color: mainColor, fontSize: 18 }} /> Плановий розклад
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Плановий час виїзду"
                                            type="datetime-local"
                                            fullWidth
                                            value={form.scheduledDeparture}
                                            onChange={(e) => setForm(f => ({ ...f, scheduledDeparture: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: new Date().toISOString().slice(0, 16) }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Очікуваний час прибуття"
                                            type="datetime-local"
                                            fullWidth
                                            value={form.scheduledArrival}
                                            onChange={(e) => setForm(f => ({ ...f, scheduledArrival: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: form.scheduledDeparture || new Date().toISOString().slice(0, 16) }}
                                        />
                                    </Grid>
                                </Grid>

                                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(mainColor, 0.03) }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mainColor, mb: 2 }}>
                                        Підсумок рейсу
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Водій:</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {drivers.find(d => d.id === form.driverId)
                                                    ? `${drivers.find(d => d.id === form.driverId).lastName} ${drivers.find(d => d.id === form.driverId).firstName}`
                                                    : '—'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">ТЗ:</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {vehicles.find(v => v.id === form.vehicleId)?.licensePlate
                                                    || vehicles.find(v => v.id === form.vehicleId)?.vehicleLicensePlate
                                                    || '—'}
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Точок маршруту:</Typography>
                                            <Chip label={form.waypoints.length} size="small"
                                                sx={{ bgcolor: mainColor, color: 'white', fontWeight: 700 }} />
                                        </Box>
                                        {form.scheduledDeparture && form.scheduledArrival && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Тривалість:</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {(() => {
                                                        const diff = (new Date(form.scheduledArrival) - new Date(form.scheduledDeparture)) / 3600000;
                                                        return diff > 0 ? `~${diff.toFixed(1)} год` : '—';
                                                    })()}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f0f0f0', gap: 1 }}>
                <Button onClick={onClose} sx={{ color: '#666' }}>Скасувати</Button>
                <Box sx={{ flexGrow: 1 }} />
                {activeStep > 0 && (
                    <Button onClick={() => go(activeStep - 1)} startIcon={<ChevronLeft />}>
                        Назад
                    </Button>
                )}
                {activeStep < STEPS.length - 1 ? (
                    <Button variant="contained" onClick={() => go(activeStep + 1)}
                        sx={{ bgcolor: mainColor, px: 3 }}>
                        Далі
                    </Button>
                ) : (
                    <Button variant="contained" color="success" onClick={handleSave}
                        startIcon={<CheckCircle />} sx={{ px: 3 }}>
                        Створити рейс
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default TripWizardDialog;