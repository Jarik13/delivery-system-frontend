import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogActions, TextField,
    Box, Typography, Button, alpha, Grid
} from '@mui/material';
import { PersonAdd, CheckCircle } from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

const initialForm = {
    firstName: '',
    lastName: '',
    middleName: '',
    phoneNumber: '+380',
    email: '',
};

const CreateClientDialog = ({ open, onClose, onCreated, mainColor }) => {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const set = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await DictionaryApi.create('clients', form);
            onCreated(res.data);
            setForm(initialForm);
            setErrors({});
            onClose();
        } catch (error) {
            const serverErrors = error.response?.data?.validationErrors;
            if (serverErrors) setErrors(serverErrors);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm(initialForm);
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 3 } }}>

            <Box sx={{
                p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                borderRadius: '12px 12px 0 0'
            }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '10px', display: 'flex' }}>
                    <PersonAdd sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', fontSize: 16 }}>
                        Новий клієнт
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Заповніть дані для створення клієнта
                    </Typography>
                </Box>
            </Box>

            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Прізвище" fullWidth required
                                value={form.lastName}
                                onChange={(e) => set('lastName', e.target.value)}
                                error={!!errors.lastName}
                                helperText={errors.lastName}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Ім'я" fullWidth required
                                value={form.firstName}
                                onChange={(e) => set('firstName', e.target.value)}
                                error={!!errors.firstName}
                                helperText={errors.firstName}
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        label="По-батькові" fullWidth
                        value={form.middleName}
                        onChange={(e) => set('middleName', e.target.value)}
                        error={!!errors.middleName}
                        helperText={errors.middleName}
                    />

                    <TextField
                        label="Телефон" fullWidth required
                        value={form.phoneNumber}
                        onChange={(e) => set('phoneNumber', e.target.value)}
                        error={!!errors.phoneNumber}
                        helperText={errors.phoneNumber || '+380xxxxxxxxx'}
                        placeholder="+380501234567"
                    />

                    <TextField
                        label="Email" fullWidth
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        error={!!errors.email}
                        helperText={errors.email}
                        placeholder="ivan@mail.com"
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f0f0f0', gap: 1 }}>
                <Button onClick={handleClose} sx={{ color: '#666' }}>Скасувати</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    startIcon={<CheckCircle />}
                    sx={{ bgcolor: mainColor }}
                >
                    Створити клієнта
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateClientDialog;