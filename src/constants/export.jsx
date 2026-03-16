import React from 'react';
import { TableChart, PictureAsPdf, Description, DataObject } from '@mui/icons-material';

export const EXPORT_FORMATS = [
    { key: 'xlsx', label: 'Excel (.xlsx)', ext: 'xlsx', icon: <TableChart sx={{ color: '#217346' }} /> },
    { key: 'csv',  label: 'CSV (.csv)',    ext: 'csv',  icon: <Description sx={{ color: '#f57c00' }} /> },
    { key: 'pdf',  label: 'PDF (.pdf)',    ext: 'pdf',  icon: <PictureAsPdf sx={{ color: '#d32f2f' }} /> },
    { key: 'json', label: 'JSON (.json)',  ext: 'json', icon: <DataObject sx={{ color: '#1565c0' }} /> },
];

export const NO_PROGRESS = {
    active: false, percent: 0, loaded: 0,
    total: 0, speed: 0, eta: null, label: '',
};

export const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 Б';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} КБ`;
    return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
};

export const formatEta = (seconds) => {
    if (!seconds || !isFinite(seconds) || seconds <= 0) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m} хв ${s} с` : `${s} с`;
};