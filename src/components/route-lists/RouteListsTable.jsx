import React, { useState } from 'react';
import {
    Paper, TableContainer, Table, TableHead, TableRow,
    TableCell, TableBody, Box, Typography, CircularProgress,
    Divider, alpha, Checkbox, Tooltip,
} from '@mui/material';
import { AssignmentInd, ArrowUpward, ArrowDownward, UnfoldMore } from '@mui/icons-material';
import RouteListRow from './RouteListRow';
import ColumnSelector from '../ColumnSelector';

export const ROUTE_LIST_COLUMNS = [
    { key: 'number', label: 'Номер листа', required: true, minWidth: 120, sortField: 'number' },
    { key: 'courier', label: "Кур'єр", required: false, minWidth: 160 },
    { key: 'status', label: 'Статус', required: false, minWidth: 130 },
    { key: 'progress', label: 'Прогрес', required: false, minWidth: 130 },
    { key: 'totalWeight', label: 'Вага (кг)', required: false, minWidth: 110, sortField: 'totalWeight' },
    { key: 'shipmentsCount', label: 'Відправлень', required: false, minWidth: 110 },
    { key: 'delivered', label: 'Доставлено', required: false, minWidth: 110 },
    { key: 'createdAt', label: 'Дата створення', required: false, minWidth: 150, sortField: 'createdAt' },
    { key: 'plannedDepart', label: 'Плановий виїзд', required: false, minWidth: 150, sortField: 'plannedDepartureTime' },
];

const DEFAULT_VISIBLE = new Set(ROUTE_LIST_COLUMNS.map(c => c.key));

const SortIcon = ({ field, sortField, sortDir, color }) => {
    if (sortField !== field) return <UnfoldMore sx={{ fontSize: 14, color: alpha(color, 0.3) }} />;
    return sortDir === 'asc'
        ? <ArrowUpward sx={{ fontSize: 14, color }} />
        : <ArrowDownward sx={{ fontSize: 14, color }} />;
};

const RouteListsTable = ({
    items, loading, mainColor,
    selected = [], onToggle, onToggleAll,
    highlightId, highlightRowRef,
    onAddShipment,
    onEdit,
    onDelete,
    onSortChange,
}) => {
    const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE);
    const [sortField, setSortField] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const allSelected = items.length > 0 && selected.length === items.length;
    const someSelected = selected.length > 0 && selected.length < items.length;
    const visibleDefs = ROUTE_LIST_COLUMNS.filter(c => visibleCols.has(c.key));
    const colSpan = visibleDefs.length + 2;

    const handleSort = (field) => {
        if (!field) return;
        const newDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDir(newDir);
        onSortChange?.({ field, dir: newDir });
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{
                px: 1.5, py: 0.75,
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                borderBottom: `1px solid ${alpha(mainColor, 0.08)}`,
                bgcolor: alpha(mainColor, 0.02),
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                        {visibleDefs.length} з {ROUTE_LIST_COLUMNS.length} колонок
                    </Typography>
                    <ColumnSelector
                        columns={ROUTE_LIST_COLUMNS}
                        visible={visibleCols}
                        onChange={setVisibleCols}
                        mainColor={mainColor}
                    />
                </Box>
            </Box>

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

                                {visibleDefs.map(col => (
                                    <TableCell
                                        key={col.key}
                                        sx={{
                                            fontWeight: 700,
                                            minWidth: col.minWidth,
                                            whiteSpace: 'nowrap',
                                            cursor: col.sortField ? 'pointer' : 'default',
                                            userSelect: 'none',
                                            '&:hover': col.sortField
                                                ? { bgcolor: alpha(mainColor, 0.06) }
                                                : {},
                                        }}
                                        onClick={() => handleSort(col.sortField)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {col.label}
                                            {col.sortField && (
                                                <SortIcon
                                                    field={col.sortField}
                                                    sortField={sortField}
                                                    sortDir={sortDir}
                                                    color={mainColor}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                ))}

                                <TableCell padding="checkbox" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
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
                                        visibleCols={visibleCols}
                                        onAddShipment={onAddShipment}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
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