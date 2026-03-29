import React from 'react';
import {
    Box, Typography, CircularProgress, Paper, Chip, alpha,
} from '@mui/material';
import { DirectionsBus, CheckCircle } from '@mui/icons-material';

const StepSegment = ({ mainColor, selectedTrip, segments, segmentsLoading, selectedSegment, setSelectedSegment }) => (
    <Box sx={{ p: 3 }}>
        <Box sx={{
            mb: 2, p: 1.5, borderRadius: 2,
            bgcolor: alpha(mainColor, 0.06),
            border: `1px solid ${alpha(mainColor, 0.2)}`,
            display: 'flex', alignItems: 'center', gap: 1,
        }}>
            <DirectionsBus sx={{ color: mainColor, fontSize: 18 }} />
            <Typography variant="body2" fontWeight={600} color={mainColor}>
                Рейс #{selectedTrip?.tripNumber}
            </Typography>
        </Box>

        {segmentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} sx={{ color: mainColor }} />
            </Box>
        ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {segments.map(seg => {
                    const isSelected = selectedSegment?.routeId === seg.routeId;
                    return (
                        <Paper
                            key={seg.routeId}
                            variant="outlined"
                            onClick={() => !seg.hasWaybill && setSelectedSegment(seg)}
                            sx={{
                                p: 2, borderRadius: 2,
                                cursor: seg.hasWaybill ? 'not-allowed' : 'pointer',
                                opacity: seg.hasWaybill ? 0.55 : 1,
                                borderColor: isSelected ? mainColor : 'divider',
                                bgcolor: isSelected ? alpha(mainColor, 0.06) : 'white',
                                transition: 'all 0.2s',
                                '&:hover': !seg.hasWaybill
                                    ? { borderColor: mainColor, bgcolor: alpha(mainColor, 0.04) }
                                    : {},
                                display: 'flex', alignItems: 'center', gap: 2,
                            }}
                        >
                            <Box sx={{
                                width: 32, height: 32, borderRadius: '50%',
                                bgcolor: isSelected ? mainColor : alpha(mainColor, 0.1),
                                color: isSelected ? 'white' : mainColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 13, flexShrink: 0,
                            }}>
                                {seg.sequenceNumber}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                    {seg.originCity} → {seg.destCity}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {seg.distance != null
                                        ? `${Number(seg.distance).toFixed(2)} км`
                                        : ''}
                                </Typography>
                            </Box>
                            {seg.hasWaybill && (
                                <Chip label="Вже є накладна" size="small" color="warning" variant="outlined" />
                            )}
                            {isSelected && <CheckCircle sx={{ color: mainColor }} />}
                        </Paper>
                    );
                })}
                {!segmentsLoading && segments.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        Сегменти не знайдено
                    </Box>
                )}
            </Box>
        )}
    </Box>
);

export default StepSegment;