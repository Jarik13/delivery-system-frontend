import React, { useState } from 'react';
import {
    Box, Table, TableHead, TableBody, TableRow, TableCell,
    TableContainer, Typography, Chip, IconButton, Tooltip,
    alpha,
} from '@mui/material';
import { Delete, AddCircleOutline } from '@mui/icons-material';
import AddConstraintDialog from './dialogs/AddConstraintDialog';
import ConfirmDialog from './dialogs/ConfirmDialog';
import { DdlApi } from '../../api/dictionaries';

export default function ConstraintsTab({ tableInfo, onRefresh, mainColor }) {
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

    const constraintColor = (type) => {
        if (type === 'UNIQUE') return { bg: alpha('#2196f3', 0.1), color: '#1565c0' };
        if (type === 'CHECK') return { bg: alpha('#ff9800', 0.1), color: '#e65100' };
        return { bg: alpha('#9e9e9e', 0.1), color: '#616161' };
    };

    const handleDrop = async () => {
        await DdlApi.dropConstraint({ tableName: tableInfo.tableName, constraintName: dropName });
        setDropName(null);
        onRefresh();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <Tooltip title="Додати constraint">
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
                            <TableCell sx={headSx}>Колонка</TableCell>
                            <TableCell sx={headSx}>Вираз</TableCell>
                            <TableCell sx={headSx} align="right">Дії</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tableInfo.constraints.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.disabled">
                                        Немає constraints
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : tableInfo.constraints.map(c => {
                            const colors = constraintColor(c.constraintType);
                            return (
                                <TableRow key={c.constraintName} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                                            {c.constraintName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={c.constraintType}
                                            size="small"
                                            sx={{
                                                fontSize: 10, fontWeight: 700,
                                                bgcolor: colors.bg, color: colors.color,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                                            {c.columnName ?? '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" fontFamily="monospace" color="text.secondary"
                                            sx={{ maxWidth: 300, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.checkClause ?? '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Видалити constraint">
                                            <IconButton size="small" onClick={() => setDropName(c.constraintName)}>
                                                <Delete sx={{ fontSize: 16, color: '#f44336' }} />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <AddConstraintDialog
                open={addOpen}
                tableName={tableInfo.tableName}
                columns={tableInfo.columns}
                mainColor={mainColor}
                onClose={() => setAddOpen(false)}
                onSuccess={() => { setAddOpen(false); onRefresh(); }}
            />

            <ConfirmDialog
                open={Boolean(dropName)}
                title="Видалити constraint?"
                message={`Constraint "${dropName}" буде видалено. Цю дію не можна скасувати.`}
                confirmLabel="Видалити"
                dangerous
                onConfirm={handleDrop}
                onClose={() => setDropName(null)}
            />
        </Box>
    );
}