import React, { useState } from 'react';
import {
    Box, Table, TableHead, TableBody, TableRow, TableCell,
    TableContainer, Typography, Chip, IconButton, Tooltip,
    alpha,
} from '@mui/material';
import { Delete, Edit, AddCircleOutline } from '@mui/icons-material';
import AddColumnDialog from './dialogs/AddColumnDialog';
import AlterColumnDialog from './dialogs/AlterColumnDialog';
import SetDefaultDialog from './dialogs/SetDefaultDialog';
import ConfirmDialog from './dialogs/ConfirmDialog';
import { DdlApi } from '../../api/dictionaries';

export default function ColumnsTab({ tableInfo, onRefresh, mainColor }) {
    const [addOpen, setAddOpen] = useState(false);
    const [alterCol, setAlterCol] = useState(null);
    const [defaultCol, setDefaultCol] = useState(null);
    const [dropCol, setDropCol] = useState(null);

    const headSx = {
        fontWeight: 700,
        fontSize: 11,
        textTransform: 'uppercase',
        color: 'text.secondary',
        bgcolor: alpha(mainColor, 0.04),
        py: 1,
    };

    const handleDrop = async () => {
        await DdlApi.dropColumn({ tableName: tableInfo.tableName, columnName: dropCol });
        setDropCol(null);
        onRefresh();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <Tooltip title="Додати колонку">
                    <IconButton
                        onClick={() => setAddOpen(true)}
                        sx={{
                            bgcolor: alpha(mainColor, 0.08),
                            color: mainColor,
                            '&:hover': { bgcolor: alpha(mainColor, 0.15) },
                        }}
                    >
                        <AddCircleOutline />
                    </IconButton>
                </Tooltip>
            </Box>

            <TableContainer sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(mainColor, 0.12)}`,
            }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headSx}>Назва</TableCell>
                            <TableCell sx={headSx}>Тип</TableCell>
                            <TableCell sx={headSx}>Nullable</TableCell>
                            <TableCell sx={headSx}>Default</TableCell>
                            <TableCell sx={headSx} align="right">Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tableInfo.columns.map(col => (
                            <TableRow key={col.columnName} hover>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                                        {col.columnName}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={buildTypeLabel(col)}
                                        size="small"
                                        sx={{
                                            fontFamily: 'monospace',
                                            fontSize: 11,
                                            bgcolor: alpha(mainColor, 0.07),
                                            color: mainColor,
                                            fontWeight: 600,
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={col.nullable ? 'NULL' : 'NOT NULL'}
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: col.nullable
                                                ? alpha('#9e9e9e', 0.1)
                                                : alpha('#f44336', 0.1),
                                            color: col.nullable ? '#757575' : '#c62828',
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                                            {col.defaultValue ?? '—'}
                                        </Typography>
                                        <Tooltip title="Змінити default">
                                            <IconButton size="small" onClick={() => setDefaultCol(col)}>
                                                <Edit sx={{ fontSize: 13, color: 'text.disabled' }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Змінити тип">
                                        <IconButton size="small" onClick={() => setAlterCol(col)}>
                                            <Edit sx={{ fontSize: 16, color: mainColor }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Видалити колонку">
                                        <IconButton size="small" onClick={() => setDropCol(col.columnName)}>
                                            <Delete sx={{ fontSize: 16, color: '#f44336' }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <AddColumnDialog
                open={addOpen}
                tableName={tableInfo.tableName}
                mainColor={mainColor}
                onClose={() => setAddOpen(false)}
                onSuccess={() => { setAddOpen(false); onRefresh(); }}
            />

            <AlterColumnDialog
                open={Boolean(alterCol)}
                tableName={tableInfo.tableName}
                column={alterCol}
                mainColor={mainColor}
                onClose={() => setAlterCol(null)}
                onSuccess={() => { setAlterCol(null); onRefresh(); }}
            />

            <SetDefaultDialog
                open={Boolean(defaultCol)}
                tableName={tableInfo.tableName}
                column={defaultCol}
                mainColor={mainColor}
                onClose={() => setDefaultCol(null)}
                onSuccess={() => { setDefaultCol(null); onRefresh(); }}
            />

            <ConfirmDialog
                open={Boolean(dropCol)}
                title="Видалити колонку?"
                message={`Колонку "${dropCol}" буде видалено з таблиці "${tableInfo.tableName}". Цю дію не можна скасувати.`}
                confirmLabel="Видалити"
                dangerous
                onConfirm={handleDrop}
                onClose={() => setDropCol(null)}
            />
        </Box>
    );
}

function buildTypeLabel(col) {
    const t = col.dataType?.toUpperCase();
    if (['VARCHAR', 'NVARCHAR'].includes(t) && col.maxLength) return `${t}(${col.maxLength})`;
    if (['DECIMAL', 'NUMERIC'].includes(t) && col.numericPrecision) return `${t}(${col.numericPrecision},${col.numericScale ?? 0})`;
    return t ?? col.dataType;
}