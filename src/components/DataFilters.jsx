import React, { useState } from 'react';
import {
    Box, TextField, MenuItem, Button, Drawer, IconButton,
    Typography, Divider, Slider, Badge, Tooltip, Paper, Chip, Stack, alpha, InputAdornment
} from '@mui/material';
import { Search, Tune, Close, RestartAlt, FilterList } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/uk';

const DataFilters = ({
    filters,
    onChange,
    onClear,
    fields,
    searchPlaceholder = "Пошук...",
    quickFilters = []
}) => {
    const [open, setOpen] = useState(false);
    
    const searchField = fields[0];
    const quickAccessFields = fields.filter(f => quickFilters.includes(f.name));
    const advancedFields = fields.filter(f =>
        f.name !== searchField?.name &&
        !quickFilters.includes(f.name)
    );

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const d = dayjs(dateStr);
        return d.isValid() ? d.format('DD.MM.YYYY, HH:mm') : dateStr;
    };

    const getOptionLabel = (field, value) => {
        const option = field.options?.find(o => String(o.id) === String(value));
        return option ? (option.name || option.label) : value;
    };

    const activeCount = Object.keys(filters).filter(key => {
        const val = filters[key];
        const field = fields.find(f => f.minName === key || f.maxName === key || f.name === key);
        if (!field || val === '' || val === null || val === undefined) return false;
        if (field.type === 'range') {
            if (key === field.minName) return val > field.min;
            if (key === field.maxName) return val < field.max;
        }
        return true;
    }).length;

    const renderField = (field, isQuick = false) => {
        if (!field) return null;

        const commonSx = {
            mb: isQuick ? 0 : 2.5, 
            mt: isQuick ? 0 : 1.5,
            minWidth: isQuick ? 200 : 'auto',
            '& .MuiInputLabel-root': {
                bgcolor: 'white',
                px: 1,
                ml: -0.5,
                fontWeight: 400,
                color: 'text.secondary',
            },
            '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '& fieldset legend': { fontSize: '0.75rem' } 
            }
        };

        if (field.type === 'range') {
            const isModified = filters[field.minName] > field.min || filters[field.maxName] < field.max;
            return (
                <Box key={field.label} sx={{ px: 1, mb: 4, mt: isQuick ? 0 : 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="body2" fontWeight="400" color="text.secondary">
                            {field.label}: <span style={{ color: '#1976d2', fontWeight: 600 }}>{filters[field.minName]} — {filters[field.maxName]}</span>
                        </Typography>
                        {isModified && (
                            <IconButton size="small" color="error" onClick={() => { onChange(field.minName, field.min); onChange(field.maxName, field.max); }}>
                                <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                        )}
                    </Box>
                    <Slider
                        size="small"
                        value={[Number(filters[field.minName] || field.min), Number(filters[field.maxName] || field.max)]}
                        onChange={(e, v) => { onChange(field.minName, v[0]); onChange(field.maxName, v[1]); }}
                        min={field.min}
                        max={field.max}
                        valueLabelDisplay="auto"
                    />
                </Box>
            );
        }

        if (field.type === 'datetime') {
            return (
                <DateTimePicker
                    key={field.name}
                    label={field.label}
                    value={filters[field.name] ? dayjs(filters[field.name]) : null}
                    onChange={(newValue) => {
                        onChange(field.name, newValue && newValue.isValid() ? newValue.format('YYYY-MM-DDTHH:mm:ss') : '');
                    }}
                    ampm={false}
                    format="DD.MM.YYYY HH:mm"
                    slotProps={{
                        textField: {
                            fullWidth: !isQuick,
                            size: 'small',
                            sx: commonSx,
                            InputLabelProps: { shrink: true },
                            InputProps: {
                                endAdornment: filters[field.name] && (
                                    <InputAdornment position="end" sx={{ mr: 3 }}>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onChange(field.name, ''); }}>
                                            <Close sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }
                    }}
                />
            );
        }

        const hasValue = filters[field.name] !== '' && filters[field.name] !== null;

        return (
            <TextField
                key={field.name}
                fullWidth={!isQuick}
                size="small"
                label={field.label}
                select={field.type === 'select'}
                value={filters[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                sx={commonSx}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                    startAdornment: isQuick && (
                        <InputAdornment position="start">
                            <FilterList fontSize="small" color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: hasValue ? (
                        <InputAdornment position="end" sx={{ mr: field.type === 'select' ? 2 : 0 }}>
                            <IconButton size="small" color="error" onClick={() => onChange(field.name, '')}>
                                <Close sx={{ fontSize: 16 }} />
                            </IconButton>
                        </InputAdornment>
                    ) : null
                }}
            >
                {field.type === 'select' && [
                    <MenuItem key="all" value=""><em>Всі</em></MenuItem>,
                    ...(field.options || []).map(o => (
                        <MenuItem key={o.id} value={o.id}>{o.name || o.label}</MenuItem>
                    ))
                ]}
            </TextField>
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
            <Box sx={{ mb: 3 }}>
                <Paper elevation={0} sx={{
                    p: 1.5, borderRadius: 3, display: 'flex', gap: 1.5, alignItems: 'center',
                    border: '1px solid #e0e0e0', bgcolor: 'white', mb: 1.5, flexWrap: 'wrap'
                }}>
                    <TextField
                        placeholder={searchPlaceholder}
                        size="small"
                        value={filters[searchField?.name] || ''}
                        onChange={(e) => onChange(searchField?.name, e.target.value)}
                        sx={{ flexGrow: 2, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} />,
                            endAdornment: filters[searchField?.name] ? (
                                <IconButton size="small" onClick={() => onChange(searchField?.name, '')}><Close sx={{ fontSize: 16 }} /></IconButton>
                            ) : null
                        }}
                    />

                    {quickAccessFields.map(f => renderField(f, true))}

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', md: 'block' } }} />

                    <Badge badgeContent={activeCount} color="primary">
                        <Button
                            variant={activeCount > 0 ? "contained" : "outlined"}
                            startIcon={<Tune />}
                            onClick={() => setOpen(true)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2, height: 40 }}
                        >
                            Більше
                        </Button>
                    </Badge>

                    {activeCount > 0 && (
                        <Tooltip title="Скинути все">
                            <IconButton onClick={onClear} color="error" sx={{ bgcolor: alpha('#f44336', 0.05), borderRadius: 2 }}>
                                <RestartAlt />
                            </IconButton>
                        </Tooltip>
                    )}
                </Paper>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ minHeight: 26, px: 0.5 }}>
                    {fields.map(f => {
                        const hasVal = f.type === 'range'
                            ? (filters[f.minName] > f.min || filters[f.maxName] < f.max)
                            : (filters[f.name] !== '' && filters[f.name] !== null);

                        if (!hasVal) return null;

                        let displayValue = "";
                        if (f.type === 'range') {
                            displayValue = `${filters[f.minName]}-${filters[f.maxName]}`;
                        } else if (f.type === 'datetime') {
                            displayValue = formatDisplayDate(filters[f.name]);
                        } else if (f.type === 'select') {
                            displayValue = getOptionLabel(f, filters[f.name]);
                        } else {
                            displayValue = filters[f.name];
                        }

                        return (
                            <Chip
                                key={f.name || f.label}
                                label={`${f.label}: ${displayValue}`}
                                size="small"
                                onDelete={() => {
                                    if (f.type === 'range') {
                                        onChange(f.minName, f.min); onChange(f.maxName, f.max);
                                    } else onChange(f.name, '');
                                }}
                                sx={{ bgcolor: alpha('#1976d2', 0.08), color: 'primary.dark', fontWeight: 500, borderRadius: 1.5 }}
                            />
                        );
                    })}
                </Stack>

                <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
                    <Box sx={{ width: 380, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterList color="primary" /> Всі фільтри
                        </Typography>

                        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                            {advancedFields.map(f => renderField(f))}
                        </Box>

                        <Button 
                            fullWidth variant="contained" 
                            onClick={() => setOpen(false)} 
                            sx={{ mt: 2, py: 1.5, borderRadius: 2, bgcolor: '#263238' }}
                        >
                            Застосувати
                        </Button>
                    </Box>
                </Drawer>
            </Box>
        </LocalizationProvider>
    );
};

export default DataFilters;