import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, CircularProgress, Typography,
    IconButton, Divider, alpha,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import ColumnTypeFields from './ColumnTypeFields';
import { DdlApi } from '../../../api/dictionaries';

const EMPTY_COL = { columnName: '', dataType: 'NVARCHAR', length: 255, precision: null, scale: null, nullable: true, defaultValue: '' };

export function CreateTableDialog({ open, mainColor, onClose, onSuccess }) {
    const [tableName, setTableName] = useState('');
    const [primaryKeyColumn, setPrimaryKeyColumn] = useState('');
    const [columns, setColumns] = useState([{ ...EMPTY_COL }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addCol = () => setColumns(c => [...c, { ...EMPTY_COL }]);
    const removeCol = (i) => setColumns(c => c.filter((_, idx) => idx !== i));
    const updateCol = (i, val) => setColumns(c => c.map((col, idx) => idx === i ? val : col));

    const handleSubmit = async () => {
        if (!tableName.trim()) { setError('Введіть назву таблиці'); return; }
        if (columns.some(c => !c.columnName.trim())) { setError('Заповніть всі назви колонок'); return; }
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
                        <TextField
                            label="Назва таблиці"
                            value={tableName}
                            onChange={e => { setTableName(e.target.value); setError(''); }}
                            fullWidth size="small"
                            placeholder="my_table"
                        />
                        <TextField
                            label="PK колонка (опційно)"
                            value={primaryKeyColumn}
                            onChange={e => setPrimaryKeyColumn(e.target.value)}
                            fullWidth size="small"
                            placeholder="my_table_id"
                        />
                    </Box>

                    <Divider />

                    <Typography variant="subtitle2" fontWeight={700}>Колонки</Typography>

                    {columns.map((col, i) => (
                        <Box key={i} sx={{
                            p: 1.5, borderRadius: 2,
                            border: `1px solid ${alpha(mainColor, 0.15)}`,
                            bgcolor: alpha(mainColor, 0.02),
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" fontWeight={700} color={mainColor}>
                                    Колонка {i + 1}
                                </Typography>
                                {columns.length > 1 && (
                                    <IconButton size="small" onClick={() => removeCol(i)}>
                                        <Delete sx={{ fontSize: 16, color: '#f44336' }} />
                                    </IconButton>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <TextField
                                    label="Назва"
                                    value={col.columnName}
                                    onChange={e => updateCol(i, { ...col, columnName: e.target.value })}
                                    fullWidth size="small"
                                />
                                <ColumnTypeFields form={col} onChange={val => updateCol(i, val)} />
                                <TextField
                                    label="Default (опційно)"
                                    value={col.defaultValue}
                                    onChange={e => updateCol(i, { ...col, defaultValue: e.target.value })}
                                    fullWidth size="small"
                                />
                            </Box>
                        </Box>
                    ))}

                    <Button
                        startIcon={<Add />}
                        onClick={addCol}
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: 'flex-start', borderColor: mainColor, color: mainColor }}
                    >
                        Додати колонку
                    </Button>

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

export default CreateTableDialog;