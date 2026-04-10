import React, { useState, useEffect } from 'react';
import { Box, TextField, MenuItem, Divider, Typography, Button, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import { DdlApi } from '../../../api/dictionaries';

const ACTIONS = ['NO ACTION', 'CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT'];

const AddForeignKeyTab = ({ tableName, mainColor, onSuccess, onError }) => {
    const [form, setForm] = useState({
        columnName: '', 
        referencedTable: '',
        referencedColumn: '', 
        onDelete: 'NO ACTION', 
        onUpdate: 'NO ACTION',
    });
    const [tables, setTables] = useState([]);
    const [pkColumns, setPkColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPk, setLoadingPk] = useState(false);
    const [tableInfo, setTableInfo] = useState(null);

    useEffect(() => {
        DdlApi.getAllTables().then(res => setTables(res.data || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (tableName) DdlApi.getTableInfo(tableName).then(res => setTableInfo(res.data)).catch(() => { });
    }, [tableName]);

    useEffect(() => {
        if (!form.referencedTable) { setPkColumns([]); return; }
        setLoadingPk(true);
        DdlApi.getPkColumns(form.referencedTable)
            .then(res => setPkColumns(res.data || []))
            .finally(() => setLoadingPk(false));
    }, [form.referencedTable]);

    const ownColumns = tableInfo?.columns?.map(c => c.columnName) || [];

    const handleSubmit = async () => {
        // Видалили перевірку constraintName, тепер вона не обов'язкова
        if (!form.columnName || !form.referencedTable || !form.referencedColumn) {
            return onError('Заповніть всі обов\'язкові поля');
        }
        
        setLoading(true);
        try {
            // constraintName відправляємо порожнім або null, щоб бекенд згенерував його сам
            await DdlApi.addForeignKey({ 
                tableName, 
                ...form, 
                constraintName: null 
            });
            
            setForm({ 
                columnName: '', 
                referencedTable: '', 
                referencedColumn: '', 
                onDelete: 'NO ACTION', 
                onUpdate: 'NO ACTION' 
            });
            onSuccess('Зовнішній ключ додано');
        } catch (e) {
            onError(e.response?.data?.message ?? 'Помилка додавання FK');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Тепер тут тільки вибір колонки, вона на всю ширину для кращого вигляду */}
            <TextField 
                select 
                label="Колонка поточної таблиці *" 
                value={form.columnName} 
                fullWidth 
                size="small"
                onChange={e => setForm(f => ({ ...f, columnName: e.target.value }))}
            >
                {ownColumns.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>

            <Divider>
                <Typography variant="caption" color="text.secondary">Посилається на</Typography>
            </Divider>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="Таблиця-ціль *" value={form.referencedTable} fullWidth size="small"
                    onChange={e => setForm(f => ({ ...f, referencedTable: e.target.value, referencedColumn: '' }))}>
                    {tables.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField select label="Колонка-ціль *" value={form.referencedColumn} fullWidth size="small"
                    disabled={!form.referencedTable || loadingPk}
                    InputProps={{
                        endAdornment: loadingPk ? <CircularProgress size={14} /> : null
                    }}
                    onChange={e => setForm(f => ({ ...f, referencedColumn: e.target.value }))}>
                    {pkColumns.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                {['onDelete', 'onUpdate'].map(field => (
                    <TextField 
                        key={field} 
                        select 
                        label={field === 'onDelete' ? 'ON DELETE' : 'ON UPDATE'}
                        value={form[field]} 
                        fullWidth 
                        size="small"
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    >
                        {ACTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                    </TextField>
                ))}
            </Box>

            <Button 
                variant="contained" 
                size="small" 
                onClick={handleSubmit} 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Add />}
                sx={{ alignSelf: 'flex-end', bgcolor: mainColor, '&:hover': { bgcolor: mainColor } }}
            >
                Додати зв'язок
            </Button>
        </Box>
    );
};

export default AddForeignKeyTab;