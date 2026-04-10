import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, alpha,
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

export function ConfirmDialog({ open, title, message, confirmLabel = 'Підтвердити', dangerous, onConfirm, onClose }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {dangerous && <WarningAmber sx={{ color: '#f44336' }} />}
                {title}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">{message}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined" size="small">Скасувати</Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    size="small"
                    sx={dangerous ? { bgcolor: '#f44336', '&:hover': { bgcolor: '#c62828' } } : {}}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;