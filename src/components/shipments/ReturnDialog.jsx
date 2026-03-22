import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogActions, Box, Typography,
    Button, TextField, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, alpha, IconButton,
    FormHelperText,
} from '@mui/material';
import { AssignmentReturn, Close, CheckCircle } from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

const ReturnDialog = ({ open, onClose, shipment, onSuccess }) => {
    const mainColor = '#f44336';
    const [reasons, setReasons] = useState([]);
    const [form, setForm] = useState({ returnReasonId: '', refundAmount: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (open) {
            DictionaryApi.getAll('return-reasons', 0, 100)
                .then(r => setReasons(r.data.content || []))
                .catch(console.error);
            setForm({
                returnReasonId: '',
                refundAmount: shipment?.totalPrice || '',
            });
            setError(null);
        }
    }, [open, shipment]);

    const handleSubmit = async () => {
        if (!form.returnReasonId) {
            setFieldErrors({ returnReasonId: 'Оберіть причину повернення' });
            return;
        }
        setLoading(true);
        setError(null);
        setFieldErrors({});
        try {
            const res = await DictionaryApi.create('returns', {
                shipmentId: shipment.id,
                returnReasonId: form.returnReasonId,
                refundAmount: parseFloat(form.refundAmount) || null,
            });
            onSuccess(`Повернення оформлено. Зворотне ТТН: ${res.data.returnShipmentTrackingNumber}`);
            onClose();
        } catch (e) {
            const ve = e?.response?.data?.validationErrors;
            if (ve) {
                setFieldErrors(ve);
            } else {
                setError(e?.response?.data?.message || 'Помилка оформлення повернення');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!shipment) return null;

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
                        <AssignmentReturn sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="white">
                            Оформлення повернення
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
                {error && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                )}

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
                    <Typography variant="body2" fontWeight={800} color={mainColor} sx={{ mt: 0.5 }}>
                        Вартість: {shipment.totalPrice} ₴
                    </Typography>
                </Box>

                <FormControl fullWidth size="small" error={!!fieldErrors.returnReasonId}>
                    <InputLabel>Причина повернення *</InputLabel>
                    <Select
                        value={form.returnReasonId}
                        label="Причина повернення *"
                        onChange={e => {
                            setForm(p => ({ ...p, returnReasonId: e.target.value }));
                            setFieldErrors(p => ({ ...p, returnReasonId: null }));
                        }}
                        sx={{ borderRadius: 2 }}
                    >
                        {reasons.map(r => (
                            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                        ))}
                    </Select>
                    {fieldErrors.returnReasonId && (
                        <FormHelperText>{fieldErrors.returnReasonId}</FormHelperText>
                    )}
                </FormControl>

                <TextField
                    fullWidth size="small"
                    label="Сума повернення (₴)"
                    type="number"
                    value={form.refundAmount}
                    disabled
                    helperText="Сума повернення відповідає вартості відправлення"
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
                        '&:hover': { bgcolor: '#c62828' }
                    }}
                >
                    Оформити повернення
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReturnDialog;