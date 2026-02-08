import React, { useState } from 'react';
import { 
    Box, TextField, MenuItem, Button, Collapse, Grid, InputAdornment, Paper, Slider, Typography 
} from '@mui/material';
import { Search, FilterList, Close, CalendarToday, AccessTime } from '@mui/icons-material';

const DataFilters = ({ filters, onChange, onClear, fields }) => {
    const [expanded, setExpanded] = useState(true);
    
    const hasActiveFilters = Object.keys(filters).some(key => {
        const val = filters[key];
        if (key.toLowerCase().includes('min') || key.toLowerCase().includes('max')) return false; 
        return val !== '' && val !== null && val !== undefined;
    });

    const getMdValue = (field) => {
        if (field.md) return field.md;
        if (field.type === 'range') return 4;
        if (field.type === 'datetime') return 4;
        if (field.type === 'select') return 3;
        return 3; 
    };

    return (
        <Paper elevation={0} sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'visible' }}>
            <Box 
                sx={{ 
                    p: 1.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    bgcolor: '#f8f9fa', cursor: 'pointer', borderTopLeftRadius: 12, borderTopRightRadius: 12,
                    borderBottom: expanded ? '1px solid #e0e0e0' : 'none', transition: 'background 0.2s',
                    '&:hover': { bgcolor: '#f0f0f0' }
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterList color="action" fontSize="small" />
                    <Box sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.9rem' }}>
                        Фільтри та пошук
                    </Box>
                </Box>
                {hasActiveFilters && (
                    <Button size="small" color="error" startIcon={<Close />} onClick={(e) => { e.stopPropagation(); onClear(); }}>
                        Скинути
                    </Button>
                )}
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ p: 2.5 }}>
                    <Grid container spacing={3} alignItems="flex-end">
                        {fields.map((field, index) => {
                            const mdValue = getMdValue(field);

                            const commonStyles = {
                                minWidth: field.type === 'datetime' ? '200px' : '150px',
                                '& .MuiInputLabel-root': {
                                    fontSize: '0.85rem',
                                    backgroundColor: 'white',
                                    px: 0.5
                                }
                            };

                            if (field.type === 'select') {
                                return (
                                    <Grid item xs={12} sm={6} md={mdValue} key={field.name || index}>
                                        <TextField
                                            select fullWidth label={field.label} value={filters[field.name] || ''}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            size="small"
                                            sx={commonStyles}
                                            InputLabelProps={{ shrink: true }}
                                        >
                                            <MenuItem value=""><em>Всі</em></MenuItem>
                                            {field.options?.map((opt) => (
                                                <MenuItem key={opt.id} value={opt.id}>{opt.name || opt.label}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                );
                            }

                            if (field.type === 'datetime') {
                                return (
                                    <Grid item xs={12} sm={6} md={mdValue} key={field.name || index}>
                                        <TextField
                                            fullWidth label={field.label} type="datetime-local" size="small"
                                            value={filters[field.name] || ''}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            sx={commonStyles}
                                            InputLabelProps={{ shrink: true }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <AccessTime fontSize="small" sx={{ mr: -0.5 }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                );
                            }

                            if (field.type === 'range') {
                                return (
                                    <Grid item xs={12} sm={6} md={mdValue} key={field.label || index}>
                                        <Box sx={{ px: 1, pb: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 700 }}>
                                                {field.label}: {filters[field.minName]} — {filters[field.maxName]}
                                            </Typography>
                                            <Slider
                                                size="small"
                                                value={[Number(filters[field.minName]), Number(filters[field.maxName])]}
                                                onChange={(e, newValue) => {
                                                    onChange(field.minName, newValue[0]);
                                                    onChange(field.maxName, newValue[1]);
                                                }}
                                                valueLabelDisplay="auto"
                                                min={field.min} max={field.max}
                                                sx={{ color: '#263238' }}
                                            />
                                        </Box>
                                    </Grid>
                                );
                            }

                            return (
                                <Grid item xs={12} sm={6} md={mdValue} key={field.name || index}>
                                    <TextField
                                        fullWidth label={field.label} value={filters[field.name] || ''}
                                        onChange={(e) => onChange(field.name, e.target.value)}
                                        size="small"
                                        sx={commonStyles}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            endAdornment: (<InputAdornment position="end"><Search color="disabled" fontSize="small" /></InputAdornment>),
                                        }}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            </Collapse>
        </Paper>
    );
};

export default DataFilters;