import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, Snackbar, Alert, Tabs, Tab, Badge, Tooltip } from '@mui/material';
import { AdminPanelSettings, History, FiberManualRecord } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { UserApi, DictionaryApi } from '../api/dictionaries';
import { Client } from '@stomp/stompjs';
import UserForm from '../components/super-admin/UserForm';
import UsersTable from '../components/super-admin/UsersTable';
import AuditLogsTable from '../components/super-admin/AuditLogsTable';

const EMPTY_FORM = {
    email: '', firstName: '', lastName: '',
    middleName: '', phoneNumber: '', role: 'EMPLOYEE', branchId: null,
};

const SuperAdminPage = () => {
    const { auth } = useAuth();
    const stompClient = useRef(null);

    const [tab, setTab] = useState(0);
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
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

    const loadBranches = async () => {
        try {
            const { data } = await DictionaryApi.getAll('branches', 0, 10000);
            setBranches(data.content || data);
        } catch {
            console.error('Помилка завантаження відділень');
        }
    };

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

    useEffect(() => { loadUsers(); loadBranches(); }, []);
    useEffect(() => { if (tab === 1) { loadAuditLogs(); setNewLogsCount(0); } }, [tab]);

    const notify = (message, severity = 'success') =>
        setNotification({ open: true, message, severity });

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
                branchId: form.role === 'EMPLOYEE' ? form.branchId : null,
            };
            await UserApi.create(payload);
            notify(`Користувача створено. Посилання надіслано на ${form.email}`);
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
            notify('Користувача видалено');
            loadUsers();
        } catch {
            notify('Помилка видалення', 'error');
        }
    };

    const handleResendEmail = async (keycloakId) => {
        try {
            await UserApi.resendEmail(keycloakId);
            notify('Email надіслано повторно');
        } catch {
            notify('Помилка відправки email', 'error');
        }
    };

    const handleUpdateRole = async (keycloakId, role) => {
        try {
            await UserApi.updateRole(keycloakId, role);
            notify('Роль оновлено');
            loadUsers();
        } catch {
            notify('Помилка оновлення ролі', 'error');
        }
    };

    const handleUpdateBranch = async (keycloakId, branchId) => {
        try {
            await UserApi.updateBranch(keycloakId, branchId);
            notify('Відділення оновлено');
            loadUsers();
        } catch {
            notify('Помилка оновлення відділення', 'error');
        }
    };

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
                <Tooltip title={wsConnected ? 'WebSocket підключено' : 'WebSocket відключено'}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
                        <FiberManualRecord sx={{ fontSize: 12, color: wsConnected ? '#4caf50' : '#f44336' }} />
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {wsConnected ? 'Live' : 'Offline'}
                        </Typography>
                    </Box>
                </Tooltip>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, overflow: 'hidden' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}>
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
                    <UserForm
                        form={form}
                        setForm={setForm}
                        onSubmit={handleCreate}
                        creating={creating}
                        formError={formError}
                        branches={branches}
                    />
                    <UsersTable
                        users={users}
                        branches={branches}
                        loading={loading}
                        onReload={loadUsers}
                        onDelete={handleDelete}
                        onResendEmail={handleResendEmail}
                        onUpdateRole={handleUpdateRole}
                        onUpdateBranch={handleUpdateBranch}
                    />
                </>
            )}

            {tab === 1 && (
                <AuditLogsTable
                    logs={auditLogs}
                    loading={auditLoading}
                    filters={auditFilters}
                    setFilters={setAuditFilters}
                    onLoad={loadAuditLogs}
                    wsConnected={wsConnected}
                />
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