import React from 'react';
import { Box } from '@mui/material';
import { Person, Inventory2 } from '@mui/icons-material';

const ICONS = [Person, Inventory2];

export default function ColorlibStepIcon({ active, completed, icon, mainColor }) {
    const Ic = ICONS[(icon - 1)] ?? Person;
    return (
        <Box sx={{
            width: 40, height: 40, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: completed || active
                ? `linear-gradient(135deg, ${mainColor}, ${mainColor}cc)`
                : '#e0e0e0',
            boxShadow: active ? `0 4px 14px ${mainColor}55` : 'none',
            transition: 'all .3s',
        }}>
            <Ic sx={{ fontSize: 20, color: completed || active ? 'white' : '#999' }} />
        </Box>
    );
}