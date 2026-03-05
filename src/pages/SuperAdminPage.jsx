import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, TextField,
    Select, FormControl, InputLabel, alpha, Chip, IconButton,
    Alert, Snackbar, Table, TableBody, TableCell, TableHead,
    TableRow, CircularProgress, Tooltip, MenuItem,
} from '@mui/material';
import {
    Add, Delete, AdminPanelSettings, PersonAdd,
    MarkEmailRead, Logout, Refresh,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { AuthApi, UserApi } from '../api/dictionaries';
import { useNavigate } from 'react-router-dom';

const ROLES = [
    { value: 'EMPLOYEE', label: 'Працівник', color: '#2196f3' },
    { value: 'COURIER', label: "Кур'єр", color: '#4caf50' },
    { value: 'DRIVER', label: 'Водій', color: '#ff9800' },
    { value: 'ADMIN', label: 'Адміністратор', color: '#9c27b0' },
    { value: 'SUPER_ADMIN', label: 'Супер адмін', color: '#f44336' },
];

const getRoleInfo = (role) => ROLES.find(r => r.value === role) || { label: role, color: '#757575' };

const SuperAdminPage = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE' });
    const [formError, setFormError] = useState('');
    const [creating, setCreating] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data } = await UserApi.getAll();
            setUsers(data);
        } catch {
            setNotification({ open: true, message: 'Помилка завантаження користувачів', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleCreate = async () => {
        if (!form.email || !form.firstName || !form.lastName) {
            setFormError('Заповніть всі поля');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(form.email)) {
            setFormError('Введіть коректний email');
            return;
        }
        setFormError('');
        setCreating(true);
        try {
            await UserApi.create(form);
            setNotification({
                open: true,
                message: `Користувача створено. Посилання надіслано на ${form.email}`,
                severity: 'success',
            });
            setForm({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE' });
            loadUsers();
        } catch (e) {
            setNotification({
                open: true,
                message: e.message || 'Помилка створення користувача',
                severity: 'error',
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (keycloakId, email) => {
        if (!window.confirm(`Видалити користувача ${email}?`)) return;
        try {
            await UserApi.delete(keycloakId);
            setNotification({ open: true, message: 'Користувача видалено', severity: 'success' });
            loadUsers();
        } catch {
            setNotification({ open: true, message: 'Помилка видалення', severity: 'error' });
        }
    };

    const handleResendEmail = async (keycloakId) => {
        try {
            await UserApi.resendEmail(keycloakId);
            setNotification({ open: true, message: 'Email надіслано повторно', severity: 'success' });
        } catch {
            setNotification({ open: true, message: 'Помилка відправки email', severity: 'error' });
        }
    };

    const handleLogout = async () => {
        await AuthApi.logout();
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: 3 }}>
            <Paper elevation={0} sx={{
                p: 2.5, mb: 3, borderRadius: 3,
                background: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(244,67,54,0.3)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: 2, display: 'flex' }}>
                        <AdminPanelSettings fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Панель супер адміністратора</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>{auth?.email}</Typography>
                    </Box>
                </Box>
                <Button variant="contained" startIcon={<Logout />} onClick={handleLogout}
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                        textTransform: 'none', fontWeight: 600,
                    }}>
                    Вийти
                </Button>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAdd fontSize="small" color="primary" />
                    Додати користувача
                </Typography>

                {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <TextField size="small" label="Email" value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        sx={{ flex: '1 1 220px' }} />
                    <TextField size="small" label="Ім'я" value={form.firstName}
                        onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                        sx={{ flex: '1 1 160px' }} />
                    <TextField size="small" label="Прізвище" value={form.lastName}
                        onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                        sx={{ flex: '1 1 160px' }} />
                    <FormControl size="small" sx={{ flex: '1 1 160px' }}>
                        <InputLabel>Роль</InputLabel>
                        <Select value={form.role} label="Роль"
                            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                            {ROLES.map(r => (
                                <MenuItem key={r.value} value={r.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color }} />
                                        {r.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained"
                        startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <Add />}
                        onClick={handleCreate} disabled={creating}
                        sx={{ bgcolor: '#673ab7', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#512da8' }, height: 40 }}>
                        Створити
                    </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                    Після створення користувач отримає email з посиланням для встановлення пароля
                </Typography>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Користувачі системи
                        <Typography component="span" variant="caption" sx={{ ml: 1, color: '#94a3b8', fontWeight: 500 }}>
                            ({users.length})
                        </Typography>
                    </Typography>
                    <Tooltip title="Оновити">
                        <IconButton size="small" onClick={loadUsers} disabled={loading}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {loading ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                        <CircularProgress size={36} sx={{ color: '#673ab7' }} />
                    </Box>
                ) : users.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">Користувачів ще немає</Typography>
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                {['Email', "Ім'я", 'Роль', 'Статус', 'Дії'].map((h, i) => (
                                    <TableCell key={h} align={i === 4 ? 'right' : 'left'}
                                        sx={{ fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map(user => {
                                const roleInfo = getRoleInfo(user.role);
                                return (
                                    <TableRow key={user.keycloakId} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{user.email}</TableCell>
                                        <TableCell sx={{ fontSize: 13 }}>{user.firstName} {user.lastName}</TableCell>
                                        <TableCell>
                                            <Chip label={roleInfo.label} size="small" sx={{
                                                bgcolor: alpha(roleInfo.color, 0.1), color: roleInfo.color,
                                                fontWeight: 700, fontSize: 11,
                                                border: `1px solid ${alpha(roleInfo.color, 0.2)}`,
                                            }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.emailVerified ? 'Активний' : 'Очікує підтвердження'}
                                                size="small"
                                                sx={{
                                                    bgcolor: user.emailVerified ? alpha('#4caf50', 0.1) : alpha('#ff9800', 0.1),
                                                    color: user.emailVerified ? '#4caf50' : '#ff9800',
                                                    fontWeight: 600, fontSize: 11,
                                                }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                {!user.emailVerified && (
                                                    <Tooltip title="Надіслати email повторно">
                                                        <IconButton size="small"
                                                            onClick={() => handleResendEmail(user.keycloakId)}
                                                            sx={{ color: '#ff9800' }}>
                                                            <MarkEmailRead fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Видалити">
                                                    <IconButton size="small"
                                                        onClick={() => handleDelete(user.keycloakId, user.email)}
                                                        sx={{ color: '#ef4444' }}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            <Snackbar open={notification.open} autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SuperAdminPage;