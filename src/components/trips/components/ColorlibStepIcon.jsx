import React from 'react';
import { Box, alpha } from '@mui/material';
import { DirectionsCar, Route, Schedule } from '@mui/icons-material';

const ICONS = {
    1: <DirectionsCar fontSize="small" />,
    2: <Route fontSize="small" />,
    3: <Schedule fontSize="small" />,
};

const ColorlibStepIcon = ({ active, completed, icon, mainColor }) => (
    <Box sx={{
        bgcolor: active || completed ? mainColor : '#e0e0e0',
        color: active || completed ? 'white' : '#aaa',
        width: 34, height: 34, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: active ? `0 0 0 4px ${alpha(mainColor, 0.2)}` : 'none',
    }}>
        {ICONS[String(icon)]}
    </Box>
);

export default ColorlibStepIcon;