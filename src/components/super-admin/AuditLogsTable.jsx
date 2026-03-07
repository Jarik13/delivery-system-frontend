import React from 'react';
import {
    Paper, Box, TextField, FormControl, InputLabel, Select, MenuItem,
    Button, IconButton, Tooltip, Typography, Table, TableHead, TableRow,
    TableCell, TableBody, Chip, CircularProgress, alpha,
} from '@mui/material';
import { Refresh, FiberManualRecord } from '@mui/icons-material';

const ACTION_COLORS = {
    CREATE_USER: '#4caf50',
    DELETE_USER: '#f44336',
    UPDATE_ROLE: '#2196f3',
    RESEND_EMAIL: '#ff9800',
};

const AuditLogsTable = ({ logs, loading, filters, setFilters, onLoad, wsConnected }) => (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" label="Виконавець" value={filters.performedBy}
                onChange={e => setFilters(p => ({ ...p, performedBy: e.target.value }))}
                sx={{ flex: '1 1 200px' }} />

            <FormControl size="small" sx={{ flex: '1 1 160px' }}>
                <InputLabel>Дія</InputLabel>
                <Select multiple value={filters.actions} label="Дія"
                    onChange={e => setFilters(p => ({ ...p, actions: e.target.value }))}
                    renderValue={s => s.join(', ')}>
                    {['CREATE_USER', 'DELETE_USER', 'UPDATE_ROLE', 'RESEND_EMAIL'].map(a => (
                        <MenuItem key={a} value={a}>{a}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: '1 1 130px' }}>
                <InputLabel>Статус</InputLabel>
                <Select multiple value={filters.statuses} label="Статус"
                    onChange={e => setFilters(p => ({ ...p, statuses: e.target.value }))}
                    renderValue={s => s.join(', ')}>
                    <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                    <MenuItem value="FAILURE">FAILURE</MenuItem>
                </Select>
            </FormControl>

            <Button variant="outlined" size="small" onClick={onLoad}
                sx={{ textTransform: 'none', borderRadius: 2 }}>
                Застосувати
            </Button>
            <Tooltip title="Оновити">
                <IconButton size="small" onClick={onLoad} disabled={loading}>
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

        {loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress size={36} sx={{ color: '#673ab7' }} /></Box>
        ) : logs.length === 0 ? (
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
                    {logs.map(log => (
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
                                <Chip label={log.status} size="small" sx={{
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
);

export default AuditLogsTable;