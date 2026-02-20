import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog, DialogContent, DialogActions, TextField, Box,
    Typography, Button, Stepper, Step, StepLabel, Grid,
    Autocomplete, Divider, Chip, IconButton,
    List, ListItem, ListItemText,
    alpha, Paper
} from '@mui/material';
import {
    LocalShipping, CheckCircle, ChevronLeft,
    DirectionsCar, AccessTime, Map as MapIcon,
    Add, Delete, Close, Schedule, Route, DragIndicator,
    Fullscreen, FullscreenExit
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
    DndContext, closestCenter,
    KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import LocationSelectorControlled from './LocationSelectorControlled';
import { DictionaryApi } from '../../api/dictionaries';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const cleanCityName = (name) => {
    if (!name) return '';
    return name
        .replace(/^(місто|м\.|село|с\.|смт\.?|селище міського типу|селище|smt\.?)\s+/i, '')
        .trim();
};

const fetchCoordinates = async (cityName) => {
    const clean = cleanCityName(cityName);
    if (!clean) return null;
    try {
        const params = new URLSearchParams({ city: clean, countrycodes: 'ua', format: 'json', limit: '1', 'accept-language': 'uk' });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) { console.warn('Nominatim structured failed:', e); }
    try {
        const params = new URLSearchParams({ q: `${clean}, Україна`, format: 'json', limit: '1', 'accept-language': 'uk' });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (e) { console.warn('Nominatim q-query failed:', e); }
    return null;
};

const makeColoredIcon = (color, label) => L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
});

const MapClickHandler = ({ onMapClick }) => {
    const map = useMap();
    useEffect(() => {
        const handler = (e) => onMapClick(e.latlng);
        map.on('click', handler);
        return () => map.off('click', handler);
    }, [map, onMapClick]);
    return null;
};

const MapBoundsUpdater = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (!coords || coords.length === 0) return;
        if (coords.length === 1) { map.setView([coords[0].lat, coords[0].lng], 10); }
        else { map.fitBounds(L.latLngBounds(coords.map(c => [c.lat, c.lng])), { padding: [40, 40] }); }
    }, [JSON.stringify(coords)]);
    return null;
};

const MapInvalidateSize = ({ trigger }) => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }, [trigger, map]);
    return null;
};

const ColorlibStepIcon = ({ active, completed, icon, mainColor }) => {
    const icons = { 1: <DirectionsCar fontSize="small" />, 2: <Route fontSize="small" />, 3: <Schedule fontSize="small" /> };
    return (
        <Box sx={{
            bgcolor: active || completed ? mainColor : '#e0e0e0',
            color: active || completed ? 'white' : '#aaa',
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: active ? `0 0 0 4px ${alpha(mainColor, 0.2)}` : 'none',
        }}>
            {icons[String(icon)]}
        </Box>
    );
};

const FullscreenMapOverlay = ({ open, onClose, mainColor, segmentsWithCoords, mapCoords, onMapClick, mapSelectMode }) => {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (open) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <Box sx={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Box sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2, py: 1,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MapIcon sx={{ color: 'white', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                        Карта маршруту
                    </Typography>
                    {mapSelectMode && (
                        <Chip
                            label="🗺️ Клікніть щоб додати місто"
                            size="small"
                            sx={{ bgcolor: mainColor, color: 'white', fontWeight: 700, ml: 1 }}
                        />
                    )}
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                    }}
                >
                    <FullscreenExit />
                </IconButton>
            </Box>

            {/* Route summary bar at bottom */}
            {mapCoords.length >= 2 && (
                <Box sx={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    zIndex: 1000,
                    px: 2, py: 1.5,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                }}>
                    {segmentsWithCoords.map((seg, idx) => (
                        <React.Fragment key={seg.id}>
                            <Chip
                                label={seg.cityName || '…'}
                                size="small"
                                sx={{
                                    bgcolor: idx === 0 ? '#4caf50' : idx === segmentsWithCoords.length - 1 ? '#f44336' : mainColor,
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: 12,
                                }}
                            />
                            {idx < segmentsWithCoords.length - 1 && (
                                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>→</Typography>
                            )}
                        </React.Fragment>
                    ))}
                </Box>
            )}

            {/* Map */}
            <MapContainer
                center={[49.0, 31.0]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onMapClick={onMapClick} />
                <MapBoundsUpdater coords={mapCoords} />
                <MapInvalidateSize trigger={open} />
                {segmentsWithCoords.map((seg, posIdx) => (
                    <Marker
                        key={`fs-${seg.id}-${posIdx}`}
                        position={[seg.lat, seg.lng]}
                        icon={makeColoredIcon(
                            posIdx === 0 ? '#4caf50' : posIdx === segmentsWithCoords.length - 1 ? '#f44336' : mainColor,
                            posIdx === 0 ? 'А' : posIdx === segmentsWithCoords.length - 1 ? 'Б' : String(posIdx)
                        )}
                    />
                ))}
                {segmentsWithCoords.length > 1 && (
                    <Polyline
                        positions={segmentsWithCoords.map(s => [s.lat, s.lng])}
                        pathOptions={{ color: mainColor, weight: 4, dashArray: '8 5' }}
                    />
                )}
            </MapContainer>
        </Box>
    );
};

