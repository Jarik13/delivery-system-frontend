import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, TextField, Button,
    Alert, CircularProgress, InputAdornment, IconButton, alpha,
} from '@mui/material';
import { LocalShipping, Visibility, VisibilityOff, Login } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { AuthApi } from '../api/dictionaries';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) { setError('Заповніть всі поля'); return; }
        setLoading(true);
        setError('');
        try {
            const { data } = await AuthApi.login(email, password);
            login(data);
            if (data.role === 'ROLE_SUPER_ADMIN') navigate('/admin');
            else navigate('/');
        } catch {
            setError('Невірний email або пароль');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Декоративні кола на фоні */}
            {[...Array(3)].map((_, i) => (
                <Box key={i} sx={{
                    position: 'absolute',
                    width: 300 + i * 150,
                    height: 300 + i * 150,
                    borderRadius: '50%',
                    border: '1px solid rgba(103,58,183,0.15)',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                }} />
            ))}

            <Paper elevation={0} sx={{
                width: 440,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Шапка */}
                <Box sx={{
                    p: 4, pb: 3,
                    background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)',
                    color: 'white',
                    textAlign: 'center',
                }}>
                    <Box sx={{
                        bgcolor: 'rgba(255,255,255,0.15)',
                        width: 72, height: 72,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}>
                        <LocalShipping sx={{ fontSize: 36 }} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                        Delivery System
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        Система управління логістикою
                    </Typography>
                </Box>

                {/* Форма */}
                <Box sx={{ p: 4 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        sx={{ mb: 2 }}
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Пароль"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        sx={{ mb: 3 }}
                        slotProps={{
                            inputLabel: { shrink: true },
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(p => !p)} edge="end" size="small">
                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading
                            ? <CircularProgress size={18} color="inherit" />
                            : <Login />
                        }
                        sx={{
                            bgcolor: '#673ab7',
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 700,
                            fontSize: 15,
                            textTransform: 'none',
                            boxShadow: `0 4px 16px ${alpha('#673ab7', 0.4)}`,
                            '&:hover': {
                                bgcolor: '#512da8',
                                boxShadow: `0 6px 20px ${alpha('#673ab7', 0.5)}`,
                            },
                        }}
                    >
                        {loading ? 'Вхід...' : 'Увійти'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default LoginPage;