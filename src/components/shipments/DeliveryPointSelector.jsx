import React, { useState, useEffect, useRef } from 'react';
import {
    FormControl, InputLabel, Select, MenuItem, Box, Collapse,
    TextField, Autocomplete, ToggleButton, ToggleButtonGroup,
    Typography, Stack
} from '@mui/material';
import {
    ArrowDownward, LocationOn, Map, Public,
    Business, MailOutline, Home,
    Explore,
    LocationCity
} from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

const DeliveryPointSelector = ({ point, onChange, label }) => {
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
                } catch (e) {
                    console.error("Помилка завантаження ієрархії", e);
                }
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

            const data = res?.data?.content || res?.data || [];
            setLeafItems(data);
        } catch (e) {
            console.error("Помилка завантаження кінцевих пунктів", e);
        }
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
        setSelectedRegion('');
        setSelectedDistrict('');
        setSelectedCity('');
        setDistricts([]);
        setCities([]);
        setLeafItems([]);
        onChange({
            ...point,
            type: newType,
            cityId: null, branchId: null, postomatId: null, streetId: null,
            houseNumber: '', apartmentNumber: ''
        });
    };

    const getLeafLabel = () => {
        if (point.type === 'address') return 'вулицю';
        if (point.type === 'branch') return 'відділення';
        return 'поштомат';
    };

    const handleLeafChange = (_, v) => {
        if (point.type === 'branch') {
            onChange({
                ...point,
                branchId: v?.id ?? null,
                deliveryPointId: v?.deliveryPointId || v?.deliveryPoint?.id || null
            });
        } else if (point.type === 'postomat') {
            onChange({
                ...point,
                postomatId: v?.id ?? null,
                deliveryPointId: v?.deliveryPointId || v?.deliveryPoint?.id || null
            });
        } else if (point.type === 'address') {
            onChange({
                ...point,
                streetId: v?.id ?? null,
                deliveryPointId: null
            });
        }
    };

    const getLeafValue = () => {
        if (point.type === 'branch') return leafItems.find(i => i.id === point.branchId) || null;
        if (point.type === 'postomat') return leafItems.find(i => i.id === point.postomatId) || null;
        if (point.type === 'address') return leafItems.find(i => i.id === point.streetId) || null;
        return null;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="subtitle2" color="primary" fontWeight="700" sx={{ mb: 2 }}>
                {label}
            </Typography>

            <ToggleButtonGroup
                value={point.type}
                exclusive
                onChange={(_, val) => handleTypeChange(val)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
            >
                <ToggleButton value="branch">
                    <Business sx={{ mr: 1, fontSize: 18 }} />Відділення
                </ToggleButton>
                <ToggleButton value="postomat">
                    <MailOutline sx={{ mr: 1, fontSize: 18 }} />Поштомат
                </ToggleButton>
                <ToggleButton value="address">
                    <Home sx={{ mr: 1, fontSize: 18 }} />Адреса
                </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Explore color="primary" />
                <FormControl fullWidth size="small">
                    <InputLabel>1. Оберіть область</InputLabel>
                    <Select
                        value={selectedRegion}
                        label="1. Оберіть область"
                        onChange={handleRegionChange}
                    >
                        {regions.map(r => (
                            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Collapse in={!!selectedRegion} unmountOnExit>
                <Box sx={{ mt: 1 }}>
                    <Stack alignItems="center" sx={{ mb: 1 }}>
                        <ArrowDownward sx={{ color: 'text.disabled', fontSize: 20 }} />
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Map color="primary" />
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={districts}
                            getOptionLabel={(o) => o.name || ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={districts.find(d => d.id === selectedDistrict) || null}
                            onChange={handleDistrictChange}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    {option.name}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="2. Оберіть район" />
                            )}
                        />
                    </Box>
                </Box>
            </Collapse>

            <Collapse in={!!selectedDistrict} unmountOnExit>
                <Box sx={{ mt: 1 }}>
                    <Stack alignItems="center" sx={{ mb: 1 }}>
                        <ArrowDownward sx={{ color: 'text.disabled', fontSize: 20 }} />
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <LocationCity color="primary" />
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={cities}
                            getOptionLabel={(o) => o.name || ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={cities.find(c => c.id === selectedCity) || null}
                            onChange={handleCityChange}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    {option.name}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="3. Оберіть місто / село" />
                            )}
                        />
                    </Box>
                </Box>
            </Collapse>

            <Collapse in={!!selectedCity} unmountOnExit>
                <Box sx={{ mt: 1 }}>
                    <Stack alignItems="center" sx={{ mb: 1 }}>
                        <ArrowDownward sx={{ color: 'text.disabled', fontSize: 20 }} />
                    </Stack>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {point.type === 'branch'
                                ? <Business color="success" />
                                : point.type === 'postomat'
                                    ? <MailOutline color="success" />
                                    : <LocationOn color="success" />
                            }
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={leafItems}
                                getOptionLabel={(o) => o.name || o.number || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={getLeafValue()}
                                onChange={handleLeafChange}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id}>
                                        {option.name || option.number || ''}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField {...params} label={`4. Оберіть ${getLeafLabel()}`} />
                                )}
                            />
                        </Box>

                        {point.type === 'address' && point.streetId && (
                            <Box sx={{ display: 'flex', gap: 2, pl: 5, mb: 1 }}>
                                <TextField
                                    label="Будинок"
                                    size="small"
                                    fullWidth
                                    value={point.houseNumber || ''}
                                    onChange={(e) => onChange({ ...point, houseNumber: e.target.value })}
                                />
                                <TextField
                                    label="Кв."
                                    size="small"
                                    fullWidth
                                    value={point.apartmentNumber || ''}
                                    onChange={(e) => onChange({ ...point, apartmentNumber: e.target.value })}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

export default DeliveryPointSelector;