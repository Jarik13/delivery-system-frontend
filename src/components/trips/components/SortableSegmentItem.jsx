import React from 'react';
import { Box, Paper, Typography, Chip, IconButton, alpha } from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LocationSelectorControlled from '../LocationSelectorControlled';

const SortableSegmentItem = ({ seg, idx, total, mainColor, onRegionChange, onDistrictChange, onCityChange, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: seg.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 'auto',
    };

    const chipColor = idx === 0 ? '#4caf50' : idx === total - 1 ? '#f44336' : mainColor;
    const chipLabel = idx === 0 ? 'А' : idx === total - 1 ? 'Б' : String(idx);
    const segmentLabel = idx === 0
        ? 'Місто відправлення'
        : idx === total - 1
            ? 'Місто призначення'
            : `Проміжна зупинка ${idx}`;

    return (
        <Paper ref={setNodeRef} style={style} variant="outlined" sx={{
            p: 1.5, mb: 1.5, borderRadius: 2,
            borderColor: seg.cityId ? mainColor : '#e0e0e0',
            bgcolor: seg.cityId ? alpha(mainColor, 0.02) : 'white',
            boxShadow: isDragging ? 4 : 0,
            transition: 'box-shadow 0.2s ease',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box {...attributes} {...listeners} sx={{
                    display: 'flex', alignItems: 'center',
                    cursor: 'grab', color: '#bbb',
                    '&:hover': { color: mainColor },
                    '&:active': { cursor: 'grabbing' },
                    touchAction: 'none', mr: -0.5,
                }}>
                    <DragIndicator fontSize="small" />
                </Box>

                <Chip label={chipLabel} size="small"
                    sx={{ bgcolor: chipColor, color: 'white', fontWeight: 700, minWidth: 28 }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {segmentLabel}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {seg.cityName && (
                    <Chip label={seg.cityName} size="small"
                        sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 600 }} />
                )}
                {seg.lat && (
                    <Chip label="📍" size="small" title="Координати знайдено"
                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                )}
                <IconButton size="small" onClick={() => onRemove(seg.id)}
                    disabled={total <= 2} sx={{ color: '#f44336' }}>
                    <Delete fontSize="small" />
                </IconButton>
            </Box>

            <LocationSelectorControlled
                regionId={seg.regionId || ''}
                districtId={seg.districtId || ''}
                cityId={seg.cityId || ''}
                onRegionChange={(regionId) => onRegionChange(seg.id, regionId)}
                onDistrictChange={(districtId) => onDistrictChange(seg.id, districtId)}
                onCityChange={(cityId, cityName) => onCityChange(seg.id, cityId, cityName)}
                error={false}
            />
        </Paper>
    );
};

export default SortableSegmentItem;