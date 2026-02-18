import React from 'react';
import { Chip, alpha } from '@mui/material';
import { 
    RadioButtonUnchecked, PendingActions, LocalShipping, 
    MoveToInbox, CheckCircle, WarningAmber 
} from '@mui/icons-material';

const STATUS_CONFIG = {
    'Заплановано': { color: '#1976d2', bg: '#e3f2fd', icon: <RadioButtonUnchecked sx={{ fontSize: 13 }} /> },
    'Завантаження': { color: '#00bcd4', bg: '#e0f7fa', icon: <PendingActions sx={{ fontSize: 13 }} /> },
    'В дорозі': { color: '#f57c00', bg: '#fff3e0', icon: <LocalShipping sx={{ fontSize: 13 }} /> },
    'Розвантаження': { color: '#673ab7', bg: '#ede7f6', icon: <MoveToInbox sx={{ fontSize: 13 }} /> },
    'Завершено': { color: '#388e3c', bg: '#e8f5e9', icon: <CheckCircle sx={{ fontSize: 13 }} /> },
    'Аварійна зупинка': { color: '#d32f2f', bg: '#ffebee', icon: <WarningAmber sx={{ fontSize: 13 }} /> },
};

const StatusChip = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { color: '#666', bg: '#f5f5f5', icon: null };
    return (
        <Chip
            icon={cfg.icon}
            label={status}
            size="small"
            sx={{
                bgcolor: cfg.bg, color: cfg.color,
                fontWeight: 700, fontSize: '0.7rem',
                border: `1px solid ${alpha(cfg.color, 0.3)}`,
                height: 24
            }}
        />
    );
};

export default StatusChip;