import React, { useState } from 'react';
import {
    Box, Paper, Typography, Tabs, Tab, alpha,
    IconButton, Tooltip, CircularProgress
} from '@mui/material';
import {
    AdminPanelSettings, OpenInNew, Refresh,
    Dashboard, Search, BarChart, Settings
} from '@mui/icons-material';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const KIBANA_URL = 'http://localhost:5601';

const KIBANA_TABS = [
    {
        label: 'Дашборди',
        icon: <Dashboard fontSize="small" />,
        path: '/app/dashboards',
    },
    {
        label: 'Discover',
        icon: <Search fontSize="small" />,
        path: '/app/discover',
    },
    {
        label: 'Візуалізації',
        icon: <BarChart fontSize="small" />,
        path: '/app/visualize',
    },
    {
        label: 'Управління',
        icon: <Settings fontSize="small" />,
        path: '/app/management',
    },
];

const AdminPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['admin']] || '#f44336';
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [key, setKey] = useState(0);

    const currentPath = KIBANA_TABS[activeTab].path;
    const iframeSrc = `${KIBANA_URL}${currentPath}`;

    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
        setLoading(true);
    };

    const handleRefresh = () => {
        setKey(prev => prev + 1);
        setLoading(true);
    };

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Шапка */}
            <Paper elevation={0} sx={{
                mb: 2, borderRadius: 3, overflow: 'hidden',
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                <Box sx={{
                    p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                            <AdminPanelSettings fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Адмін-панель</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Аналітика та керування системою через Kibana
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Оновити">
                            <IconButton onClick={handleRefresh} sx={{ color: 'white' }}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Відкрити Kibana у новій вкладці">
                            <IconButton
                                onClick={() => window.open(iframeSrc, '_blank')}
                                sx={{ color: 'white' }}
                            >
                                <OpenInNew />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        bgcolor: alpha(mainColor, 0.05),
                        borderBottom: `1px solid ${alpha(mainColor, 0.15)}`,
                        '& .MuiTab-root': { fontWeight: 600, minHeight: 48 },
                        '& .Mui-selected': { color: mainColor },
                        '& .MuiTabs-indicator': { bgcolor: mainColor },
                    }}
                >
                    {KIBANA_TABS.map((tab, idx) => (
                        <Tab
                            key={idx}
                            icon={tab.icon}
                            iconPosition="start"
                            label={tab.label}
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* iframe */}
            <Paper elevation={0} sx={{
                flex: 1,
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${alpha(mainColor, 0.15)}`,
                position: 'relative',
                minHeight: 'calc(100vh - 220px)',
            }}>
                {loading && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'white', zIndex: 10,
                    }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress sx={{ color: mainColor }} />
                            <Typography variant="body2" color="text.secondary">
                                Завантаження Kibana...
                            </Typography>
                        </Box>
                    </Box>
                )}
                <iframe
                    key={key}
                    src={iframeSrc}
                    style={{
                        width: '100%',
                        height: '100%',
                        minHeight: 'calc(100vh - 220px)',
                        border: 'none',
                        display: 'block',
                    }}
                    onLoad={() => setLoading(false)}
                    title="Kibana Analytics"
                />
            </Paper>
        </Box>
    );
};

export default AdminPage;