const SortableSegmentItem = ({ seg, idx, total, mainColor, onRegionChange, onDistrictChange, onCityChange, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: seg.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 'auto',
    };

    const chipColor    = idx === 0 ? '#4caf50' : idx === total - 1 ? '#f44336' : mainColor;
    const chipLabel    = idx === 0 ? 'А' : idx === total - 1 ? 'Б' : String(idx);
    const segmentLabel = idx === 0 ? 'Місто відправлення' : idx === total - 1 ? 'Місто призначення' : `Проміжна зупинка ${idx}`;

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{
                p: 1.5, mb: 1.5, borderRadius: 2,
                borderColor: seg.cityId ? mainColor : '#e0e0e0',
                bgcolor: seg.cityId ? alpha(mainColor, 0.02) : 'white',
                boxShadow: isDragging ? 4 : 0,
                transition: 'box-shadow 0.2s ease',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                    {...attributes} {...listeners}
                    sx={{
                        display: 'flex', alignItems: 'center',
                        cursor: 'grab', color: '#bbb',
                        '&:hover': { color: mainColor },
                        '&:active': { cursor: 'grabbing' },
                        touchAction: 'none', mr: -0.5,
                    }}
                >
                    <DragIndicator fontSize="small" />
                </Box>

                <Chip label={chipLabel} size="small"
                    sx={{ bgcolor: chipColor, color: 'white', fontWeight: 700, minWidth: 28 }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {segmentLabel}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {seg.cityName && (
                    <Chip label={seg.cityName} size="small"
                        sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 600 }} />
                )}
                {seg.lat && (
                    <Chip label="📍" size="small" title="Координати знайдено"
                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                )}
                <IconButton size="small" onClick={() => onRemove(seg.id)}
                    disabled={total <= 2} sx={{ color: '#f44336' }}>
                    <Delete fontSize="small" />
                </IconButton>
            </Box>

            <LocationSelectorControlled
                regionId={seg.regionId || ''}
                districtId={seg.districtId || ''}
                cityId={seg.cityId || ''}
                onRegionChange={(regionId) => onRegionChange(seg.id, regionId)}
                onDistrictChange={(districtId) => onDistrictChange(seg.id, districtId)}
                onCityChange={(cityId, cityName) => onCityChange(seg.id, cityId, cityName)}
                error={false}
            />
        </Paper>
    );
};

const initialForm = { driverId: null, vehicleId: null, scheduledDeparture: '', scheduledArrival: '' };

let segIdCounter = 0;
const makeSegment = (overrides = {}) => ({
    id: `seg-${++segIdCounter}`,
    regionId: null,
    districtId: null,
    cityId: null,
    cityName: '',
    lat: null,
    lng: null,
    ...overrides,
});

