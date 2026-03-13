import React from 'react';
import {
    Paper, TableContainer, Table, TableHead, TableRow,
    TableCell, TableBody, Box, Typography, CircularProgress,
    Divider, alpha, Checkbox, Tooltip,
} from '@mui/material';
import { AssignmentInd } from '@mui/icons-material';
import RouteListRow from './RouteListRow';

const RouteListsTable = ({
    items, loading, mainColor,
    selected = [], onToggle, onToggleAll,
    highlightId,
    highlightRowRef,
}) => {
    const allSelected = items.length > 0 && selected.length === items.length;
    const someSelected = selected.length > 0 && selected.length < items.length;

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                    <CircularProgress sx={{ color: mainColor }} />
                </Box>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                                <TableCell padding="checkbox" width={48}>
                                    <Tooltip title={allSelected ? 'Зняти всі' : 'Вибрати всі'}>
                                        <Checkbox
                                            size="small"
                                            checked={allSelected}
                                            indeterminate={someSelected}
                                            onChange={onToggleAll}
                                            sx={{
                                                color: alpha(mainColor, 0.5),
                                                '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: mainColor },
                                            }}
                                        />
                                    </Tooltip>
                                </TableCell>
                                <TableCell width={48} />
                                <TableCell sx={{ fontWeight: 700 }}>Номер листа</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Кур'єр</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Статус</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Прогрес</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Загальна вага</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Дата формування</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Плановий виїзд</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#bbb' }}>
                                            <AssignmentInd sx={{ fontSize: 48 }} />
                                            <Typography variant="body2">Маршрутних листів не знайдено</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map(item => (
                                    <RouteListRow
                                        key={item.id}
                                        item={item}
                                        mainColor={mainColor}
                                        selected={selected.includes(item.id)}
                                        onToggle={() => onToggle(item.id)}
                                        isHighlighted={item.id === highlightId}
                                        highlightRowRef={item.id === highlightId ? highlightRowRef : null}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Divider />
        </Paper>
    );
};

export default RouteListsTable;