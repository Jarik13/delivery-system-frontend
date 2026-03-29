import React from 'react';
import {
    Box, Typography, TextField, InputAdornment, CircularProgress,
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    Paper, Chip, Checkbox, alpha,
} from '@mui/material';
import { Search } from '@mui/icons-material';

const statusColor = (status) => {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s.includes('доставлено')) return 'success';
    if (s.includes('дорозі') || s.includes('сортування') || s.includes('завантаження') || s.includes('розвантаження')) return 'warning';
    if (s.includes('відмова') || s.includes('втрат') || s.includes('аварій')) return 'error';
    return 'default';
};

const StepTrip = ({ mainColor, tripSearch, setTripSearch, trips, tripsLoading, selectedTrip, setSelectedTrip }) => (
    <Box sx={{ p: 3 }}>
        <TextField
            fullWidth size="small"
            placeholder="Пошук за номером рейсу..."
            value={tripSearch}
            onChange={e => setTripSearch(e.target.value)}
            InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>,
            }}
            sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, px: 0.5 }}>
            Показуються тільки активні рейси
        </Typography>
        {tripsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} sx={{ color: mainColor }} />
            </Box>
        ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                            <TableCell sx={{ fontWeight: 700, width: 40 }} />
                            <TableCell sx={{ fontWeight: 700 }}>№ рейсу</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Відправлення</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Прибуття</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Статус</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {trips.map(trip => (
                            <TableRow
                                key={trip.id}
                                hover
                                selected={selectedTrip?.id === trip.id}
                                onClick={() => setSelectedTrip(trip)}
                                sx={{
                                    cursor: 'pointer',
                                    '&.Mui-selected': {
                                        bgcolor: alpha(mainColor, 0.08),
                                        '&:hover': { bgcolor: alpha(mainColor, 0.12) },
                                    },
                                }}
                            >
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedTrip?.id === trip.id}
                                        size="small"
                                        sx={{ '&.Mui-checked': { color: mainColor } }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>#{trip.tripNumber}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        {trip.scheduledDepartureTime
                                            ? new Date(trip.scheduledDepartureTime).toLocaleString('uk-UA', {
                                                day: '2-digit', month: '2-digit',
                                                hour: '2-digit', minute: '2-digit',
                                            })
                                            : '—'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        {trip.scheduledArrivalTime
                                            ? new Date(trip.scheduledArrivalTime).toLocaleString('uk-UA', {
                                                day: '2-digit', month: '2-digit',
                                                hour: '2-digit', minute: '2-digit',
                                            })
                                            : '—'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={trip.status || '—'}
                                        size="small"
                                        color={statusColor(trip.status)}
                                        variant="outlined"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!tripsLoading && trips.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    Активних рейсів не знайдено
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        )}
    </Box>
);

export default StepTrip;