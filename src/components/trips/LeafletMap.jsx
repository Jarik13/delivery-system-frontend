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

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMzZDcyZDA5YjFmYTRiNDk5ZDliMjk3NjU4MjUyYzc0IiwiaCI6Im11cm11cjY0In0=';
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

// 1. CartoDB Dark:  https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
// 2. CartoDB Light: https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
// 3. CartoDB Voyager (colorful clean): https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png
// 4. Stadia Alidade Smooth Dark: https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png
// 5. OpenStreetMap standard: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

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
            headers: { 'Content-Type': 'application/json', 'Authorization': ORS_API_KEY },
            body: JSON.stringify({ coordinates: coords.map(c => [c[1], c[0]]) }),
        });
        if (!res.ok) throw new Error(`ORS HTTP ${res.status}`);
        const data = await res.json();
        const raw = data.features?.[0]?.geometry?.coordinates;
        if (raw?.length) return decimatePoints(raw.map(c => [c[1], c[0]]), 8);
    } catch (e) {
        console.warn('ORS routing failed, straight line fallback:', e);
    }
    return coords;
}

function lerpColor(hex1, hex2, t) {
    const parse = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const [r1, g1, b1] = parse(hex1);
    const [r2, g2, b2] = parse(hex2);
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function addGradientPolyline(map, coords, colorA, colorB) {
    if (coords.length < 2) return;
    const total = coords.length - 1;
    for (let i = 0; i < total; i++) {
        L.polyline([coords[i], coords[i + 1]], {
            color: lerpColor(colorA, colorB, i / Math.max(total - 1, 1)),
            weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round',
        }).addTo(map);
    }
}

function getBearing(from, to) {
    const lat1 = from[0] * Math.PI / 180;
    const lat2 = to[0] * Math.PI / 180;
    const dLng = (to[1] - from[1]) * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function createArrowIcon(color = '#FB8C00', bearing = 0) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <defs>
            <filter id="glow">
                <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="rgba(0,0,0,0.6)"/>
            </filter>
        </defs>
        <g transform="rotate(${bearing}, 20, 20)" filter="url(#glow)">
            <circle cx="20" cy="20" r="16" fill="${color}" opacity="0.18"/>
            <polygon points="20,4 29,32 20,25 11,32"
                fill="${color}" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
            <circle cx="20" cy="20" r="3.5" fill="white" opacity="0.95"/>
        </g>
    </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
}

function buildDistanceLookup(coords) {
    const dist = [0];
    for (let i = 1; i < coords.length; i++) {
        const [lat1, lng1] = coords[i - 1];
        const [lat2, lng2] = coords[i];
        const dlat = lat2 - lat1, dlng = lng2 - lng1;
        dist.push(dist[i - 1] + Math.sqrt(dlat * dlat + dlng * dlng));
    }
    return dist;
}

function positionAtProgress(coords, distLookup, t) {
    const total = distLookup[distLookup.length - 1];
    const target = Math.min(t, 1) * total;
    let lo = 0, hi = distLookup.length - 2;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (distLookup[mid + 1] < target) lo = mid + 1; else hi = mid;
    }
    const segLen = distLookup[lo + 1] - distLookup[lo];
    const frac = segLen < 1e-10 ? 0 : (target - distLookup[lo]) / segLen;
    const [lat1, lng1] = coords[lo];
    const [lat2, lng2] = coords[lo + 1] ?? coords[lo];
    return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
}

function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

