import React, { useEffect } from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import { Map as MapIcon, FullscreenExit } from '@mui/icons-material';
import { MapContainer, TileLayer } from 'react-leaflet';
import { makeColoredIcon } from '../utils';
import { MapClickHandler, MapBoundsUpdater, MapInvalidateSize, DraggableMarker, LivePolyline } from './MapHelpers';

const FullscreenMapOverlay = ({
    open, onClose, mainColor,
    segmentsWithCoords, mapCoords,
    onMapClick, mapSelectMode,
    markerRefs,
    draggingSegId,
    onMarkerDragStart,
    onMarkerDragEnd,
}) => {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (open) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <Box sx={{
            position: 'fixed', top: 0, left: 0,
            width: '100vw', height: '100vh',
            zIndex: 9999, display: 'flex', flexDirection: 'column',
        }}>
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 1,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MapIcon sx={{ color: 'white', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                        Карта маршруту
                    </Typography>
                    {mapSelectMode
                        ? <Chip label="🗺️ Клікніть щоб додати • Перетягніть маркер щоб перемістити" size="small"
                            sx={{ bgcolor: mainColor, color: 'white', fontWeight: 700, ml: 1 }} />
                        : <Chip label="↕ Перетягніть маркер щоб скоригувати точку" size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, ml: 1 }} />
                    }
                </Box>
                <IconButton onClick={onClose} sx={{
                    color: 'white', bgcolor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                }}>
                    <FullscreenExit />
                </IconButton>
            </Box>

            {mapCoords.length >= 2 && (
                <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
                    px: 2, py: 1.5,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                    display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
                }}>
                    {segmentsWithCoords.map((seg, idx) => (
                        <React.Fragment key={seg.id}>
                            <Chip label={seg.cityName || '…'} size="small" sx={{
                                bgcolor: idx === 0 ? '#4caf50' : idx === segmentsWithCoords.length - 1 ? '#f44336' : mainColor,
                                color: 'white', fontWeight: 700, fontSize: 12,
                            }} />
                            {idx < segmentsWithCoords.length - 1 && (
                                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>→</Typography>
                            )}
                        </React.Fragment>
                    ))}
                </Box>
            )}

            <MapContainer center={[49.0, 31.0]} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onMapClick={onMapClick} />
                <MapBoundsUpdater coords={mapCoords} />
                <MapInvalidateSize trigger={open} />

                <LivePolyline
                    coords={segmentsWithCoords.map(s => ({ segId: s.id, lat: s.lat, lng: s.lng }))}
                    markerRefs={markerRefs}
                    draggingSegId={draggingSegId}
                    color={mainColor}
                />

                {segmentsWithCoords.map((seg, posIdx) => {
                    const color = posIdx === 0 ? '#4caf50'
                        : posIdx === segmentsWithCoords.length - 1 ? '#f44336' : mainColor;
                    const label = posIdx === 0 ? 'А'
                        : posIdx === segmentsWithCoords.length - 1 ? 'Б' : String(posIdx);
                    return (
                        <DraggableMarker
                            key={seg.id}
                            segId={seg.id}
                            position={[seg.lat, seg.lng]}
                            icon={makeColoredIcon(color, label)}
                            draggable={true}
                            markerRefs={markerRefs}
                            onDragStart={onMarkerDragStart}
                            onDragEnd={onMarkerDragEnd}
                        />
                    );
                })}
            </MapContainer>
        </Box>
    );
};

export default FullscreenMapOverlay;