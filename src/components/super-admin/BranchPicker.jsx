import React, { useState, useEffect } from 'react';
import {
    Box, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, FormHelperText, Autocomplete, TextField,
} from '@mui/material';
import { DictionaryApi } from '../../api/dictionaries';

const BranchPicker = ({
    cityId,
    branchId,
    onCityChange,
    onBranchChange,
    error,
    errorText,
}) => {
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);
    const [branches, setBranches] = useState([]);

    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);

    useEffect(() => {
        setLoadingRegions(true);
        DictionaryApi.getAll('regions', 0, 100)
            .then(r => setRegions(r.data.content || r.data || []))
            .catch(() => { })
            .finally(() => setLoadingRegions(false));
    }, []);

    useEffect(() => {
        if (!selectedRegion) { setDistricts([]); setSelectedDistrict(null); return; }
        setLoadingDistricts(true);
        DictionaryApi.getAll('districts', 0, 200, { regionId: selectedRegion.id })
            .then(r => setDistricts(r.data.content || r.data || []))
            .catch(() => { })
            .finally(() => setLoadingDistricts(false));
        setSelectedDistrict(null);
        setCities([]);
        setSelectedCity(null);
        onCityChange('');
    }, [selectedRegion]);

    useEffect(() => {
        if (!selectedDistrict) { setCities([]); setSelectedCity(null); return; }
        setLoadingCities(true);
        DictionaryApi.getAll('cities', 0, 500, { districtId: selectedDistrict.id })
            .then(r => setCities(r.data.content || r.data || []))
            .catch(() => { })
            .finally(() => setLoadingCities(false));
        setSelectedCity(null);
        onCityChange('');
    }, [selectedDistrict]);

    useEffect(() => {
        if (!selectedCity) { setBranches([]); return; }
        setLoadingBranches(true);
        DictionaryApi.getAll('branches', 0, 1000, { cityId: selectedCity.id })
            .then(r => setBranches(r.data.content || r.data || []))
            .catch(() => { })
            .finally(() => setLoadingBranches(false));
        onCityChange(selectedCity.id);
    }, [selectedCity]);

    const autocomplete = (label, options, value, onChange, loading, disabled) => (
        <Autocomplete
            size="small"
            sx={{ flex: '1 1 180px' }}
            options={options}
            getOptionLabel={o => o.name || ''}
            value={value}
            onChange={(_, v) => onChange(v)}
            disabled={disabled || loading}
            loading={loading}
            renderInput={params => (
                <TextField
                    {...params}
                    label={label}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading && <CircularProgress size={14} />}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );

    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {autocomplete('Область', regions, selectedRegion,
                setSelectedRegion, loadingRegions, false)}

            {autocomplete('Район', districts, selectedDistrict,
                setSelectedDistrict, loadingDistricts, !selectedRegion)}

            {autocomplete('Місто', cities, selectedCity,
                setSelectedCity, loadingCities, !selectedDistrict)}

            <FormControl
                size="small"
                sx={{ flex: '1 1 180px' }}
                disabled={!selectedCity || loadingBranches}
                error={!!error && !branchId}
            >
                <InputLabel>Відділення</InputLabel>
                <Select
                    value={branchId || ''}
                    label="Відділення"
                    onChange={e => onBranchChange(e.target.value)}
                    endAdornment={loadingBranches
                        ? <CircularProgress size={14} sx={{ mr: 3 }} />
                        : null}
                >
                    {branches.length === 0 && !loadingBranches && (
                        <MenuItem disabled value="">
                            <em>Відділень не знайдено</em>
                        </MenuItem>
                    )}
                    {branches.map(b => (
                        <MenuItem key={b.id} value={b.id}>
                            <Box>
                                <Box sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.name}</Box>
                                {b.address && (
                                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                        {b.address}
                                    </Box>
                                )}
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
                {error && !branchId && (
                    <FormHelperText error>{errorText || 'Оберіть відділення'}</FormHelperText>
                )}
            </FormControl>
        </Box>
    );
};

export default BranchPicker;