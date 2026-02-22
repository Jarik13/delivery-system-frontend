import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box, Typography, Popover, alpha, Chip, IconButton,
    Tooltip, Collapse, Divider, Paper,
} from '@mui/material';
import { Search, Close, Add, Check, KeyboardArrowDown } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import 'dayjs/locale/uk';

const fmt = (dateStr) => {
    if (!dateStr) return '';
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('DD.MM.YY, HH:mm') : dateStr;
};

const isActive = (field, filters) => {
    if (field.type === 'range')
        return filters[field.minName] > field.min || filters[field.maxName] < field.max;
    if (field.type === 'checkbox-group') {
        const v = filters[field.name];
        return Array.isArray(v) && v.length > 0;
    }
    const v = filters[field.name];
    return v !== '' && v !== null && v !== undefined;
};

const displayValue = (field, filters) => {
    if (field.type === 'range')
        return `${filters[field.minName]}–${filters[field.maxName]}`;
    if (field.type === 'datetime')
        return fmt(filters[field.name]);
    if (field.type === 'select') {
        const val = filters[field.name];
        const o = field.options?.find(o => String(o.id) === String(val));
        return o?.name || o?.label || val;
    }
    if (field.type === 'checkbox-group') {
        const ids = filters[field.name] || [];
        const labels = ids.map(id => {
            const o = field.options?.find(o => String(o.id) === String(id));
            return o?.name || o?.label || id;
        });
        return labels.length <= 2 ? labels.join(', ') : `${labels[0]}, +${labels.length - 1}`;
    }
    return filters[field.name];
};

