import React, { useState, useEffect } from 'react';
import { Box, Table, TableHead, TableRow, TableCell, TableBody, Typography, Chip, IconButton, CircularProgress, alpha } from '@mui/material';
import { LinkOff } from '@mui/icons-material';
import { DdlApi } from '../../../api/dictionaries';

const ExistingForeignKeysTab = ({ tableName, mainColor, onSuccess, onError }) => {
    const [fks, setFks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dropping, setDropping] = useState(null);

    const loadFks = () => {
        setLoading(true);
        DdlApi.getTableInfo(tableName)
            .then(res => setFks(res.data?.foreignKeys || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (tableName) loadFks(); }, [tableName]);

    const handleDrop = async (constraintName) => {
        if (!window.confirm(`Видалити FK "${constraintName}"?`)) return;
        setDropping(constraintName);
        try {
            await DdlApi.dropForeignKey({ tableName, constraintName });
            onSuccess(`FK "${constraintName}" видалено`);
            loadFks();
        } catch (e) {
            onError(e.response?.data?.message ?? 'Помилка видалення FK');
        } finally {
            setDropping(null);
        }
    };

    if (loading) return <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: mainColor }} /></Box>;
    if (fks.length === 0) return <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="body2" color="text.disabled">Ключів не знайдено</Typography></Box>;

    return (
        <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                {['Constraint', 'Колонка', 'Посилається на', 'ON DELETE', 'ON UPDATE', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                ))}
            </TableRow></TableHead>
            <TableBody>
                {fks.map(fk => (
                    <TableRow key={fk.constraintName} hover>
                        <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{fk.constraintName}</Typography></TableCell>
                        <TableCell><Chip label={fk.columnName} size="small" sx={{ bgcolor: alpha(mainColor, 0.08), color: mainColor, fontWeight: 600, fontSize: 11 }} /></TableCell>
                        <TableCell><Typography variant="caption">{fk.referencedTable}.{fk.referencedColumn}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{fk.onDelete || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{fk.onUpdate || '—'}</Typography></TableCell>
                        <TableCell align="right">
                            <IconButton size="small" onClick={() => handleDrop(fk.constraintName)} disabled={dropping === fk.constraintName} sx={{ color: '#f44336' }}>
                                {dropping === fk.constraintName ? <CircularProgress size={14} /> : <LinkOff fontSize="small" />}
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
export default ExistingForeignKeysTab;