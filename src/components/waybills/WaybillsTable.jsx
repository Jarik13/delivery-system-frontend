import React, { useState } from 'react';
import {
    Paper, TableContainer, Table, TableHead, TableRow,
    TableCell, TableBody, Box, Typography, CircularProgress,
    Divider, alpha, Checkbox, Tooltip,
} from '@mui/material';
import { LocalShipping, ArrowUpward, ArrowDownward, UnfoldMore } from '@mui/icons-material';
import WaybillRow from './WaybillRow';
import ColumnSelector from '../ColumnSelector';

export const WAYBILL_COLUMNS = [
    { key: 'number', label: 'Номер', required: true, default: true, minWidth: 110, sortField: 'number' },
    { key: 'totalWeight', label: 'Загальна вага', required: false, default: true, minWidth: 120, sortField: 'totalWeight' },
    { key: 'volume', label: "Об'єм", required: false, default: true, minWidth: 100, sortField: 'volume' },
    { key: 'shipmentsCount', label: 'Відправлень', required: false, default: true, minWidth: 110 },
    { key: 'totalDistanceKm', label: 'Відстань (км)', required: false, default: false, minWidth: 120 },
    { key: 'statusSummary', label: 'Статус', required: false, default: false, minWidth: 130 },
    { key: 'deliveredCount', label: 'Доставлено', required: false, default: false, minWidth: 110 },
    { key: 'tripNumber', label: 'Рейс', required: false, default: true, minWidth: 120 },
    { key: 'scheduledDeparture', label: 'Відправлення рейсу', required: false, default: false, minWidth: 160 },
    { key: 'scheduledArrival', label: 'Прибуття рейсу', required: false, default: false, minWidth: 160 },
    { key: 'createdByName', label: 'Створив', required: false, default: true, minWidth: 160 },
    { key: 'createdAt', label: 'Дата створення', required: false, default: true, minWidth: 160, sortField: 'createdAt' },
];

const DEFAULT_VISIBLE = new Set(
    WAYBILL_COLUMNS.filter(c => c.default).map(c => c.key)
);

const SortIcon = ({ field, sortField, sortDir, color }) => {
    if (sortField !== field) return <UnfoldMore sx={{ fontSize: 14, color: alpha(color, 0.3) }} />;
    return sortDir === 'asc'
        ? <ArrowUpward sx={{ fontSize: 14, color }} />
        : <ArrowDownward sx={{ fontSize: 14, color }} />;
};

const WaybillsTable = ({
    waybills, loading, mainColor,
    selected, onToggle, onToggleAll,
    highlightId, highlightRowRef,
    onSortChange,
    sortField = null,
    sortDir = 'asc',
}) => {
    const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE);

    const allSelected = waybills.length > 0 && selected.length === waybills.length;
    const someSelected = selected.length > 0 && selected.length < waybills.length;
    const visibleDefs = WAYBILL_COLUMNS.filter(c => visibleCols.has(c.key));
    const colSpan = visibleDefs.length + 2;
    const tableMinWidth = visibleDefs.reduce((sum, c) => sum + c.minWidth, 96);

    const handleSort = (field) => {
        if (!field) return;
        const newDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
        onSortChange?.({ field, dir: newDir });
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{
                px: 1.5, py: 0.75,
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                borderBottom: `1px solid ${alpha(mainColor, 0.08)}`,
                bgcolor: alpha(mainColor, 0.02),
                borderRadius: '8px 8px 0 0',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                        {visibleDefs.length} з {WAYBILL_COLUMNS.length} колонок
                    </Typography>
                    <ColumnSelector
                        columns={WAYBILL_COLUMNS}
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
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: tableMinWidth }}>
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {waybills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#bbb' }}>
                                            <LocalShipping sx={{ fontSize: 48 }} />
                                            <Typography variant="body2">Накладних не знайдено</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                waybills.map(w => (
                                    <WaybillRow
                                        key={w.id}
                                        waybill={w}
                                        mainColor={mainColor}
                                        selected={selected.includes(w.id)}
                                        onToggle={() => onToggle(w.id)}
                                        visibleCols={visibleCols}
                                        colSpan={colSpan}
                                        isHighlighted={w.id === highlightId}
                                        highlightRowRef={w.id === highlightId ? highlightRowRef : null}
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

export default WaybillsTable;