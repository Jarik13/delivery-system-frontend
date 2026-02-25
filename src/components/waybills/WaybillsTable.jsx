import React, { useState } from 'react';
import {
    Paper, TableContainer, Table, TableHead, TableRow,
    TableCell, TableBody, Box, Typography, CircularProgress,
    Divider, alpha, Checkbox, Tooltip, IconButton, Menu,
    MenuItem, ListItemIcon, ListItemText, Chip,
} from '@mui/material';
import { LocalShipping, ViewColumn, Check } from '@mui/icons-material';
import WaybillRow from './WaybillRow';

export const WAYBILL_COLUMNS = [
    { key: 'number',            label: 'Номер',             default: true,  required: true  },
    { key: 'totalWeight',       label: 'Загальна вага',     default: true                   },
    { key: 'volume',            label: "Об'єм",             default: true                   },
    { key: 'shipmentsCount',    label: 'Відправлень',       default: true                   },
    { key: 'routeSummary',      label: 'Маршрут',           default: false                  },
    { key: 'totalDistanceKm',   label: 'Відстань (км)',     default: false                  },
    { key: 'originCity',        label: 'Місто відпр.',      default: false                  },
    { key: 'destinationCity',   label: 'Місто призн.',      default: false                  },
    { key: 'statusSummary',     label: 'Статус',            default: false                  },
    { key: 'deliveredCount',    label: 'Доставлено',        default: false                  },
    { key: 'tripNumber',        label: 'Рейс',              default: false                  },
    { key: 'scheduledDeparture',label: 'Відправлення',      default: false                  },
    { key: 'createdByName',     label: 'Створив',           default: true                   },
    { key: 'createdAt',         label: 'Дата створення',    default: true                   },
];

const DEFAULT_VISIBLE = new Set(
    WAYBILL_COLUMNS.filter(c => c.default).map(c => c.key)
);

const ColumnSelector = ({ visible, onChange, mainColor }) => {
    const [anchor, setAnchor] = useState(null);

    const toggle = (key) => {
        const col = WAYBILL_COLUMNS.find(c => c.key === key);
        if (col?.required) return;
        const next = new Set(visible);
        next.has(key) ? next.delete(key) : next.add(key);
        onChange(next);
    };

    return (
        <>
            <Tooltip title="Вибрати колонки">
                <IconButton
                    size="small"
                    onClick={(e) => setAnchor(e.currentTarget)}
                    sx={{
                        color: mainColor,
                        bgcolor: alpha(mainColor, 0.08),
                        border: `1px solid ${alpha(mainColor, 0.2)}`,
                        borderRadius: 1.5,
                        '&:hover': { bgcolor: alpha(mainColor, 0.15) },
                    }}
                >
                    <ViewColumn fontSize="small" />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 200, boxShadow: 4, mt: 0.5 } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" color="text.secondary"
                        fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                        Відображати колонки
                    </Typography>
                </Box>
                <Divider />
                {WAYBILL_COLUMNS.map(col => (
                    <MenuItem
                        key={col.key}
                        onClick={() => toggle(col.key)}
                        disabled={col.required}
                        dense
                        sx={{ py: 0.75, '&:hover': { bgcolor: alpha(mainColor, 0.06) } }}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            {visible.has(col.key)
                                ? <Check sx={{ fontSize: 16, color: mainColor }} />
                                : <Box sx={{ width: 16 }} />
                            }
                        </ListItemIcon>
                        <ListItemText
                            primary={col.label}
                            primaryTypographyProps={{
                                fontSize: 13, fontWeight: visible.has(col.key) ? 700 : 400,
                                color: col.required ? 'text.disabled' : 'text.primary',
                            }}
                        />
                        {col.required && (
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                                завжди
                            </Typography>
                        )}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

const WaybillsTable = ({
    waybills, loading, mainColor,
    selected, onToggle, onToggleAll,
    highlightId, highlightRowRef,
}) => {
    const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE);

    const allSelected  = waybills.length > 0 && selected.length === waybills.length;
    const someSelected = selected.length > 0 && selected.length < waybills.length;

    const visibleDefs = WAYBILL_COLUMNS.filter(c => visibleCols.has(c.key));

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
                        {visibleDefs.length} з {WAYBILL_COLUMNS.length} колонок
                    </Typography>
                    <ColumnSelector
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
                                    <TableCell key={col.key} sx={{ fontWeight: 700 }}>
                                        {col.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {waybills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleDefs.length + 2} align="center" sx={{ py: 6 }}>
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