import React from 'react';
import { Chip, alpha } from '@mui/material';
import { TRIP_STATUS_CONFIG } from '../../constants/statusColors';

const StatusChip = ({ status }) => {
    const cfg = TRIP_STATUS_CONFIG[status] ?? TRIP_STATUS_CONFIG['default'];
    const Icon = cfg.icon;

    return (
        <Chip
            icon={Icon ? <Icon sx={{ fontSize: '13px !important' }} /> : undefined}
            label={status}
            size="small"
            sx={{
                bgcolor: alpha(cfg.color, 0.12),
                color: cfg.color,
                fontWeight: 700,
                fontSize: '0.7rem',
                border: `1px solid ${alpha(cfg.color, 0.3)}`,
                height: 24,
            }}
        />
    );
};

export default StatusChip;