const FilterToken = ({ field, filters, onChange, accentColor, counts }) => {
    const [anchor, setAnchor] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const active = isActive(field, filters);
    const val = active ? displayValue(field, filters) : null;
    const count = counts?.[field.name];

    const handleClear = (e) => {
        e.stopPropagation();
        if (field.type === 'range') {
            onChange(field.minName, field.min);
            onChange(field.maxName, field.max);
        } else if (field.type === 'checkbox-group') {
            onChange(field.name, []);
        } else {
            onChange(field.name, '');
        }
    };

    const minVal = Number(filters[field.minName] ?? field.min);
    const maxVal = Number(filters[field.maxName] ?? field.max);

    return (
        <>
            <Box
                onClick={(e) => setAnchor(e.currentTarget)}
                sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    px: active ? 1.25 : 1.5,
                    py: 0.6,
                    borderRadius: '8px',
                    border: `1.5px solid`,
                    borderColor: active ? accentColor : '#e2e8f0',
                    bgcolor: active ? alpha(accentColor, 0.07) : 'white',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                        borderColor: accentColor,
                        bgcolor: active ? alpha(accentColor, 0.1) : alpha(accentColor, 0.04),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(accentColor, 0.15)}`,
                    },
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 600,
                        fontSize: 12.5,
                        color: active ? accentColor : '#64748b',
                        letterSpacing: '0.01em',
                    }}
                >
                    {field.label}
                </Typography>

                {active && (
                    <>
                        <Box sx={{ width: 1, height: 12, bgcolor: alpha(accentColor, 0.3) }} />
                        <Typography variant="caption" sx={{
                            fontSize: 12, fontWeight: 700, color: accentColor,
                            maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {val}
                        </Typography>
                    </>
                )}

                {count !== undefined && (
                    <Typography variant="caption" sx={{
                        fontSize: 11, color: active ? alpha(accentColor, 0.7) : '#94a3b8',
                        fontWeight: 500,
                    }}>
                        ({count})
                    </Typography>
                )}

                {active ? (
                    <Box
                        onClick={handleClear}
                        sx={{
                            ml: 0.25, display: 'flex', alignItems: 'center',
                            '&:hover .close-icon': { opacity: 1, transform: 'scale(1)' },
                        }}
                    >
                        <Close className="close-icon" sx={{
                            fontSize: 13, color: accentColor,
                            opacity: 0.6, transform: 'scale(0.85)',
                            transition: 'all 0.12s',
                        }} />
                    </Box>
                ) : (
                    <KeyboardArrowDown sx={{ fontSize: 14, color: '#94a3b8', ml: 0.25 }} />
                )}
            </Box>

            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => {
                    setAnchor(null);
                    setSearchQuery('');
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        mt: 1, borderRadius: 3, overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
                        border: '1px solid #f1f5f9',
                        minWidth: field.type === 'datetime' ? 340 : field.type === 'checkbox-group' ? 260 : 220,
                    },
                }}
            >
                <Box sx={{
                    px: 2, py: 1.5,
                    bgcolor: alpha(accentColor, 0.04),
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10.5 }}>
                        {field.label}
                    </Typography>
                    {active && (
                        <Box onClick={handleClear}
                            sx={{
                                fontSize: 11, color: '#ef4444', cursor: 'pointer',
                                fontWeight: 600, letterSpacing: '0.02em',
                                '&:hover': { textDecoration: 'underline' },
                            }}>
                            Скинути
                        </Box>
                    )}
                </Box>

                <Box sx={{ p: field.type === 'datetime' ? 0 : 2 }}>
                    {(!field.type || field.type === 'text') && (
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            border: `1.5px solid ${alpha(accentColor, 0.3)}`,
                            borderRadius: 2, px: 1.5, py: 0.75, bgcolor: 'white',
                        }}>
                            <Search sx={{ fontSize: 16, color: '#94a3b8' }} />
                            <input
                                autoFocus
                                value={filters[field.name] || ''}
                                onChange={e => onChange(field.name, e.target.value)}
                                placeholder={`Фільтр: ${field.label.toLowerCase()}...`}
                                style={{
                                    border: 'none', outline: 'none', background: 'transparent',
                                    fontSize: 13, fontWeight: 500, width: '100%', color: '#1e293b',
                                }}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setAnchor(null); }}
                            />
                            {filters[field.name] && (
                                <Close onClick={() => onChange(field.name, '')}
                                    sx={{ fontSize: 14, color: '#94a3b8', cursor: 'pointer' }} />
                            )}
                        </Box>
                    )}

                    {field.type === 'select' && (() => {
                        const filteredOptions = (field.options || []).filter(opt =>
                            (opt.name || opt.label || "").toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        return (
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ p: 1.5, pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        px: 1, py: 0.5, bgcolor: '#f8fafc', borderRadius: 2,
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <Search sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        <input
                                            autoFocus
                                            placeholder="Пошук..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{
                                                border: 'none', outline: 'none', background: 'transparent',
                                                fontSize: 13, width: '100%', color: '#1e293b'
                                            }}
                                        />
                                        {searchQuery && (
                                            <Close
                                                onClick={() => setSearchQuery('')}
                                                sx={{ fontSize: 14, color: '#94a3b8', cursor: 'pointer' }}
                                            />
                                        )}
                                    </Box>
                                </Box>

                                <Box sx={{
                                    maxHeight: 250, overflowY: 'auto', p: 1,
                                    '&::-webkit-scrollbar': { width: 3 },
                                    '&::-webkit-scrollbar-thumb': { bgcolor: alpha(accentColor, 0.2), borderRadius: 2 },
                                }}>
                                    {filteredOptions.length > 0 ? (
                                        filteredOptions.map(opt => {
                                            const isSelected = String(filters[field.name]) === String(opt.id);
                                            return (
                                                <Box key={opt.id}
                                                    onClick={() => {
                                                        onChange(field.name, isSelected ? '' : opt.id);
                                                        setAnchor(null);
                                                        setSearchQuery('');
                                                    }}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center', gap: 1,
                                                        px: 1.5, py: 1, borderRadius: 2, cursor: 'pointer',
                                                        bgcolor: isSelected ? alpha(accentColor, 0.08) : 'transparent',
                                                        '&:hover': { bgcolor: isSelected ? alpha(accentColor, 0.12) : '#f8fafc' }
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{
                                                        fontSize: 13,
                                                        fontWeight: isSelected ? 600 : 400,
                                                        color: isSelected ? accentColor : '#374151'
                                                    }}>
                                                        {opt.name || opt.label}
                                                    </Typography>
                                                    {isSelected && <Check sx={{ fontSize: 14, color: accentColor, ml: 'auto' }} />}
                                                </Box>
                                            );
                                        })
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="caption" color="text.disabled">Нічого не знайдено</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        );
                    })()}

                    {field.type === 'checkbox-group' && (() => {
                        const selected = Array.isArray(filters[field.name]) ? filters[field.name] : [];
                        return (
                            <Box sx={{
                                display: 'flex', flexDirection: 'column', gap: 0.25, maxHeight: 300, overflowY: 'auto',
                                '&::-webkit-scrollbar': { width: 3 },
                                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(accentColor, 0.2), borderRadius: 2 },
                            }}>
                                {(field.options || []).map(opt => {
                                    const id = opt.id;
                                    const checked = selected.includes(id);
                                    const optCount = counts?.[`${field.name}_${id}`];
                                    return (
                                        <Box key={id}
                                            onClick={() => {
                                                const next = checked
                                                    ? selected.filter(x => x !== id)
                                                    : [...selected, id];
                                                onChange(field.name, next);
                                            }}
                                            sx={{
                                                display: 'flex', alignItems: 'center',
                                                gap: 1, px: 1.25, py: 0.9, borderRadius: 2,
                                                cursor: 'pointer', transition: 'all 0.1s',
                                                bgcolor: checked ? alpha(accentColor, 0.08) : 'transparent',
                                                '&:hover': { bgcolor: checked ? alpha(accentColor, 0.12) : '#f8fafc' },
                                            }}
                                        >
                                            <Box sx={{
                                                width: 16, height: 16, borderRadius: '5px',
                                                border: `2px solid`, flexShrink: 0,
                                                borderColor: checked ? accentColor : '#cbd5e1',
                                                bgcolor: checked ? accentColor : 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.12s',
                                            }}>
                                                {checked && <Check sx={{ fontSize: 11, color: 'white' }} />}
                                            </Box>
                                            {opt.color && (
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: opt.color, flexShrink: 0 }} />
                                            )}
                                            <Typography variant="body2" sx={{
                                                fontSize: 13, fontWeight: checked ? 600 : 400,
                                                color: checked ? accentColor : '#374151', flex: 1,
                                            }}>
                                                {opt.name || opt.label}
                                            </Typography>
                                            {optCount !== undefined && (
                                                <Typography variant="caption" sx={{
                                                    fontSize: 11, color: '#94a3b8', fontWeight: 500,
                                                }}>
                                                    {optCount}
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })()}

                    {field.type === 'range' && (() => {
                        const pctLeft = ((minVal - field.min) / (field.max - field.min)) * 100;
                        const pctRight = ((maxVal - field.min) / (field.max - field.min)) * 100;

                        return (
                            <Box>
                                <style>{`
                .dual-range-input {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    background: transparent;
                    pointer-events: none;
                    position: absolute;
                    margin: 0;
                }
                .dual-range-input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    pointer-events: auto;
                    cursor: pointer;
                }
                .dual-range-input::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    pointer-events: auto;
                    cursor: pointer;
                }
                .dual-range-input:focus {
                    outline: none;
                }
            `}</style>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                                    {[
                                        { label: 'Від', name: field.minName, val: minVal },
                                        { label: 'До', name: field.maxName, val: maxVal },
                                    ].map(({ label, name, val: v }) => (
                                        <Box key={name}>
                                            <Typography variant="caption" color="text.secondary"
                                                sx={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {label}
                                            </Typography>
                                            <Box sx={{
                                                mt: 0.5, px: 1.5, py: 0.75, borderRadius: 2,
                                                border: `1px solid ${alpha(accentColor, 0.2)}`,
                                                minWidth: 75, textAlign: 'center', bgcolor: alpha(accentColor, 0.02)
                                            }}>
                                                <Typography variant="body2" fontWeight={700} color={accentColor}>
                                                    {v}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>

                                <Box sx={{ px: 0, position: 'relative', height: 24, display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{ position: 'absolute', left: 0, right: 0, height: 4, bgcolor: '#f1f5f9', borderRadius: 2 }} />

                                    <Box sx={{
                                        position: 'absolute',
                                        left: `${pctLeft}%`,
                                        right: `${100 - pctRight}%`,
                                        height: 4, bgcolor: accentColor, borderRadius: 2,
                                    }} />

                                    <input
                                        type="range"
                                        className="dual-range-input"
                                        min={field.min}
                                        max={field.max}
                                        step={field.step || 1}
                                        value={minVal}
                                        onChange={e => {
                                            const nv = Number(e.target.value);
                                            if (nv <= maxVal) onChange(field.minName, nv);
                                        }}
                                        style={{ zIndex: minVal > (field.max - (field.max - field.min) * 0.1) ? 5 : 3 }}
                                    />

                                    <input
                                        type="range"
                                        className="dual-range-input"
                                        min={field.min}
                                        max={field.max}
                                        step={field.step || 1}
                                        value={maxVal}
                                        onChange={e => {
                                            const nv = Number(e.target.value);
                                            if (nv >= minVal) onChange(field.maxName, nv);
                                        }}
                                        style={{ zIndex: 4 }}
                                    />

                                    <Box sx={{
                                        position: 'absolute', left: `calc(${pctLeft}% - 10px)`,
                                        width: 20, height: 20, borderRadius: '50%',
                                        bgcolor: 'white', border: `2px solid ${accentColor}`,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)', zIndex: 2, pointerEvents: 'none'
                                    }} />

                                    <Box sx={{
                                        position: 'absolute', left: `calc(${pctRight}% - 10px)`,
                                        width: 20, height: 20, borderRadius: '50%',
                                        bgcolor: 'white', border: `2px solid ${accentColor}`,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)', zIndex: 2, pointerEvents: 'none'
                                    }} />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                    <Typography variant="caption" color="text.disabled" fontWeight={500}>{field.min}</Typography>
                                    <Typography variant="caption" color="text.disabled" fontWeight={500}>{field.max}</Typography>
                                </Box>
                            </Box>
                        );
                    })()}

                    {field.type === 'datetime' && (
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
                            <StaticDateTimePicker
                                value={filters[field.name] ? dayjs(filters[field.name]) : null}
                                onChange={v => onChange(field.name, v?.isValid() ? v.format('YYYY-MM-DDTHH:mm:ss') : '')}
                                ampm={false}
                                slots={{ actionBar: () => null }}
                                slotProps={{
                                    toolbar: { hidden: true },
                                    actionBar: { actions: [] },
                                }}
                                sx={{
                                    '& .MuiPickersDay-root.Mui-selected': { bgcolor: accentColor },
                                    '& .MuiClockPointer-root': { bgcolor: accentColor },
                                    '& .MuiClockPointer-thumb': { borderColor: accentColor },
                                    '& .MuiClock-pin': { bgcolor: accentColor },
                                }}
                            />
                        </LocalizationProvider>
                    )}
                </Box>
            </Popover>
        </>
    );
};

const DataFilters = ({
    filters,
    onChange,
    onClear,
    fields,
    searchPlaceholder = 'Пошук...',
    accentColor = '#1976d2',
    counts = {},
}) => {
    const searchField = fields[0];
    const filterFields = fields.filter(f => f.name !== searchField?.name);
    const activeCount = filterFields.filter(f => isActive(f, filters)).length;
    const totalCount = counts?.total;

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                p: 1, pl: 1.5,
                bgcolor: 'white',
                border: '1.5px solid #e2e8f0',
                borderRadius: 3,
                mb: 1,
                flexWrap: 'wrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 200px', minWidth: 160 }}>
                    <Search sx={{ fontSize: 18, color: '#94a3b8', flexShrink: 0 }} />
                    <input
                        value={filters[searchField?.name] || ''}
                        onChange={e => onChange(searchField?.name, e.target.value)}
                        placeholder={searchPlaceholder}
                        style={{
                            border: 'none', outline: 'none', background: 'transparent',
                            fontSize: 13.5, fontWeight: 500, width: '100%',
                            color: '#1e293b', letterSpacing: '0.01em',
                        }}
                    />
                    {filters[searchField?.name] && (
                        <Close onClick={() => onChange(searchField?.name, '')}
                            sx={{
                                fontSize: 15, color: '#94a3b8', cursor: 'pointer', flexShrink: 0,
                                '&:hover': { color: '#ef4444' }
                            }} />
                    )}
                </Box>

                <Box sx={{ width: 1, height: 28, bgcolor: '#e2e8f0', flexShrink: 0 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', flex: '99 1 auto' }}>
                    {filterFields.map(f => (
                        <FilterToken
                            key={f.name || f.label}
                            field={f}
                            filters={filters}
                            onChange={onChange}
                            accentColor={accentColor}
                            counts={counts}
                        />
                    ))}
                </Box>

                {activeCount > 0 && (
                    <>
                        <Box sx={{ width: 1, height: 28, bgcolor: '#e2e8f0', flexShrink: 0 }} />
                        <Tooltip title="Скинути всі фільтри">
                            <Box onClick={onClear} sx={{
                                display: 'flex', alignItems: 'center', gap: 0.5,
                                px: 1.25, py: 0.6, borderRadius: 2, cursor: 'pointer',
                                color: '#ef4444', transition: 'all 0.15s',
                                '&:hover': { bgcolor: alpha('#ef4444', 0.07) },
                            }}>
                                <Close sx={{ fontSize: 14 }} />
                                <Typography variant="caption" fontWeight={700} fontSize={12}>
                                    Скинути{activeCount > 0 ? ` (${activeCount})` : ''}
                                </Typography>
                            </Box>
                        </Tooltip>
                    </>
                )}
            </Box>

            {(totalCount !== undefined || activeCount > 0) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5 }}>
                    {totalCount !== undefined && (
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>
                            Знайдено:{' '}
                            <span style={{ color: accentColor, fontWeight: 700 }}>{totalCount}</span>
                        </Typography>
                    )}

                    {activeCount > 0 && totalCount !== undefined && (
                        <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                    )}

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {filterFields.filter(f => isActive(f, filters)).map(f => {
                            const fCount = counts?.[f.name];
                            return (
                                <Box key={f.name} sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                    px: 1, py: 0.3, borderRadius: '6px',
                                    bgcolor: alpha(accentColor, 0.07),
                                }}>
                                    <Typography variant="caption" sx={{
                                        fontSize: 11.5, color: '#64748b',
                                    }}>
                                        {f.label}:
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        fontSize: 11.5, color: accentColor, fontWeight: 700,
                                    }}>
                                        {displayValue(f, filters)}
                                        {fCount !== undefined && (
                                            <span style={{ color: alpha(accentColor, 0.6), fontWeight: 500 }}>
                                                {' '}({fCount})
                                            </span>
                                        )}
                                    </Typography>
                                    <Close onClick={() => {
                                        if (f.type === 'range') {
                                            onChange(f.minName, f.min);
                                            onChange(f.maxName, f.max);
                                        } else if (f.type === 'checkbox-group') {
                                            onChange(f.name, []);
                                        } else {
                                            onChange(f.name, '');
                                        }
                                    }} sx={{
                                        fontSize: 11, color: '#94a3b8', cursor: 'pointer',
                                        '&:hover': { color: '#ef4444' },
                                    }} />
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default DataFilters;