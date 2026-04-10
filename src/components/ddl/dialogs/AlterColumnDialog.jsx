import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, CircularProgress, Typography,
} from '@mui/material';
import ColumnTypeFields from './ColumnTypeFields';
import { DdlApi } from '../../../api/dictionaries';

export function AlterColumnDialog({ open, tableName, column, mainColor, onClose, onSuccess }) {
    const [form, setForm] = useState({ dataType: 'NVARCHAR', length: 255, precision: null, scale: null, nullable: true });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (column) {
            setForm({
                dataType: column.dataType?.toUpperCase() ?? 'NVARCHAR',
                length: column.maxLength ?? null,
                precision: column.numericPrecision ?? null,
                scale: column.numericScale ?? null,
                nullable: column.nullable,
            });
        }
    }, [column]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await DdlApi.alterColumn({ tableName, columnName: column.columnName, ...form });
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.message ?? 'Помилка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Змінити тип колонки <b style={{ fontFamily: 'monospace' }}>{column?.columnName}</b>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <ColumnTypeFields form={form} onChange={setForm} />
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
                    Зберегти
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AlterColumnDialog;