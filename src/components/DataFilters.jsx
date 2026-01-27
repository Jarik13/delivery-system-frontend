import React, { useState } from 'react';
import { 
    Box, TextField, MenuItem, Button, Collapse, Grid, InputAdornment, Paper, Slider, Typography 
} from '@mui/material';
import { Search, FilterList, Close } from '@mui/icons-material';

const DataFilters = ({ filters, onChange, onClear, fields }) => {
    const [expanded, setExpanded] = useState(true);
    
    const hasActiveFilters = Object.keys(filters).some(key => {
        const val = filters[key];
        if ((key.includes('Min') && val === 0) || (key.includes('Max') && val === 100)) return false;
        return val !== '' && val !== null && val !== undefined;
    });

    const getMdValue = (field) => {
        if (field.md) return field.md;
        if (field.type === 'range') return 4;
        if (fields.length <= 3) return 4;
        if (fields.length === 4) return 3;
        return 2;
    };

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                mb: 2, border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'visible' 
            }}
        >
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
                <Box sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="flex-end">
                        {fields.map((field) => {
                            const isRange = field.type === 'range';
                            const mdValue = getMdValue(field);

                            return (
                                <Grid item xs={12} sm={6} md={mdValue} key={field.name || field.label} sx={{ flexGrow: 1 }}>
                                    {field.type === 'select' ? (
                                        <TextField
                                            select fullWidth label={field.label} value={filters[field.name] || ''}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            size="small" variant="outlined"
                                            sx={{ 
                                                minWidth: '160px',
                                                '& .MuiInputLabel-root': { 
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '100%',
                                                    overflow: 'visible'
                                                } 
                                            }}
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        >
                                            <MenuItem value=""><em>Всі</em></MenuItem>
                                            {field.options?.map((opt) => (
                                                <MenuItem key={opt.id} value={opt.id}>{opt.name || opt.label}</MenuItem>
                                            ))}
                                        </TextField>
                                    ) : isRange ? (
                                        <Box sx={{ px: 1, pb: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
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
                                                sx={{ py: 1, '& .MuiSlider-thumb': { width: 14, height: 14 } }}
                                            />
                                        </Box>
                                    ) : (
                                        <TextField
                                            fullWidth label={field.label} value={filters[field.name] || ''}
                                            onChange={(e) => onChange(field.name, e.target.value)}
                                            size="small" variant="outlined"
                                            InputProps={{
                                                sx: { borderRadius: 2 },
                                                endAdornment: (<InputAdornment position="end"><Search color="disabled" fontSize="small" /></InputAdornment>),
                                            }}
                                        />
                                    )}
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