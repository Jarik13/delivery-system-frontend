import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress,
    Box,
    alpha
} from '@mui/material';
import { DeleteForever, WarningAmber } from '@mui/icons-material';

const RouteListDeleteDialog = ({ open, onClose, onConfirm, item, loading }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { 
                    borderRadius: 3, 
                    width: '100%', 
                    maxWidth: 420 
                }
            }}
        >
            <DialogTitle sx={{ 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                color: 'error.main'
            }}>
                <WarningAmber />
                Видалити маршрутний лист?
            </DialogTitle>

            <DialogContent>
                <DialogContentText sx={{ color: 'text.primary', mb: 1.5 }}>
                    Ви впевнені, що хочете видалити <strong>ML-{item?.number}</strong>?
                </DialogContentText>
                <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                    border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                }}>
                    <DialogContentText variant="body2" sx={{ color: 'warning.dark', fontWeight: 500 }}>
                        Всі відправлення в ньому змінять статус на доступні для нового розподілу. Цю дію неможливо скасувати.
                    </DialogContentText>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
                <Button 
                    onClick={onClose} 
                    color="inherit" 
                    disabled={loading}
                    sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                    Скасувати
                </Button>
                <Button 
                    onClick={onConfirm} 
                    color="error" 
                    variant="contained" 
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DeleteForever />}
                    sx={{ 
                        fontWeight: 700, 
                        borderRadius: 2, 
                        textTransform: 'none',
                        px: 3,
                        boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                        '&:hover': {
                            bgcolor: 'error.dark',
                        }
                    }}
                >
                    {loading ? 'Видалення...' : 'Так, видалити'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RouteListDeleteDialog;