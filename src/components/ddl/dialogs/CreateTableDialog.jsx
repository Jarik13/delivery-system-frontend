import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress, Typography, Divider } from '@mui/material';
import { Add } from '@mui/icons-material';
import CreateTableColumnItem from './CreateTableColumnItem';
import { DdlApi } from '../../../api/dictionaries';

const EMPTY_COL = { columnName: '', dataType: 'NVARCHAR', length: 255, precision: null, scale: null, nullable: true, defaultValue: '' };

export function CreateTableDialog({ open, mainColor, onClose, onSuccess }) {
    const [tableName, setTableName] = useState('');
    const [primaryKeyColumn, setPrimaryKeyColumn] = useState('');
    const [columns, setColumns] = useState([{ ...EMPTY_COL }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addCol = () => setColumns(prev => [...prev, { ...EMPTY_COL }]);
    const removeCol = (i) => setColumns(prev => prev.filter((_, idx) => idx !== i));
    const updateCol = (i, val) => setColumns(prev => prev.map((col, idx) => idx === i ? val : col));

    const handleSubmit = async () => {
        if (!tableName.trim()) return setError('Введіть назву таблиці');
        if (columns.some(c => !c.columnName.trim())) return setError('Заповніть всі назви колонок');
        setLoading(true);
        try {
            await DdlApi.createTable({ tableName, primaryKeyColumn: primaryKeyColumn || null, columns });
            setTableName(''); setPrimaryKeyColumn(''); setColumns([{ ...EMPTY_COL }]);
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.message ?? 'Помилка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Створити нову таблицю</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Назва таблиці" value={tableName} fullWidth size="small"
                            onChange={e => { setTableName(e.target.value); setError(''); }} />
                        <TextField label="PK колонка (опційно)" value={primaryKeyColumn} fullWidth size="small"
                            onChange={e => setPrimaryKeyColumn(e.target.value)} />
                    </Box>
                    <Divider />
                    <Typography variant="subtitle2" fontWeight={700}>Колонки</Typography>
                    {columns.map((col, i) => (
                        <CreateTableColumnItem key={i} index={i} col={col} mainColor={mainColor}
                            onUpdate={updateCol} onRemove={removeCol} isOnlyOne={columns.length === 1} />
                    ))}
                    <Button startIcon={<Add />} onClick={addCol} variant="outlined" size="small"
                        sx={{ alignSelf: 'flex-start', borderColor: mainColor, color: mainColor }}>
                        Додати колонку
                    </Button>
                    {error && <Typography variant="caption" color="error">{error}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined" size="small">Скасувати</Button>
                <Button onClick={handleSubmit} variant="contained" size="small" disabled={loading}
                    sx={{ bgcolor: mainColor, '&:hover': { bgcolor: mainColor } }}
                    startIcon={loading && <CircularProgress size={14} color="inherit" />}>
                    Створити
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CreateTableDialog;