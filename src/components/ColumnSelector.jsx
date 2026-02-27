import React, { useState } from 'react';
import {
    IconButton, Popover, Box, Typography, Checkbox,
    FormControlLabel, Divider, Button, Tooltip, alpha,
} from '@mui/material';
import { ViewColumn, RestartAlt } from '@mui/icons-material';

const ColumnSelector = ({ columns, visible, onChange, mainColor }) => {
    const [anchor, setAnchor] = useState(null);

    const toggle = (key) => {
        const next = new Set(visible);
        next.has(key) ? next.delete(key) : next.add(key);
        onChange(next);
    };

    const reset = () => {
        onChange(new Set(columns.map(c => c.key)));
    };

    const visibleCount = columns.filter(c => visible.has(c.key)).length;

    return (
        <>
            <Tooltip title="Налаштувати колонки">
                <IconButton
                    size="small"
                    onClick={(e) => setAnchor(e.currentTarget)}
                    sx={{
                        color: mainColor,
                        bgcolor: alpha(mainColor, 0.08),
                        border: `1px solid ${alpha(mainColor, 0.2)}`,
                        borderRadius: 1.5,
                        '&:hover': { bgcolor: alpha(mainColor, 0.15) },
                    }}
                >
                    <ViewColumn fontSize="small" />
                </IconButton>
            </Tooltip>

            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: { borderRadius: 2, boxShadow: 6, minWidth: 220, mt: 0.5 },
                }}
            >
                <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" fontWeight={800}
                        sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.8, color: 'text.secondary' }}>
                        Колонки ({visibleCount}/{columns.length})
                    </Typography>
                    <Tooltip title="Показати всі">
                        <IconButton size="small" onClick={reset} sx={{ color: mainColor, p: 0.5 }}>
                            <RestartAlt fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Divider />

                <Box sx={{ px: 1.5, py: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {columns.map(col => (
                        <FormControlLabel
                            key={col.key}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={visible.has(col.key)}
                                    onChange={() => toggle(col.key)}
                                    disabled={col.required && visible.has(col.key) && visibleCount <= 1}
                                    sx={{
                                        color: alpha(mainColor, 0.4),
                                        '&.Mui-checked': { color: mainColor },
                                        p: 0.5,
                                    }}
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: col.required ? 700 : 400 }}>
                                    {col.label}
                                    {col.required && (
                                        <Typography component="span" sx={{ fontSize: '0.65rem', color: 'text.disabled', ml: 0.5 }}>
                                            (завжди)
                                        </Typography>
                                    )}
                                </Typography>
                            }
                            sx={{ m: 0, '&:hover': { bgcolor: alpha(mainColor, 0.04), borderRadius: 1 } }}
                        />
                    ))}
                </Box>
            </Popover>
        </>
    );
};

export default ColumnSelector;