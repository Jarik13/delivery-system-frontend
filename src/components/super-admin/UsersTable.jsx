import React, { useState } from 'react';
import {
    Paper, Box, Typography, IconButton, Tooltip, Table, TableHead,
    TableRow, TableCell, TableBody, Chip, CircularProgress, alpha,
    Select, MenuItem, Button,
} from '@mui/material';
import { Refresh, Delete, MarkEmailRead, Save, Cancel, Business } from '@mui/icons-material';
import { getRoleMeta, ROLES_META } from '../../constants/roles';
import BranchPickerDialog from './BranchPickerDialog';

const UsersTable = ({ users, branches = [], loading, onReload, onDelete, onResendEmail, onUpdateRole, onUpdateBranch }) => {
    const [pending, setPending] = useState({});
    const [branchDialog, setBranchDialog] = useState(null);

    const setChange = (keycloakId, field, value) =>
        setPending(prev => ({ ...prev, [keycloakId]: { ...prev[keycloakId], [field]: value } }));

    const hasChanges = (keycloakId) =>
        !!pending[keycloakId] && Object.keys(pending[keycloakId]).length > 0;

    const handleSave = async (user) => {
        const changes = pending[user.keycloakId];
        if (!changes) return;
        if (changes.role && changes.role !== user.role) {
            await onUpdateRole(user.keycloakId, changes.role);
        }
        if (changes.branchId !== undefined && changes.branchId !== user.branchId) {
            await onUpdateBranch(user.keycloakId, changes.branchId);
        }
        setPending(prev => { const n = { ...prev }; delete n[user.keycloakId]; return n; });
    };

    const handleCancel = (keycloakId) =>
        setPending(prev => { const n = { ...prev }; delete n[keycloakId]; return n; });

    const getBranchName = (branchId) => {
        const b = branches.find(b => b.id === branchId);
        return b?.deliveryPoint?.name || b?.name || (branchId ? `Відділення #${branchId}` : '—');
    };

    return (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                    Користувачі системи
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: '#94a3b8', fontWeight: 500 }}>
                        ({users.length})
                    </Typography>
                </Typography>
                <Tooltip title="Оновити">
                    <span>
                        <IconButton size="small" onClick={onReload} disabled={loading}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </span>
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
                            {['Email', 'ПІБ', 'Телефон', 'Роль', 'Відділення', 'Статус', 'Дії'].map((h, i) => (
                                <TableCell key={h} align={i === 6 ? 'right' : 'left'}
                                    sx={{ fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(user => {
                            const changes = pending[user.keycloakId] || {};
                            const currentRole = changes.role ?? user.role;
                            const currentBranchId = changes.branchId ?? user.branchId;
                            const roleInfo = getRoleMeta(currentRole);
                            const isDirty = hasChanges(user.keycloakId);
                            const isEmployee = currentRole === 'EMPLOYEE';
                            const fullName = [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ') || '—';

                            return (
                                <TableRow key={user.keycloakId} hover sx={{
                                    '&:last-child td': { border: 0 },
                                    bgcolor: isDirty ? alpha('#673ab7', 0.03) : 'inherit',
                                    transition: 'background 0.2s',
                                }}>
                                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{user.email}</TableCell>
                                    <TableCell sx={{ fontSize: 13 }}>{fullName}</TableCell>
                                    <TableCell sx={{ fontSize: 13, color: user.phoneNumber ? 'inherit' : '#94a3b8' }}>
                                        {user.phoneNumber || '—'}
                                    </TableCell>

                                    {/* Роль */}
                                    <TableCell>
                                        <Select size="small" value={currentRole}
                                            onChange={e => setChange(user.keycloakId, 'role', e.target.value)}
                                            sx={{
                                                fontSize: 12, fontWeight: 700, height: 28,
                                                color: roleInfo.color,
                                                bgcolor: alpha(roleInfo.color, 0.08),
                                                border: `1px solid ${alpha(roleInfo.color, 0.2)}`,
                                                borderRadius: 4, minWidth: 140,
                                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                '& .MuiSelect-icon': { color: roleInfo.color },
                                            }}>
                                            {ROLES_META.map(r => (
                                                <MenuItem key={r.value} value={r.value}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color }} />
                                                        <Typography fontSize={12} fontWeight={600}>{r.label}</Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>

                                    {/* Відділення */}
                                    <TableCell>
                                        {isEmployee ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{
                                                    display: 'flex', alignItems: 'center', gap: 0.5,
                                                    px: 1.5, py: 0.5, borderRadius: 2, cursor: 'pointer',
                                                    border: `1px solid ${changes.branchId ? '#673ab7' : '#e2e8f0'}`,
                                                    bgcolor: changes.branchId ? alpha('#673ab7', 0.05) : '#f8fafc',
                                                    '&:hover': { borderColor: '#673ab7', bgcolor: alpha('#673ab7', 0.05) },
                                                    transition: 'all 0.15s',
                                                    minWidth: 160,
                                                }}
                                                    onClick={() => setBranchDialog(user.keycloakId)}>
                                                    <Business sx={{ fontSize: 14, color: changes.branchId ? '#673ab7' : '#94a3b8' }} />
                                                    <Typography fontSize={12} sx={{ color: changes.branchId ? '#673ab7' : 'text.primary', fontWeight: changes.branchId ? 600 : 400 }}>
                                                        {getBranchName(currentBranchId)}
                                                    </Typography>
                                                </Box>

                                                <BranchPickerDialog
                                                    open={branchDialog === user.keycloakId}
                                                    currentBranchId={currentBranchId}
                                                    onSelect={(id) => {
                                                        setChange(user.keycloakId, 'branchId', id);
                                                        setBranchDialog(null);
                                                    }}
                                                    onClose={() => setBranchDialog(null)}
                                                />
                                            </Box>
                                        ) : (
                                            <Typography fontSize={12} color="text.secondary">—</Typography>
                                        )}
                                    </TableCell>

                                    {/* Статус */}
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

                                    {/* Дії */}
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                                            {isDirty && (
                                                <>
                                                    <Button size="small" variant="contained"
                                                        startIcon={<Save sx={{ fontSize: 14 }} />}
                                                        onClick={() => handleSave(user)}
                                                        sx={{
                                                            bgcolor: '#673ab7', fontSize: 11, height: 28,
                                                            textTransform: 'none', fontWeight: 600, borderRadius: 2,
                                                            '&:hover': { bgcolor: '#512da8' }, px: 1.5,
                                                        }}>
                                                        Зберегти
                                                    </Button>
                                                    <Tooltip title="Скасувати">
                                                        <IconButton size="small" onClick={() => handleCancel(user.keycloakId)}
                                                            sx={{ color: '#94a3b8' }}>
                                                            <Cancel fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                            {!user.emailVerified && (
                                                <Tooltip title="Надіслати email повторно">
                                                    <IconButton size="small" onClick={() => onResendEmail(user.keycloakId)} sx={{ color: '#ff9800' }}>
                                                        <MarkEmailRead fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Видалити">
                                                <IconButton size="small" onClick={() => onDelete(user.keycloakId, user.email)} sx={{ color: '#ef4444' }}>
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
    );
};

export default UsersTable;