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
                            const districtsData = districtsRes.data.content || districtsRes.data || [];
                            setDistricts(districtsData);
                            setFilteredDistricts(districtsData);

                            setSelectedDistrict(districtId);
                            setDistrictSearch(districtsData.find(d => d.id === districtId)?.name || '');

                            const citiesRes = await DictionaryApi.getByParam('cities', 'districtId', districtId + '&size=1000');
                            const citiesData = citiesRes.data.content || citiesRes.data || [];
                            setCities(citiesData);
                            setFilteredCities(citiesData);

                            setSelectedCity(selectedCityId);
                            const selectedCityData = citiesData.find(c => c.id === selectedCityId);
                            setCitySearch(selectedCityData?.name || '');
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
                setFilteredDistricts([]);
                setCities([]);
                setFilteredCities([]);
            }
            
            isInitialMount.current = false;
        };

        loadCityHierarchy();
    }, [selectedCityId, regions.length]);

    useEffect(() => {
        if (districtSearch) {
            const filtered = districts.filter(district =>
                district.name.toLowerCase().includes(districtSearch.toLowerCase())
            );
            setFilteredDistricts(filtered);
        } else {
            setFilteredDistricts(districts);
        }
    }, [districtSearch, districts]);

    useEffect(() => {
        if (citySearch) {
            const filtered = cities.filter(city =>
                city.name.toLowerCase().includes(citySearch.toLowerCase())
            );
            setFilteredCities(filtered);
        } else {
            setFilteredCities(cities);
        }
    }, [citySearch, cities]);

    const handleRegionChange = async (e) => {
        const regionId = e.target.value;
        setSelectedRegion(regionId);
        
        setSelectedDistrict('');
        setSelectedCity('');
        setDistrictSearch('');
        setCitySearch('');
        setDistricts([]);
        setFilteredDistricts([]);
        setCities([]);
        setFilteredCities([]);
        
        isInternalChange.current = true;
        onCityChange(null);

        if (regionId) {
            try {
                const res = await DictionaryApi.getByParam('districts', 'regionId', regionId + '&size=1000');
                const districtsData = res.data.content || res.data || [];
                setDistricts(districtsData);
                setFilteredDistricts(districtsData);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleDistrictChange = (e, value) => {
        if (value) {
            setSelectedDistrict(value.id);
            setDistrictSearch(value.name);
            
            setSelectedCity('');
            setCitySearch('');
            setCities([]);
            setFilteredCities([]);
            
            isInternalChange.current = true;
            onCityChange(null);

            DictionaryApi.getByParam('cities', 'districtId', value.id + '&size=1000')
                .then(res => {
                    const citiesData = res.data.content || res.data || [];
                    setCities(citiesData);
                    setFilteredCities(citiesData);
                })
                .catch(console.error);
        } else {
            setSelectedDistrict('');
            setDistrictSearch('');
            setCities([]);
            setFilteredCities([]);
            
            isInternalChange.current = true;
            onCityChange(null);
        }
    };

    const handleCityChange = (e, value) => {
        if (value) {
            setSelectedCity(value.id);
            setCitySearch(value.name);
            isInternalChange.current = true;
            onCityChange(value.id);
        } else {
            setSelectedCity('');
            setCitySearch('');
            isInternalChange.current = true;
            onCityChange(null);
        }
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
                            <Autocomplete
                                id="district-search"
                                options={filteredDistricts}
                                getOptionLabel={(option) => option.name}
                                value={districts.find(d => d.id === selectedDistrict) || null}
                                onChange={handleDistrictChange}
                                inputValue={districtSearch}
                                onInputChange={(e, newValue) => setDistrictSearch(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="2. Оберіть район"
                                        variant="outlined"
                                        size="small"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                                noOptionsText="Нічого не знайдено"
                                loadingText="Завантаження..."
                            />
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
                            <Autocomplete
                                id="city-search"
                                options={filteredCities}
                                getOptionLabel={(option) => option.name}
                                value={cities.find(c => c.id === selectedCity) || null}
                                onChange={handleCityChange}
                                inputValue={citySearch}
                                onInputChange={(e, newValue) => setCitySearch(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="3. Оберіть населений пункт"
                                        variant="outlined"
                                        size="small"
                                        error={!!error}
                                        helperText={error ? "Обов'язкове поле" : ""}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                                noOptionsText="Нічого не знайдено"
                                loadingText="Завантаження..."
                            />
                        </FormControl>
                    </Box>
                </Box>
            </Grow>
        </Box>
    );
};

export default LocationSelector;