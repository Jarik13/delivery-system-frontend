import React from 'react';
import { AppBar, Toolbar, Typography, Box, CssBaseline } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AppRoutes from './components/AppRoutes';
import { useAuth } from './context/AuthContext';

const FULLSCREEN_ROUTES = ['/courier'];

function App() {
    const { auth } = useAuth();
    const location = useLocation();
    const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            {auth && !isFullscreen && (
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar>
                        <Typography variant="h6" noWrap component="div">
                            Delivery System Admin
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}
            {auth && !isFullscreen && <Sidebar />}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: auth && !isFullscreen ? 3 : 0,
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                {auth && !isFullscreen && <Toolbar />}
                <AppRoutes />
            </Box>
        </Box>
    );
}

export default App;