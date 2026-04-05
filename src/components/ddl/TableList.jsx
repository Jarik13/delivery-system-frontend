import React from 'react';
import {
    Box, List, ListItemButton, ListItemIcon, ListItemText,
    Typography, TextField, InputAdornment, CircularProgress, alpha,
} from '@mui/material';
import { TableChart, Search } from '@mui/icons-material';

export default function TableList({ tables, loading, selected, onSelect, mainColor }) {
    const [search, setSearch] = React.useState('');

    const filtered = tables.filter(t =>
        t.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{
            width: 240,
            flexShrink: 0,
            borderRight: `1px solid ${alpha(mainColor, 0.15)}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            <Box sx={{ p: 1.5, borderBottom: `1px solid ${alpha(mainColor, 0.1)}` }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Пошук таблиці…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" sx={{ color: 'text.disabled' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                    <CircularProgress size={28} sx={{ color: mainColor }} />
                </Box>
            ) : (
                <List dense sx={{ overflow: 'auto', flex: 1, py: 0.5 }}>
                    {filtered.map(table => (
                        <ListItemButton
                            key={table}
                            selected={selected === table}
                            onClick={() => onSelect(table)}
                            sx={{
                                borderRadius: 1.5,
                                mx: 0.5,
                                mb: 0.25,
                                '&.Mui-selected': {
                                    bgcolor: alpha(mainColor, 0.1),
                                    '&:hover': { bgcolor: alpha(mainColor, 0.15) },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <TableChart sx={{ fontSize: 16, color: selected === table ? mainColor : 'text.disabled' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={table}
                                primaryTypographyProps={{
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    fontWeight: selected === table ? 700 : 400,
                                    color: selected === table ? mainColor : 'text.primary',
                                }}
                            />
                        </ListItemButton>
                    ))}
                    {filtered.length === 0 && (
                        <Typography variant="caption" color="text.disabled" sx={{ px: 2, py: 1, display: 'block' }}>
                            Нічого не знайдено
                        </Typography>
                    )}
                </List>
            )}

            <Box sx={{
                px: 2, py: 1,
                borderTop: `1px solid ${alpha(mainColor, 0.1)}`,
            }}>
                <Typography variant="caption" color="text.disabled">
                    {filtered.length} таблиць
                </Typography>
            </Box>
        </Box>
    );
}