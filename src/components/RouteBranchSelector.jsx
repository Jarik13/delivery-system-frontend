import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, CircularProgress } from '@mui/material';
import LocationSelector from './LocationSelector';
import { DictionaryApi } from '../api/dictionaries';

const RouteBranchSelector = ({ title, icon: Icon, cityId, branchId, onBranchChange, onCityChange, color = 'primary.main' }) => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (cityId) {
            setLoading(true);
            DictionaryApi.getAll('branches', 0, 1000, { cityId: cityId })
                .then(res => {
                    setBranches(res.data.content || []);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setBranches([]);
        }
    }, [cityId]);

    return (
        <Paper 
            variant="outlined" 
            sx={{ 
                p: 2, 
                bgcolor: '#fcfcfc', 
                height: '100%', 
                borderRadius: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1.5,
                border: '1px solid #e0e0e0'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {Icon && <Icon sx={{ color: color, fontSize: 22 }} />}
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {title}
                </Typography>
            </Box>

            <Box sx={{ width: '100%' }}>
                <LocationSelector selectedCityId={cityId} onCityChange={onCityChange} />
            </Box>

            <FormControl fullWidth size="small" sx={{ mt: 'auto' }} disabled={!cityId || loading}>
                <InputLabel sx={{ fontSize: '0.85rem' }}>4. Оберіть відділення</InputLabel>
                <Select
                    value={branchId || ''}
                    label="4. Оберіть відділення"
                    onChange={(e) => onBranchChange(e.target.value)}
                    sx={{ fontSize: '0.85rem' }}
                    endAdornment={loading ? <CircularProgress size={16} sx={{ mr: 3 }} /> : null}
                >
                    {branches.length === 0 && !loading && (
                        <MenuItem disabled value=""><em>Відділень не знайдено</em></MenuItem>
                    )}
                    {branches.map(b => (
                        <MenuItem key={b.id} value={b.id} sx={{ fontSize: '0.85rem' }}>
                            {b.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Paper>
    );
};

export default RouteBranchSelector;