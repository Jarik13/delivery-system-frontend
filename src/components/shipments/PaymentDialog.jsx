import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogActions, Box, Typography,
    Button, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, alpha, IconButton, TextField,
    FormHelperText, Chip,
} from '@mui/material';
import { Payment, Close, CheckCircle } from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

const PaymentDialog = ({ open, onClose, shipment, paymentTypes = [], onSuccess }) => {
    const mainColor = '#2e7d32';
    const [form, setForm] = useState({ paymentTypeId: '', amount: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (open && shipment) {
            setForm({
                paymentTypeId: '',
                amount: shipment.remainingAmount > 0
                    ? shipment.remainingAmount
                    : shipment.totalPrice || '',
            });
            setError(null);
            setFieldErrors({});
        }
    }, [open, shipment]);

    const handleSubmit = async () => {
        const errs = {};
        if (!form.paymentTypeId) errs.paymentTypeId = 'Оберіть тип оплати';
        if (!form.amount || parseFloat(form.amount) <= 0)
            errs.amount = 'Сума має бути більше 0';
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

        setLoading(true);
        setError(null);
        setFieldErrors({});
        try {
            await DictionaryApi.create('payments', {
                shipmentId: shipment.id,
                paymentTypeId: form.paymentTypeId,
                amount: parseFloat(form.amount),
            });
            onSuccess('Платіж оформлено успішно');
            onClose();
        } catch (e) {
            const ve = e?.response?.data?.validationErrors;
            if (ve) setFieldErrors(ve);
            else setError(e?.response?.data?.message || 'Помилка оформлення платежу');
        } finally {
            setLoading(false);
        }
    };

    if (!shipment) return null;

    const remaining = shipment.remainingAmount || 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

            <Box sx={{
                p: 2.5, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px', display: 'flex' }}>
                        <Payment sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="white">
                            Оформлення платежу
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            ТТН: {shipment.trackingNumber}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                <Box sx={{
                    p: 2, borderRadius: 2,
                    bgcolor: alpha(mainColor, 0.04),
                    border: `1px solid ${alpha(mainColor, 0.15)}`,
                }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                        sx={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>
                        Відправлення
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>
                        {shipment.parcelDescription || 'Без опису'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {shipment.senderFullName} → {shipment.recipientFullName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Chip size="small" label={`Загалом: ${shipment.totalPrice} ₴`}
                            sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
                        <Chip size="small"
                            label={`Оплачено: ${shipment.totalPaidAmount || 0} ₴`}
                            sx={{
                                fontSize: '0.7rem', fontWeight: 700,
                                bgcolor: alpha('#2e7d32', 0.1), color: '#2e7d32'
                            }} />
                        {remaining > 0 && (
                            <Chip size="small"
                                label={`Борг: ${remaining} ₴`}
                                sx={{
                                    fontSize: '0.7rem', fontWeight: 700,
                                    bgcolor: alpha('#d32f2f', 0.1), color: '#d32f2f'
                                }} />
                        )}
                    </Box>
                </Box>

                <FormControl fullWidth size="small" error={!!fieldErrors.paymentTypeId}>
                    <InputLabel>Тип оплати *</InputLabel>
                    <Select
                        value={form.paymentTypeId}
                        label="Тип оплати *"
                        onChange={e => {
                            setForm(p => ({ ...p, paymentTypeId: e.target.value }));
                            setFieldErrors(p => ({ ...p, paymentTypeId: null }));
                        }}
                        sx={{ borderRadius: 2 }}
                    >
                        {paymentTypes.map(t => (
                            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                        ))}
                    </Select>
                    {fieldErrors.paymentTypeId && (
                        <FormHelperText>{fieldErrors.paymentTypeId}</FormHelperText>
                    )}
                </FormControl>

                <TextField
                    fullWidth size="small"
                    label="Сума платежу (₴) *"
                    type="number"
                    value={form.amount}
                    onChange={e => {
                        setForm(p => ({ ...p, amount: e.target.value }));
                        setFieldErrors(p => ({ ...p, amount: null }));
                    }}
                    error={!!fieldErrors.amount}
                    helperText={fieldErrors.amount || (remaining > 0
                        ? `Залишок до сплати: ${remaining} ₴`
                        : 'Введіть суму платежу')}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f0f0f0', gap: 1 }}>
                <Button onClick={onClose} sx={{ color: '#666' }}>Скасувати</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading
                        ? <CircularProgress size={16} color="inherit" />
                        : <CheckCircle />}
                    sx={{
                        bgcolor: mainColor, borderRadius: 2, fontWeight: 700,
                        '&:hover': { bgcolor: '#1b5e20' }
                    }}
                >
                    Оформити платіж
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentDialog;