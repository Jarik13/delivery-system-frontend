import React from 'react';
import {
    Box, Typography, TextField, Grid, Autocomplete, Chip,
    FormControlLabel, Checkbox, alpha, IconButton, Tooltip,
} from '@mui/material';
import { Inventory } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ParcelStep = ({ formData, setFormData, fieldErrors, setFieldErrors, mainColor, boxVariants, parcelTypes, storageConditions, direction, variants, listboxRef, handleBoxListboxOpen }) => {
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
        <motion.div key="s0" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="subtitle2" sx={{
                    color: '#666', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase',
                }}>
                    <Inventory sx={{ color: mainColor, fontSize: 18 }} /> Параметри посилки
                </Typography>

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
                                const optimalId = getOptimalBoxId(formData.parcel.actualWeight);
                                const isOptimal = suitable && o.id === optimalId;
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
        </motion.div>
    );
};

export default ParcelStep;