const initialSegments = () => [makeSegment(), makeSegment()];

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
    const [segments, setSegments] = useState(initialSegments);
    const [activeDragId, setActiveDragId] = useState(null);
    const [mapFullscreen, setMapFullscreen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        if (!open) {
            setActiveStep(0);
            setForm(initialForm);
            setMapSelectMode(false);
            setMapFullscreen(false);
            setSegments(initialSegments());
        }
    }, [open]);

    useEffect(() => {
        if (!open) setMapFullscreen(false);
    }, [open]);

    const updateSeg = useCallback((id, patch) =>
        setSegments(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s)), []);

    const addSegment = () => setSegments(prev => [...prev, makeSegment()]);
    const removeSegment = (id) => setSegments(prev => prev.filter(s => s.id !== id));
    const go = (next) => { setDirection(next > activeStep ? 1 : -1); setActiveStep(next); };

    const handleRegionChange = useCallback((id, regionId) => {
        updateSeg(id, { regionId, districtId: null, cityId: null, cityName: '', lat: null, lng: null });
    }, [updateSeg]);

    const handleDistrictChange = useCallback((id, districtId) => {
        updateSeg(id, { districtId, cityId: null, cityName: '', lat: null, lng: null });
    }, [updateSeg]);

    const handleCityChange = useCallback(async (id, cityId, cityName) => {
        if (!cityId) {
            updateSeg(id, { cityId: null, cityName: '', lat: null, lng: null });
            return;
        }
        updateSeg(id, { cityId, cityName, lat: null, lng: null });
        const coords = await fetchCoordinates(cityName);
        if (coords) updateSeg(id, { lat: coords.lat, lng: coords.lng });
    }, [updateSeg]);

    const handleDragStart = ({ active }) => setActiveDragId(active.id);
    const handleDragEnd = ({ active, over }) => {
        setActiveDragId(null);
        if (!over || active.id === over.id) return;
        setSegments(prev => {
            const oldIdx = prev.findIndex(s => s.id === active.id);
            const newIdx = prev.findIndex(s => s.id === over.id);
            return arrayMove(prev, oldIdx, newIdx);
        });
    };

    const handleMapClick = useCallback(async (latlng) => {
        if (!mapSelectMode) return;
        try {
            const params = new URLSearchParams({ lat: latlng.lat, lon: latlng.lng, format: 'json', 'accept-language': 'uk' });
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
            const data = await res.json();
            const cityName = data.address?.city || data.address?.town
                || data.address?.village || data.address?.hamlet
                || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;

            const citiesRes = await DictionaryApi.getAll('cities', 0, 5, { name: cityName });
            const found = citiesRes.data.content?.[0];

            setSegments(prev => [...prev, makeSegment({
                cityId: found?.id || null,
                cityName: found?.name || cityName,
                lat: latlng.lat, lng: latlng.lng,
            })]);
        } catch {
            setSegments(prev => [...prev, makeSegment({
                cityName: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
                lat: latlng.lat, lng: latlng.lng,
            })]);
        }
    }, [mapSelectMode]);

    const handleSave = async () => {
        try {
            await DictionaryApi.create('trips', {
                driverId: form.driverId,
                vehicleId: form.vehicleId,
                scheduledDepartureTime: form.scheduledDeparture,
                scheduledArrivalTime: form.scheduledArrival,
                waypoints: segments.map((seg, idx) => ({ cityId: seg.cityId, sequenceNumber: idx + 1 })),
            });
            onSuccess?.('Рейс створено успішно!');
            onClose();
        } catch (e) { console.error(e); }
    };

    const segmentsWithCoords = segments.filter(s => s.lat && s.lng);
    const mapCoords = segmentsWithCoords.map(s => ({ lat: s.lat, lng: s.lng }));
    const activeSeg = activeDragId ? segments.find(s => s.id === activeDragId) : null;

    return (
        <>
            <FullscreenMapOverlay
                open={mapFullscreen}
                onClose={() => setMapFullscreen(false)}
                mainColor={mainColor}
                segmentsWithCoords={segmentsWithCoords}
                mapCoords={mapCoords}
                onMapClick={handleMapClick}
                mapSelectMode={mapSelectMode}
            />

            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

                <Box sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.8)} 100%)`,
                    color: 'white',
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
                                <StepLabel StepIconComponent={(p) => <ColorlibStepIcon {...p} mainColor={mainColor} />}>
                                    {s.label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <AnimatePresence mode="wait" custom={direction}>
                        {activeStep === 0 && (
                            <motion.div key="s0" custom={direction} variants={variants}
                                initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#666', fontWeight: 800, textTransform: 'uppercase',
                                        display: 'flex', alignItems: 'center', gap: 1,
                                    }}>
                                        <DirectionsCar sx={{ color: mainColor, fontSize: 18 }} /> Водій та транспортний засіб
                                    </Typography>

                                    <Autocomplete
                                        options={drivers}
                                        getOptionLabel={(o) =>
                                            `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim()
                                            + (o.licenseNumber ? ` — ${o.licenseNumber}` : '')}
                                        onChange={(_, v) => setForm(f => ({ ...f, driverId: v?.id }))}
                                        renderInput={(p) => (
                                            <TextField {...p} label="Водій" fullWidth
                                                InputProps={{ ...p.InputProps, startAdornment: <DirectionsCar sx={{ mr: 1, color: mainColor }} /> }} />
                                        )}
                                    />

                                    <Autocomplete
                                        options={vehicles}
                                        getOptionLabel={(o) =>
                                            `${o.licensePlate || ''}` +
                                            (o.brandName ? ` — ${o.brandName}` : '') +
                                            (o.bodyTypeName ? `, ${o.bodyTypeName}` : '') +
                                            (o.loadCapacity ? `, ${o.loadCapacity} т` : '') +
                                            (o.activityStatusName ? ` [${o.activityStatusName}]` : '')}
                                        onChange={(_, v) => setForm(f => ({ ...f, vehicleId: v?.id }))}
                                        renderInput={(p) => (
                                            <TextField {...p} label="Транспортний засіб" fullWidth
                                                InputProps={{ ...p.InputProps, startAdornment: <LocalShipping sx={{ mr: 1, color: mainColor }} /> }} />
                                        )}
                                    />

                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(mainColor, 0.03) }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Примітка</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Водій та транспортний засіб будуть закріплені за рейсом. Розклад та маршрут можна налаштувати на наступних кроках.
                                        </Typography>
                                    </Paper>
                                </Box>
                            </motion.div>
                        )}

                        {activeStep === 1 && (
                            <motion.div key="s1" custom={direction} variants={variants}
                                initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2" sx={{
                                            color: '#666', fontWeight: 800, textTransform: 'uppercase',
                                            display: 'flex', alignItems: 'center', gap: 1,
                                        }}>
                                            <Route sx={{ color: mainColor, fontSize: 18 }} /> Міста маршруту
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button size="small"
                                                variant={!mapSelectMode ? 'contained' : 'outlined'}
                                                onClick={() => setMapSelectMode(false)}
                                                sx={{ bgcolor: !mapSelectMode ? mainColor : undefined }}>
                                                Список
                                            </Button>
                                            <Button size="small"
                                                variant={mapSelectMode ? 'contained' : 'outlined'}
                                                startIcon={<MapIcon />}
                                                onClick={() => setMapSelectMode(true)}
                                                sx={{ bgcolor: mapSelectMode ? mainColor : undefined }}>
                                                На карті
                                            </Button>
                                            {!mapSelectMode && (
                                                <Button size="small" variant="contained" startIcon={<Add />}
                                                    onClick={addSegment} sx={{ bgcolor: mainColor }}>
                                                    Місто
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>

                                    {!mapSelectMode && (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext items={segments.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                                <Box sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
                                                    {segments.map((seg, idx) => (
                                                        <SortableSegmentItem
                                                            key={seg.id}
                                                            seg={seg}
                                                            idx={idx}
                                                            total={segments.length}
                                                            mainColor={mainColor}
                                                            onRegionChange={handleRegionChange}
                                                            onDistrictChange={handleDistrictChange}
                                                            onCityChange={handleCityChange}
                                                            onRemove={removeSegment}
                                                        />
                                                    ))}
                                                </Box>
                                            </SortableContext>

                                            <DragOverlay>
                                                {activeSeg && (
                                                    <Paper variant="outlined" sx={{
                                                        p: 1.5, borderRadius: 2,
                                                        borderColor: mainColor,
                                                        bgcolor: alpha(mainColor, 0.05),
                                                        boxShadow: 8, opacity: 0.95,
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DragIndicator sx={{ color: mainColor }} />
                                                            <Chip label={activeSeg.cityName || '…'} size="small"
                                                                sx={{ bgcolor: alpha(mainColor, 0.15), color: mainColor, fontWeight: 700 }} />
                                                        </Box>
                                                    </Paper>
                                                )}
                                            </DragOverlay>
                                        </DndContext>
                                    )}

                                    <Box sx={{
                                        height: mapSelectMode ? 340 : 200,
                                        borderRadius: 2, overflow: 'hidden', position: 'relative',
                                        border: mapSelectMode ? `2px solid ${mainColor}` : '1px solid #e0e0e0',
                                        transition: 'height 0.3s ease',
                                    }}>
                                        {mapSelectMode && (
                                            <Box sx={{
                                                position: 'absolute', top: 8, left: '50%',
                                                transform: 'translateX(-50%)', zIndex: 1000,
                                                bgcolor: mainColor, color: 'white',
                                                px: 2, py: 0.5, borderRadius: 2,
                                                fontSize: 12, fontWeight: 700, boxShadow: 2, whiteSpace: 'nowrap',
                                            }}>
                                                🗺️ Клікніть на карті щоб додати місто
                                            </Box>
                                        )}

                                        <Box
                                            onClick={() => setMapFullscreen(true)}
                                            title="Розгорнути карту на весь екран"
                                            sx={{
                                                position: 'absolute',
                                                bottom: 8, right: 8,
                                                zIndex: 1000,
                                                width: 32, height: 32,
                                                borderRadius: 1.5,
                                                bgcolor: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(0,0,0,0.12)',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: mainColor,
                                                    '& svg': { color: 'white' },
                                                    transform: 'scale(1.08)',
                                                },
                                            }}
                                        >
                                            <Fullscreen sx={{ fontSize: 18, color: '#555', transition: 'color 0.2s ease' }} />
                                        </Box>

                                        <MapContainer center={[49.0, 31.0]} zoom={6} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <MapClickHandler onMapClick={handleMapClick} />
                                            <MapBoundsUpdater coords={mapCoords} />
                                            {segmentsWithCoords.map((seg, posIdx) => (
                                                <Marker
                                                    key={`${seg.id}-${posIdx}`}
                                                    position={[seg.lat, seg.lng]}
                                                    icon={makeColoredIcon(
                                                        posIdx === 0 ? '#4caf50' : posIdx === segmentsWithCoords.length - 1 ? '#f44336' : mainColor,
                                                        posIdx === 0 ? 'А' : posIdx === segmentsWithCoords.length - 1 ? 'Б' : String(posIdx)
                                                    )}
                                                />
                                            ))}
                                            {segmentsWithCoords.length > 1 && (
                                                <Polyline
                                                    positions={segmentsWithCoords.map(s => [s.lat, s.lng])}
                                                    pathOptions={{ color: mainColor, weight: 3, dashArray: '6 4' }}
                                                />
                                            )}
                                        </MapContainer>
                                    </Box>

                                    {mapSelectMode && segments.filter(s => s.cityName).length > 0 && (
                                        <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                                            <List dense disablePadding>
                                                {segments.map((seg, idx) => (
                                                    <ListItem key={seg.id} sx={{ py: 0.25 }}>
                                                        <Chip
                                                            label={idx === 0 ? 'А' : idx === segments.length - 1 ? 'Б' : idx}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: idx === 0 ? '#4caf50' : idx === segments.length - 1 ? '#f44336' : mainColor,
                                                                color: 'white', mr: 1, minWidth: 28,
                                                            }}
                                                        />
                                                        <ListItemText
                                                            primary={seg.cityName}
                                                            primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                                                        />
                                                        <IconButton size="small" onClick={() => removeSegment(seg.id)} sx={{ color: '#f44336' }}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}

                                    {segments.filter(s => s.cityName).length >= 2 && (
                                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(mainColor, 0.03) }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Маршрут:</Typography>
                                            <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                                                {segments.filter(s => s.cityName).map(s => s.cityName).join(' → ')}
                                            </Typography>
                                        </Paper>
                                    )}
                                </Box>
                            </motion.div>
                        )}

                        {activeStep === 2 && (
                            <motion.div key="s2" custom={direction} variants={variants}
                                initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#666', fontWeight: 800, textTransform: 'uppercase',
                                        display: 'flex', alignItems: 'center', gap: 1,
                                    }}>
                                        <AccessTime sx={{ color: mainColor, fontSize: 18 }} /> Плановий розклад
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <TextField label="Плановий час виїзду" type="datetime-local" fullWidth
                                                value={form.scheduledDeparture}
                                                onChange={(e) => setForm(f => ({ ...f, scheduledDeparture: e.target.value }))}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: new Date().toISOString().slice(0, 16) }}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField label="Очікуваний час прибуття" type="datetime-local" fullWidth
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
                                                    {vehicles.find(v => v.id === form.vehicleId)?.licensePlate || '—'}
                                                </Typography>
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Typography variant="body2" color="text.secondary">Маршрут:</Typography>
                                                <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', maxWidth: '60%' }}>
                                                    {segments.filter(s => s.cityName).map(s => s.cityName).join(' → ') || '—'}
                                                </Typography>
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
                        <Button onClick={() => go(activeStep - 1)} startIcon={<ChevronLeft />}>Назад</Button>
                    )}
                    {activeStep < STEPS.length - 1 ? (
                        <Button variant="contained" onClick={() => go(activeStep + 1)} sx={{ bgcolor: mainColor, px: 3 }}>
                            Далі
                        </Button>
                    ) : (
                        <Button variant="contained" color="success" onClick={handleSave} startIcon={<CheckCircle />} sx={{ px: 3 }}>
                            Створити рейс
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TripWizardDialog;