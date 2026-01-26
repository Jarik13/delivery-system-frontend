import React, { useState, useEffect, useRef } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Grow, TextField, InputAdornment, Autocomplete } from '@mui/material';
import { ArrowDownward, LocationOn, Map, Public, Search as SearchIcon } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';

const LocationSelector = ({ selectedCityId, onCityChange, error }) => {
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);
    
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [districtSearch, setDistrictSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');

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

                    const districtId = cityData.districtId || (cityData.district && cityData.district.id);

                    if (districtId) {
                        const distRes = await DictionaryApi.getById('districts', districtId);
                        const distData = distRes.data;
                        const regionId = distData.regionId || (distData.region && distData.region.id);

                        if (regionId) {
                            const districtsRes = await DictionaryApi.getAll('districts', 0, 1000, { regionId });
                            const districtsData = districtsRes.data.content || districtsRes.data || [];
                            
                            const citiesRes = await DictionaryApi.getAll('cities', 0, 1000, { districtId });
                            const citiesData = citiesRes.data.content || citiesRes.data || [];

                            setDistricts(districtsData);
                            setFilteredDistricts(districtsData);
                            setCities(citiesData);
                            setFilteredCities(citiesData);

                            setSelectedRegion(regionId);
                            setSelectedDistrict(districtId);
                            setSelectedCity(selectedCityId);

                            setDistrictSearch(districtsData.find(d => d.id === districtId)?.name || '');
                            setCitySearch(citiesData.find(c => c.id === selectedCityId)?.name || '');
                        }
                    }
                } catch (e) {
                    console.error("Failed to load city hierarchy", e);
                }
            } else if (!selectedCityId && !isInitialMount.current) {
                setSelectedRegion('');
                setSelectedDistrict('');
                setSelectedCity('');
                setDistrictSearch('');
                setCitySearch('');
                setDistricts([]);
                setCities([]);
            }
            isInitialMount.current = false;
        };

        loadCityHierarchy();
    }, [selectedCityId, regions.length]);

    useEffect(() => {
        setFilteredDistricts(districts.filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase())));
    }, [districtSearch, districts]);

    useEffect(() => {
        setFilteredCities(cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())));
    }, [citySearch, cities]);

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
                const res = await DictionaryApi.getAll('districts', 0, 1000, { regionId });
                const data = res.data.content || res.data || [];
                setDistricts(data);
            } catch (e) { console.error(e); }
        }
    };

    const handleDistrictChange = (e, value) => {
        if (value) {
            setSelectedDistrict(value.id);
            setSelectedCity('');
            setCities([]);
            isInternalChange.current = true;
            onCityChange(null);

            DictionaryApi.getAll('cities', 0, 1000, { districtId: value.id })
                .then(res => setCities(res.data.content || res.data || []))
                .catch(console.error);
        }
    };

    const handleCityChange = (e, value) => {
        const id = value ? value.id : null;
        setSelectedCity(id);
        isInternalChange.current = true;
        onCityChange(id);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Public color="primary" />
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

            <Grow in={!!selectedRegion}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <ArrowDownward sx={{ color: 'text.disabled', fontSize: 20 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Map color="primary" />
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={filteredDistricts}
                            getOptionLabel={(option) => option.name}
                            value={districts.find(d => d.id === selectedDistrict) || null}
                            onChange={handleDistrictChange}
                            onInputChange={(e, val) => setDistrictSearch(val)}
                            renderInput={(params) => <TextField {...params} label="2. Оберіть район" />}
                        />
                    </Box>
                </Box>
            </Grow>

            <Grow in={!!selectedDistrict}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <ArrowDownward sx={{ color: 'text.disabled', fontSize: 20 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <LocationOn sx={{ color: selectedCity ? 'success.main' : 'primary.main' }} />
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={filteredCities}
                            getOptionLabel={(option) => option.name}
                            value={cities.find(c => c.id === selectedCity) || null}
                            onChange={handleCityChange}
                            onInputChange={(e, val) => setCitySearch(val)}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="3. Оберіть населений пункт" 
                                    error={!!error}
                                    helperText={error ? "Обов'язкове поле" : ""}
                                />
                            )}
                        />
                    </Box>
                </Box>
            </Grow>
        </Box>
    );
};

export default LocationSelector;