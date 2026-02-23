import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Grow, TextField } from '@mui/material';
import { ArrowDownward, LocationOn, Map, Public } from '@mui/icons-material';
import { Autocomplete } from '@mui/material';
import { DictionaryApi } from '../../api/dictionaries';

const LocationSelectorControlled = ({
    regionId = '',
    districtId = '',
    cityId = '',
    onRegionChange,
    onDistrictChange,
    onCityChange,
    error,
}) => {
    const [regions, setRegions]   = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities]     = useState([]);

    const [districtSearch, setDistrictSearch] = useState('');
    const [citySearch, setCitySearch]         = useState('');

    useEffect(() => {
        DictionaryApi.getAll('regions', 0, 100)
            .then(res => setRegions(res.data.content || res.data || []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!regionId) { setDistricts([]); return; }
        DictionaryApi.getAll('districts', 0, 1000, { regionId })
            .then(res => setDistricts(res.data.content || res.data || []))
            .catch(console.error);
    }, [regionId]);

    useEffect(() => {
        if (!districtId) { setCities([]); return; }
        DictionaryApi.getAll('cities', 0, 1000, { districtId })
            .then(res => setCities(res.data.content || res.data || []))
            .catch(console.error);
    }, [districtId]);

    useEffect(() => {
        if (!cityId || (regionId && districtId)) return;

        const restore = async () => {
            try {
                const cityRes = await DictionaryApi.getById('cities', cityId);
                const cityData = cityRes.data;
                if (!cityData?.districtId) return;

                const distRes = await DictionaryApi.getById('districts', cityData.districtId);
                const distData = distRes.data;
                const restoredRegionId = distData.regionId || distData.region?.id;
                if (!restoredRegionId) return;

                onRegionChange?.(restoredRegionId);
                onDistrictChange?.(cityData.districtId);
            } catch (e) {
                console.error('LocationSelectorControlled: failed to restore hierarchy', e);
            }
        };
        restore();
    }, [cityId]);

    const filteredDistricts = districts.filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase()));
    const filteredCities = cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()));

    const handleRegionChange = (e) => {
        onRegionChange?.(e.target.value);
        onDistrictChange?.(null);
        onCityChange?.(null, null);
    };

    const handleDistrictChange = (_, value) => {
        onDistrictChange?.(value?.id ?? null);
        onCityChange?.(null, null);
    };

    const handleCityChange = (_, value) => {
        onCityChange?.(value?.id ?? null, value?.name ?? null);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Public color="primary" />
                <FormControl fullWidth size="small">
                    <InputLabel>1. Оберіть область</InputLabel>
                    <Select
                        value={regionId}
                        label="1. Оберіть область"
                        onChange={handleRegionChange}
                    >
                        {regions.map(r => (
                            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Grow in={!!regionId}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <ArrowDownward sx={{ color: 'text.disabled', fontSize: 20 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Map color="primary" />
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={filteredDistricts}
                            getOptionLabel={(o) => o.name}
                            value={districts.find(d => d.id === districtId) || null}
                            onChange={handleDistrictChange}
                            onInputChange={(_, val) => setDistrictSearch(val)}
                            renderInput={(params) => (
                                <TextField {...params} label="2. Оберіть район" />
                            )}
                        />
                    </Box>
                </Box>
            </Grow>

            <Grow in={!!districtId}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <ArrowDownward sx={{ color: 'text.disabled', fontSize: 20 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <LocationOn sx={{ color: cityId ? 'success.main' : 'primary.main' }} />
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={filteredCities}
                            getOptionLabel={(o) => o.name}
                            value={cities.find(c => c.id === cityId) || null}
                            onChange={handleCityChange}
                            onInputChange={(_, val) => setCitySearch(val)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="3. Оберіть населений пункт"
                                    error={!!error}
                                    helperText={error ? "Обов'язкове поле" : ''}
                                />
                            )}
                        />
                    </Box>
                </Box>
            </Grow>

        </Box>
    );
};

export default LocationSelectorControlled;