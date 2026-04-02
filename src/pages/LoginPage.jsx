import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, TextField, Button,
    Alert, CircularProgress, InputAdornment, IconButton, alpha,
    Container, Stack
} from '@mui/material';
import { LocalShipping, Visibility, VisibilityOff, Login, Email, LockOutlined } from '@mui/icons-material';
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
            if (data.role === 'ROLE_SUPER_ADMIN') navigate('/super-admin');
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
            bgcolor: '#0f172a',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <Box sx={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
                top: '-100px',
                right: '-100px',
                zIndex: 0,
            }} />
            <Box sx={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0) 70%)',
                bottom: '-150px',
                left: '-150px',
                zIndex: 0,
            }} />

            <Container maxWidth="sm" sx={{ zIndex: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, sm: 6 },
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <Stack spacing={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2.5,
                                boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)',
                            }}>
                                <LocalShipping sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Typography variant="h4" fontWeight="800" sx={{ color: 'white', mb: 1, letterSpacing: '-0.02em' }}>
                                Вітаємо знову
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'slate.400', color: alpha('#fff', 0.6) }}>
                                Введіть дані для доступу до системи
                            </Typography>
                        </Box>

                        {error && (
                            <Alert
                                severity="error"
                                variant="filled"
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: alpha('#ef4444', 0.8),
                                    '& .MuiAlert-icon': { color: 'white' }
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Box component="form" noValidate>
                            <TextField
                                fullWidth
                                placeholder="Ваш email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                sx={{
                                    mb: 2.5,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        borderRadius: 3,
                                        bgcolor: alpha('#fff', 0.05),
                                        transition: '0.3s',
                                        '& fieldset': { borderColor: alpha('#fff', 0.1) },
                                        '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
                                        '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: alpha('#fff', 0.4), fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                placeholder="Пароль"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                sx={{
                                    mb: 4,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        borderRadius: 3,
                                        bgcolor: alpha('#fff', 0.05),
                                        transition: '0.3s',
                                        '& fieldset': { borderColor: alpha('#fff', 0.1) },
                                        '&:hover fieldset': { borderColor: alpha('#fff', 0.2) },
                                        '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlined sx={{ color: alpha('#fff', 0.4), fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(p => !p)}
                                                edge="end"
                                                sx={{ color: alpha('#fff', 0.4) }}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={{
                                    height: 56,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontSize: '1.05rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4)',
                                        transform: 'translateY(-2px)',
                                        filter: 'brightness(1.1)',
                                    },
                                    '&:active': {
                                        transform: 'translateY(0)',
                                    },
                                    '&.Mui-disabled': {
                                        background: alpha('#6366f1', 0.3),
                                        color: alpha('#fff', 0.5)
                                    }
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography fontWeight="700">Увійти в систему</Typography>
                                        <Login fontSize="small" />
                                    </Stack>
                                )}
                            </Button>
                        </Box>
                    </Stack>
                </Paper>

                <Typography
                    variant="body2"
                    sx={{
                        mt: 4,
                        textAlign: 'center',
                        color: alpha('#fff', 0.4),
                        fontWeight: 500
                    }}
                >
                    &copy; {new Date().getFullYear()} Delivery System. Всі права захищені.
                </Typography>
            </Container>
        </Box>
    );
};

export default LoginPage;