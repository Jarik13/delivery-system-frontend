import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, TextField, Button,
    Alert, CircularProgress, InputAdornment, IconButton, alpha,
    Container, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Link
} from '@mui/material';
import { 
    LocalShipping, Visibility, VisibilityOff, 
    Login, Email, LockOutlined, CheckCircle 
} from '@mui/icons-material';
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

    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotError, setForgotError] = useState('');

    const handleSubmit = async () => {
        if (!email || !password) { 
            setError('Заповніть всі поля'); 
            return; 
        }
        setLoading(true);
        setError('');
        try {
            const { data } = await AuthApi.login(email, password);
            login(data);
            if (data.role === 'ROLE_SUPER_ADMIN') navigate('/super-admin');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Невірний email або пароль');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail) return;
        setForgotLoading(true);
        setForgotError('');
        try {
            await AuthApi.forgotPassword(forgotEmail);
            setForgotSuccess(true);
        } catch (err) {
            setForgotError('Користувача з таким email не знайдено');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleCloseForgot = () => {
        setForgotOpen(false);
        setForgotSuccess(false);
        setForgotEmail('');
        setForgotError('');
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
                            <Typography variant="body1" sx={{ color: alpha('#fff', 0.6) }}>
                                Введіть дані для доступу до системи
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" variant="filled" sx={{ borderRadius: 3, bgcolor: alpha('#ef4444', 0.8) }}>
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
                                sx={inputStyles}
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
                                sx={{ ...inputStyles, mb: 1 }}
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

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                                <Link
                                    component="button"
                                    type="button"
                                    variant="body2"
                                    onClick={() => { setForgotOpen(true); }}
                                    sx={{ 
                                        color: '#6366f1', 
                                        textDecoration: 'none', 
                                        fontWeight: 600,
                                        '&:hover': { color: '#a855f7' }
                                    }}
                                >
                                    Забули пароль?
                                </Link>
                            </Box>

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={buttonStyles}
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
                    sx={{ mt: 4, textAlign: 'center', color: alpha('#fff', 0.4), fontWeight: 500 }}
                >
                    &copy; {new Date().getFullYear()} Delivery System. Всі права захищені.
                </Typography>
            </Container>

            <Dialog 
                open={forgotOpen} 
                onClose={handleCloseForgot}
                PaperProps={{
                    sx: { 
                        borderRadius: 5, 
                        bgcolor: '#1e293b', 
                        color: 'white',
                        backgroundImage: 'none',
                        maxWidth: 400
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, pt: 3 }}>Скидання пароля</DialogTitle>
                <DialogContent>
                    {!forgotSuccess ? (
                        <>
                            <Typography sx={{ mb: 3, color: alpha('#fff', 0.7), fontSize: '0.95rem' }}>
                                Введіть ваш email, і ми надішлемо вам інструкції для створення нового пароля.
                            </Typography>
                            {forgotError && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{forgotError}</Alert>
                            )}
                            <TextField
                                fullWidth
                                placeholder="Email"
                                value={forgotEmail}
                                onChange={e => setForgotEmail(e.target.value)}
                                sx={inputStyles}
                            />
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <CheckCircle sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
                            <Typography variant="h6" fontWeight="700" sx={{ mb: 1 }}>Перевірте пошту</Typography>
                            <Typography sx={{ color: alpha('#fff', 0.7) }}>
                                Ми надіслали інструкції для скидання на <strong>{forgotEmail}</strong>
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={handleCloseForgot} sx={{ color: alpha('#fff', 0.5), textTransform: 'none' }}>
                        Закрити
                    </Button>
                    {!forgotSuccess && (
                        <Button
                            variant="contained"
                            disabled={forgotLoading || !forgotEmail}
                            onClick={handleForgotPassword}
                            sx={{ 
                                ...buttonStyles, 
                                height: 44, 
                                px: 4,
                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' 
                            }}
                        >
                            {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Надіслати'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const inputStyles = {
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
};

const buttonStyles = {
    height: 56,
    borderRadius: 3,
    textTransform: 'none',
    fontSize: '1.05rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        transform: 'translateY(-2px)',
        filter: 'brightness(1.1)',
        boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)',
    },
    '&.Mui-disabled': {
        background: alpha('#6366f1', 0.3),
        color: alpha('#fff', 0.5)
    }
};

export default LoginPage;