import React, { useState } from 'react';
import { 
    Box, TextField, MenuItem, Button, IconButton, 
    Typography, Slider, Badge, Paper, Stack, Popover, Chip, Divider, alpha
} from '@mui/material';
import { 
    Search, Tune, RestartAlt, ExpandMore, 
    CalendarMonth, LocalShipping, QueryStats, Close 
} from '@mui/icons-material';

const FilterCategory = ({ label, icon, children, activeCount }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    return (
        <Box>
            <Badge 
                badgeContent={activeCount} 
                color="primary" 
                sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16, top: 4, right: 4 } }}
            >
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={icon}
                    endIcon={<ExpandMore />}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ 
                        borderRadius: 2, 
                        textTransform: 'none', 
                        borderColor: activeCount > 0 ? 'primary.main' : '#e0e0e0',
                        color: activeCount > 0 ? 'primary.main' : 'text.primary',
                        bgcolor: activeCount > 0 ? alpha('#1976d2', 0.05) : 'transparent',
                        fontWeight: activeCount > 0 ? 700 : 400,
                        '&:hover': { borderColor: 'primary.dark' }
                    }}
                >
                    {label}
                </Button>
            </Badge>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { p: 2, mt: 1, width: 280, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
            >
                {children}
            </Popover>
        </Box>
    );
};

const DataFilters = ({ filters, onChange, onClear, fields }) => {
    const logisticsFields = fields.filter(f => !f.type || f.type === 'select' || f.type === 'text').slice(1);
    const timeFields = fields.filter(f => f.type === 'datetime');
    const rangeFields = fields.filter(f => f.type === 'range');

    const getActiveCount = (group) => {
        return group.filter(f => {
            if (f.type === 'range') {
                return filters[f.minName] > f.min || filters[f.maxName] < f.max;
            }
            return filters[f.name] !== '' && filters[f.name] != null;
        }).length;
    };

    const handleRemoveFilter = (field) => {
        if (field.type === 'range') {
            onChange(field.minName, field.min);
            onChange(field.maxName, field.max);
        } else {
            onChange(field.name, '');
        }
    };

    const renderInput = (field) => (
        <TextField 
            key={field.name}
            fullWidth size="small" label={field.label}
            select={field.type === 'select'}
            type={field.type === 'datetime' ? 'datetime-local' : 'text'}
            value={filters[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
        >
            {field.type === 'select' && [
                <MenuItem key="all" value=""><em>Всі</em></MenuItem>,
                ...(field.options || []).map(o => <MenuItem key={o.id} value={o.id}>{o.name || o.label}</MenuItem>)
            ]}
        </TextField>
    );

    const renderRange = (field) => (
        <Box key={field.label} sx={{ mb: 2, px: 1 }}>
            <Typography variant="caption" fontWeight="700" color="text.secondary">
                {field.label}
            </Typography>
            <Slider
                size="small"
                value={[Number(filters[field.minName] || field.min), Number(filters[field.maxName] || field.max)]}
                onChange={(e, v) => { onChange(field.minName, v[0]); onChange(field.maxName, v[1]); }}
                min={field.min} max={field.max}
                valueLabelDisplay="auto"
            />
        </Box>
    );

    return (
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', borderRadius: 3, bgcolor: '#ffffff' }}>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField 
                        placeholder="Швидкий пошук..." 
                        size="small" 
                        value={filters[fields[0]?.name] || ''}
                        onChange={(e) => onChange(fields[0]?.name, e.target.value)}
                        sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fcfcfc' } }}
                        InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
                    />
                    
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    <FilterCategory label="Логістика" icon={<LocalShipping fontSize="small" />} activeCount={getActiveCount(logisticsFields)}>
                        {logisticsFields.map(renderInput)}
                    </FilterCategory>

                    <FilterCategory label="Період" icon={<CalendarMonth fontSize="small" />} activeCount={getActiveCount(timeFields)}>
                        {timeFields.map(renderInput)}
                    </FilterCategory>

                    <FilterCategory label="Ціни/Вага" icon={<QueryStats fontSize="small" />} activeCount={getActiveCount(rangeFields)}>
                        {rangeFields.map(renderRange)}
                    </FilterCategory>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button 
                        startIcon={<RestartAlt />} 
                        size="small" 
                        onClick={onClear} 
                        sx={{ color: 'text.secondary', textTransform: 'none', '&:hover': { color: 'error.main' } }}
                    >
                        Скинути все
                    </Button>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ minHeight: 26 }}>
                    {fields.map(f => {
                        if (f.type !== 'range') {
                            if (!filters[f.name]) return null;
                            
                            let displayValue = filters[f.name];
                            if (f.type === 'select') {
                                const opt = f.options.find(o => String(o.id) === String(filters[f.name]));
                                displayValue = opt ? (opt.name || opt.label) : displayValue;
                            } else if (f.type === 'datetime') {
                                displayValue = new Date(filters[f.name]).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                            }

                            return (
                                <Chip 
                                    key={f.name}
                                    label={`${f.label}: ${displayValue}`}
                                    size="small"
                                    onDelete={() => handleRemoveFilter(f)}
                                    deleteIcon={<Close sx={{ color: 'error.main !important' }} />}
                                    sx={{ 
                                        borderRadius: 1.5, 
                                        bgcolor: alpha('#1976d2', 0.1), 
                                        color: 'primary.dark', 
                                        fontWeight: 600,
                                        border: `1px solid ${alpha('#1976d2', 0.2)}`
                                    }}
                                />
                            );
                        }

                        const isMinChanged = filters[f.minName] > f.min;
                        const isMaxChanged = filters[f.maxName] < f.max;

                        if (isMinChanged || isMaxChanged) {
                            return (
                                <Chip 
                                    key={f.label}
                                    label={`${f.label}: ${filters[f.minName]} - ${filters[f.maxName]}`}
                                    size="small"
                                    onDelete={() => handleRemoveFilter(f)}
                                    deleteIcon={<Close sx={{ color: 'error.main !important' }} />}
                                    sx={{ 
                                        borderRadius: 1.5, 
                                        bgcolor: alpha('#ed6c02', 0.1), 
                                        color: '#e65100', 
                                        fontWeight: 600,
                                        border: `1px solid ${alpha('#ed6c02', 0.2)}`
                                    }}
                                />
                            );
                        }
                        return null;
                    })}
                </Stack>
            </Stack>
        </Paper>
    );
};

export default DataFilters;