import { useState, useEffect, useCallback } from 'react';
import { DictionaryApi } from '../../../api/dictionaries';

const EMPTY_FORM = {
    courierId: null,
    plannedDepartureTime: null,
};

export default function useRouteListForm({ open, routeListToEdit, onSuccess, onClose }) {
    const isEditMode = Boolean(routeListToEdit);

    const [activeStep, setActiveStep]         = useState(0);
    const [direction, setDirection]           = useState(1);
    const [form, setForm]                     = useState(EMPTY_FORM);
    const [loadingData, setLoadingData]       = useState(false);

    const [availableShipments, setAvailableShipments] = useState([]);
    const [loadingShipments, setLoadingShipments]     = useState(false);
    const [selectedShipmentIds, setSelectedShipmentIds] = useState(new Set());
    const [shipmentSearch, setShipmentSearch] = useState('');
    const [streetFilter, setStreetFilter]     = useState('');

    useEffect(() => {
        if (!open) return;
        setActiveStep(0);
        setDirection(1);
        setSelectedShipmentIds(new Set());
        setShipmentSearch('');
        setStreetFilter('');

        if (isEditMode && routeListToEdit) {
            setLoadingData(true);
            DictionaryApi.getById('route-lists', routeListToEdit.id)
                .then(res => {
                    const d = res.data;
                    setForm({
                        courierId: d.courierId ?? null,
                        plannedDepartureTime: d.plannedDepartureTime ?? null,
                    });
                    const ids = (d.shipments ?? []).map(s => s.id);
                    setSelectedShipmentIds(new Set(ids));
                })
                .catch(console.error)
                .finally(() => setLoadingData(false));
        } else {
            setForm(EMPTY_FORM);
        }
    }, [open, isEditMode, routeListToEdit?.id]);

    useEffect(() => {
        if (activeStep !== 1) return;
        setLoadingShipments(true);
        DictionaryApi.getAll('shipments/available-for-route-list', 0, 1000)
            .then(res => setAvailableShipments(res.data.content ?? res.data ?? []))
            .catch(console.error)
            .finally(() => setLoadingShipments(false));
    }, [activeStep]);

    const go = useCallback((next) => {
        setDirection(next > activeStep ? 1 : -1);
        setActiveStep(next);
    }, [activeStep]);

    const toggleShipment = useCallback((id) => {
        setSelectedShipmentIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback((visibleIds) => {
        setSelectedShipmentIds(prev => {
            const allSelected = visibleIds.every(id => prev.has(id));
            const next = new Set(prev);
            if (allSelected) visibleIds.forEach(id => next.delete(id));
            else visibleIds.forEach(id => next.add(id));
            return next;
        });
    }, []);

    const filteredShipments = availableShipments.filter(s => {
        const q = shipmentSearch.toLowerCase();
        const matchSearch = !q
            || s.trackingNumber?.toLowerCase().includes(q)
            || s.recipientName?.toLowerCase().includes(q);
        const matchStreet = !streetFilter
            || s.deliveryAddress?.toLowerCase().includes(streetFilter.toLowerCase());
        return matchSearch && matchStreet;
    });

    const sortedShipments = [...filteredShipments].sort((a, b) => {
        if (a.isExpress && !b.isExpress) return -1;
        if (!a.isExpress && b.isExpress)  return 1;
        return (a.deliveryAddress ?? '').localeCompare(b.deliveryAddress ?? '');
    });

    const selectedShipments = availableShipments.filter(s => selectedShipmentIds.has(s.id));
    const totalWeight    = selectedShipments.reduce((acc, s) => acc + (s.weight ?? 0), 0);
    const totalCount     = selectedShipments.length;

    const handleSave = useCallback(async () => {
        const payload = {
            courierId:            form.courierId,
            plannedDepartureTime: form.plannedDepartureTime,
            shipmentIds:          [...selectedShipmentIds],
        };

        if (isEditMode) {
            await DictionaryApi.update('route-lists', routeListToEdit.id, payload);
        } else {
            await DictionaryApi.create('route-lists', payload);
        }
        onSuccess?.();
        onClose?.();
    }, [form, selectedShipmentIds, isEditMode, routeListToEdit, onSuccess, onClose]);

    return {
        isEditMode,
        activeStep, direction,
        form, setForm,
        loadingData,

        availableShipments: sortedShipments,
        loadingShipments,
        selectedShipmentIds,
        selectedShipments,
        totalWeight,
        totalCount,
        toggleShipment,
        toggleAll,

        shipmentSearch, setShipmentSearch,
        streetFilter,   setStreetFilter,

        go,
        handleSave,
    };
}