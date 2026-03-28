import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogContent, DialogActions, Box, Typography, Button,
    CircularProgress, alpha, IconButton
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';
import StepShipments from './steps/StepShipments';
import { MAX_WEIGHT, MAX_SHIPMENTS } from './utils';

const AddShipmentDialog = ({ open, onClose, onSuccess, mainColor, routeList }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [availableShipments, setAvailableShipments] = useState([]);
    const [selectedShipmentIds, setSelectedShipmentIds] = useState(new Set());
    const [shipmentSearch, setShipmentSearch] = useState('');
    const [streetFilter, setStreetFilter] = useState('');
    const [error, setError] = useState(null);

    const existingIds = useMemo(() =>
        new Set((routeList?.items ?? routeList?.shipments ?? routeList?.routeSheetItems ?? []).map(s => s.id)),
        [routeList]
    );

    useEffect(() => {
        if (!open) return;
        setSelectedShipmentIds(new Set());
        setShipmentSearch('');
        setStreetFilter('');
        setError(null);
        setLoading(true);
        DictionaryApi.getAll('shipments/available-for-route-list', 0, 1000)
            .then(res => setAvailableShipments(res.data.content ?? res.data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [open]);

    const filtered = useMemo(() => {
        const q = shipmentSearch.toLowerCase();
        return availableShipments.filter(s => {
            const matchSearch = !q
                || s.trackingNumber?.toLowerCase().includes(q)
                || s.recipientName?.toLowerCase().includes(q);
            const matchStreet = !streetFilter
                || s.deliveryAddress?.toLowerCase().includes(streetFilter.toLowerCase());
            return matchSearch && matchStreet;
        });
    }, [availableShipments, shipmentSearch, streetFilter]);

    const selectedShipments = filtered.filter(s => selectedShipmentIds.has(s.id));

    const existingWeight = (routeList?.items ?? routeList?.shipments ?? routeList?.routeSheetItems ?? [])
        .reduce((acc, s) => acc + (s.weight ?? 0), 0);
    const existingCount = existingIds.size;

    const totalWeight = existingWeight + selectedShipments.reduce((acc, s) => acc + (s.weight ?? 0), 0);
    const totalCount = existingCount + selectedShipments.length;

    const toggleShipment = (id) => {
        setSelectedShipmentIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (totalCount >= MAX_SHIPMENTS) {
                    setError(`Максимум ${MAX_SHIPMENTS} відправлень у маршрутному листі`);
                    return prev;
                }

                const shipment = availableShipments.find(s => s.id === id);
                if (shipment && totalWeight + (shipment.weight ?? 0) > MAX_WEIGHT) {
                    setError(`Перевищено максимальну вагу ${MAX_WEIGHT} кг`);
                    return prev;
                }
                setError(null);
                next.add(id);
            }
            return next;
        });
    };

    const toggleAll = (ids) => {
        setSelectedShipmentIds(prev => {
            const allSelected = ids.every(id => prev.has(id));
            const next = new Set(prev);
            if (allSelected) {
                ids.forEach(id => next.delete(id));
            } else {
                for (const id of ids) {
                    if (next.size >= MAX_SHIPMENTS) {
                        setError(`Максимум ${MAX_SHIPMENTS} відправлень`);
                        break;
                    }
                    const shipment = availableShipments.find(s => s.id === id);
                    const currentWeight = [...next]
                        .map(sid => availableShipments.find(s => s.id === sid)?.weight ?? 0)
                        .reduce((a, b) => a + b, 0);
                    if (shipment && currentWeight + (shipment.weight ?? 0) > MAX_WEIGHT) {
                        setError(`Перевищено максимальну вагу ${MAX_WEIGHT} кг`);
                        break;
                    }
                    next.add(id);
                }
            }
            return next;
        });
    };

    const handleSave = async () => {
        if (selectedShipmentIds.size === 0) {
            setError('Оберіть хоча б одне відправлення');
            return;
        }
        setSaving(true);
        try {
            await DictionaryApi.patch(`route-lists/${routeList.id}/shipments`, {
                shipmentIds: [...selectedShipmentIds],
            });
            onSuccess?.('Відправлення додано успішно');
            onClose();
        } catch (e) {
            setError(e.response?.data?.message || 'Помилка збереження');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
            <Box sx={{
                p: 2.5, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px', display: 'flex' }}>
                        <Add sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="white">
                            Додати відправлення
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Маршрутний лист №{routeList?.number}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ pt: 3, px: 3, minHeight: 400 }}>
                {error && (
                    <Box sx={{
                        mb: 2, p: 1.5, borderRadius: 2,
                        bgcolor: alpha('#f44336', 0.06),
                        border: `1px solid ${alpha('#f44336', 0.25)}`,
                    }}>
                        <Typography variant="caption" color="error">{error}</Typography>
                    </Box>
                )}
                <StepShipments
                    direction={1}
                    mainColor={mainColor}
                    availableShipments={filtered}
                    loadingShipments={loading}
                    selectedShipmentIds={selectedShipmentIds}
                    totalWeight={totalWeight}
                    totalCount={totalCount}
                    toggleShipment={toggleShipment}
                    toggleAll={toggleAll}
                    shipmentSearch={shipmentSearch}
                    setShipmentSearch={setShipmentSearch}
                    streetFilter={streetFilter}
                    setStreetFilter={setStreetFilter}
                    errors={{}}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f0f0f0', gap: 1 }}>
                <Button onClick={onClose} sx={{ color: '#666' }}>Скасувати</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || selectedShipmentIds.size === 0}
                    startIcon={saving
                        ? <CircularProgress size={16} color="inherit" />
                        : <Add />
                    }
                    sx={{ bgcolor: mainColor, px: 3 }}
                >
                    Додати {selectedShipmentIds.size > 0 ? `(${selectedShipmentIds.size})` : ''}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddShipmentDialog;