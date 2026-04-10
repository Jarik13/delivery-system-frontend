import { useState, useCallback, useEffect, useRef } from 'react';
import {
    useSensor, useSensors, PointerSensor, KeyboardSensor,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DictionaryApi } from '../../../api/dictionaries';
import {
    initialForm, initialSegments, makeSegment,
    fetchCoordinates, toDatetimeLocal,
} from '../utils';

const extractCityName = (address, fallback) => {
    return address?.city
        || address?.town
        || address?.village
        || address?.hamlet
        || address?.suburb
        || fallback;
};

const buildSegsFromChain = async (chain) => {
    if (chain.length === 0) return initialSegments();
    const cityNames = [
        chain[0].originCityName,
        ...chain.map(r => r.destinationCityName),
    ];
    return Promise.all(cityNames.map(async (name) => {
        const coords = name ? await fetchCoordinates(name) : null;
        return makeSegment({
            cityName: name || '',
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null,
        });
    }));
};

const useTripForm = ({ open, tripToEdit, onSuccess, onClose }) => {
    const isEditMode = Boolean(tripToEdit);

    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [segments, setSegments] = useState(() => initialSegments());
    const [activeDragId, setActiveDragId] = useState(null);
    const [mapSelectMode, setMapSelectMode] = useState(false);
    const [mapFullscreen, setMapFullscreen] = useState(false);
    const [loadingTrip, setLoadingTrip] = useState(false);
    const [draggingSegId, setDraggingSegId] = useState(null);

    const segmentsRef = useRef(segments);
    segmentsRef.current = segments;
    const markerRefs = useRef({});
    const fsMarkerRefs = useRef({});

    const [routeSearchQuery, setRouteSearchQuery] = useState('');
    const [availableRoutes, setAvailableRoutes] = useState([]);
    const [routesLoading, setRoutesLoading] = useState(false);
    const [routeChain, setRouteChain] = useState([]);
    const [selectedRouteIds, setSelectedRouteIds] = useState([]);

    useEffect(() => {
        if (!open || activeStep !== 1) return;
        const t = setTimeout(async () => {
            setRoutesLoading(true);
            try {
                const lastCity = routeChain.length > 0
                    ? routeChain[routeChain.length - 1].destinationCityName
                    : null;

                const params = lastCity
                    ? {
                        originCityName: lastCity,
                        ...(routeSearchQuery ? { destinationCityName: routeSearchQuery } : {}),
                    }
                    : {
                        ...(routeSearchQuery ? { originCityName: routeSearchQuery } : {}),
                    };

                const res = await DictionaryApi.getAll('routes', 0, 100, params);
                setAvailableRoutes(res.data.content || []);
            } catch (e) {
                console.error('Помилка завантаження маршрутів:', e);
            } finally {
                setRoutesLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [open, activeStep, routeSearchQuery, routeChain]);

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
            setRouteChain([]);
            setSelectedRouteIds([]);
            setRouteSearchQuery('');
            setAvailableRoutes([]);
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

                const segmentsRes = await DictionaryApi.getById('trips', `${tripToEdit.id}/segments`);
                const segmentsData = segmentsRes.data || [];

                if (segmentsData.length > 0) {
                    const chain = segmentsData.map(seg => ({
                        id: seg.routeId,
                        originCityName: seg.originCity,
                        destinationCityName: seg.destCity,
                        originCityId: seg.originCityId,
                        destinationCityId: seg.destCityId,
                        distanceKm: seg.distance
                    }));

                    setRouteChain(chain);
                    setSelectedRouteIds(chain.map(c => c.id));

                    const waypoints = [
                        {
                            id: crypto.randomUUID(),
                            cityId: segmentsData[0].originCityId,
                            cityName: segmentsData[0].originCity,
                            districtId: segmentsData[0].originDistrictId,
                            regionId: segmentsData[0].originRegionId,
                            lat: segmentsData[0].originLat,
                            lng: segmentsData[0].originLng
                        },
                        ...segmentsData.map(seg => ({
                            id: crypto.randomUUID(),
                            cityId: seg.destCityId,
                            cityName: seg.destCity,
                            districtId: seg.destDistrictId,
                            regionId: seg.destRegionId,
                            lat: seg.destLat,
                            lng: seg.destLng
                        }))
                    ];

                    console.log("DEBUG: Waypoints with full hierarchy:", waypoints);
                    setSegments(waypoints);
                }
            } catch (e) {
                console.error('Помилка відновлення ланцюжка маршруту:', e);
            } finally {
                setLoadingTrip(false);
            }
        };

        loadTrip();
    }, [open, tripToEdit, isEditMode]);

    const updateSeg = useCallback((id, patch) =>
        setSegments(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s)), []);

    const addSegment = useCallback(() => setSegments(prev => [...prev, makeSegment()]), []);
    const removeSegment = useCallback((id) => setSegments(prev => prev.filter(s => s.id !== id)), []);

    const handleSetMapSelectMode = useCallback((val) => {
        if (val) {
            setSegments(prev => prev.filter(s => s.cityName && s.cityName.trim() !== ''));
        } else {
            setSegments(prev => {
                const withCity = prev.filter(s => s.cityName && s.cityName.trim() !== '');
                if (withCity.length < 2) return initialSegments();
                return prev;
            });
        }
        setMapSelectMode(val);
    }, []);

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

    const handleMarkerDragStart = useCallback((segId) => {
        setDraggingSegId(segId);
    }, []);

    const handleMarkerDragEnd = useCallback(async (segId, latlng) => {
        setDraggingSegId(null);
        updateSeg(segId, {
            lat: latlng.lat,
            lng: latlng.lng,
            cityId: null,
            cityName: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
        });

        const seg = segmentsRef.current.find(s => s.id === segId);
        try {
            const params = new URLSearchParams({
                lat: latlng.lat, lon: latlng.lng, format: 'json', 'accept-language': 'uk'
            });
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
            const data = await res.json();
            const cityName = extractCityName(
                data.address,
                `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
            );
            if (seg?.cityId) {
                try {
                    const citiesRes = await DictionaryApi.getAll('cities', 0, 5, { name: cityName });
                    const found = citiesRes.data.content?.[0];
                    updateSeg(segId, { cityId: found?.id || null, cityName: found?.name || cityName });
                } catch {
                    updateSeg(segId, { cityId: null, cityName });
                }
            } else {
                updateSeg(segId, { cityName });
            }
        } catch { }
    }, [updateSeg]);

    const handleMapClick = useCallback(async (latlng) => {
        if (!mapSelectMode) return;
        try {
            const params = new URLSearchParams({
                lat: latlng.lat, lon: latlng.lng, format: 'json', 'accept-language': 'uk'
            });
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
            const data = await res.json();
            const cityName = extractCityName(
                data.address,
                `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
            );
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

    const addRouteToChain = useCallback(async (route) => {
        const newChain = [...routeChain, route];
        setRouteChain(newChain);
        setSelectedRouteIds(newChain.map(r => r.id));
        const segs = await buildSegsFromChain(newChain);
        setSegments(segs);
        setMapSelectMode(false);
    }, [routeChain]);

    const removeRouteFromChain = useCallback(async (idx) => {
        const newChain = routeChain.slice(0, idx);
        setRouteChain(newChain);
        setSelectedRouteIds(newChain.map(r => r.id));
        const segs = await buildSegsFromChain(newChain);
        setSegments(segs);
    }, [routeChain]);

    const clearRouteChain = useCallback(() => {
        setRouteChain([]);
        setSelectedRouteIds([]);
        setSegments(initialSegments());
    }, []);

    const handleSave = useCallback(async () => {
        const waypoints = routeChain.length > 0
            ? [
                { cityId: routeChain[0].originCityId, sequenceNumber: 1 },
                ...routeChain.map((r, idx) => ({
                    cityId: r.destinationCityId,
                    sequenceNumber: idx + 2,
                })),
            ]
            : segments.map((seg, idx) => ({ cityId: seg.cityId, sequenceNumber: idx + 1 }));

        const payload = {
            driverId: form.driverId,
            vehicleId: form.vehicleId,
            scheduledDepartureTime: form.scheduledDeparture,
            scheduledArrivalTime: form.scheduledArrival,
            waypoints,
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
        } catch (e) {
            throw e;
        }
    }, [form, segments, routeChain, isEditMode, tripToEdit, onSuccess, onClose]);

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
        mapSelectMode,
        setMapSelectMode: handleSetMapSelectMode,
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
        markerRefs,
        fsMarkerRefs,
        draggingSegId,
        handleMarkerDragStart,
        handleMarkerDragEnd,
        handleSave,
        routeSearchQuery, setRouteSearchQuery,
        availableRoutes, routesLoading,
        routeChain, selectedRouteIds,
        addRouteToChain, removeRouteFromChain, clearRouteChain,
    };
};

export default useTripForm;