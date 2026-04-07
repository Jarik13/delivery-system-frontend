import React from 'react';
import { Box, TextField, Typography, IconButton, alpha } from '@mui/material';
import { Delete } from '@mui/icons-material';
import ColumnTypeFields from './ColumnTypeFields';

const CreateTableColumnItem = ({ col, index, mainColor, onUpdate, onRemove, isOnlyOne }) => (
    <Box sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${alpha(mainColor, 0.15)}`, bgcolor: alpha(mainColor, 0.02) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight={700} color={mainColor}>Колонка {index + 1}</Typography>
            {!isOnlyOne && (
                <IconButton size="small" onClick={() => onRemove(index)}>
                    <Delete sx={{ fontSize: 16, color: '#f44336' }} />
                </IconButton>
            )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField label="Назва" value={col.columnName} size="small" fullWidth
                onChange={e => onUpdate(index, { ...col, columnName: e.target.value })} />
            <ColumnTypeFields form={col} onChange={val => onUpdate(index, val)} />
            <TextField label="Default (опційно)" value={col.defaultValue} size="small" fullWidth
                onChange={e => onUpdate(index, { ...col, defaultValue: e.target.value })} />
        </Box>
    </Box>
);

export default CreateTableColumnItem;