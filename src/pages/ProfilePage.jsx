import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, alpha,
    Snackbar, Alert, CircularProgress, Divider,
} from '@mui/material';
import { Person, Save, BadgeOutlined } from '@mui/icons-material';
import { UserApi } from '../api/dictionaries';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
    const { auth } = useAuth();
    const isDriver = auth?.role === 'ROLE_DRIVER';
    const mainColor = '#5c6bc0';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        phoneNumber: '',
        licenseNumber: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        UserApi.getProfile()
            .then(res => {
                const d = res.data;
                setForm({
                    firstName: d.firstName || '',
                    lastName: d.lastName || '',
                    middleName: d.middleName || '',
                    phoneNumber: d.phoneNumber || '',
                    licenseNumber: d.licenseNumber || '',
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setErrors({});
        try {
            await UserApi.updateProfile(form);
            setNotification({ open: true, message: 'Профіль оновлено', severity: 'success' });
        } catch (e) {
            const ve = e.response?.data?.validationErrors;
            if (ve) setErrors(ve);
            else setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress sx={{ color: mainColor }} />
        </Box>
    );

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Paper elevation={0} sx={{
                borderRadius: 3, overflow: 'hidden',
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.2)}`,
            }}>
                <Box sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '12px', display: 'flex' }}>
                        <Person sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="white">Мій профіль</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {auth?.email}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Typography variant="subtitle2" sx={{
                        fontWeight: 800, textTransform: 'uppercase',
                        color: '#666', display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                        <Person sx={{ color: mainColor, fontSize: 18 }} /> Особисті дані
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth label="Прізвище"
                            value={form.lastName}
                            onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                            error={!!errors.lastName} helperText={errors.lastName}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                            fullWidth label="Ім'я"
                            value={form.firstName}
                            onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                            error={!!errors.firstName} helperText={errors.firstName}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Box>

                    <TextField
                        fullWidth label="По батькові"
                        value={form.middleName}
                        onChange={e => setForm(p => ({ ...p, middleName: e.target.value }))}
                        error={!!errors.middleName} helperText={errors.middleName}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                        fullWidth label="Номер телефону"
                        value={form.phoneNumber}
                        onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                        error={!!errors.phoneNumber} helperText={errors.phoneNumber || '+380XXXXXXXXX або 0XXXXXXXXX'}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {isDriver && (
                        <>
                            <Divider />
                            <Typography variant="subtitle2" sx={{
                                fontWeight: 800, textTransform: 'uppercase',
                                color: '#666', display: 'flex', alignItems: 'center', gap: 1,
                            }}>
                                <BadgeOutlined sx={{ color: mainColor, fontSize: 18 }} /> Водійське посвідчення
                            </Typography>
                            <TextField
                                fullWidth label="Номер ліцензії"
                                value={form.licenseNumber}
                                onChange={e => setForm(p => ({ ...p, licenseNumber: e.target.value }))}
                                error={!!errors.licenseNumber} helperText={errors.licenseNumber}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </>
                    )}

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
                        disabled={saving}
                        onClick={handleSave}
                        sx={{ bgcolor: mainColor, borderRadius: 2, fontWeight: 700, mt: 1 }}
                    >
                        {saving ? 'Збереження...' : 'Зберегти зміни'}
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={notification.open} autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProfilePage;