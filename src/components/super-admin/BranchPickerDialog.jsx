import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import RouteBranchSelector from '../RouteBranchSelector';

const BranchPickerDialog = ({ open, onSelect, onClose }) => {
    const [cityId, setCityId] = useState('');
    const [branchId, setBranchId] = useState('');

    const handleConfirm = () => {
        if (branchId) {
            onSelect(branchId);
            setCityId('');
            setBranchId('');
        }
    };

    const handleClose = () => {
        setCityId('');
        setBranchId('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
                Обрати відділення
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <RouteBranchSelector
                    cityId={cityId}
                    branchId={branchId}
                    onCityChange={setCityId}
                    onBranchChange={setBranchId}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={handleClose}
                    sx={{ textTransform: 'none', color: '#64748b' }}>
                    Скасувати
                </Button>
                <Button onClick={handleConfirm} disabled={!branchId} variant="contained"
                    sx={{
                        textTransform: 'none', fontWeight: 600,
                        bgcolor: '#673ab7', '&:hover': { bgcolor: '#512da8' }, borderRadius: 2,
                    }}>
                    Обрати
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BranchPickerDialog;