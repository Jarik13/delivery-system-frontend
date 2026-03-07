import React from 'react';
import {
    Paper, Box, Typography, IconButton, Tooltip, Table, TableHead,
    TableRow, TableCell, TableBody, Chip, CircularProgress, alpha,
} from '@mui/material';
import { Refresh, Delete, MarkEmailRead } from '@mui/icons-material';
import { getRoleMeta } from '../../constants/roles';

const UsersTable = ({ users, loading, onReload, onDelete, onResendEmail }) => (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight={700}>
                Користувачі системи
                <Typography component="span" variant="caption" sx={{ ml: 1, color: '#94a3b8', fontWeight: 500 }}>
                    ({users.length})
                </Typography>
            </Typography>
            <Tooltip title="Оновити">
                <IconButton size="small" onClick={onReload} disabled={loading}>
                    <Refresh fontSize="small" />
                </IconButton>
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
                        const roleInfo = getRoleMeta(user.role);
                        const fullName = [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ') || '—';
                        return (
                            <TableRow key={user.keycloakId} hover sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{user.email}</TableCell>
                                <TableCell sx={{ fontSize: 13 }}>{fullName}</TableCell>
                                <TableCell sx={{ fontSize: 13, color: user.phoneNumber ? 'inherit' : '#94a3b8' }}>
                                    {user.phoneNumber || '—'}
                                </TableCell>
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

export default UsersTable;