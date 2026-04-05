import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Box, CircularProgress, Typography,
} from '@mui/material';
import { DdlApi } from '../../../api/dictionaries';
import { CONSTRAINT_TYPES } from '../../../constants/ddl';

export function AddConstraintDialog({ open, tableName, columns, mainColor, onClose, onSuccess }) {
    const [form, setForm] = useState({ columnName: '', constraintType: 'UNIQUE', checkExpression: '', constraintName: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!form.columnName) { setError('Виберіть колонку'); return; }
        if (form.constraintType === 'CHECK' && !form.checkExpression.trim()) {
            setError('Введіть CHECK вираз'); return;
        }
        setLoading(true);
        try {
            await DdlApi.addConstraint({ tableName, ...form });
            setForm({ columnName: '', constraintType: 'UNIQUE', checkExpression: '', constraintName: '' });
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.message ?? 'Помилка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Додати constraint до <b>{tableName}</b></DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        select
                        label="Тип"
                        value={form.constraintType}
                        onChange={e => { setForm(f => ({ ...f, constraintType: e.target.value })); setError(''); }}
                        fullWidth size="small"
                    >
                        {CONSTRAINT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>

                    <TextField
                        select
                        label="Колонка"
                        value={form.columnName}
                        onChange={e => { setForm(f => ({ ...f, columnName: e.target.value })); setError(''); }}
                        fullWidth size="small"
                        error={Boolean(error && !form.columnName)}
                    >
                        {columns.map(c => <MenuItem key={c.columnName} value={c.columnName}>{c.columnName}</MenuItem>)}
                    </TextField>

                    {form.constraintType === 'CHECK' && (
                        <TextField
                            label="CHECK вираз"
                            value={form.checkExpression}
                            onChange={e => { setForm(f => ({ ...f, checkExpression: e.target.value })); setError(''); }}
                            fullWidth size="small"
                            placeholder="age > 0"
                            error={Boolean(error && form.constraintType === 'CHECK')}
                        />
                    )}

                    <TextField
                        label="Назва constraint (опційно)"
                        value={form.constraintName}
                        onChange={e => setForm(f => ({ ...f, constraintName: e.target.value }))}
                        fullWidth size="small"
                        placeholder="Генерується автоматично"
                    />

                    {error && <Typography variant="caption" color="error">{error}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined" size="small">Скасувати</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    size="small"
                    disabled={loading}
                    sx={{ bgcolor: mainColor, '&:hover': { bgcolor: mainColor } }}
                    startIcon={loading && <CircularProgress size={14} color="inherit" />}
                >
                    Додати
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddConstraintDialog;