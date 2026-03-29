import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Grid, Autocomplete, Chip,
    FormControlLabel, Checkbox, alpha, Tabs, Tab,
    CircularProgress, InputAdornment, Paper,
} from '@mui/material';
import { Inventory, Search, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { DictionaryApi } from '../../../api/dictionaries';

const NewParcelForm = ({
    formData, setFormData, fieldErrors, setFieldErrors,
    mainColor, boxVariants, parcelTypes, storageConditions,
    listboxRef, handleBoxListboxOpen,
}) => {
    const selectedParcelType = parcelTypes.find(p => p.id === formData.parcel.parcelTypeId) ?? null;
    const selectedStorageConditions = storageConditions.filter(sc => formData.parcel.storageConditionIds.includes(sc.id));
    const selectedBoxVariant = boxVariants.find(b => b.id === formData.box.boxVariantId) ?? null;

    const isBoxSuitable = (box, weight) => {
        const w = parseFloat(weight) || 0;
        if (w === 0) return true;
        const maxW = parseFloat(box.maxWeight);
        return isNaN(maxW) || w <= maxW;
    };

    const getOptimalBoxId = (weight) => {
        const w = parseFloat(weight) || 0;
        if (w === 0) return null;
        const suitable = boxVariants.filter(b => isBoxSuitable(b, weight) && b.maxWeight != null);
        if (suitable.length === 0) return null;
        return suitable.reduce((best, b) =>
            parseFloat(b.maxWeight) < parseFloat(best.maxWeight) ? b : best
        ).id;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
                label="Опис вмісту" fullWidth multiline rows={2}
                value={formData.parcel.contentDescription}
                onChange={e => {
                    setFormData(prev => ({ ...prev, parcel: { ...prev.parcel, contentDescription: e.target.value } }));
                    setFieldErrors(prev => ({ ...prev, 'parcel.contentDescription': null }));
                }}
                error={!!fieldErrors['parcel.contentDescription']}
                helperText={fieldErrors['parcel.contentDescription']}
            />

            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        label="Вага (кг)" fullWidth type="number"
                        value={formData.parcel.actualWeight}
                        onChange={e => {
                            setFormData(prev => ({ ...prev, parcel: { ...prev.parcel, actualWeight: e.target.value } }));
                            setFieldErrors(prev => ({ ...prev, 'parcel.actualWeight': null }));
                        }}
                        error={!!fieldErrors['parcel.actualWeight']}
                        helperText={fieldErrors['parcel.actualWeight']}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Оголошена вартість" fullWidth type="number"
                        value={formData.parcel.declaredValue}
                        onChange={e => {
                            setFormData(prev => ({ ...prev, parcel: { ...prev.parcel, declaredValue: e.target.value } }));
                            setFieldErrors(prev => ({ ...prev, 'parcel.declaredValue': null }));
                        }}
                        error={!!fieldErrors['parcel.declaredValue']}
                        helperText={fieldErrors['parcel.declaredValue']}
                    />
                </Grid>
            </Grid>

            <Autocomplete
                options={parcelTypes}
                value={selectedParcelType}
                getOptionLabel={o => o.name || ''}
                onChange={(_, v) => {
                    setFormData(prev => ({ ...prev, parcel: { ...prev.parcel, parcelTypeId: v?.id ?? null } }));
                    setFieldErrors(prev => ({ ...prev, 'parcel.parcelTypeId': null }));
                }}
                renderInput={p => (
                    <TextField {...p} label="Тип посилки"
                        error={!!fieldErrors['parcel.parcelTypeId']}
                        helperText={fieldErrors['parcel.parcelTypeId']}
                    />
                )}
            />

            <Autocomplete
                multiple
                options={storageConditions}
                value={selectedStorageConditions}
                getOptionLabel={o => o.name || ''}
                onChange={(_, v) => {
                    setFormData(prev => ({ ...prev, parcel: { ...prev.parcel, storageConditionIds: v.map(i => i.id) } }));
                    setFieldErrors(prev => ({ ...prev, 'parcel.storageConditionIds': null }));
                }}
                renderInput={p => (
                    <TextField {...p} label="Умови зберігання"
                        error={!!fieldErrors['parcel.storageConditionIds']}
                        helperText={fieldErrors['parcel.storageConditionIds']}
                    />
                )}
                renderTags={(val, getTagProps) => val.map((opt, idx) => (
                    <Chip label={opt.name} {...getTagProps({ idx })} size="small"
                        sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700 }} key={opt.id} />
                ))}
            />

            <Box sx={{
                mt: 1, p: 2, borderRadius: 2,
                bgcolor: formData.box.useBox ? alpha(mainColor, 0.03) : 'transparent',
                border: formData.box.useBox ? `1px dashed ${mainColor}` : '1px solid #eee',
            }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            sx={{ '&.Mui-checked': { color: mainColor } }}
                            checked={formData.box.useBox}
                            onChange={e => setFormData(prev => ({
                                ...prev,
                                box: { ...prev.box, useBox: e.target.checked, boxVariantId: null },
                            }))}
                        />
                    }
                    label="Потрібна коробка"
                />

                {formData.box.useBox && (
                    <Autocomplete
                        sx={{ mt: 2 }}
                        options={boxVariants}
                        value={selectedBoxVariant}
                        getOptionLabel={o => `${o.boxTypeName} ${o.name} - ${o.price} ₴`}
                        getOptionKey={o => o.id}
                        getOptionDisabled={o => !isBoxSuitable(o, formData.parcel.actualWeight)}
                        onOpen={handleBoxListboxOpen}
                        ListboxProps={{ ref: listboxRef }}
                        onChange={(_, v) => {
                            setFormData(prev => ({ ...prev, box: { ...prev.box, boxVariantId: v?.id ?? null } }));
                            setFieldErrors(prev => ({ ...prev, 'box.boxVariantId': null }));
                        }}
                        renderOption={({ key, ...props }, o) => {
                            const suitable = isBoxSuitable(o, formData.parcel.actualWeight);
                            const isOptimal = suitable && o.id === getOptimalBoxId(formData.parcel.actualWeight);
                            return (
                                <li key={key} {...props}
                                    data-optimal-box={isOptimal ? 'true' : undefined}
                                    style={{
                                        borderLeft: isOptimal ? '3px solid #4caf50' : '3px solid transparent',
                                        backgroundColor: isOptimal ? 'rgba(76,175,80,0.1)' : undefined,
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" fontWeight={600}
                                                color={suitable ? (isOptimal ? '#2e7d32' : 'text.primary') : 'text.disabled'}>
                                                {o.boxTypeName} {o.name} — {o.price} ₴
                                                {isOptimal && (
                                                    <Chip label="Оптимально" size="small" sx={{
                                                        ml: 1, height: 18, fontSize: 10, fontWeight: 800,
                                                        bgcolor: '#4caf50', color: 'white',
                                                        '& .MuiChip-label': { px: 0.75 },
                                                    }} />
                                                )}
                                            </Typography>
                                            {!suitable && (
                                                <Typography variant="caption" color="error" sx={{ ml: 1, fontSize: 10 }}>
                                                    {o.weightCategoryName ?? `макс. ${o.maxWeight} кг`}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {o.width} × {o.length} × {o.height} см
                                            {o.weightCategoryName ? ` · ${o.weightCategoryName}` : o.maxWeight != null ? ` · до ${o.maxWeight} кг` : ''}
                                        </Typography>
                                    </Box>
                                </li>
                            );
                        }}
                        renderInput={p => (
                            <TextField {...p} label="Розмір коробки" size="small"
                                error={!!fieldErrors['box.boxVariantId']}
                                helperText={fieldErrors['box.boxVariantId'] || (
                                    parseFloat(formData.parcel.actualWeight) > 0
                                        ? 'Недоступні коробки перевищені за допустимою вагою'
                                        : 'Введіть вагу для фільтрації підходящих коробок'
                                )}
                            />
                        )}
                    />
                )}
            </Box>
        </Box>
    );
};

const ExistingParcelSelector = ({ mainColor, onSelect, selectedParcelId }) => {
    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        setLoading(true);
        DictionaryApi.getAll('parcels/unshipped', page, 20, search ? { contentDescription: search } : {})
            .then(res => {
                const content = res.data.content || [];
                setParcels(prev => page === 0 ? content : [...prev, ...content]);
                setHasMore(!res.data.last);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [search, page]);

    const handleSearch = (val) => {
        setSearch(val);
        setPage(0);
        setParcels([]);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
                fullWidth size="small"
                placeholder="Пошук за описом..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search sx={{ fontSize: 18, color: '#94a3b8' }} />
                        </InputAdornment>
                    ),
                }}
            />

            <Box sx={{
                maxHeight: 360, overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: 1,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(mainColor, 0.2), borderRadius: 2 },
            }}>
                {parcels.map(parcel => {
                    const isSelected = selectedParcelId === parcel.id;
                    return (
                        <Paper
                            key={parcel.id}
                            onClick={() => onSelect(isSelected ? null : parcel)}
                            variant="outlined"
                            sx={{
                                p: 1.5, borderRadius: 2, cursor: 'pointer',
                                borderColor: isSelected ? mainColor : 'divider',
                                bgcolor: isSelected ? alpha(mainColor, 0.05) : 'white',
                                transition: 'all 0.15s',
                                '&:hover': { borderColor: mainColor, bgcolor: alpha(mainColor, 0.03) },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap>
                                        {parcel.contentDescription}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">{parcel.actualWeight} кг</Typography>
                                        <Typography variant="caption" color="text.disabled">·</Typography>
                                        <Typography variant="caption" color="text.secondary">{parcel.declaredValue} ₴</Typography>
                                        {parcel.parcelTypeName && (
                                            <>
                                                <Typography variant="caption" color="text.disabled">·</Typography>
                                                <Typography variant="caption" color="text.secondary">{parcel.parcelTypeName}</Typography>
                                            </>
                                        )}
                                    </Box>
                                    {parcel.storageConditionNames && parcel.storageConditionNames.length > 0 && (
                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                            {[...parcel.storageConditionNames].map(name => (
                                                <Chip key={name} label={name} size="small" sx={{
                                                    height: 18, fontSize: 10,
                                                    bgcolor: alpha(mainColor, 0.08), color: mainColor,
                                                }} />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                                {isSelected && (
                                    <CheckCircle sx={{ color: mainColor, fontSize: 20, flexShrink: 0, mt: 0.25 }} />
                                )}
                            </Box>
                        </Paper>
                    );
                })}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={24} sx={{ color: mainColor }} />
                    </Box>
                )}

                {!loading && parcels.length === 0 && (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.disabled">
                            Посилок без відправлення не знайдено
                        </Typography>
                    </Box>
                )}

                {hasMore && !loading && parcels.length > 0 && (
                    <Box
                        onClick={() => setPage(prev => prev + 1)}
                        sx={{
                            py: 1, textAlign: 'center', cursor: 'pointer',
                            color: mainColor, fontWeight: 600, fontSize: 13,
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        Завантажити ще
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const ParcelStep = ({
    formData, setFormData, fieldErrors, setFieldErrors,
    mainColor, direction, variants,
    boxVariants, parcelTypes, storageConditions,
    listboxRef, handleBoxListboxOpen,
    onSelectExistingParcel, selectedExistingParcelId,
}) => {
    const [tab, setTab] = useState(0);

    const handleSelectParcel = (parcel) => {
        if (!parcel) {
            onSelectExistingParcel(null);
            setFormData(prev => ({ ...prev, existingParcelId: null }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            existingParcelId: parcel.id,
            parcel: {
                declaredValue: parcel.declaredValue?.toString() ?? '',
                actualWeight: parcel.actualWeight?.toString() ?? '',
                contentDescription: parcel.contentDescription ?? '',
                parcelTypeId: parcel.parcelTypeId ?? null,
                storageConditionIds: parcel.storageConditionIds
                    ? [...parcel.storageConditionIds]
                    : [],
            },
        }));
        onSelectExistingParcel(parcel.id);
    };

    return (
        <motion.div key="s0" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" sx={{
                    color: '#666', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase',
                }}>
                    <Inventory sx={{ color: mainColor, fontSize: 18 }} /> Параметри посилки
                </Typography>

                <Tabs
                    value={tab}
                    onChange={(_, v) => {
                        setTab(v);
                        if (v === 0) {
                            onSelectExistingParcel(null);
                            setFormData(prev => ({ ...prev, existingParcelId: null }));
                        }
                    }}
                    sx={{
                        borderBottom: 1, borderColor: 'divider',
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 40 },
                        '& .Mui-selected': { color: mainColor },
                        '& .MuiTabs-indicator': { bgcolor: mainColor },
                    }}
                >
                    <Tab label="Нова посилка" />
                    <Tab
                        label={
                            selectedExistingParcelId
                                ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    Обрати існуючу
                                    <CheckCircle sx={{ fontSize: 14, color: mainColor }} />
                                </Box>
                                : 'Обрати існуючу'
                        }
                    />
                </Tabs>

                {tab === 0 && (
                    <NewParcelForm
                        formData={formData}
                        setFormData={setFormData}
                        fieldErrors={fieldErrors}
                        setFieldErrors={setFieldErrors}
                        mainColor={mainColor}
                        boxVariants={boxVariants}
                        parcelTypes={parcelTypes}
                        storageConditions={storageConditions}
                        listboxRef={listboxRef}
                        handleBoxListboxOpen={handleBoxListboxOpen}
                    />
                )}

                {tab === 1 && (
                    <ExistingParcelSelector
                        mainColor={mainColor}
                        onSelect={handleSelectParcel}
                        selectedParcelId={selectedExistingParcelId}
                    />
                )}
            </Box>
        </motion.div>
    );
};

export default ParcelStep;