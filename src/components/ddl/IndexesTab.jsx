import React, { useState } from 'react';
import {
    Box, Table, TableHead, TableBody, TableRow, TableCell,
    TableContainer, Typography, Chip, IconButton, Tooltip, alpha,
} from '@mui/material';
import { Delete, AddCircleOutline } from '@mui/icons-material';
import AddIndexDialog from './dialogs/AddIndexDialog';
import ConfirmDialog from './dialogs/ConfirmDialog';
import { DdlApi } from '../../api/dictionaries';

export default function IndexesTab({ tableInfo, onRefresh, mainColor }) {
    const [addOpen, setAddOpen] = useState(false);
    const [dropName, setDropName] = useState(null);

    const headSx = {
        fontWeight: 700,
        fontSize: 11,
        textTransform: 'uppercase',
        color: 'text.secondary',
        bgcolor: alpha(mainColor, 0.04),
        py: 1,
    };

    const handleDrop = async () => {
        await DdlApi.dropIndex({ tableName: tableInfo.tableName, indexName: dropName });
        setDropName(null);
        onRefresh();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <Tooltip title="Створити індекс">
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
                            <TableCell sx={headSx}>Колонки</TableCell>
                            <TableCell sx={headSx} align="right">Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tableInfo.indexes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.disabled">
                                        Немає індексів
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : tableInfo.indexes.map(idx => (
                            <TableRow key={idx.indexName} hover>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                                        {idx.indexName}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={idx.unique ? 'UNIQUE' : 'INDEX'}
                                        size="small"
                                        sx={{
                                            fontSize: 10, fontWeight: 700,
                                            bgcolor: idx.unique ? alpha('#4caf50', 0.1) : alpha('#9e9e9e', 0.1),
                                            color: idx.unique ? '#2e7d32' : '#616161',
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {idx.columns.map(col => (
                                            <Chip
                                                key={col}
                                                label={col}
                                                size="small"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: 11,
                                                    bgcolor: alpha(mainColor, 0.07),
                                                    color: mainColor,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Видалити індекс">
                                        <IconButton size="small" onClick={() => setDropName(idx.indexName)}>
                                            <Delete sx={{ fontSize: 16, color: '#f44336' }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <AddIndexDialog
                open={addOpen}
                tableName={tableInfo.tableName}
                columns={tableInfo.columns}
                mainColor={mainColor}
                onClose={() => setAddOpen(false)}
                onSuccess={() => { setAddOpen(false); onRefresh(); }}
            />

            <ConfirmDialog
                open={Boolean(dropName)}
                title="Видалити індекс?"
                message={`Індекс "${dropName}" буде видалено. Цю дію не можна скасувати.`}
                confirmLabel="Видалити"
                dangerous
                onConfirm={handleDrop}
                onClose={() => setDropName(null)}
            />
        </Box>
    );
}