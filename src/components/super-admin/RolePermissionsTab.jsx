import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, alpha, Chip, Button, CircularProgress,
    List, ListItem, ListItemText, TextField, Snackbar, Alert,
} from '@mui/material';
import { Add, Delete, Save, Security } from '@mui/icons-material';
import { UserApi } from '../../api/dictionaries';

const ROLE_COLORS = {
    EMPLOYEE: '#2196f3',
    DRIVER: '#ff9800',
    COURIER: '#4caf50',
    ADMIN: '#9c27b0',
};

const SUGGESTED_PERMISSIONS = [
    'shipments:read', 'shipments:write',
    'payments:read', 'payments:write',
    'parcels:read', 'parcels:write',
    'trips:read', 'trips:write',
    'waybills:read', 'waybills:write',
    'route-lists:read', 'route-lists:write',
    'branches:read', 'branches:write',
    'users:read', 'audit:read',
];

const RolePermissionsTab = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newPerm, setNewPerm] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const mainColor = ROLE_COLORS[selectedRole] || '#5c6bc0';

    useEffect(() => {
        UserApi.getRoles()
            .then(res => {
                setRoles(res.data);
                if (res.data.length > 0) setSelectedRole(res.data[0]);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedRole) return;
        setLoading(true);
        UserApi.getRolePermissions(selectedRole)
            .then(res => setPermissions(res.data || []))
            .catch(() => setPermissions([]))
            .finally(() => setLoading(false));
    }, [selectedRole]);

    const handleAdd = () => {
        const trimmed = newPerm.trim();
        if (!trimmed || permissions.includes(trimmed)) return;
        setPermissions(prev => [...prev, trimmed]);
        setNewPerm('');
    };

    const handleDelete = (perm) =>
        setPermissions(prev => prev.filter(p => p !== perm));

    const handleAddSuggested = (perm) => {
        if (!permissions.includes(perm))
            setPermissions(prev => [...prev, perm]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await UserApi.updateRolePermissions(selectedRole, permissions);
            setNotification({ open: true, message: `Права ролі ${selectedRole} оновлено`, severity: 'success' });
        } catch {
            setNotification({ open: true, message: 'Помилка збереження', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Paper elevation={0} sx={{
                width: 200, borderRadius: 3, flexShrink: 0,
                border: '1px solid #e2e8f0', overflow: 'hidden',
            }}>
                <Box sx={{ p: 2, bgcolor: alpha('#5c6bc0', 0.06) }}>
                    <Typography variant="subtitle2" fontWeight={700}
                        color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: 11 }}>
                        Ролі
                    </Typography>
                </Box>
                <List disablePadding>
                    {roles.map(role => (
                        <ListItem
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            sx={{
                                cursor: 'pointer',
                                borderLeft: selectedRole === role
                                    ? `4px solid ${ROLE_COLORS[role] || '#5c6bc0'}`
                                    : '4px solid transparent',
                                bgcolor: selectedRole === role
                                    ? alpha(ROLE_COLORS[role] || '#5c6bc0', 0.08)
                                    : 'transparent',
                                '&:hover': { bgcolor: alpha(ROLE_COLORS[role] || '#5c6bc0', 0.05) },
                            }}
                        >
                            <ListItemText
                                primary={role}
                                primaryTypographyProps={{
                                    fontSize: 13,
                                    fontWeight: selectedRole === role ? 700 : 400,
                                    color: selectedRole === role
                                        ? ROLE_COLORS[role] || '#5c6bc0'
                                        : 'text.primary',
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Box sx={{
                        p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '10px', display: 'flex' }}>
                                <Security sx={{ color: 'white', fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} color="white">
                                    Права ролі: {selectedRole}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {permissions.length} прав призначено
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained" size="small"
                            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save />}
                            disabled={saving}
                            onClick={handleSave}
                            sx={{ bgcolor: 'white', color: mainColor, fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                            Зберегти
                        </Button>
                    </Box>

                    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small" fullWidth
                                placeholder="Назва права (напр. shipments:read)"
                                value={newPerm}
                                onChange={e => setNewPerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <Button
                                variant="contained" size="small"
                                startIcon={<Add />} onClick={handleAdd}
                                sx={{ bgcolor: mainColor, borderRadius: 2, flexShrink: 0 }}
                            >
                                Додати
                            </Button>
                        </Box>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress size={28} sx={{ color: mainColor }} />
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 40 }}>
                                {permissions.length === 0 && (
                                    <Typography variant="body2" color="text.disabled">
                                        Немає призначених прав
                                    </Typography>
                                )}
                                {permissions.map(perm => (
                                    <Chip
                                        key={perm}
                                        label={perm}
                                        onDelete={() => handleDelete(perm)}
                                        deleteIcon={<Delete sx={{ fontSize: '14px !important' }} />}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(mainColor, 0.1),
                                            color: mainColor,
                                            fontWeight: 600,
                                            border: `1px solid ${alpha(mainColor, 0.3)}`,
                                            '& .MuiChip-deleteIcon': { color: mainColor },
                                        }}
                                    />
                                ))}
                            </Box>
                        )}

                        <Box>
                            <Typography variant="caption" color="text.secondary"
                                fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                Швидке додавання
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {SUGGESTED_PERMISSIONS.map(perm => {
                                    const added = permissions.includes(perm);
                                    return (
                                        <Chip
                                            key={perm}
                                            label={perm}
                                            size="small"
                                            onClick={() => !added && handleAddSuggested(perm)}
                                            sx={{
                                                cursor: added ? 'default' : 'pointer',
                                                bgcolor: added ? alpha('#4caf50', 0.1) : 'transparent',
                                                color: added ? '#4caf50' : 'text.secondary',
                                                border: added
                                                    ? '1px solid rgba(76,175,80,0.3)'
                                                    : '1px solid #e0e0e0',
                                                fontWeight: added ? 700 : 400,
                                                '&:hover': !added ? { bgcolor: alpha(mainColor, 0.06) } : {},
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>

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

export default RolePermissionsTab;