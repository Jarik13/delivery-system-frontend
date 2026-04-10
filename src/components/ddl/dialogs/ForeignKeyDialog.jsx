import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Tabs, Tab } from '@mui/material';
import AddForeignKeyTab from './AddForeignKeyTab';
import ExistingForeignKeysTab from './ExistingForeignKeysTab';

export default function ForeignKeyDialog({ open, onClose, tableName, mainColor }) {
    const [tab, setTab] = useState(0);
    const [message, setMessage] = useState({ text: '', error: false });

    const handleSuccess = (text) => { setMessage({ text, error: false }); setTab(1); };
    const handleError = (text) => setMessage({ text, error: true });

    useEffect(() => { if (!open) { setMessage({ text: '', error: false }); setTab(0); } }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle><Typography variant="h6" fontWeight={700}>Зовнішні ключі — <span style={{ color: mainColor }}>{tableName}</span></Typography></DialogTitle>
            <Box sx={{ px: 3, borderBottom: '1px solid #eee' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .Mui-selected': { color: mainColor }, '& .MuiTabs-indicator': { bgcolor: mainColor } }}>
                    <Tab label="Додати FK" /><Tab label="Існуючі FK" />
                </Tabs>
            </Box>
            <DialogContent>
                {message.text && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: message.error ? 'error.main' : 'success.main', fontWeight: 600 }}>
                        {message.text}
                    </Typography>
                )}
                {tab === 0 ? (
                    <AddForeignKeyTab tableName={tableName} mainColor={mainColor} onSuccess={handleSuccess} onError={handleError} />
                ) : (
                    <ExistingForeignKeysTab tableName={tableName} mainColor={mainColor} onSuccess={handleSuccess} onError={handleError} />
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} variant="outlined" size="small">Закрити</Button></DialogActions>
        </Dialog>
    );
}