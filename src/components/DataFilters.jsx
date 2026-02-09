import React, { useState } from 'react';
import { 
    Box, TextField, MenuItem, Button, Drawer, IconButton, 
    Typography, Divider, Slider, Badge, Tooltip, Paper 
} from '@mui/material';
import { 
    Search, Tune, Close, RestartAlt 
} from '@mui/icons-material';

const DataFilters = ({ filters, onChange, onClear, fields }) => {
    const [open, setOpen] = useState(false);

    const activeCount = Object.keys(filters).filter(key => {
        const val = filters[key];
        if (key.toLowerCase().includes('min') || key.toLowerCase().includes('max')) return false; 
        return val !== '' && val !== null && val !== undefined;
    }).length;

    const renderField = (field) => {
        if (field.type === 'range') {
            return (
                <Box key={field.label} sx={{ px: 1, mb: 3 }}>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {field.label}: {filters[field.minName]} — {filters[field.maxName]}
                    </Typography>
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

        return (
            <TextField 
                key={field.name}
                fullWidth 
                size="small" 
                label={field.label}
                type={field.type === 'datetime' ? 'datetime-local' : 'text'}
                select={field.type === 'select'}
                value={filters[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2.5 }}
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

    const logisticsFields = fields.filter(f => !f.type || f.type === 'select' || f.type === 'text');
    const timeFields = fields.filter(f => f.type === 'datetime');
    const rangeFields = fields.filter(f => f.type === 'range');

    return (
        <>
            <Paper elevation={0} sx={{ p: 1.5, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', border: '1px solid #e0e0e0', bgcolor: 'white' }}>
                <TextField 
                    placeholder="Швидкий пошук..." 
                    size="small" 
                    // Прив'язуємо до першого текстового поля (зазвичай name або trackingNumber)
                    value={filters[fields[0]?.name] || ''}
                    onChange={(e) => onChange(fields[0]?.name, e.target.value)}
                    sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} /> }}
                />
                
                <Badge badgeContent={activeCount} color="primary">
                    <Button 
                        variant="outlined" 
                        startIcon={<Tune />} 
                        onClick={() => setOpen(true)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
                    >
                        Фільтри
                    </Button>
                </Badge>

                {activeCount > 0 && (
                    <Tooltip title="Скинути фільтри">
                        <IconButton onClick={onClear} color="error" size="small"><RestartAlt /></IconButton>
                    </Tooltip>
                )}
            </Paper>

            <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
                <Box sx={{ width: 340, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" fontWeight="800">Фільтри пошуку</Typography>
                        <IconButton onClick={() => setOpen(false)}><Close /></IconButton>
                    </Box>

                    <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                        {logisticsFields.length > 0 && (
                            <>
                                <Typography variant="overline" color="primary" fontWeight="800">Основна інформація</Typography>
                                <Divider sx={{ mb: 2 }} />
                                {logisticsFields.map(renderField)}
                            </>
                        )}

                        {timeFields.length > 0 && (
                            <>
                                <Typography variant="overline" color="primary" fontWeight="800" sx={{ mt: 2, display: 'block' }}>Період</Typography>
                                <Divider sx={{ mb: 2 }} />
                                {timeFields.map(renderField)}
                            </>
                        )}

                        {rangeFields.length > 0 && (
                            <>
                                <Typography variant="overline" color="primary" fontWeight="800" sx={{ mt: 2, display: 'block' }}>Параметри</Typography>
                                <Divider sx={{ mb: 2 }} />
                                {rangeFields.map(renderField)}
                            </>
                        )}
                    </Box>

                    <Box sx={{ pt: 2, borderTop: '1px solid #eee' }}>
                        <Button fullWidth variant="contained" onClick={() => setOpen(false)} sx={{ borderRadius: 2, py: 1.2, fontWeight: 700 }}>
                            Застосувати
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default DataFilters;