import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, FormHelperText, Grow } from '@mui/material';
import { ArrowDownward, LocationOn, Map, Public } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';

const LocationSelector = ({ selectedCityId, onCityChange, error }) => {
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedCity, setSelectedCity] = useState(selectedCityId || '');

    useEffect(() => {
        const loadRegions = async () => {
            try {
                const res = await DictionaryApi.getAll('regions', 0, 25);
                setRegions(res.data.content || res.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        loadRegions();
    }, []);

    useEffect(() => {
        if (selectedCityId && !selectedRegion && regions.length > 0) {
            const prefillLocation = async () => {
                try {
                    const cityRes = await DictionaryApi.getById('cities', selectedCityId);
                    const cityData = cityRes.data;

                    if (cityData.districtId) {
                        const distRes = await DictionaryApi.getById('districts', cityData.districtId);
                        const distData = distRes.data;

                        if (distData.regionId) {
                            setSelectedRegion(distData.regionId);

                            const districtsRes = await DictionaryApi.getByParam('districts', 'regionId', distData.regionId);
                            setDistricts(districtsRes.data.content || districtsRes.data || []);

                            setSelectedDistrict(cityData.districtId);

                            const citiesRes = await DictionaryApi.getByParam('cities', 'districtId', cityData.districtId);
                            setCities(citiesRes.data.content || citiesRes.data || []);

                            setSelectedCity(selectedCityId);
                        }
                    }
                } catch (e) {
                    console.error("Failed to prefill location", e);
                }
            };
            prefillLocation();
        } else if (!selectedCityId) {
            setSelectedRegion('');
            setSelectedDistrict('');
            setSelectedCity('');
            setDistricts([]);
            setCities([]);
        }
    }, [selectedCityId, regions.length]);

    const handleRegionChange = async (e) => {
        const regionId = e.target.value;
        setSelectedRegion(regionId);
        
        setSelectedDistrict('');
        setSelectedCity('');
        setDistricts([]);
        setCities([]);
        onCityChange(null);

        if (regionId) {
            try {
                const res = await DictionaryApi.getByParam('districts', 'regionId', regionId);
                setDistricts(res.data.content || res.data || []);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleDistrictChange = async (e) => {
        const districtId = e.target.value;
        setSelectedDistrict(districtId);
        
        setSelectedCity('');
        setCities([]);
        onCityChange(null);

        if (districtId) {
            try {
                const res = await DictionaryApi.getByParam('cities', 'districtId', districtId);
                setCities(res.data.content || res.data || []);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleCityChange = (e) => {
        const cityId = e.target.value;
        setSelectedCity(cityId);
        onCityChange(cityId);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 1, mb: 1 }}>  
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <Public sx={{ color: 'primary.main', mr: 2 }} />
                <FormControl fullWidth size="small">
                    <InputLabel>1. Оберіть область</InputLabel>
                    <Select 
                        value={selectedRegion} 
                        label="1. Оберіть область" 
                        onChange={handleRegionChange}
                    >
                        {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            <Grow in={!!selectedRegion} style={{ transformOrigin: '0 0 0' }} timeout={500}>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ArrowDownward sx={{ color: 'text.secondary', my: 1 }} />

                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                        <Map sx={{ color: 'primary.main', mr: 2 }} />
                        <FormControl fullWidth size="small">
                            <InputLabel>2. Оберіть район</InputLabel>
                            <Select 
                                value={selectedDistrict} 
                                label="2. Оберіть район" 
                                onChange={handleDistrictChange}
                            >
                                {districts.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </Grow>

            <Grow in={!!selectedDistrict} style={{ transformOrigin: '0 0 0' }} timeout={500}>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>  
                    <ArrowDownward sx={{ color: 'text.secondary', my: 1 }} />

                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ color: selectedCity ? 'success.main' : 'primary.main', mr: 2 }} />
                        <FormControl fullWidth size="small" error={!!error}>
                            <InputLabel>3. Оберіть населений пункт</InputLabel>
                            <Select 
                                value={selectedCity} 
                                label="3. Оберіть населений пункт" 
                                onChange={handleCityChange}
                            >
                                {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                            {error && <FormHelperText>Обов'язкове поле</FormHelperText>}
                        </FormControl>
                    </Box>
                </Box>
            </Grow>
        </Box>
    );
};

export default LocationSelector;