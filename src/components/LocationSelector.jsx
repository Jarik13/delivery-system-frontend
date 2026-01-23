import React, { useState, useEffect, useRef } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, FormHelperText, Grow } from '@mui/material';
import { ArrowDownward, LocationOn, Map, Public } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';

const LocationSelector = ({ selectedCityId, onCityChange, error }) => {
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const isInternalChange = useRef(false);
    const isInitialMount = useRef(true);

    useEffect(() => {
        const loadRegions = async () => {
            try {
                const res = await DictionaryApi.getAll('regions', 0, 100);
                setRegions(res.data.content || res.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        loadRegions();
    }, []);

    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }

        const loadCityHierarchy = async () => {
            if (selectedCityId && regions.length > 0) {
                try {
                    const cityRes = await DictionaryApi.getById('cities', selectedCityId);
                    const cityData = cityRes.data;

                    const districtId = cityData.districtId || 
                                       (cityData.district && cityData.district.id) || 
                                       (cityData.district_id);

                    if (districtId) {
                        const distRes = await DictionaryApi.getById('districts', districtId);
                        const distData = distRes.data;

                        const regionId = distData.regionId || 
                                         (distData.region && distData.region.id) || 
                                         (distData.region_id);

                        if (regionId) {
                            setSelectedRegion(regionId);

                            const districtsRes = await DictionaryApi.getByParam('districts', 'regionId', regionId + '&size=1000');
                            setDistricts(districtsRes.data.content || districtsRes.data || []);

                            setSelectedDistrict(districtId);

                            const citiesRes = await DictionaryApi.getByParam('cities', 'districtId', districtId + '&size=1000');
                            setCities(citiesRes.data.content || citiesRes.data || []);

                            setSelectedCity(selectedCityId);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load city hierarchy", e);
                }
            } else if (!selectedCityId && !isInitialMount.current) {
                setSelectedRegion('');
                setSelectedDistrict('');
                setSelectedCity('');
                setDistricts([]);
                setCities([]);
            }
            
            isInitialMount.current = false;
        };

        loadCityHierarchy();
    }, [selectedCityId, regions.length]);

    const handleRegionChange = async (e) => {
        const regionId = e.target.value;
        setSelectedRegion(regionId);
        
        setSelectedDistrict('');
        setSelectedCity('');
        setDistricts([]);
        setCities([]);
        
        isInternalChange.current = true;
        onCityChange(null);

        if (regionId) {
            try {
                const res = await DictionaryApi.getByParam('districts', 'regionId', regionId + '&size=1000');
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
        
        isInternalChange.current = true;
        onCityChange(null);

        if (districtId) {
            try {
                const res = await DictionaryApi.getByParam('cities', 'districtId', districtId + '&size=1000');
                setCities(res.data.content || res.data || []);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleCityChange = (e) => {
        const cityId = e.target.value;
        setSelectedCity(cityId);
        isInternalChange.current = true;
        onCityChange(cityId);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 1, mb: 1 }}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <Public sx={{ color: 'primary.main', mr: 2 }} />
                <FormControl fullWidth size="small">
                    <InputLabel id="region-label">1. Оберіть область</InputLabel>
                    <Select
                        labelId="region-label"
                        id="region-select"
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
                            <InputLabel id="district-label">2. Оберіть район</InputLabel>
                            <Select
                                labelId="district-label"
                                id="district-select"
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
                            <InputLabel id="city-label">3. Оберіть населений пункт</InputLabel>
                            <Select
                                labelId="city-label"
                                id="city-select"
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