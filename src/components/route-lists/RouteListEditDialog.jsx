import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Autocomplete, Box, CircularProgress, alpha,
    Avatar, Typography, Chip
} from '@mui/material';
import { Edit, Warning } from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

const RouteListEditDialog = ({ open, onClose, onSuccess, mainColor, item, references }) => {
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        courierId: null,
        plannedDepartureTime: ''
    });

    useEffect(() => {
        if (item) {
            setFormData({
                courierId: item.courierId || null,
                plannedDepartureTime: item.plannedDepartureTime ? item.plannedDepartureTime.slice(0, 16) : ''
            });
            setFieldErrors({});
        }
    }, [item, open]);

    const handleSave = async () => {
        setLoading(true);
        setFieldErrors({});
        try {
            await DictionaryApi.update('route-lists', item.id, {
                courierId: formData.courierId,
                plannedDepartureTime: formData.plannedDepartureTime
            });
            onSuccess(`Маршрутний лист ML-${item.number} успішно оновлено`);
        } catch (e) {
            if (e.response?.data?.validationErrors) {
                setFieldErrors(e.response.data.validationErrors);
            } else {
                console.error(e);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatFullCourierName = (c) => {
        if (!c) return '';
        return `${c.lastName || ''} ${c.firstName || ''} ${c.middleName || ''}`.trim();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: alpha(mainColor, 0.05),
                color: mainColor,
                mb: 1
            }}>
                <Edit fontSize="small" /> Редагувати ML-{item?.number}
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                        options={references.couriers}
                        getOptionLabel={(o) => formatFullCourierName(o)}
                        getOptionDisabled={(o) => !!o.hasActiveRouteList && o.id !== item?.courierId}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        filterOptions={(options, state) => {
                            const input = state.inputValue.toLowerCase();
                            return options.filter(o =>
                                formatFullCourierName(o).toLowerCase().includes(input) ||
                                (o.phoneNumber && o.phoneNumber.includes(input))
                            );
                        }}

                        value={references.couriers.find(c => c.id === formData.courierId) || null}
                        onChange={(_, v) => {
                            setFormData({ ...formData, courierId: v?.id });
                            setFieldErrors(prev => ({ ...prev, courierId: null }));
                        }}
                        renderOption={(props, option) => (
                            <Box component="li" {...props}
                                sx={{
                                    ...props.sx,
                                    opacity: option.hasActiveRouteList && option.id !== item?.courierId ? 0.6 : 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(mainColor, 0.15), color: mainColor, fontSize: 12 }}>
                                            {(option.firstName?.[0] ?? '') + (option.lastName?.[0] ?? '')}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {formatFullCourierName(option)}
                                            </Typography>
                                            {option.phoneNumber && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.phoneNumber}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    {option.hasActiveRouteList && option.id !== item?.courierId && (
                                        <Chip
                                            icon={<Warning sx={{ fontSize: '12px !important' }} />}
                                            label="Зайнятий"
                                            size="small"
                                            sx={{
                                                height: 20, fontSize: 10, fontWeight: 700,
                                                bgcolor: alpha('#f44336', 0.1),
                                                color: '#f44336',
                                                border: `1px solid ${alpha('#f44336', 0.3)}`,
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Призначити кур'єра"
                                error={!!fieldErrors.courierId}
                                helperText={fieldErrors.courierId}
                            />
                        )}
                    />

                    <TextField
                        label="Плановий час виїзду"
                        type="datetime-local"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={formData.plannedDepartureTime}
                        onChange={(e) => {
                            setFormData({ ...formData, plannedDepartureTime: e.target.value });
                            setFieldErrors(prev => ({ ...prev, plannedDepartureTime: null }));
                        }}
                        error={!!fieldErrors.plannedDepartureTime}
                        helperText={fieldErrors.plannedDepartureTime}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, bgcolor: alpha(mainColor, 0.02) }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Скасувати</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        bgcolor: mainColor,
                        fontWeight: 700,
                        px: 3,
                        '&:hover': { bgcolor: mainColor, filter: 'brightness(0.9)' }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Зберегти'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RouteListEditDialog;