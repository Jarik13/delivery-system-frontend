import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#263238',
    },
    secondary: {
      main: '#0288d1',
      contrastText: '#fff',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1c2429',
      secondary: '#637381',
    },
  },
  shape: {
    borderRadius: 8,
  },

  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          boxShadow: '0px 1px 8px rgba(0,0,0,0.1)',
          color: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
          },
        },
        containedSecondary: {
            backgroundColor: '#0077c2',
        }
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f9fafb',
          color: '#637381',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export default theme;