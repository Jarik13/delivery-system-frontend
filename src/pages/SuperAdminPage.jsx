import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, Button, TextField,
    Select, FormControl, InputLabel, alpha, Chip, IconButton,
    Alert, Snackbar, Table, TableBody, TableCell, TableHead,
    TableRow, CircularProgress, Tooltip, MenuItem, Tabs, Tab, Badge,
} from '@mui/material';
import {
    Add, Delete, AdminPanelSettings, PersonAdd,
    MarkEmailRead, Logout, Refresh, History, FiberManualRecord,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { AuthApi, UserApi, DictionaryApi } from '../api/dictionaries';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';

const ROLES = [
    { value: 'EMPLOYEE', label: 'Працівник', color: '#2196f3' },
    { value: 'COURIER', label: "Кур'єр", color: '#4caf50' },
    { value: 'DRIVER', label: 'Водій', color: '#ff9800' },
    { value: 'ADMIN', label: 'Адміністратор', color: '#9c27b0' },
    { value: 'SUPER_ADMIN', label: 'Супер адмін', color: '#f44336' },
];

const ACTION_COLORS = {
    CREATE_USER: '#4caf50',
    DELETE_USER: '#f44336',
    UPDATE_ROLE: '#2196f3',
    RESEND_EMAIL: '#ff9800',
};

const getRoleInfo = (role) => ROLES.find(r => r.value === role) || { label: role, color: '#757575' };

const EMPTY_FORM = {
    email: '', firstName: '', lastName: '',
    middleName: '', phoneNumber: '', role: 'EMPLOYEE',
};

const SuperAdminPage = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const stompClient = useRef(null);

    const [tab, setTab] = useState(0);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [creating, setCreating] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [newLogsCount, setNewLogsCount] = useState(0);
    const [wsConnected, setWsConnected] = useState(false);
    const [auditFilters, setAuditFilters] = useState({ performedBy: '', actions: [], statuses: [] });

    useEffect(() => {
        const client = new Client({
            brokerURL: `ws://localhost:4000/ws`,
            connectHeaders: { Authorization: `Bearer ${auth?.accessToken}` },
            onConnect: () => {
                setWsConnected(true);
                client.subscribe('/topic/audit', (message) => {
                    const log = JSON.parse(message.body);
                    setAuditLogs(prev => [log, ...prev].slice(0, 200));
                    if (tab !== 1) setNewLogsCount(prev => prev + 1);
                });
            },
            onDisconnect: () => setWsConnected(false),
            onStompError: () => setWsConnected(false),
            reconnectDelay: 5000,
        });

        client.activate();
        stompClient.current = client;

        return () => client.deactivate();
    }, [auth?.accessToken]);

    const loadAuditLogs = async () => {
        setAuditLoading(true);
        try {
            const params = {
                ...(auditFilters.performedBy && { performedBy: auditFilters.performedBy }),
                ...(auditFilters.actions.length && { actions: auditFilters.actions }),
                ...(auditFilters.statuses.length && { statuses: auditFilters.statuses }),
                size: 100,
                sort: 'performedAt,desc',
            };
            const { data } = await DictionaryApi.getAll('audit', 0, 100, params);
            setAuditLogs(data.content);
        } catch {
            setNotification({ open: true, message: 'Помилка завантаження логів', severity: 'error' });
        } finally {
            setAuditLoading(false);
        }
    };

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
    useEffect(() => { if (tab === 1) { loadAuditLogs(); setNewLogsCount(0); } }, [tab]);

    const handleCreate = async () => {
        setFormError('');
        setCreating(true);
        try {
            const payload = {
                ...form,
                phoneNumber: form.phoneNumber?.trim() || null,
                middleName: form.middleName?.trim() || null,
                firstName: form.firstName?.trim() || null,
                lastName: form.lastName?.trim() || null,
            };
            await UserApi.create(payload);
            setNotification({ open: true, message: `Користувача створено. Посилання надіслано на ${form.email}`, severity: 'success' });
            setForm(EMPTY_FORM);
            loadUsers();
        } catch (e) {
            const errors = e?.response?.data?.validationErrors;
            setFormError(errors ? Object.values(errors).join(', ') : e?.response?.data?.message || 'Помилка створення');
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

    const field = (label, key, props = {}) => (
        <TextField size="small" label={label} value={form[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            {...props} />
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: 3 }}>
            <Paper elevation={0} sx={{
                p: 2.5, mb: 3, borderRadius: 3,
                background: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title={wsConnected ? 'WebSocket підключено' : 'WebSocket відключено'}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FiberManualRecord sx={{ fontSize: 12, color: wsConnected ? '#4caf50' : '#f44336' }} />
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {wsConnected ? 'Live' : 'Offline'}
                            </Typography>
                        </Box>
                    </Tooltip>
                    <Button variant="contained" startIcon={<Logout />} onClick={handleLogout}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', fontWeight: 600 }}>
                        Вийти
                    </Button>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, overflow: 'hidden' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}>
                    <Tab label="Користувачі" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label={
                        <Badge badgeContent={newLogsCount} color="error" max={99}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <History fontSize="small" />
                                Аудит логи
                            </Box>
                        </Badge>
                    } sx={{ textTransform: 'none', fontWeight: 600 }} />
                </Tabs>
            </Paper>

            {tab === 0 && (
                <>
                    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonAdd fontSize="small" color="primary" />
                            Додати користувача
                        </Typography>
                        {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            {field('Email *', 'email', { sx: { flex: '1 1 220px' }, type: 'email' })}
                            {field('Прізвище', 'lastName', { sx: { flex: '1 1 160px' } })}
                            {field("Ім'я", 'firstName', { sx: { flex: '1 1 160px' } })}
                            {field('По батькові', 'middleName', { sx: { flex: '1 1 160px' } })}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            {field('Телефон', 'phoneNumber', { sx: { flex: '1 1 180px' }, placeholder: '+380XXXXXXXXX' })}
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
                                sx={{ bgcolor: '#673ab7', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#512da8' }, height: 40, ml: 'auto' }}>
                                Створити
                            </Button>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                            * Обов'язкове поле. Після створення користувач отримає email з посиланням для встановлення пароля.
                        </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Користувачі системи
                                <Typography component="span" variant="caption" sx={{ ml: 1, color: '#94a3b8', fontWeight: 500 }}>({users.length})</Typography>
                            </Typography>
                            <Tooltip title="Оновити">
                                <IconButton size="small" onClick={loadUsers} disabled={loading}><Refresh fontSize="small" /></IconButton>
                            </Tooltip>
                        </Box>
                        {loading ? (
                            <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress size={36} sx={{ color: '#673ab7' }} /></Box>
                        ) : users.length === 0 ? (
                            <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Користувачів ще немає</Typography></Box>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        {['Email', 'ПІБ', 'Телефон', 'Роль', 'Статус', 'Дії'].map((h, i) => (
                                            <TableCell key={h} align={i === 5 ? 'right' : 'left'}
                                                sx={{ fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                                                {h}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map(user => {
                                        const roleInfo = getRoleInfo(user.role);
                                        const fullName = [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ') || '—';
                                        return (
                                            <TableRow key={user.keycloakId} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{user.email}</TableCell>
                                                <TableCell sx={{ fontSize: 13 }}>{fullName}</TableCell>
                                                <TableCell sx={{ fontSize: 13, color: user.phoneNumber ? 'inherit' : '#94a3b8' }}>{user.phoneNumber || '—'}</TableCell>
                                                <TableCell>
                                                    <Chip label={roleInfo.label} size="small" sx={{
                                                        bgcolor: alpha(roleInfo.color, 0.1), color: roleInfo.color,
                                                        fontWeight: 700, fontSize: 11, border: `1px solid ${alpha(roleInfo.color, 0.2)}`,
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
                                                                <IconButton size="small" onClick={() => handleResendEmail(user.keycloakId)} sx={{ color: '#ff9800' }}>
                                                                    <MarkEmailRead fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Видалити">
                                                            <IconButton size="small" onClick={() => handleDelete(user.keycloakId, user.email)} sx={{ color: '#ef4444' }}>
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
                </>
            )}

            {tab === 1 && (
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField size="small" label="Виконавець" value={auditFilters.performedBy}
                            onChange={e => setAuditFilters(p => ({ ...p, performedBy: e.target.value }))}
                            sx={{ flex: '1 1 200px' }} />
                        <FormControl size="small" sx={{ flex: '1 1 160px' }}>
                            <InputLabel>Дія</InputLabel>
                            <Select multiple value={auditFilters.actions} label="Дія"
                                onChange={e => setAuditFilters(p => ({ ...p, actions: e.target.value }))}
                                renderValue={selected => selected.join(', ')}>
                                {['CREATE_USER', 'DELETE_USER', 'UPDATE_ROLE', 'RESEND_EMAIL'].map(a => (
                                    <MenuItem key={a} value={a}>{a}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ flex: '1 1 130px' }}>
                            <InputLabel>Статус</InputLabel>
                            <Select multiple value={auditFilters.statuses} label="Статус"
                                onChange={e => setAuditFilters(p => ({ ...p, statuses: e.target.value }))}
                                renderValue={selected => selected.join(', ')}>
                                <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                                <MenuItem value="FAILURE">FAILURE</MenuItem>
                            </Select>
                        </FormControl>
                        <Button variant="outlined" size="small" onClick={loadAuditLogs}
                            sx={{ textTransform: 'none', borderRadius: 2 }}>
                            Застосувати
                        </Button>
                        <Tooltip title="Оновити">
                            <IconButton size="small" onClick={loadAuditLogs} disabled={auditLoading}>
                                <Refresh fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiberManualRecord sx={{ fontSize: 10, color: wsConnected ? '#4caf50' : '#f44336' }} />
                            <Typography variant="caption" color="text.secondary">
                                {wsConnected ? 'Live оновлення увімкнено' : 'Live оновлення вимкнено'}
                            </Typography>
                        </Box>
                    </Box>

                    {auditLoading ? (
                        <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress size={36} sx={{ color: '#673ab7' }} /></Box>
                    ) : auditLogs.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">Логів ще немає</Typography></Box>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    {['Час', 'Дія', 'Виконавець', 'Ціль', 'Статус', 'Деталі'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {auditLogs.map(log => (
                                    <TableRow key={log.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {new Date(log.performedAt).toLocaleString('uk-UA')}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={log.action} size="small" sx={{
                                                bgcolor: alpha(ACTION_COLORS[log.action] || '#757575', 0.1),
                                                color: ACTION_COLORS[log.action] || '#757575',
                                                fontWeight: 700, fontSize: 11,
                                                border: `1px solid ${alpha(ACTION_COLORS[log.action] || '#757575', 0.2)}`,
                                            }} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13 }}>{log.performedBy || '—'}</TableCell>
                                        <TableCell sx={{ fontSize: 13 }}>{log.target || '—'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={log.status}
                                                size="small"
                                                sx={{
                                                    bgcolor: log.status === 'SUCCESS' ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                                                    color: log.status === 'SUCCESS' ? '#4caf50' : '#f44336',
                                                    fontWeight: 700, fontSize: 11,
                                                }} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12, color: '#64748b', maxWidth: 300 }}>
                                            {log.status === 'FAILURE' ? (
                                                <Typography variant="caption" color="error">{log.errorMessage}</Typography>
                                            ) : (
                                                <Typography variant="caption" sx={{
                                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap', display: 'block', maxWidth: 280,
                                                }}>
                                                    {log.details}
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            )}

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