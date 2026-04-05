import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, CircularProgress, Typography,
} from '@mui/material';
import { DdlApi } from '../../../api/dictionaries';

export function SetDefaultDialog({ open, tableName, column, mainColor, onClose, onSuccess }) {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (column) setValue(column.defaultValue ?? '');
    }, [column]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await DdlApi.setDefault({ tableName, columnName: column.columnName, defaultValue: value || null });
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.message ?? 'Помилка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                Default для <b style={{ fontFamily: 'monospace' }}>{column?.columnName}</b>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1 }}>
                    <TextField
                        label="Дефолтне значення"
                        value={value}
                        onChange={e => { setValue(e.target.value); setError(''); }}
                        fullWidth size="small"
                        placeholder="0 або 'текст' або GETDATE() — порожньо = видалити"
                        helperText={error || "Залиш порожнім щоб видалити дефолт"}
                        error={Boolean(error)}
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
                    Зберегти
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SetDefaultDialog;