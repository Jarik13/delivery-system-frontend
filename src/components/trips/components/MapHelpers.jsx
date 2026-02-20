import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
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

export const MapBoundsUpdater = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (!coords || coords.length === 0) return;
        if (coords.length === 1) { map.setView([coords[0].lat, coords[0].lng], 10); }
        else { map.fitBounds(L.latLngBounds(coords.map(c => [c.lat, c.lng])), { padding: [40, 40] }); }
    }, [JSON.stringify(coords)]);
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