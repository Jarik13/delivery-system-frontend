import React, { useState } from 'react';
import { 
    Box, TextField, MenuItem, Button, Collapse, Grid, InputAdornment, Paper 
} from '@mui/material';
import { Search, FilterList, Close } from '@mui/icons-material';

const DataFilters = ({ filters, onChange, onClear, fields }) => {
    const [expanded, setExpanded] = useState(false);

    const hasActiveFilters = Object.values(filters).some(val => val !== '' && val !== null);

    return (
        <Paper elevation={0} sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
            <Box 
                sx={{ 
                    p: 1.5, px: 2, 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    bgcolor: '#f8f9fa', cursor: 'pointer'
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
                    <Button 
                        size="small" 
                        color="error" 
                        startIcon={<Close />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                        }}
                    >
                        Скинути
                    </Button>
                )}
            </Box>

            <Collapse in={expanded || hasActiveFilters}>
                <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                        {fields.map((field) => (
                            <Grid item xs={12} sm={6} md={3} key={field.name}>
                                {field.type === 'select' ? (
                                    <TextField
                                        select
                                        fullWidth
                                        label={field.label}
                                        value={filters[field.name] || ''}
                                        onChange={(e) => onChange(field.name, e.target.value)}
                                        size="small"
                                        variant="outlined"
                                    >
                                        <MenuItem value=""><em>Всі</em></MenuItem>
                                        {field.options?.map((opt) => (
                                            <MenuItem key={opt.id} value={opt.id}>
                                                {opt.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                ) : (
                                    <TextField
                                        fullWidth
                                        label={field.label}
                                        value={filters[field.name] || ''}
                                        onChange={(e) => onChange(field.name, e.target.value)}
                                        size="small"
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Search color="disabled" fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Collapse>
        </Paper>
    );
};

export default DataFilters;