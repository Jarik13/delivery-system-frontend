import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { 
    AppBar, Toolbar, Typography, Box, CssBaseline 
} from '@mui/material';
import Sidebar from './components/Sidebar';
import AppRoutes from './components/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Delivery System Admin
            </Typography>
          </Toolbar>
        </AppBar>

        <Sidebar />

        <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
          <Toolbar />
          <AppRoutes />
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;