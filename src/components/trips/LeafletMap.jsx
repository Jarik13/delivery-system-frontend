import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMzZDcyZDA5YjFmYTRiNDk5ZDliMjk3NjU4MjUyYzc0IiwiaCI6Im11cm11cjY0In0='; // ← замінити на свій ключ
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

function decimatePoints(points, factor = 8) {
    if (points.length <= 2) return points;
    const result = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
        if (i % factor === 0) result.push(points[i]);
    }
    result.push(points[points.length - 1]);
    return result;
}

async function fetchRoute(coords) {
    try {
        const res = await fetch(ORS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ORS_API_KEY,
            },
            body: JSON.stringify({
                coordinates: coords.map(c => [c[1], c[0]]),
            }),
        });
        if (!res.ok) throw new Error(`ORS HTTP ${res.status}`);
        const data = await res.json();
        const raw = data.features?.[0]?.geometry?.coordinates;
        if (raw?.length) {
            return decimatePoints(raw.map(c => [c[1], c[0]]), 8);
        }
    } catch (e) {
        console.warn('ORS routing failed, falling back to straight line:', e);
    }
    return coords;
}

function createCarIcon(color = '#1565c0') {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="17" fill="${color}" stroke="white" stroke-width="2.5" opacity="0.95"/>
      <g transform="translate(7, 11)">
        <rect x="1" y="5" width="20" height="8" rx="2" fill="white"/>
        <path d="M3 5 L5 1 L17 1 L19 5" fill="white"/>
        <rect x="3" y="2" width="6" height="3" rx="0.5" fill="${color}" opacity="0.6"/>
        <rect x="13" y="2" width="6" height="3" rx="0.5" fill="${color}" opacity="0.6"/>
        <circle cx="5" cy="13.5" r="2" fill="${color}" stroke="white" stroke-width="1"/>
        <circle cx="17" cy="13.5" r="2" fill="${color}" stroke="white" stroke-width="1"/>
        <rect x="0" y="7" width="3" height="2" rx="0.5" fill="yellow" opacity="0.9"/>
        <rect x="19" y="7" width="3" height="2" rx="0.5" fill="red" opacity="0.9"/>
      </g>
    </svg>`;
    return L.divIcon({ html: svg, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
}

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
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
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
            <Chip icon={<Scale sx={{ fontSize: '13px !important' }} />}
                label={`${data.totalWeight ?? 0} кг`} size="small"
                sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: '#f5f5f5' }} />
            <Chip label={`${data.shipments?.length || 0} відправлень`} size="small"
                sx={{ bgcolor: alpha(mainColor, 0.1), color: mainColor, fontWeight: 700, fontSize: '0.7rem' }} />
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        {['№', 'Трекінг', 'Відправник', 'Отримувач', 'Вага', 'Статус'].map(h => (
                            <TableCell key={h} sx={{
                                fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase',
                                letterSpacing: 0.5, bgcolor: '#fafafa', color: 'text.secondary', whiteSpace: 'nowrap',
                            }}>{h}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {(data.shipments || []).map(s => {
                        const sc = SHIPMENT_STATUS_COLORS[s.shipmentStatusName] || SHIPMENT_STATUS_COLORS['default'];
                        return (
                            <TableRow key={s.id} sx={{
                                bgcolor: 'white', '&:hover': { bgcolor: '#fafafa' },
                                borderLeft: `3px solid ${alpha(sc, 0.4)}`
                            }}>
                                <TableCell sx={{ pl: 1.5, py: 1, width: 40 }}>
                                    <Box sx={{
                                        width: 24, height: 24, borderRadius: '50%', bgcolor: '#f0f0f0',
                                        color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700
                                    }}>{s.sequenceNumber ?? '—'}</Box>
                                </TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                                    <Typography variant="caption" sx={{
                                        fontFamily: 'monospace', fontWeight: 700,
                                        bgcolor: '#f5f5f5', px: 1, py: 0.25, borderRadius: 1, color: mainColor, fontSize: 11
                                    }}>
                                        {s.trackingNumber || `#${s.id}`}
                                    </Typography>
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
                                            bgcolor: alpha(sc, 0.12), color: sc,
                                            fontWeight: 700, fontSize: 11, height: 22,
                                            border: `1px solid ${alpha(sc, 0.3)}`,
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
    const mapInstanceRef = useRef(null);
    const carMarkerRef = useRef(null);
    const animFrameRef = useRef(null);

    const [isMapReady, setIsMapReady] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [segments, setSegments] = useState([]);
    const [waybillPanel, setWaybillPanel] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);

    const COLOR_COMPLETED = '#43A047';
    const COLOR_ACTIVE = '#FB8C00';
    const COLOR_PENDING = '#90A4AE';
    const COLOR_CAR = '#1565c0';

    const STEP_DELAY = 350;

    const tripStatus = (trip?.statusName ?? trip?.status ?? '').toLowerCase();
    const isPlanned = tripStatus.includes('заплановано') || tripStatus.includes('формо') || tripStatus.includes('завантаж');
    const isCompleted = tripStatus.includes('завершено');

    useEffect(() => {
        if (!trip?.id) return;
        setSegments([]);
        setIsMapReady(false);
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
        } catch {
            setWaybillPanel(null);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
    };

    useEffect(() => {
        const handleKey = e => {
            if (e.key === 'Escape') { setIsFullscreen(false); setWaybillPanel(null); }
        };
        if (isFullscreen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isFullscreen]);

    const placeStaticCar = useCallback((map, position) => {
        if (carMarkerRef.current) { carMarkerRef.current.remove(); carMarkerRef.current = null; }
        if (!position) return;
        carMarkerRef.current = L.marker(position, {
            icon: createCarIcon(COLOR_CAR), zIndexOffset: 1000,
        }).addTo(map);
    }, [COLOR_CAR]);

    const animateCar = useCallback((map, routeCoords) => {
        if (!routeCoords || routeCoords.length < 2) return;
        if (carMarkerRef.current) { carMarkerRef.current.remove(); carMarkerRef.current = null; }

        carMarkerRef.current = L.marker(routeCoords[0], {
            icon: createCarIcon(COLOR_CAR), zIndexOffset: 1000,
        }).addTo(map);

        let idx = 0;
        const step = () => {
            if (!carMarkerRef.current) return;
            idx = (idx + 1) % routeCoords.length;
            const pos = routeCoords[idx];
            carMarkerRef.current.setLatLng(pos);

            if (idx > 0) {
                const prev = routeCoords[idx - 1];
                const angle = Math.atan2(pos[1] - prev[1], pos[0] - prev[0]) * 180 / Math.PI;
                const el = carMarkerRef.current.getElement();
                if (el) el.style.transform += ` rotate(${angle - 90}deg)`;
            }
            animFrameRef.current = setTimeout(step, STEP_DELAY);
        };
        animFrameRef.current = setTimeout(step, STEP_DELAY);
    }, [COLOR_CAR, STEP_DELAY]);

    useEffect(() => {
        if (!mapRef.current || !trip || segments.length === 0) return;
        let destroyed = false;

        if (animFrameRef.current) clearTimeout(animFrameRef.current);
        carMarkerRef.current = null;
        if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });
        mapInstanceRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        const points = [];
        const first = segments[0];
        if (first?.originLat && first?.originLng) {
            points.push({
                lat: first.originLat, lng: first.originLng,
                name: first.originCity || 'Старт', type: 'origin',
                waybillId: null, isCompleted: true, isDeparted: true,
            });
        }
        segments.forEach((seg, idx) => {
            if (seg.destLat && seg.destLng) {
                points.push({
                    lat: seg.destLat, lng: seg.destLng,
                    name: seg.destCity || `Зупинка ${idx + 1}`,
                    type: idx === segments.length - 1 ? 'destination' : 'waypoint',
                    waybillId: seg.waybillId ?? null,
                    isCompleted: seg.isCompleted,
                    isDeparted: seg.isDeparted,
                });
            }
        });

        if (points.length === 0) { map.setView([49.0, 31.0], 6); setIsMapReady(true); return; }

        setRouteLoading(true);

        const buildRoutes = async () => {
            if (destroyed) return;
            const segmentRoutes = [];
            const allBounds = [];

            for (let i = 0; i < points.length - 1; i++) {
                const from = points[i];
                const to = points[i + 1];
                const seg = segments[i];
                const route = await fetchRoute([[from.lat, from.lng], [to.lat, to.lng]]);
                if (destroyed) return;

                segmentRoutes.push({ route, seg });
                route.forEach(c => allBounds.push(c));

                const segColor = seg?.isCompleted ? COLOR_COMPLETED
                    : seg?.isDeparted ? COLOR_ACTIVE : COLOR_PENDING;

                L.polyline(route, {
                    color: segColor,
                    weight: seg?.isDeparted ? 5 : 4,
                    opacity: seg?.isDeparted ? 0.9 : 0.6,
                    dashArray: seg?.isCompleted ? null : '10, 6',
                }).addTo(map);
            }

            if (destroyed) return;

            points.forEach((point, idx) => {
                const color = point.type === 'origin' ? '#4CAF50'
                    : point.type === 'destination' ? '#E53935'
                        : point.isCompleted ? COLOR_COMPLETED
                            : point.isDeparted ? COLOR_ACTIVE
                                : COLOR_PENDING;

                const label = point.type === 'origin' ? '▶'
                    : point.type === 'destination' ? '⬛'
                        : String(idx);

                const hasWaybill = !!point.waybillId;
                const icon = L.divIcon({
                    html: `<div style="position:relative">
                      <div style="background:${color};color:white;border-radius:50%;
                        width:30px;height:30px;display:flex;align-items:center;
                        justify-content:center;font-size:11px;font-weight:bold;
                        border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)">
                        ${label}
                      </div>
                      ${hasWaybill ? `<div style="position:absolute;top:-4px;right:-4px;
                        background:#1565c0;border-radius:50%;width:13px;height:13px;
                        font-size:8px;color:white;display:flex;align-items:center;
                        justify-content:center;border:1.5px solid white;
                        box-shadow:0 1px 4px rgba(0,0,0,0.3)">📄</div>` : ''}
                    </div>`,
                    className: '', iconSize: [30, 30], iconAnchor: [15, 15],
                });

                const marker = L.marker([point.lat, point.lng], { icon }).addTo(map);
                if (hasWaybill) {
                    const pid = `wb-${idx}`;
                    marker.bindPopup(
                        `<div style="text-align:center;padding:4px 2px">
                            <b style="font-size:13px">${point.name}</b><br/>
                            <span id="${pid}" style="display:inline-block;margin-top:6px;
                                background:#1565c0;color:white;padding:4px 10px;border-radius:6px;
                                cursor:pointer;font-size:11px;font-weight:700">
                                📄 Переглянути накладну
                            </span>
                        </div>`, { maxWidth: 200 }
                    );
                    marker.on('popupopen', () => {
                        setTimeout(() => {
                            const btn = document.getElementById(pid);
                            if (btn) btn.onclick = () => openWaybill(point.waybillId);
                        }, 50);
                    });
                } else {
                    marker.bindPopup(`<b>${point.name}</b>`);
                }
            });

            if (allBounds.length >= 2) map.fitBounds(L.latLngBounds(allBounds), { padding: [40, 40] });
            else if (allBounds.length === 1) map.setView(allBounds[0], 12);

            if (isPlanned) {
                placeStaticCar(map, [points[0].lat, points[0].lng]);

            } else if (isCompleted) {
                placeStaticCar(map, [points[points.length - 1].lat, points[points.length - 1].lng]);

            } else {
                let activeRoute = null;
                for (const { route, seg } of segmentRoutes) {
                    if (seg?.isDeparted && !seg?.isCompleted) { activeRoute = route; break; }
                }

                if (!activeRoute) {
                    for (let i = segmentRoutes.length - 1; i >= 0; i--) {
                        const { route, seg } = segmentRoutes[i];
                        if (seg?.isCompleted || seg?.isDeparted) { activeRoute = route; break; }
                    }
                }

                if (!activeRoute && segmentRoutes.length > 0) activeRoute = segmentRoutes[0].route;

                if (activeRoute) animateCar(map, activeRoute);
                else placeStaticCar(map, [points[0].lat, points[0].lng]);
            }

            setRouteLoading(false);
            setTimeout(() => {
                if (!destroyed && mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                    setIsMapReady(true);
                }
            }, 300);
        };

        buildRoutes();

        return () => {
            destroyed = true;
            if (animFrameRef.current) clearTimeout(animFrameRef.current);
            carMarkerRef.current = null;
            if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
        };
    }, [trip, segments, animateCar, placeStaticCar, isPlanned, isCompleted]);

    useEffect(() => {
        const t = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
        return () => clearTimeout(t);
    }, [isFullscreen]);

    const Legend = () => (
        <Box sx={{
            position: 'absolute', bottom: 56, left: 12, zIndex: 1000,
            bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2,
            p: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)',
        }}>
            {[
                { color: COLOR_COMPLETED, label: 'Пройдено', dash: false },
                { color: COLOR_ACTIVE, label: 'Поточний', dash: true },
                { color: COLOR_PENDING, label: 'Очікує', dash: true },
            ].map(({ color, label, dash }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                    <Box sx={{
                        width: 24, height: 3, borderRadius: 1,
                        backgroundImage: dash
                            ? `repeating-linear-gradient(90deg, ${color} 0, ${color} 5px, transparent 5px, transparent 9px)`
                            : 'none',
                        bgcolor: dash ? 'transparent' : color,
                    }} />
                    <Typography variant="caption" sx={{ fontSize: 10, color: '#555', fontWeight: 600 }}>
                        {label}
                    </Typography>
                </Box>
            ))}
            <Box sx={{ mt: 0.75, pt: 0.75, borderTop: '1px solid #eee' }}>
                <Typography variant="caption" sx={{ fontSize: 9.5, color: '#888', display: 'block' }}>
                    🚗 {isPlanned ? 'Стоїть на старті' : isCompleted ? 'На фінішній точці' : 'Рухається по маршруту'}
                </Typography>
            </Box>
        </Box>
    );

    const mapContent = (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            <Legend />

            <Tooltip title={isFullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'} placement="left">
                <IconButton onClick={toggleFullscreen} sx={{
                    position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
                    bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: `1px solid ${alpha(mainColor, 0.2)}`, transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: mainColor, color: 'white', borderColor: mainColor,
                        boxShadow: `0 4px 12px ${alpha(mainColor, 0.4)}`
                    },
                }}>
                    {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                </IconButton>
            </Tooltip>

            {waybillPanel && (
                waybillPanel.loading
                    ? <Box sx={{
                        position: 'absolute', top: 0, right: 0, bottom: 0,
                        width: { xs: '100%', sm: 500 }, bgcolor: 'white',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1100, boxShadow: '-4px 0 24px rgba(0,0,0,0.18)'
                    }}>
                        <CircularProgress sx={{ color: mainColor }} />
                    </Box>
                    : waybillPanel.data
                        ? <WaybillPanel data={waybillPanel.data} onClose={() => setWaybillPanel(null)} mainColor={mainColor} />
                        : null
            )}

            {(!isMapReady || routeLoading) && (
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.85)', zIndex: 1000, gap: 1.5
                }}>
                    <CircularProgress size={32} sx={{ color: mainColor }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {routeLoading ? 'Будуємо маршрут по дорогах...' : 'Завантаження карти...'}
                    </Typography>
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