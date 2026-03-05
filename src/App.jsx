import React from 'react';
import { AppBar, Toolbar, Typography, Box, CssBaseline } from '@mui/material';
import Sidebar from './components/Sidebar';
import AppRoutes from './components/AppRoutes';
import { useAuth } from './context/AuthContext';

function App() {
    const { auth } = useAuth();

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            {auth && (
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar>
                        <Typography variant="h6" noWrap component="div">
                            Delivery System Admin
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}
            {auth && <Sidebar />}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: auth ? 3 : 0,
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                {auth && <Toolbar />}
                <AppRoutes />
            </Box>
        </Box>
    );
}

export default App;