import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, CircularProgress,
} from '@mui/material';
import ColumnTypeFields from './ColumnTypeFields';
import { DdlApi } from '../../../api/dictionaries';

const INIT = { columnName: '', dataType: 'NVARCHAR', length: 255, precision: null, scale: null, nullable: true, defaultValue: '' };

export function AddColumnDialog({ open, tableName, mainColor, onClose, onSuccess }) {
    const [form, setForm] = useState(INIT);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!form.columnName.trim()) { setError('Введіть назву колонки'); return; }
        setLoading(true);
        try {
            await DdlApi.addColumn({ tableName, ...form });
            setForm(INIT);
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.message ?? 'Помилка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Додати колонку до <b>{tableName}</b></DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        label="Назва колонки"
                        value={form.columnName}
                        onChange={e => { setForm(f => ({ ...f, columnName: e.target.value })); setError(''); }}
                        fullWidth size="small"
                        error={Boolean(error)}
                        helperText={error}
                        placeholder="my_column"
                    />
                    <ColumnTypeFields form={form} onChange={setForm} />
                    <TextField
                        label="Дефолтне значення (опційно)"
                        value={form.defaultValue}
                        onChange={e => setForm(f => ({ ...f, defaultValue: e.target.value }))}
                        fullWidth size="small"
                        placeholder="0 або 'текст' або GETDATE()"
                    />
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

export default AddColumnDialog;