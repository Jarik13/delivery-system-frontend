import React from 'react';
import {
    Box, Typography, Button, Paper, Chip, IconButton,
    List, ListItem, ListItemText, alpha
} from '@mui/material';
import { Add, Map as MapIcon, Route, Delete, DragIndicator, Fullscreen, Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { stepVariants, makeColoredIcon } from '../utils';
import { MapClickHandler, MapBoundsUpdater, DraggableMarker, LivePolyline } from '../components/MapHelpers';
import SortableSegmentItem from '../components/SortableSegmentItem';

const StepRoute = ({
    direction, mainColor,
    segments, activeSeg,
    mapSelectMode, setMapSelectMode,
    mapFullscreen, setMapFullscreen,
    segmentsWithCoords, mapCoords,
    sensors,
    addSegment, removeSegment,
    handleRegionChange, handleDistrictChange, handleCityChange,
    handleDragStart, handleDragEnd,
    handleMapClick,
    markerRefs,
    draggingSegId,
    handleMarkerDragStart,
    handleMarkerDragEnd,
    errors = {},
}) => {
    const waypointErrors = Object.entries(errors).filter(([k]) => k === 'waypoints' || k.startsWith('waypoints['));
    const hasErrors = waypointErrors.length > 0;

    return (
        <motion.div key="s1" custom={direction} variants={stepVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{
                        color: '#666', fontWeight: 800, textTransform: 'uppercase',
                        display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                        <Route sx={{ color: mainColor, fontSize: 18 }} /> Міста маршруту
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small"
                            variant={!mapSelectMode ? 'contained' : 'outlined'}
                            onClick={() => setMapSelectMode(false)}
                            sx={{ bgcolor: !mapSelectMode ? mainColor : undefined }}>
                            Список
                        </Button>
                        <Button size="small"
                            variant={mapSelectMode ? 'contained' : 'outlined'}
                            startIcon={<MapIcon />}
                            onClick={() => setMapSelectMode(true)}
                            sx={{ bgcolor: mapSelectMode ? mainColor : undefined }}>
                            На карті
                        </Button>
                        {!mapSelectMode && (
                            <Button size="small" variant="contained" startIcon={<Add />}
                                onClick={addSegment} sx={{ bgcolor: mainColor }}>
                                Місто
                            </Button>
                        )}
                    </Box>
                </Box>

                {hasErrors && (
                    <Box sx={{
                        p: 1.5, borderRadius: 2,
                        bgcolor: 'rgba(211,47,47,0.06)',
                        border: '1px solid rgba(211,47,47,0.3)',
                        display: 'flex', flexDirection: 'column', gap: 0.5
                    }}>
                        {waypointErrors.map(([k, v]) => (
                            <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning sx={{ fontSize: 16, color: 'error.main' }} />
                                <Typography variant="caption" color="error" fontWeight={600}>
                                    {v}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {!mapSelectMode && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter}
                        onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <SortableContext items={segments.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            <Box sx={{
                                maxHeight: 360, overflowY: 'auto', pr: 0.5,
                                borderRadius: 2,
                                border: hasErrors ? '1px solid rgba(211,47,47,0.4)' : 'none',
                            }}>
                                {segments.map((seg, idx) => (
                                    <SortableSegmentItem
                                        key={seg.id} seg={seg} idx={idx} total={segments.length}
                                        mainColor={mainColor}
                                        onRegionChange={handleRegionChange}
                                        onDistrictChange={handleDistrictChange}
                                        onCityChange={handleCityChange}
                                        onRemove={removeSegment}
                                    />
                                ))}
                            </Box>
                        </SortableContext>
                        <DragOverlay>
                            {activeSeg && (
                                <Paper variant="outlined" sx={{
                                    p: 1.5, borderRadius: 2, borderColor: mainColor,
                                    bgcolor: alpha(mainColor, 0.05), boxShadow: 8, opacity: 0.95,
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DragIndicator sx={{ color: mainColor }} />
                                        <Chip label={activeSeg.cityName || '…'} size="small"
                                            sx={{ bgcolor: alpha(mainColor, 0.15), color: mainColor, fontWeight: 700 }} />
                                    </Box>
                                </Paper>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}

                <Box sx={{
                    height: mapSelectMode ? 340 : 200,
                    borderRadius: 2, overflow: 'hidden', position: 'relative',
                    border: mapSelectMode ? `2px solid ${mainColor}` : '1px solid #e0e0e0',
                    transition: 'height 0.3s ease',
                }}>
                    {mapSelectMode && (
                        <Box sx={{
                            position: 'absolute', top: 8, left: '50%',
                            transform: 'translateX(-50%)', zIndex: 1000,
                            bgcolor: mainColor, color: 'white',
                            px: 2, py: 0.5, borderRadius: 2,
                            fontSize: 12, fontWeight: 700, boxShadow: 2, whiteSpace: 'nowrap',
                        }}>
                            🗺️ Клікніть щоб додати • Перетягніть маркер щоб перемістити
                        </Box>
                    )}
                    {!mapSelectMode && segmentsWithCoords.length > 0 && (
                        <Box sx={{
                            position: 'absolute', bottom: 8, left: 8, zIndex: 1000,
                            bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
                            px: 1.5, py: 0.5, borderRadius: 1.5,
                            fontSize: 11, fontWeight: 600, color: '#666',
                            border: '1px solid #e0e0e0', boxShadow: 1, pointerEvents: 'none',
                        }}>
                            ↕ Перетягніть маркер щоб скоригувати точку
                        </Box>
                    )}
                    <Box onClick={() => setMapFullscreen(true)} title="Розгорнути карту на весь екран" sx={{
                        position: 'absolute', bottom: 8, right: 8, zIndex: 1000,
                        width: 32, height: 32, borderRadius: 1.5,
                        bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(0,0,0,0.12)', transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: mainColor, '& svg': { color: 'white' }, transform: 'scale(1.08)' },
                    }}>
                        <Fullscreen sx={{ fontSize: 18, color: '#555', transition: 'color 0.2s ease' }} />
                    </Box>

                    <MapContainer center={[49.0, 31.0]} zoom={6} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapClickHandler onMapClick={handleMapClick} />
                        <MapBoundsUpdater coords={mapCoords} disabled={!!draggingSegId} />
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
                                    key={seg.id} segId={seg.id}
                                    position={[seg.lat, seg.lng]}
                                    icon={makeColoredIcon(color, label)}
                                    draggable={true}
                                    markerRefs={markerRefs}
                                    onDragStart={handleMarkerDragStart}
                                    onDragEnd={handleMarkerDragEnd}
                                />
                            );
                        })}
                    </MapContainer>
                </Box>

                {mapSelectMode && segments.filter(s => s.cityName).length > 0 && (
                    <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                        <List dense disablePadding>
                            {segments.map((seg, idx) => (
                                <ListItem key={seg.id} sx={{ py: 0.25 }}>
                                    <Chip
                                        label={idx === 0 ? 'А' : idx === segments.length - 1 ? 'Б' : idx}
                                        size="small"
                                        sx={{
                                            bgcolor: idx === 0 ? '#4caf50' : idx === segments.length - 1 ? '#f44336' : mainColor,
                                            color: 'white', mr: 1, minWidth: 28,
                                        }}
                                    />
                                    <ListItemText primary={seg.cityName}
                                        primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
                                    <IconButton size="small" onClick={() => removeSegment(seg.id)} sx={{ color: '#f44336' }}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {segments.filter(s => s.cityName).length >= 2 && (
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(mainColor, 0.03) }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Маршрут:</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                            {segments.filter(s => s.cityName).map(s => s.cityName).join(' → ')}
                        </Typography>
                    </Paper>
                )}
            </Box>
        </motion.div>
    );
};

export default StepRoute;