import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Autocomplete, Box, CircularProgress
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { DictionaryApi } from '../../api/dictionaries';

const RouteListEditDialog = ({ open, onClose, onSuccess, mainColor, item, references }) => {
    const [loading, setLoading] = useState(false);
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
        }
    }, [item]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await DictionaryApi.update('route-lists', item.id, {
                courierId: formData.courierId,
                plannedDepartureTime: formData.plannedDepartureTime
            });
            onSuccess(`Маршрутний лист ML-${item.number} успішно оновлено`);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Edit sx={{ color: mainColor }} /> Редагувати ML-{item?.number}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                        options={references.couriers}
                        getOptionLabel={(o) => `${o.lastName} ${o.firstName}`}
                        value={references.couriers.find(c => c.id === formData.courierId) || null}
                        onChange={(_, v) => setFormData({ ...formData, courierId: v?.id })}
                        renderInput={(params) => <TextField {...params} label="Виберіть кур'єра" />}
                    />
                    <TextField
                        label="Плановий виїзд"
                        type="datetime-local"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={formData.plannedDepartureTime}
                        onChange={(e) => setFormData({ ...formData, plannedDepartureTime: e.target.value })}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} color="inherit">Скасувати</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={loading}
                    sx={{ bgcolor: mainColor, '&:hover': { bgcolor: mainColor } }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Зберегти зміни'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RouteListEditDialog;