import React, { useState, useEffect, useRef } from 'react';
import {
    FormControl, InputLabel, Select, MenuItem, Box, Collapse,
    TextField, Autocomplete, ToggleButton, ToggleButtonGroup,
    Typography, alpha,
} from '@mui/material';
import {
    LocationOn, Map, Business, MailOutline, Home,
    Explore, LocationCity,
} from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

const DeliveryPointSelector = ({
    point, onChange, label, errors = {}, onClearError
}) => {
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);
    const [leafItems, setLeafItems] = useState([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const isInternalChange = useRef(false);

    useEffect(() => {
        DictionaryApi.getAll('regions', 0, 100).then(res => {
            setRegions(res.data.content || res.data || []);
        });
    }, []);

    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }

        const loadHierarchy = async () => {
            if (point.cityId && regions.length > 0) {
                try {
                    const cityRes = await DictionaryApi.getById('cities', point.cityId);
                    const cityData = cityRes.data;
                    const districtId = cityData.districtId || cityData.district?.id;

                    if (districtId) {
                        const distRes = await DictionaryApi.getById('districts', districtId);
                        const distData = distRes.data;
                        const regionId = distData.regionId || distData.region?.id;

                        if (regionId) {
                            const [dRes, cRes] = await Promise.all([
                                DictionaryApi.getAll('districts', 0, 500, { regionId }),
                                DictionaryApi.getAll('cities', 0, 5000, { districtId })
                            ]);

                            setDistricts(dRes.data.content || dRes.data || []);
                            setCities(cRes.data.content || cRes.data || []);
                            setSelectedRegion(regionId);
                            setSelectedDistrict(districtId);
                            setSelectedCity(point.cityId);

                            loadLeafItems(point.cityId, point.type);
                        }
                    }
                } catch (e) { console.error("Помилка ієрархії", e); }
            }
        };
        loadHierarchy();
    }, [point.cityId, regions.length]);

    const loadLeafItems = async (cityId, type) => {
        if (!cityId) return;
        try {
            let res;
            if (type === 'branch') res = await DictionaryApi.getByParam('branches', 'cityId', cityId);
            else if (type === 'postomat') res = await DictionaryApi.getByParam('postomats', 'cityId', cityId);
            else if (type === 'address') res = await DictionaryApi.getByParam('streets', 'cityId', cityId);
            setLeafItems(res?.data?.content || res?.data || []);
        } catch (e) { console.error(e); }
    };

    const handleRegionChange = async (e) => {
        const id = e.target.value;
        setSelectedRegion(id);
        setSelectedDistrict('');
        setSelectedCity('');
        setDistricts([]);
        setCities([]);
        setLeafItems([]);
        isInternalChange.current = true;
        onChange({ ...point, cityId: null, branchId: null, postomatId: null, streetId: null });
        if (id) {
            const res = await DictionaryApi.getByParam('districts', 'regionId', id);
            setDistricts(res.data.content || res.data || []);
        }
    };

    const handleDistrictChange = async (e, value) => {
        const id = value?.id || '';
        setSelectedDistrict(id);
        setSelectedCity('');
        setCities([]);
        setLeafItems([]);
        isInternalChange.current = true;
        onChange({ ...point, cityId: null, branchId: null, postomatId: null, streetId: null });
        if (id) {
            const res = await DictionaryApi.getAll('cities', 0, 5000, { districtId: id });
            setCities(res.data.content || res.data || []);
        }
    };

    const handleCityChange = (e, value) => {
        const id = value?.id || '';
        setSelectedCity(id);
        isInternalChange.current = true;
        onChange({ ...point, cityId: id, branchId: null, postomatId: null, streetId: null });
        loadLeafItems(id, point.type);
    };

    const handleTypeChange = (newType) => {
        if (!newType) return;
        setLeafItems([]);
        onChange({
            ...point,
            type: newType,
            branchId: null, postomatId: null, streetId: null,
            houseNumber: '', apartmentNumber: '', deliveryPointId: null
        });
        if (selectedCity) loadLeafItems(selectedCity, newType);
    };

    const handleLeafChange = (_, v) => {
        const base = { ...point };
        if (point.type === 'branch') {
            base.branchId = v?.id ?? null;
            base.deliveryPointId = v?.deliveryPointId || v?.deliveryPoint?.id || null;
        } else if (point.type === 'postomat') {
            base.postomatId = v?.id ?? null;
            base.deliveryPointId = v?.deliveryPointId || v?.deliveryPoint?.id || null;
        } else if (point.type === 'address') {
            base.streetId = v?.id ?? null;
            base.deliveryPointId = null;
        }
        onChange(base);
    };

    const getLeafValue = () => {
        if (point.type === 'branch') return leafItems.find(i => (point.branchId && i.id === point.branchId) || (point.deliveryPointId && (i.deliveryPointId === point.deliveryPointId || i.deliveryPoint?.id === point.deliveryPointId))) || null;
        if (point.type === 'postomat') return leafItems.find(i => (point.postomatId && i.id === point.postomatId) || (point.deliveryPointId && (i.deliveryPointId === point.deliveryPointId || i.deliveryPoint?.id === point.deliveryPointId))) || null;
        if (point.type === 'address') return leafItems.find(i => i.id === point.streetId) || null;
        return null;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: 2 }}>
            <Typography variant="subtitle2" color="primary" fontWeight="700" sx={{ mb: 2 }}>
                {label}
            </Typography>

            <ToggleButtonGroup
                value={point.type}
                exclusive
                onChange={(_, val) => handleTypeChange(val)}
                fullWidth size="small" sx={{ mb: 3 }}
            >
                <ToggleButton value="branch"><Business sx={{ mr: 1, fontSize: 18 }} />Відділення</ToggleButton>
                <ToggleButton value="postomat"><MailOutline sx={{ mr: 1, fontSize: 18 }} />Поштомат</ToggleButton>
                <ToggleButton value="address"><Home sx={{ mr: 1, fontSize: 18 }} />Адреса</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                <Explore color="primary" sx={{ mt: 1, fontSize: 26 }} />
                <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small" error={!!errors.cityId && !selectedRegion}>
                        <InputLabel>1. Оберіть область</InputLabel>
                        <Select value={selectedRegion} label="1. Оберіть область" onChange={handleRegionChange}>
                            {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Collapse in={!!selectedRegion} unmountOnExit>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 3 }}>
                    <Map color="primary" sx={{ fontSize: 26 }} />
                    <Autocomplete
                        fullWidth size="small" options={districts}
                        getOptionLabel={(o) => o.name || ''}
                        value={districts.find(d => d.id === selectedDistrict) || null}
                        onChange={handleDistrictChange}
                        renderInput={(params) => <TextField {...params} label="2. Оберіть район" />}
                    />
                </Box>
            </Collapse>

            <Collapse in={!!selectedDistrict} unmountOnExit>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 3 }}>
                    <LocationCity color="primary" sx={{ fontSize: 26 }} />
                    <Autocomplete
                        fullWidth size="small" options={cities}
                        getOptionLabel={(o) => o.name || ''}
                        value={cities.find(c => c.id === selectedCity) || null}
                        onChange={handleCityChange}
                        renderInput={(params) => <TextField {...params} label="3. Оберіть місто / село" error={!!errors.cityId} />}
                    />
                </Box>
            </Collapse>

            <Collapse in={!!selectedCity} unmountOnExit>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        {point.type === 'branch' ? <Business color="success" sx={{ fontSize: 26 }} /> :
                            point.type === 'postomat' ? <MailOutline color="success" sx={{ fontSize: 26 }} /> :
                                <LocationOn color="success" sx={{ fontSize: 26 }} />}

                        <Autocomplete
                            fullWidth size="small"
                            options={leafItems}
                            getOptionLabel={(o) => o.name || o.number || ''}
                            value={getLeafValue()}
                            onChange={(e, v) => { handleLeafChange(e, v); onClearError?.(); }}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.id} sx={{ flexDirection: 'column', alignItems: 'flex-start !important', py: 1 }}>
                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                                        {option.name || option.number}
                                    </Typography>
                                    {(option.address || option.locationDescription) && (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                                            {option.address || option.locationDescription}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={`4. Оберіть ${point.type === 'address' ? 'вулицю' : point.type === 'branch' ? 'відділення' : 'поштомат'}`}
                                    error={!!errors.deliveryPointId}
                                    helperText={errors.deliveryPointId}
                                />
                            )}
                        />
                    </Box>

                    {point.type === 'address' && point.streetId && (
                        <Box sx={{ display: 'flex', gap: 2, pl: 5.8 }}>
                            <TextField label="Буд." size="small" fullWidth value={point.houseNumber || ''} onChange={(e) => onChange({ ...point, houseNumber: e.target.value })} />
                            <TextField label="Кв." size="small" fullWidth value={point.apartmentNumber || ''} onChange={(e) => onChange({ ...point, apartmentNumber: e.target.value })} />
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

export default DeliveryPointSelector;