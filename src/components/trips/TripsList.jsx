import React from 'react';
import { Box, Typography, Divider, Chip, Stack, alpha } from '@mui/material';
import TripCard from './TripCard';

const TripsList = ({ trips, mainColor, onMap, onDelete }) => {
    const grouped = trips.reduce((acc, trip) => {
        const date = trip.scheduledDepartureTime
            ? new Date(trip.scheduledDepartureTime).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })
            : 'Без дати';
        if (!acc[date]) acc[date] = [];
        acc[date].push(trip);
        return acc;
    }, {});

    return (
        <Box sx={{ maxWidth: 850, mx: 'auto' }}>
            {Object.entries(grouped).map(([date, dayTrips]) => (
                <Box key={date} sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, ml: { xs: 0, sm: 6.5 } }}>
                        <Typography variant="caption" fontWeight="800" sx={{ textTransform: 'uppercase', color: 'text.disabled', fontSize: '0.7rem' }}>
                            {date}
                        </Typography>
                        <Divider sx={{ flex: 1 }} />
                        <Chip
                            label={`${dayTrips.length} рейсів`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(mainColor, 0.05), color: mainColor, fontWeight: 700 }}
                        />
                    </Box>
                    <Stack spacing={0.5}>
                        {dayTrips.map(trip => (
                            <TripCard key={trip.id} trip={trip} color={mainColor} onMap={onMap} onDelete={onDelete} />
                        ))}
                    </Stack>
                </Box>
            ))}
        </Box>
    );
};

export default TripsList;