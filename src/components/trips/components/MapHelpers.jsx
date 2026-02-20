import { useEffect, useRef, useCallback } from 'react';
import { useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

export const MapClickHandler = ({ onMapClick }) => {
    const map = useMap();
    useEffect(() => {
        const handler = (e) => onMapClick(e.latlng);
        map.on('click', handler);
        return () => map.off('click', handler);
    }, [map, onMapClick]);
    return null;
};

export const MapBoundsUpdater = ({ coords, disabled }) => {
    const map = useMap();
    useEffect(() => {
        if (disabled || !coords || coords.length === 0) return;
        if (coords.length === 1) { map.setView([coords[0].lat, coords[0].lng], 10); }
        else { map.fitBounds(L.latLngBounds(coords.map(c => [c.lat, c.lng])), { padding: [40, 40] }); }
    }, [JSON.stringify(coords), disabled]);
    return null;
};

export const MapInvalidateSize = ({ trigger }) => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }, [trigger, map]);
    return null;
};

export const LivePolyline = ({ coords, markerRefs, draggingSegId, color }) => {
    const map = useMap();
    const polylineRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const poly = L.polyline([], { color, weight: 3, dashArray: '6 4' }).addTo(map);
        polylineRef.current = poly;
        return () => {
            cancelAnimationFrame(rafRef.current);
            poly.remove();
            polylineRef.current = null;
        };
    }, [map]);

    useEffect(() => {
        polylineRef.current?.setStyle({ color });
    }, [color]);

    useEffect(() => {
        cancelAnimationFrame(rafRef.current);
        if (!polylineRef.current) return;

        if (coords.length < 2) {
            polylineRef.current.setLatLngs([]);
            return;
        }

        if (!draggingSegId) {
            polylineRef.current.setLatLngs(coords.map(c => [c.lat, c.lng]));
            return;
        }

        const animate = () => {
            if (!polylineRef.current) return;
            const latlngs = coords.map(c => {
                if (c.segId === draggingSegId) {
                    const marker = markerRefs.current[draggingSegId];
                    if (marker) return marker.getLatLng();
                }
                return [c.lat, c.lng];
            });
            polylineRef.current.setLatLngs(latlngs);
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(rafRef.current);
    }, [coords, draggingSegId]);

    return null;
};


export const DraggableMarker = ({
    segId, position, icon,
    draggable = true,
    markerRefs,
    onDragStart,
    onDragEnd,
}) => {
    const markerRef = useRef(null);
    const isDragging = useRef(false);

    const handleRef = useCallback((instance) => {
        markerRef.current = instance;

        if (!markerRefs) return;

        if (instance) {
            markerRefs.current[segId] = instance;

            if (draggable && instance.dragging) {
                instance.dragging.enable();
            }
        } else {
            delete markerRefs.current[segId];
        }
    }, [segId, markerRefs, draggable]);

    useEffect(() => {
        if (!isDragging.current && markerRef.current) {
            markerRef.current.setLatLng(position);
        }
    }, [position[0], position[1]]);

    const eventHandlers = draggable ? {
        dragstart: () => {
            isDragging.current = true;
            onDragStart?.(segId);
        },
        dragend: () => {
            isDragging.current = false;
            const ll = markerRef.current?.getLatLng();
            if (ll) onDragEnd?.(segId, ll);
        },
    } : {};

    return (
        <Marker
            ref={handleRef}
            position={position}
            icon={icon}
            draggable={draggable}
            eventHandlers={eventHandlers}
        />
    );
};