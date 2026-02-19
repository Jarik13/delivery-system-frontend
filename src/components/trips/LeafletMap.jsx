import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ trip }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!mapRef.current || !trip) return;

        let destroyed = false;
        let timerId = null;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        try {
            const map = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: false
            });
            mapInstanceRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            const allPoints = [];

            if (trip.originCoordinates?.latitude) {
                allPoints.push({
                    lat: trip.originCoordinates.latitude,
                    lng: trip.originCoordinates.longitude,
                    name: trip.originCity || 'Старт',
                    type: 'origin'
                });
            }

            if (Array.isArray(trip.waypointCoordinates)) {
                const sorted = [...trip.waypointCoordinates]
                    .sort((a, b) => (a.sequenceNumber ?? 999) - (b.sequenceNumber ?? 999));

                sorted.forEach((wp, index) => {
                    const isLast = index === sorted.length - 1;
                    const isDest = wp.latitude === trip.destinationCoordinates?.latitude &&
                        wp.longitude === trip.destinationCoordinates?.longitude;

                    if (wp.latitude && wp.longitude && !(isLast && isDest)) {
                        allPoints.push({
                            lat: wp.latitude,
                            lng: wp.longitude,
                            name: wp.cityName || `Зупинка ${index + 1}`,
                            type: 'waypoint'
                        });
                    }
                });
            }

            if (trip.destinationCoordinates?.latitude) {
                allPoints.push({
                    lat: trip.destinationCoordinates.latitude,
                    lng: trip.destinationCoordinates.longitude,
                    name: trip.destinationCity || 'Фініш',
                    type: 'destination'
                });
            }

            if (allPoints.length === 0) {
                map.setView([49.0, 31.0], 6);
            } else {
                const coords = allPoints.map(p => [p.lat, p.lng]);

                allPoints.forEach((point, idx) => {
                    let color = '#2196F3';
                    let label;

                    if (point.type === 'origin') {
                        color = '#4CAF50';
                        label = 'А';
                    } else if (point.type === 'destination') {
                        color = '#F44336';
                        label = 'Б';
                    } else {
                        const waypointIdx = allPoints
                            .slice(0, idx)
                            .filter(p => p.type === 'waypoint').length + 1;
                        label = String(waypointIdx);
                    }

                    const icon = L.divIcon({
                        html: `<div style="background:${color};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${label}</div>`,
                        className: '',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                    });

                    L.marker([point.lat, point.lng], { icon })
                        .addTo(map)
                        .bindPopup(`<b>${point.name}</b>`);
                });

                if (coords.length >= 2) {
                    L.polyline(coords, {
                        color: '#1976d2', weight: 3, opacity: 0.7, dashArray: '8, 8'
                    }).addTo(map);
                    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
                } else {
                    map.setView(coords[0], 12);
                }
            }

            timerId = setTimeout(() => {
                if (!destroyed && mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                    setIsMapReady(true);
                }
            }, 300);

        } catch (err) {
            console.error('Leaflet Map Error:', err);
            if (!destroyed) {
                setError(err.message);
                setIsMapReady(true);
            }
        }

        return () => {
            destroyed = true;
            if (timerId) clearTimeout(timerId);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [trip]);

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: '420px' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '420px' }} />

            {!isMapReady && !error && (
                <Box sx={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.9)', zIndex: 1000
                }}>
                    <CircularProgress size={30} />
                </Box>
            )}
        </Box>
    );
};

export default LeafletMap;