const WaybillPanel = ({ data, onClose, mainColor }) => (
    <Box sx={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: { xs: '100%', sm: 620 },
        bgcolor: '#1a1a2e', display: 'flex', flexDirection: 'column',
        zIndex: 1100, boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
        borderLeft: `3px solid ${mainColor}`,
    }}>
        <Box sx={{ p: 2, bgcolor: mainColor, color: 'white', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <ArticleOutlined sx={{ fontSize: 18 }} />
                    <Typography fontWeight="900" fontSize="1rem" letterSpacing={0.5}>Накладна №{data.waybillNumber}</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ opacity: 0.85 }}>
                    <Stack direction="row" spacing={0.4} alignItems="center">
                        <CalendarToday sx={{ fontSize: 11 }} />
                        <Typography fontSize="0.72rem">{new Date(data.createdAt).toLocaleDateString('uk-UA')}</Typography>
                    </Stack>
                    {data.employeeName && (
                        <Stack direction="row" spacing={0.4} alignItems="center">
                            <Person sx={{ fontSize: 11 }} />
                            <Typography fontSize="0.72rem">{data.employeeName}</Typography>
                        </Stack>
                    )}
                </Stack>
            </Stack>
            <IconButton onClick={onClose} size="small" sx={{ color: 'white', mt: -0.5 }}><Close fontSize="small" /></IconButton>
        </Box>
        <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <Chip icon={<Scale sx={{ fontSize: '13px !important' }} />} label={`${data.totalWeight ?? 0} кг`} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} />
            <Chip label={`${data.shipments?.length || 0} відправлень`} size="small" sx={{ bgcolor: alpha(mainColor, 0.3), color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        {['№', 'Трекінг', 'Відправник', 'Отримувач', 'Вага', 'Статус'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5, bgcolor: '#16213e', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', borderColor: 'rgba(255,255,255,0.08)' }}>{h}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {(data.shipments || []).map(s => {
                        const sc = SHIPMENT_STATUS_COLORS[s.shipmentStatusName] || SHIPMENT_STATUS_COLORS['default'];
                        return (
                            <TableRow key={s.id} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }, borderLeft: `3px solid ${alpha(sc, 0.5)}` }}>
                                <TableCell sx={{ pl: 1.5, py: 1, width: 40, borderColor: 'rgba(255,255,255,0.06)' }}>
                                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{s.sequenceNumber ?? '—'}</Box>
                                </TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap', borderColor: 'rgba(255,255,255,0.06)' }}>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.08)', px: 1, py: 0.25, borderRadius: 1, color: mainColor === '#7B1FA2' ? '#ce93d8' : mainColor, fontSize: 11 }}>{s.trackingNumber || `#${s.id}`}</Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap', borderColor: 'rgba(255,255,255,0.06)' }}><Typography variant="caption" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.8)' }}>{s.senderFullName || '—'}</Typography></TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap', borderColor: 'rgba(255,255,255,0.06)' }}><Typography variant="caption" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.8)' }}>{s.recipientFullName || '—'}</Typography></TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap', borderColor: 'rgba(255,255,255,0.06)' }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{s.actualWeight != null ? `${s.actualWeight} кг` : '—'}</Typography></TableCell>
                                <TableCell sx={{ py: 1, whiteSpace: 'nowrap', borderColor: 'rgba(255,255,255,0.06)' }}>
                                    {s.shipmentStatusName
                                        ? <Chip label={s.shipmentStatusName} size="small" sx={{ bgcolor: alpha(sc, 0.18), color: sc, fontWeight: 700, fontSize: 11, height: 22, border: `1px solid ${alpha(sc, 0.4)}` }} />
                                        : '—'}
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
    const dotMarkerRef = useRef(null);
    const rafRef = useRef(null);
    const animStateRef = useRef(null);

    const [isMapReady, setIsMapReady] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [segments, setSegments] = useState([]);
    const [waybillPanel, setWaybillPanel] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);

    const COLOR_COMPLETED = '#43A047';
    const COLOR_ACTIVE = '#FB8C00';
    const COLOR_PENDING = '#90A4AE';

    const TRAVEL_DURATION_MS = 300_000;

    const tripStatus = (trip?.statusName ?? trip?.status ?? '').toLowerCase();
    const isPlanned = tripStatus.includes('заплановано') || tripStatus.includes('формо') || tripStatus.includes('завантаж');
    const isCompleted = tripStatus.includes('завершено');
    const isInProgress = !isPlanned && !isCompleted;

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
        } catch { setWaybillPanel(null); }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
    };

    useEffect(() => {
        const handleKey = e => { if (e.key === 'Escape') { setIsFullscreen(false); setWaybillPanel(null); } };
        if (isFullscreen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isFullscreen]);

    const startSmoothAnimation = (map, routeCoords) => {
        if (!routeCoords || routeCoords.length < 2) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (dotMarkerRef.current) { dotMarkerRef.current.remove(); dotMarkerRef.current = null; }

        const distLookup = buildDistanceLookup(routeCoords);
        const initBearing = getBearing(routeCoords[0], routeCoords[1]);

        dotMarkerRef.current = L.marker(routeCoords[0], {
            icon: createArrowIcon(COLOR_ACTIVE, initBearing),
            zIndexOffset: 900,
            interactive: false,
        }).addTo(map);

        const startTime = performance.now();
        animStateRef.current = { active: true, lastBearing: initBearing };

        const tick = (now) => {
            if (!dotMarkerRef.current || !animStateRef.current) return;

            const elapsed = now - startTime;
            const rawT = Math.min(elapsed / TRAVEL_DURATION_MS, 1);
            const t = easeInOut(rawT);

            const pos = positionAtProgress(routeCoords, distLookup, t);

            const aheadRaw = Math.min(rawT + 0.02, 1);
            const aheadPos = positionAtProgress(routeCoords, distLookup, easeInOut(aheadRaw));

            const dlat = aheadPos[0] - pos[0];
            const dlng = aheadPos[1] - pos[1];
            const moved = Math.sqrt(dlat * dlat + dlng * dlng);
            const bearing = moved > 1e-6
                ? getBearing(pos, aheadPos)
                : animStateRef.current.lastBearing;
            animStateRef.current.lastBearing = bearing;

            dotMarkerRef.current.setLatLng(pos);

            const gEl = dotMarkerRef.current.getElement()?.querySelector('g');
            if (gEl) {
                gEl.setAttribute('transform', `rotate(${bearing}, 20, 20)`);
            } else {
                dotMarkerRef.current.setIcon(createArrowIcon(COLOR_ACTIVE, bearing));
            }

            if (rawT < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        rafRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        if (!mapRef.current || !trip || segments.length === 0) return;
        let destroyed = false;

        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        animStateRef.current = null;
        if (dotMarkerRef.current) { dotMarkerRef.current.remove(); dotMarkerRef.current = null; }
        if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true });
        mapInstanceRef.current = map;

        L.tileLayer(TILE_URL, {
            maxZoom: 19,
            attribution: TILE_ATTRIBUTION,
            subdomains: 'abcd',
        }).addTo(map);

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

            const allBounds = [];
            let activeSegRoute = null;

            for (let i = 0; i < points.length - 1; i++) {
                const from = points[i];
                const to = points[i + 1];
                const seg = segments[i];

                const route = await fetchRoute([[from.lat, from.lng], [to.lat, to.lng]]);
                if (destroyed) return;

                route.forEach(c => allBounds.push(c));

                const isActiveSeg = seg?.isDeparted && !seg?.isCompleted;
                const isCompletedSeg = seg?.isCompleted;

                if (isActiveSeg) {
                    L.polyline(route, {
                        color: COLOR_ACTIVE, weight: 10, opacity: 0.15,
                        lineCap: 'round', lineJoin: 'round',
                    }).addTo(map);
                    addGradientPolyline(map, route, COLOR_PENDING, COLOR_ACTIVE);
                    activeSegRoute = route;
                } else if (isCompletedSeg) {
                    L.polyline(route, {
                        color: COLOR_COMPLETED, weight: 5, opacity: 0.85,
                        lineCap: 'round', lineJoin: 'round',
                    }).addTo(map);
                } else {
                    L.polyline(route, {
                        color: COLOR_PENDING, weight: 3.5, opacity: 0.45,
                        dashArray: '8, 7', lineCap: 'round', lineJoin: 'round',
                    }).addTo(map);
                }
            }

            if (destroyed) return;

            points.forEach((point, idx) => {
                const color =
                    point.type === 'origin' ? '#4CAF50'
                        : point.type === 'destination' ? '#E53935'
                            : point.isCompleted ? COLOR_COMPLETED
                                : point.isDeparted ? COLOR_ACTIVE
                                    : COLOR_PENDING;

                const label =
                    point.type === 'origin' ? '▶'
                        : point.type === 'destination' ? '■'
                            : String(idx);

                const hasWaybill = !!point.waybillId;

                const icon = L.divIcon({
                    html: `<div style="position:relative">
                      <div style="
                        background:${color};color:white;border-radius:50%;
                        width:30px;height:30px;display:flex;align-items:center;justify-content:center;
                        font-size:11px;font-weight:bold;
                        border:2.5px solid rgba(255,255,255,0.9);
                        box-shadow:0 0 0 3px ${alpha(color, 0.35)}, 0 3px 10px rgba(0,0,0,0.5)">
                        ${label}
                      </div>
                      ${hasWaybill ? `<div style="position:absolute;top:-4px;right:-4px;
                        background:#1565c0;border-radius:50%;width:13px;height:13px;font-size:8px;
                        color:white;display:flex;align-items:center;justify-content:center;
                        border:1.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5)">📄</div>` : ''}
                    </div>`,
                    className: '', iconSize: [30, 30], iconAnchor: [15, 15],
                });

                const marker = L.marker([point.lat, point.lng], { icon }).addTo(map);
                if (hasWaybill) {
                    const pid = `wb-${idx}`;
                    marker.bindPopup(
                        `<div style="text-align:center;padding:4px 2px;background:#1a1a2e;color:white;border-radius:6px">
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
                    marker.bindPopup(`<b style="color:#333">${point.name}</b>`);
                }
            });

            if (allBounds.length >= 2) map.fitBounds(L.latLngBounds(allBounds), { padding: [40, 40] });
            else if (allBounds.length === 1) map.setView(allBounds[0], 12);

            if (isInProgress && activeSegRoute) {
                startSmoothAnimation(map, activeSegRoute);
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
            if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
            animStateRef.current = null;
            if (dotMarkerRef.current) { dotMarkerRef.current.remove(); dotMarkerRef.current = null; }
            if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
        };
    }, [trip, segments, isInProgress]);

    useEffect(() => {
        const t = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
        return () => clearTimeout(t);
    }, [isFullscreen]);

    const Legend = () => (
        <Box sx={{
            position: 'absolute', bottom: 56, left: 12, zIndex: 1000,
            bgcolor: 'rgba(20,20,35,0.92)', borderRadius: 2,
            p: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.08)',
        }}>
            {[
                { color: COLOR_COMPLETED, label: 'Пройдено', dash: false, gradient: false },
                { color: COLOR_ACTIVE, label: 'У дорозі', dash: false, gradient: true },
                { color: COLOR_PENDING, label: 'Очікує', dash: true, gradient: false },
            ].map(({ color, label, dash, gradient }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                    <Box sx={{
                        width: 28, height: 3, borderRadius: 1,
                        background: gradient
                            ? `linear-gradient(to right, ${COLOR_PENDING}, ${COLOR_ACTIVE})`
                            : dash
                                ? `repeating-linear-gradient(90deg,${color} 0,${color} 5px,transparent 5px,transparent 9px)`
                                : color,
                    }} />
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{label}</Typography>
                </Box>
            ))}
            {isInProgress && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, pt: 0.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLOR_ACTIVE, border: '2px solid rgba(255,255,255,0.7)', boxShadow: `0 0 6px ${COLOR_ACTIVE}` }} />
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Позиція рейсу</Typography>
                </Box>
            )}
        </Box>
    );

    const mapContent = (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            <Legend />

            <Tooltip title={isFullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'} placement="left">
                <IconButton onClick={toggleFullscreen} sx={{
                    position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
                    bgcolor: 'rgba(20,20,35,0.85)', color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    border: `1px solid ${alpha(mainColor, 0.4)}`, transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: mainColor, borderColor: mainColor, boxShadow: `0 4px 12px ${alpha(mainColor, 0.5)}` },
                }}>
                    {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                </IconButton>
            </Tooltip>

            {waybillPanel && (
                waybillPanel.loading
                    ? <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: { xs: '100%', sm: 500 }, bgcolor: '#1a1a2e', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, boxShadow: '-4px 0 24px rgba(0,0,0,0.4)' }}>
                        <CircularProgress sx={{ color: mainColor }} />
                    </Box>
                    : waybillPanel.data
                        ? <WaybillPanel data={waybillPanel.data} onClose={() => setWaybillPanel(null)} mainColor={mainColor} />
                        : null
            )}

            {(!isMapReady || routeLoading) && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(10,10,20,0.7)', zIndex: 1000, gap: 1.5 }}>
                    <CircularProgress size={32} sx={{ color: mainColor }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }} fontWeight={600}>
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