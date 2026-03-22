import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, alpha,
    Snackbar, Alert,
} from '@mui/material';
import { LocalShipping, TaskAlt } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import RouteListCard from '../components/courier/RouteListCard';

const mainColor = '#e91e63';

const TAB_STATUSES = {
    active: ['Сформовано', 'Видано кур\'єру', 'У процесі доставки'],
    archive: ['Завершено', 'Скасовано'],
};

const CourierPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('active');
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        DictionaryApi.getAll('payment-types', 0, 100)
            .then(r => setPaymentTypes(r.data.content || []))
            .catch(console.error);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await DictionaryApi.getAll('route-lists', 0, 50, {});
            const all = res.data.content || res.data || [];
            setItems(all.filter(r => TAB_STATUSES[tab].includes(r.statusName)));
        } catch {
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => { load(); }, [load]);

    const handleNotify = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const activeCount = items.filter(r => TAB_STATUSES.active.includes(r.statusName)).length;

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>

            <Box sx={{
                position: 'sticky', top: 0, zIndex: 10,
                background: `linear-gradient(135deg, ${mainColor}, ${alpha(mainColor, 0.85)})`,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.3)}`,
            }}>
                <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 2.5, md: 3 }, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: 2, display: 'flex' }}>
                            <LocalShipping sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="white" sx={{ lineHeight: 1.2 }}>
                                Мої маршрути
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                {activeCount > 0
                                    ? `${activeCount} активних завдань`
                                    : 'Немає активних завдань'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {[
                            { key: 'active', label: 'Активні' },
                            { key: 'archive', label: 'Архів' },
                        ].map(t => (
                            <Box
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                sx={{
                                    px: 2.5, py: 1,
                                    borderRadius: '12px 12px 0 0',
                                    cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                    color: tab === t.key ? mainColor : 'rgba(255,255,255,0.7)',
                                    bgcolor: tab === t.key ? 'background.paper' : 'transparent',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {t.label}
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ px: { xs: 2, md: 4 }, py: 2.5 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: mainColor }} />
                    </Box>
                ) : items.length === 0 ? (
                    <Box sx={{
                        textAlign: 'center', py: 8,
                        border: `2px dashed ${alpha(mainColor, 0.2)}`,
                        borderRadius: 3, mt: 1,
                    }}>
                        <TaskAlt sx={{ fontSize: 48, color: alpha(mainColor, 0.3), mb: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                            {tab === 'active'
                                ? 'Немає активних маршрутних листів'
                                : 'Архів порожній'}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                        gap: 2, width: '100%', alignItems: 'start',
                    }}>
                        {items.map(r => (
                            <RouteListCard
                                key={r.id}
                                routeList={r}
                                paymentTypes={paymentTypes}
                                onStatusChange={load}
                                onNotify={handleNotify}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CourierPage;