import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Grid, FormHelperText } from '@mui/material';
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
            const res = await DictionaryApi.getAll('regions', 0, 25); 
            setRegions(res.data.content || res.data || []);
        };
        loadRegions();
    }, []);

    useEffect(() => {
        if (selectedCityId && !selectedRegion) {
            const prefillLocation = async () => {
                try {
                    const cityRes = await DictionaryApi.getById('cities', selectedCityId);
                    const cityData = cityRes.data;

                    if (cityData.regionId) {
                        setSelectedRegion(cityData.regionId);
                        
                        const districtsRes = await DictionaryApi.getByParam('districts', 'regionId', cityData.regionId);
                        setDistricts(districtsRes.data);
                        
                        setSelectedDistrict(cityData.districtId);

                        const citiesRes = await DictionaryApi.getByParam('cities', 'districtId', cityData.districtId);
                        setCities(citiesRes.data);
                        
                        setSelectedCity(selectedCityId);
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
    }, [selectedCityId]);

    const handleRegionChange = async (e) => {
        const regionId = e.target.value;
        setSelectedRegion(regionId);
        setSelectedDistrict('');
        setSelectedCity('');
        setCities([]);
        onCityChange(null);

        const res = await DictionaryApi.getByParam('districts', 'regionId', regionId);
        setDistricts(res.data);
    };

    const handleDistrictChange = async (e) => {
        const districtId = e.target.value;
        setSelectedDistrict(districtId);
        setSelectedCity('');
        onCityChange(null);

        const res = await DictionaryApi.getByParam('cities', 'districtId', districtId);
        setCities(res.data);
    };

    const handleCityChange = (e) => {
        const cityId = e.target.value;
        setSelectedCity(cityId);
        onCityChange(cityId);
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <FormControl fullWidth size="small">
                    <InputLabel>Область</InputLabel>
                    <Select value={selectedRegion} label="Область" onChange={handleRegionChange}>
                        {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <FormControl fullWidth size="small" disabled={!selectedRegion}>
                    <InputLabel>Район</InputLabel>
                    <Select value={selectedDistrict} label="Район" onChange={handleDistrictChange}>
                        {districts.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <FormControl fullWidth size="small" disabled={!selectedDistrict} error={!!error}>
                    <InputLabel>Населений пункт</InputLabel>
                    <Select value={selectedCity} label="Населений пункт" onChange={handleCityChange}>
                        {cities.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                    {error && <FormHelperText>Оберіть місто</FormHelperText>}
                </FormControl>
            </Grid>
        </Grid>
    );
};

export default LocationSelector;