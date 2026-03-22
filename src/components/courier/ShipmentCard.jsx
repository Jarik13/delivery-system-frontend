import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, alpha, IconButton, Tooltip, CircularProgress,
    Dialog, DialogContent, DialogActions, Button, FormControl, InputLabel,
    Select, MenuItem, FormHelperText, Alert,
} from '@mui/material';
import {
    CheckCircle, LocalShipping, PendingActions, Cancel,
    RadioButtonUnchecked, TaskAlt, ErrorOutline,
    AssignmentReturn, Payment, Close,
} from '@mui/icons-material';
import { SHIPMENT_STATUS_COLORS, getStatusColor } from '../../constants/statusColors';
import { DictionaryApi } from '../../api/dictionaries';

const STATUS_ICONS = {
    'Доставлено': CheckCircle,
    'Видано кур\'єру': LocalShipping,
    'Спроба вручення провалена': PendingActions,
    'Відмова': Cancel,
    'У процесі доставки': RadioButtonUnchecked,
};

const ACTIONABLE_STATUSES = ['Видано кур\'єру', 'Спроба вручення провалена', 'У процесі доставки'];

const ReturnDialog = ({ open, onClose, item, onSuccess }) => {
    const [reasons, setReasons] = useState([]);
    const [reasonId, setReasonId] = useState('');
    const [error, setError] = useState(null);
    const [fieldError, setFieldError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setReasonId('');
            setError(null);
            setFieldError(null);
            DictionaryApi.getAll('return-reasons', 0, 100)
                .then(r => setReasons(r.data.content || []))
                .catch(console.error);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!reasonId) { setFieldError('Оберіть причину повернення'); return; }
        setLoading(true);
        setError(null);
        try {
            await DictionaryApi.create('returns', {
                shipmentId: item.shipmentId,
                returnReasonId: reasonId,
                refundAmount: item.totalPrice || null,
            });
            onSuccess('Повернення оформлено успішно');
            onClose();
        } catch (e) {
            setError(e?.response?.data?.message || 'Помилка оформлення повернення');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <Box sx={{
                p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #f44336, #e53935)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentReturn sx={{ color: 'white', fontSize: 20 }} />
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="white">
                            Оформлення повернення
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            ТТН: {item?.trackingNumber}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ pt: 2.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                <Box sx={{
                    p: 1.5, borderRadius: 2,
                    bgcolor: alpha('#f44336', 0.04),
                    border: `1px solid ${alpha('#f44336', 0.15)}`,
                }}>
                    <Typography variant="body2" fontWeight={700}>{item?.recipientFullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{item?.deliveryAddress}</Typography>
                    {item?.totalPrice && (
                        <Typography variant="body2" fontWeight={800} color="#f44336" sx={{ mt: 0.5 }}>
                            Вартість: {item.totalPrice} ₴
                        </Typography>
                    )}
                </Box>

                <FormControl fullWidth size="small" error={!!fieldError}>
                    <InputLabel>Причина повернення *</InputLabel>
                    <Select
                        value={reasonId}
                        label="Причина повернення *"
                        onChange={e => { setReasonId(e.target.value); setFieldError(null); }}
                        sx={{ borderRadius: 2 }}
                    >
                        {reasons.map(r => (
                            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                        ))}
                    </Select>
                    {fieldError && <FormHelperText>{fieldError}</FormHelperText>}
                </FormControl>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
                <Button onClick={onClose} sx={{ color: '#666' }}>Скасувати</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AssignmentReturn />}
                    sx={{ bgcolor: '#f44336', borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: '#c62828' } }}
                >
                    Оформити
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const PaymentDialog = ({ open, onClose, item, paymentTypes, onSuccess }) => {
    const [paymentTypeId, setPaymentTypeId] = useState('');
    const [error, setError] = useState(null);
    const [fieldError, setFieldError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setPaymentTypeId('');
            setError(null);
            setFieldError(null);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!paymentTypeId) { setFieldError('Оберіть тип оплати'); return; }
        setLoading(true);
        setError(null);
        try {
            await DictionaryApi.create('payments', {
                shipmentId: item.shipmentId,
                paymentTypeId,
                amount: item.remainingAmount || item.totalPrice,
            });
            onSuccess('Платіж оформлено успішно');
            onClose();
        } catch (e) {
            setError(e?.response?.data?.message || 'Помилка оформлення платежу');
        } finally {
            setLoading(false);
        }
    };

    const amount = item?.remainingAmount || item?.totalPrice;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <Box sx={{
                p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Payment sx={{ color: 'white', fontSize: 20 }} />
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="white">
                            Оформлення платежу
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            ТТН: {item?.trackingNumber}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ pt: 2.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                <Box sx={{
                    p: 1.5, borderRadius: 2,
                    bgcolor: alpha('#2e7d32', 0.04),
                    border: `1px solid ${alpha('#2e7d32', 0.15)}`,
                }}>
                    <Typography variant="body2" fontWeight={700}>{item?.recipientFullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{item?.deliveryAddress}</Typography>
                    {amount && (
                        <Typography variant="body2" fontWeight={800} color="#2e7d32" sx={{ mt: 0.5 }}>
                            До оплати: {amount} ₴
                        </Typography>
                    )}
                </Box>

                <FormControl fullWidth size="small" error={!!fieldError}>
                    <InputLabel>Тип оплати *</InputLabel>
                    <Select
                        value={paymentTypeId}
                        label="Тип оплати *"
                        onChange={e => { setPaymentTypeId(e.target.value); setFieldError(null); }}
                        sx={{ borderRadius: 2 }}
                    >
                        {(paymentTypes || []).map(t => (
                            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                        ))}
                    </Select>
                    {fieldError && <FormHelperText>{fieldError}</FormHelperText>}
                </FormControl>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
                <Button onClick={onClose} sx={{ color: '#666' }}>Скасувати</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Payment />}
                    sx={{ bgcolor: '#2e7d32', borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: '#1b5e20' } }}
                >
                    Підтвердити оплату
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── ShipmentCard ─────────────────────────────────────────────────────────────
const ShipmentCard = ({ item, routeListId, paymentTypes, onStatusChange, onNotify }) => {
    const [loading, setLoading] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);

    const statusName = item.shipmentStatusName || (item.isDelivered ? 'Доставлено' : 'У процесі доставки');
    const color = getStatusColor(SHIPMENT_STATUS_COLORS, statusName);
    const Icon = STATUS_ICONS[statusName] || RadioButtonUnchecked;
    const canAct = ACTIONABLE_STATUSES.includes(statusName);

    const handleAction = async (action) => {
        if (!routeListId || !item.id) return;

        // REFUSED → спочатку діалог повернення
        if (action === 'REFUSED') {
            setReturnOpen(true);
            return;
        }

        setLoading(true);
        try {
            await DictionaryApi.patch(`route-lists/items/${item.id}/status`, { action });

            // DELIVERED + є накладний платіж → відкрити платіж
            if (action === 'DELIVERED' && item.hasCod && item.remainingAmount > 0) {
                setPaymentOpen(true);
            } else {
                onStatusChange?.();
            }
        } catch (e) {
            console.error(e);
            onNotify?.('Помилка оновлення статусу', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReturnSuccess = (msg) => {
        // після повернення — оновити статус на REFUSED
        DictionaryApi.patch(`route-lists/items/${item.id}/status`, { action: 'REFUSED' })
            .catch(console.error)
            .finally(() => {
                onStatusChange?.();
                onNotify?.(msg, 'success');
            });
    };

    return (
        <>
            <Box sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                p: 1.5, borderRadius: 2,
                bgcolor: alpha(color, 0.05),
                border: `1px solid ${alpha(color, 0.15)}`,
                mb: 1,
            }}>
                <Box sx={{
                    mt: 0.3, width: 32, height: 32, borderRadius: '50%',
                    bgcolor: alpha(color, 0.12),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon sx={{ fontSize: 16, color }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{
                        fontFamily: 'monospace', fontWeight: 700,
                        bgcolor: alpha('#000', 0.06), px: 0.75, py: 0.2,
                        borderRadius: 0.75, fontSize: 11, color: 'text.secondary',
                    }}>
                        {item.trackingNumber}
                    </Typography>

                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, lineHeight: 1.3 }}>
                        {item.recipientFullName || '—'}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{
                        display: 'block', mt: 0.25,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {item.deliveryAddress || 'Самовивіз з відділення'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                        <Chip
                            label={statusName}
                            size="small"
                            sx={{
                                height: 20, fontSize: 10, fontWeight: 700,
                                bgcolor: alpha(color, 0.1), color,
                                border: `1px solid ${alpha(color, 0.25)}`,
                            }}
                        />
                        {item.weight != null && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                                {item.weight} кг
                            </Typography>
                        )}
                        {item.hasCod && item.remainingAmount > 0 && (
                            <Chip
                                label={`Накладний: ${item.remainingAmount} ₴`}
                                size="small"
                                sx={{
                                    height: 20, fontSize: 10, fontWeight: 700,
                                    bgcolor: alpha('#ff9800', 0.1), color: '#ff9800',
                                    border: `1px solid ${alpha('#ff9800', 0.3)}`,
                                }}
                            />
                        )}
                        {item.deliveredAt && (
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                                {new Date(item.deliveredAt).toLocaleString('uk-UA', {
                                    day: '2-digit', month: '2-digit',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </Typography>
                        )}
                    </Box>

                    {canAct && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                            {loading ? (
                                <CircularProgress size={18} sx={{ color: '#4caf50' }} />
                            ) : (
                                <>
                                    <Tooltip title="Доставлено">
                                        <IconButton size="small" onClick={() => handleAction('DELIVERED')}
                                            sx={{
                                                bgcolor: alpha('#4caf50', 0.1), color: '#4caf50',
                                                border: `1px solid ${alpha('#4caf50', 0.3)}`,
                                                borderRadius: 1.5, p: 0.5,
                                                '&:hover': { bgcolor: alpha('#4caf50', 0.2) },
                                            }}>
                                            <TaskAlt sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Спроба вручення провалена">
                                        <IconButton size="small" onClick={() => handleAction('FAILED')}
                                            sx={{
                                                bgcolor: alpha('#ff9800', 0.1), color: '#ff9800',
                                                border: `1px solid ${alpha('#ff9800', 0.3)}`,
                                                borderRadius: 1.5, p: 0.5,
                                                '&:hover': { bgcolor: alpha('#ff9800', 0.2) },
                                            }}>
                                            <ErrorOutline sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Відмова — оформити повернення">
                                        <IconButton size="small" onClick={() => handleAction('REFUSED')}
                                            sx={{
                                                bgcolor: alpha('#f44336', 0.1), color: '#f44336',
                                                border: `1px solid ${alpha('#f44336', 0.3)}`,
                                                borderRadius: 1.5, p: 0.5,
                                                '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                                            }}>
                                            <Cancel sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            <ReturnDialog
                open={returnOpen}
                onClose={() => setReturnOpen(false)}
                item={item}
                onSuccess={handleReturnSuccess}
            />

            <PaymentDialog
                open={paymentOpen}
                onClose={() => { setPaymentOpen(false); onStatusChange?.(); }}
                item={item}
                paymentTypes={paymentTypes}
                onSuccess={(msg) => {
                    setPaymentOpen(false);
                    onStatusChange?.();
                    onNotify?.(msg, 'success');
                }}
            />
        </>
    );
};

export default ShipmentCard;