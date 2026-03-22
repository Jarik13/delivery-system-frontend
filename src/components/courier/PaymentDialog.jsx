import React, { useState, useEffect } from 'react';
import {
    Box, Typography, alpha, IconButton, CircularProgress,
    Dialog, DialogContent, DialogActions, Button, FormControl, InputLabel,
    Select, MenuItem, FormHelperText, Alert,
} from '@mui/material';
import { Payment, Close } from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

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
            const ve = e?.response?.data?.validationErrors;
            if (ve) {
                const firstMsg = Object.values(ve)[0];
                setError(firstMsg);
            } else {
                setError(e?.response?.data?.message || 'Помилка оформлення платежу');
            }
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

export default PaymentDialog;