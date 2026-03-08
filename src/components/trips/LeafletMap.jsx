import React, { useState, useEffect, useRef } from 'react';
import {
    Box, CircularProgress, Typography, IconButton,
    Table, TableHead, TableRow, TableCell, TableBody,
    Chip, alpha, Stack, Tooltip
} from '@mui/material';
import {
    Close, ArticleOutlined, Fullscreen, FullscreenExit,
    Scale, CalendarToday, Person
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DictionaryApi } from '../../api/dictionaries';
import { SHIPMENT_STATUS_COLORS } from '../../constants/statusColors';

const WaybillPanel = ({ data, onClose, mainColor }) => (
    <Box sx={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: { xs: '100%', sm: 620 },
        bgcolor: 'white', display: 'flex', flexDirection: 'column',
        zIndex: 1100, boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
        borderLeft: `3px solid ${mainColor}`,
    }}>
        <Box sx={{
            p: 2, bgcolor: mainColor, color: 'white', flexShrink: 0,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
            <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <ArticleOutlined sx={{ fontSize: 18 }} />
                    <Typography fontWeight="900" fontSize="1rem" letterSpacing={0.5}>
                        Накладна №{data.waybillNumber}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ opacity: 0.85 }}>
                    <Stack direction="row" spacing={0.4} alignItems="center">
                        <CalendarToday sx={{ fontSize: 11 }} />
                        <Typography fontSize="0.72rem">
                            {new Date(data.createdAt).toLocaleDateString('uk-UA')}
                        </Typography>
                    </Stack>
                    {data.employeeName && (
                        <Stack direction="row" spacing={0.4} alignItems="center">
                            <Person sx={{ fontSize: 11 }} />
                            <Typography fontSize="0.72rem">{data.employeeName}</Typography>
                        </Stack>
                    )}
                </Stack>
            </Stack>
            <IconButton onClick={onClose} size="small" sx={{ color: 'white', mt: -0.5 }}>
                <Close fontSize="small" />
            </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, borderBottom: '1px solid #eee', flexShrink: 0 }}>
            <Chip
                icon={<Scale sx={{ fontSize: '13px !important' }} />}
                label={`${data.totalWeight ?? 0} кг`}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: '#f5f5f5' }}
            />
            <Chip
                label={`${data.shipments?.length || 0} відправлень`}
                size="small"
                sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700, fontSize: '0.7rem' }}
            />
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        {['№', 'Трекінг', 'Відправник', 'Отримувач', 'Вага', 'Статус'].map(h => (
                            <TableCell key={h} sx={{
                                fontWeight: 800, fontSize: '0.65rem',
                                textTransform: 'uppercase', letterSpacing: 0.5,
                                bgcolor: '#fafafa', color: 'text.secondary',
                                whiteSpace: 'nowrap',
                            }}>{h}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {(data.shipments || []).map((s) => {
                        const statusColor = SHIPMENT_STATUS_COLORS[s.shipmentStatusName] || SHIPMENT_STATUS_COLORS['default'];
                        return (
                            <TableRow key={s.id} sx={{
                                bgcolor: 'white', '&:hover': { bgcolor: '#fafafa' },
                                borderLeft: `3px solid ${alpha(statusColor, 0.4)}`,
                            }}>
                                <TableCell sx={{ pl: 1.5, py: 1, width: 40 }}>
                                    <Box sx={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        bgcolor: '#f0f0f0', color: '#666',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700,
                                    }}>{s.sequenceNumber ?? '—'}</Box>
                                </TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                                    <Typography variant="caption" sx={{
                                        fontFamily: 'monospace', fontWeight: 700,
                                        bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1,
                                        color: mainColor, fontSize: 11,
                                    }}>{s.trackingNumber || `#${s.id}`}</Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                                    <Typography variant="caption" fontWeight={600}>{s.senderFullName || '—'}</Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                                    <Typography variant="caption" fontWeight={600}>{s.recipientFullName || '—'}</Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {s.actualWeight != null ? `${s.actualWeight} кг` : '—'}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                                    {s.shipmentStatusName ? (
                                        <Chip label={s.shipmentStatusName} size="small" sx={{
                                            bgcolor: alpha(statusColor, 0.12), color: statusColor,
                                            fontWeight: 700, fontSize: 11, height: 22,
                                            border: `1px solid ${alpha(statusColor, 0.3)}`,
                                        }} />
                                    ) : '—'}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Box>
    </Box>
);

const LeafletMap = ({ trip, mainColor = '#7B1FA2' }) => {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [segments, setSegments] = useState([]);
    const [waybillPanel, setWaybillPanel] = useState(null);

    useEffect(() => {
        if (!trip?.id) return;
        setSegments([]);
        DictionaryApi.getById('trips', `${trip.id}/segments`)
            .then(res => setSegments(res.data || []))
            .catch(console.error);
    }, [trip?.id]);

    const openWaybill = async (waybillId) => {
        setIsFullscreen(true);
        setWaybillPanel({ loading: true, data: null });
        try {
            const res = await DictionaryApi.getById('waybills', `${waybillId}/details`);
            setWaybillPanel({ loading: false, data: res.data });
        } catch (e) {
            console.error('waybill error:', e);
            setWaybillPanel(null);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
    };

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') { setIsFullscreen(false); setWaybillPanel(null); }
        };
        if (isFullscreen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isFullscreen]);

    useEffect(() => {
        if (!mapRef.current || !trip) return;
        if (segments.length === 0) return;

        let destroyed = false;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        const allPoints = [];

        if (segments.length > 0) {
            const first = segments[0];
            if (first.originLat && first.originLng) {
                allPoints.push({
                    lat: first.originLat,
                    lng: first.originLng,
                    name: first.originCity || 'Старт',
                    type: 'origin',
                    waybillId: null,
                });
            }

            segments.forEach((seg, idx) => {
                if (seg.destLat && seg.destLng) {
                    allPoints.push({
                        lat: seg.destLat,
                        lng: seg.destLng,
                        name: seg.destCity || `Зупинка ${idx + 1}`,
                        type: idx === segments.length - 1 ? 'destination' : 'waypoint',
                        waybillId: seg.waybillId ?? null,
                    });
                }
            });
        }

        if (allPoints.length === 0) {
            map.setView([49.0, 31.0], 6);
        } else {
            const coords = allPoints.map(p => [p.lat, p.lng]);

            allPoints.forEach((point, idx) => {
                let color = mainColor;
                let label;

                if (point.type === 'origin') { color = '#4CAF50'; label = 'А'; }
                else if (point.type === 'destination') { color = '#F44336'; label = 'Б'; }
                else {
                    label = String(allPoints.slice(0, idx).filter(p => p.type === 'waypoint').length + 1);
                }

                const hasWaybill = !!point.waybillId;
                const badge = hasWaybill
                    ? `<div style="position:absolute;top:-5px;right:-5px;background:#1565c0;border-radius:50%;width:14px;height:14px;font-size:8px;color:white;display:flex;align-items:center;justify-content:center;border:1.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)">📄</div>`
                    : '';

                const icon = L.divIcon({
                    html: `<div style="position:relative;width:28px;height:28px">
                        <div style="background:${color};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${label}</div>
                        ${badge}
                    </div>`,
                    className: '', iconSize: [28, 28], iconAnchor: [14, 14],
                });

                const marker = L.marker([point.lat, point.lng], { icon }).addTo(map);

                if (hasWaybill) {
                    const popupId = `wb-popup-${idx}`;
                    marker.bindPopup(
                        `<div style="text-align:center;padding:4px 2px">
                            <b style="font-size:13px">${point.name}</b><br/>
                            <span id="${popupId}" style="display:inline-block;margin-top:6px;background:#1565c0;color:white;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;">
                                📄 Переглянути накладну
                            </span>
                        </div>`,
                        { maxWidth: 200 }
                    );
                    marker.on('popupopen', () => {
                        setTimeout(() => {
                            const btn = document.getElementById(popupId);
                            if (btn) btn.onclick = () => openWaybill(point.waybillId);
                        }, 50);
                    });
                } else {
                    marker.bindPopup(`<b>${point.name}</b>`);
                }
            });

            if (coords.length >= 2) {
                L.polyline(coords, { color: mainColor, weight: 3, opacity: 0.7, dashArray: '8, 8' }).addTo(map);
                map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
            } else {
                map.setView(coords[0], 12);
            }
        }

        const timerId = setTimeout(() => {
            if (!destroyed && mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
                setIsMapReady(true);
            }
        }, 300);

        return () => {
            destroyed = true;
            clearTimeout(timerId);
            if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
        };
    }, [trip, segments]);

    useEffect(() => {
        const t = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
        return () => clearTimeout(t);
    }, [isFullscreen]);

    const mapContent = (
        <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            <Tooltip title={isFullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'} placement="left">
                <IconButton onClick={toggleFullscreen} sx={{
                    position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
                    bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: `1px solid ${alpha(mainColor, 0.2)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: mainColor, color: 'white', borderColor: mainColor,
                        boxShadow: `0 4px 12px ${alpha(mainColor, 0.4)}`,
                    },
                }}>
                    {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                </IconButton>
            </Tooltip>

            {waybillPanel && (
                waybillPanel.loading ? (
                    <Box sx={{
                        position: 'absolute', top: 0, right: 0, bottom: 0, width: { xs: '100%', sm: 500 },
                        bgcolor: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1100, boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
                    }}>
                        <CircularProgress sx={{ color: mainColor }} />
                    </Box>
                ) : waybillPanel.data ? (
                    <WaybillPanel data={waybillPanel.data} onClose={() => setWaybillPanel(null)} mainColor={mainColor} />
                ) : null
            )}

            {!isMapReady && (
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.9)', zIndex: 1000,
                }}>
                    <CircularProgress size={30} />
                </Box>
            )}
        </Box>
    );

    if (isFullscreen) {
        return (
            <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
                {mapContent}
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: '420px' }}>
            {mapContent}
        </Box>
    );
};

export default LeafletMap;