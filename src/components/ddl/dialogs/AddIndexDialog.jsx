import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Box, CircularProgress,
    Typography, FormControlLabel, Switch, Checkbox, ListItemText,
    OutlinedInput, InputLabel, FormControl, Select,
} from '@mui/material';
import { DdlApi } from '../../../api/dictionaries';

export function AddIndexDialog({ open, tableName, columns, mainColor, onClose, onSuccess }) {
    const [form, setForm] = useState({ columnNames: [], unique: false, indexName: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!form.columnNames.length) { setError('Виберіть хоча б одну колонку'); return; }
        setLoading(true);
        try {
            await DdlApi.addIndex({ tableName, ...form });
            setForm({ columnNames: [], unique: false, indexName: '' });
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.message ?? 'Помилка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Створити індекс для <b>{tableName}</b></DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <FormControl fullWidth size="small" error={Boolean(error && !form.columnNames.length)}>
                        <InputLabel>Колонки</InputLabel>
                        <Select
                            multiple
                            value={form.columnNames}
                            onChange={e => { setForm(f => ({ ...f, columnNames: e.target.value })); setError(''); }}
                            input={<OutlinedInput label="Колонки" />}
                            renderValue={selected => selected.join(', ')}
                        >
                            {columns.map(c => (
                                <MenuItem key={c.columnName} value={c.columnName}>
                                    <Checkbox checked={form.columnNames.includes(c.columnName)} size="small" />
                                    <ListItemText primary={c.columnName} primaryTypographyProps={{ fontFamily: 'monospace', fontSize: 13 }} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Назва індексу (опційно)"
                        value={form.indexName}
                        onChange={e => setForm(f => ({ ...f, indexName: e.target.value }))}
                        fullWidth size="small"
                        placeholder="Генерується автоматично"
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={form.unique}
                                onChange={e => setForm(f => ({ ...f, unique: e.target.checked }))}
                                size="small"
                            />
                        }
                        label="Унікальний індекс"
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
                    Створити
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddIndexDialog;