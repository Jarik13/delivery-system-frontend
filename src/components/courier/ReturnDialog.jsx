import React, { useState, useEffect } from 'react';
import {
    Box, Typography, alpha, IconButton, CircularProgress,
    Dialog, DialogContent, DialogActions, Button, FormControl, InputLabel,
    Select, MenuItem, FormHelperText, Alert,
} from '@mui/material';
import { AssignmentReturn, Close } from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

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
                    Оформити повернення
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReturnDialog;