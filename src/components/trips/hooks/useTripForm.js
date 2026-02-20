import { useState, useCallback, useEffect } from 'react';
import {
    useSensor, useSensors, PointerSensor, KeyboardSensor,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DictionaryApi } from '../../../api/dictionaries';
import { initialForm, initialSegments, makeSegment, fetchCoordinates, toDatetimeLocal } from '../utils';

const useTripForm = ({ open, tripToEdit, onSuccess, onClose }) => {
    const isEditMode = Boolean(tripToEdit);

    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [segments, setSegments] = useState(initialSegments);
    const [activeDragId, setActiveDragId] = useState(null);
    const [mapSelectMode, setMapSelectMode] = useState(false);
    const [mapFullscreen, setMapFullscreen] = useState(false);
    const [loadingTrip, setLoadingTrip] = useState(false);

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
            setLoadingTrip(false);
            return;
        }

        if (!isEditMode) {
            setSegments(initialSegments());
            setForm(initialForm);
            return;
        }

        const loadTrip = async () => {
            setLoadingTrip(true);
            try {
                setForm({
                    driverId: tripToEdit.driverId ?? null,
                    vehicleId: tripToEdit.vehicleId ?? null,
                    scheduledDeparture: toDatetimeLocal(tripToEdit.scheduledDepartureTime),
                    scheduledArrival: toDatetimeLocal(tripToEdit.scheduledArrivalTime),
                });

                const waypoints = tripToEdit.waypoints || [];
                if (waypoints.length >= 2) {
                    const segs = await Promise.all(
                        waypoints
                            .slice()
                            .sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))
                            .map(async (wp) => {
                                const coords = wp.cityName ? await fetchCoordinates(wp.cityName) : null;
                                return makeSegment({
                                    cityId: wp.cityId ?? null,
                                    cityName: wp.cityName ?? '',
                                    regionId: wp.regionId ?? null,
                                    districtId: wp.districtId ?? null,
                                    lat: coords?.lat ?? null,
                                    lng: coords?.lng ?? null,
                                });
                            })
                    );
                    setSegments(segs);
                } else {
                    setSegments(initialSegments());
                }
            } catch (e) {
                console.error('Помилка завантаження рейсу для редагування:', e);
                setSegments(initialSegments());
            } finally {
                setLoadingTrip(false);
            }
        };

        loadTrip();
    }, [open, tripToEdit]);

    const updateSeg = useCallback((id, patch) =>
        setSegments(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s)), []);

    const addSegment = useCallback(() => setSegments(prev => [...prev, makeSegment()]), []);
    const removeSegment = useCallback((id) => setSegments(prev => prev.filter(s => s.id !== id)), []);

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

    const handleDragStart = useCallback(({ active }) => setActiveDragId(active.id), []);
    const handleDragEnd = useCallback(({ active, over }) => {
        setActiveDragId(null);
        if (!over || active.id === over.id) return;
        setSegments(prev => {
            const oldIdx = prev.findIndex(s => s.id === active.id);
            const newIdx = prev.findIndex(s => s.id === over.id);
            return arrayMove(prev, oldIdx, newIdx);
        });
    }, []);

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

    const handleSave = useCallback(async () => {
        const payload = {
            driverId: form.driverId,
            vehicleId: form.vehicleId,
            scheduledDepartureTime: form.scheduledDeparture,
            scheduledArrivalTime: form.scheduledArrival,
            waypoints: segments.map((seg, idx) => ({ cityId: seg.cityId, sequenceNumber: idx + 1 })),
        };
        try {
            if (isEditMode) {
                await DictionaryApi.update('trips', tripToEdit.id, payload);
                onSuccess?.('Рейс успішно оновлено!');
            } else {
                await DictionaryApi.create('trips', payload);
                onSuccess?.('Рейс створено успішно!');
            }
            onClose();
        } catch (e) { console.error(e); }
    }, [form, segments, isEditMode, tripToEdit, onSuccess, onClose]);

    const go = useCallback((next) => {
        setDirection(next > activeStep ? 1 : -1);
        setActiveStep(next);
    }, [activeStep]);

    const segmentsWithCoords = segments.filter(s => s.lat && s.lng);
    const mapCoords = segmentsWithCoords.map(s => ({ lat: s.lat, lng: s.lng }));
    const activeSeg = activeDragId ? segments.find(s => s.id === activeDragId) : null;

    return {
        isEditMode,
        activeStep,
        direction,
        form, setForm,
        segments,
        activeDragId,
        activeSeg,
        mapSelectMode, setMapSelectMode,
        mapFullscreen, setMapFullscreen,
        loadingTrip,
        segmentsWithCoords,
        mapCoords,
        sensors,
        go,
        addSegment,
        removeSegment,
        handleRegionChange,
        handleDistrictChange,
        handleCityChange,
        handleDragStart,
        handleDragEnd,
        handleMapClick,
        handleSave,
    };
};

export default useTripForm;