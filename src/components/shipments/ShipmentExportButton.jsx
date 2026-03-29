import React, { useState, useRef } from 'react';
import {
    Box, Typography, CircularProgress, Popover,
    alpha, Tooltip, Divider, MenuItem, ListItemIcon, 
    ListItemText, Button, LinearProgress
} from '@mui/material';
import { FileDownload, Close } from '@mui/icons-material';
import { EXPORT_FORMATS, NO_PROGRESS } from '../../constants/export';
import { DictionaryApi } from '../../api/dictionaries';
import axios from 'axios';

const ShipmentExportButton = ({ shipmentId, mainColor }) => {
    const [anchor, setAnchor] = useState(null);
    const [progress, setProgress] = useState(NO_PROGRESS);
    const [activeKey, setActiveKey] = useState(null);
    
    const abortRef = useRef(null);
    const statsRef = useRef({ startTime: 0, lastLoaded: 0, lastTime: 0 });

    const cancelExport = () => {
        abortRef.current?.abort();
        setProgress(NO_PROGRESS);
        setActiveKey(null);
    };

    const handleExport = async (fmt) => {
        if (activeKey) return;
        
        setAnchor(null);
        setActiveKey(fmt.key);
        
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        
        statsRef.current = { startTime: Date.now(), lastLoaded: 0, lastTime: Date.now() };
        setProgress({ ...NO_PROGRESS, active: true, percent: null, label: fmt.label });

        try {
            const res = await DictionaryApi.exportFile('shipments/export', 
                { format: fmt.key, ids: shipmentId }, 
                {
                    signal: abortRef.current.signal,
                    onDownloadProgress: (e) => {
                        const { loaded, total: rawTotal } = e;
                        const total = rawTotal || 0;
                        const now = Date.now();
                        const { lastLoaded, lastTime } = statsRef.current;
                        
                        const dtMs = now - lastTime;
                        const speed = dtMs > 50 ? ((loaded - lastLoaded) / dtMs) * 1000 : 0;
                        const eta = speed > 0 && total > 0 ? (total - loaded) / speed : null;
                        const percent = total > 0 ? Math.min(Math.round((loaded / total) * 100), 99) : null;
                        
                        statsRef.current = { ...statsRef.current, lastLoaded: loaded, lastTime: now };
                        setProgress({ active: true, percent, loaded, total, speed, eta, label: fmt.label });
                    },
                }
            );

            setProgress(p => ({ ...p, percent: 100, eta: null, speed: 0 }));
            
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shipment_${shipmentId}_${new Date().toISOString().slice(0, 10)}.${fmt.ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setTimeout(() => {
                setProgress(NO_PROGRESS);
                setActiveKey(null);
            }, 800);

        } catch (e) {
            if (axios.isCancel(e) || e?.name === 'AbortError') return;
            console.error('Export error:', e);
            setProgress(NO_PROGRESS);
            setActiveKey(null);
        }
    };

    const isIndeterminate = progress.active && progress.percent === null;
    const isDeterminate = progress.active && progress.percent !== null;

    return (
        <>
            <Tooltip title={progress.active ? "Завантаження..." : "Експортувати відправлення"}>
                <Box
                    onClick={e => !progress.active && setAnchor(e.currentTarget)}
                    sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.8,
                        px: 1.2, py: 0.6, borderRadius: 2, cursor: progress.active ? 'default' : 'pointer',
                        border: `1px solid ${alpha(mainColor, 0.3)}`,
                        bgcolor: progress.active ? alpha(mainColor, 0.1) : alpha(mainColor, 0.05),
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: progress.active ? alpha(mainColor, 0.1) : alpha(mainColor, 0.12),
                            borderColor: mainColor,
                        },
                    }}
                >
                    {progress.active && (
                        <LinearProgress 
                            variant={isIndeterminate ? "indeterminate" : "determinate"}
                            value={isDeterminate ? progress.percent : undefined}
                            sx={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                                bgcolor: alpha(mainColor, 0.1),
                                '& .MuiLinearProgress-bar': { bgcolor: mainColor }
                            }}
                        />
                    )}
                    
                    {progress.active ? (
                        <CircularProgress size={12} sx={{ color: mainColor }} />
                    ) : (
                        <FileDownload sx={{ fontSize: 16, color: mainColor }} />
                    )}
                    
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: mainColor }}>
                        {progress.active ? (isDeterminate ? `${progress.percent}%` : 'Експорт...') : 'Експорт'}
                    </Typography>

                    {progress.active && (
                        <Box 
                            onClick={(e) => { e.stopPropagation(); cancelExport(); }}
                            sx={{ 
                                ml: 0.5, display: 'flex', alignItems: 'center', 
                                cursor: 'pointer', '&:hover': { color: '#ef5350' } 
                            }}
                        >
                            <Close sx={{ fontSize: 14 }} />
                        </Box>
                    )}
                </Box>
            </Tooltip>

            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        mt: 1, borderRadius: 2.5, minWidth: 200,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        border: '1px solid #f1f5f9',
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.2, bgcolor: alpha(mainColor, 0.04) }}>
                    <Typography variant="caption" fontWeight={800} color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }}>
                        Оберіть формат
                    </Typography>
                </Box>
                <Divider sx={{ opacity: 0.6 }} />
                
                <Box sx={{ p: 0.5 }}>
                    {EXPORT_FORMATS.map(fmt => (
                        <MenuItem 
                            key={fmt.key} 
                            onClick={() => handleExport(fmt)}
                            sx={{ 
                                py: 1, px: 1.5, borderRadius: 1.5,
                                '&:hover': { bgcolor: alpha(mainColor, 0.06) } 
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
                                {React.cloneElement(fmt.icon, { sx: { fontSize: 18 } })}
                            </ListItemIcon>
                            <ListItemText 
                                primary={fmt.label} 
                                primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} 
                            />
                        </MenuItem>
                    ))}
                </Box>
            </Popover>
        </>
    );
};

export default ShipmentExportButton;