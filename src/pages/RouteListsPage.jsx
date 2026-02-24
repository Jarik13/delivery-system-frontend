import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert, Button, Chip,
} from '@mui/material';
import { Assignment, Add } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import RouteListsTable from '../components/route-lists/RouteListsTable';
// import RouteListWizardDialog from '../components/route-lists/RouteListWizardDialog';

const RouteListsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['route-lists']] || '#673ab7';

    const [searchParams, setSearchParams] = useSearchParams();
    const highlightId = searchParams.get('highlight') ? Number(searchParams.get('highlight')) : null;
    const highlightRowRef = useRef(null);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [openWizard, setOpenWizard] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [references, setReferences] = useState({ statuses: [], couriers: [] });

    const defaultFilters = { number: '', courierId: '', statusId: '' };
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        const loadRefs = async () => {
            try {
                const [s, c] = await Promise.all([
                    DictionaryApi.getAll('route-list-statuses', 0, 100),
                    DictionaryApi.getAll('couriers', 0, 1000),
                ]);
                setReferences({
                    statuses: s.data.content || [],
                    couriers: c.data.content || [],
                });
            } catch (e) { console.error(e); }
        };
        loadRefs();
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );
            const res = await DictionaryApi.getAll('route-lists', page, rowsPerPage, activeFilters);
            setItems(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        if (!highlightId || loading) return;
        const timer = setTimeout(() => {
            highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
        return () => clearTimeout(timer);
    }, [highlightId, loading, items]);

    useEffect(() => {
        if (!highlightId || loading || items.length === 0) return;
        const found = items.find(i => i.id === highlightId);
        if (!found) {
            setNotification({
                open: true,
                message: `Маршрутний лист #${highlightId} не знайдено на цій сторінці. Спробуйте пошук.`,
                severity: 'info',
            });
        }
    }, [highlightId, items, loading]);

    const handleToggle = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleToggleAll = () => {
        setSelectedIds(prev =>
            prev.size === items.length ? new Set() : new Set(items.map(i => i.id))
        );
    };

    const filterFields = [
        { name: 'number', label: 'Номер листа', type: 'text' },
        { name: 'statusId', label: 'Статус', type: 'select', options: references.statuses },
        { name: 'courierId', label: 'Кур\'єр', type: 'select', options: references.couriers },
    ];

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                mb: 2, borderRadius: 3, overflow: 'hidden', position: 'relative',
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                <Box sx={{
                    p: 2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                            <Assignment fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Маршрутні листи</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                                Керування чергою доставки та кур'єрами
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {highlightId && !loading && (
                            <Chip
                                label={`↓ Маршрутний лист #${highlightId}`}
                                size="small"
                                onDelete={() => setSearchParams({})}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.25)', color: 'white',
                                    fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)',
                                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' },
                                }}
                            />
                        )}

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => setOpenWizard(true)}
                            sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                            Сформувати маршрут
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={() => { setFilters(defaultFilters); setPage(0); }}
                fields={filterFields}
                searchPlaceholder="Пошук листа за номером..."
                quickFilters={['statusId']}
                accentColor={mainColor}
            />

            <RouteListsTable
                items={items}
                loading={loading}
                mainColor={mainColor}
                selected={[...selectedIds]}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
                highlightId={highlightId}
                highlightRowRef={highlightRowRef}
            />

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Листів:"
            />

            {/* <RouteListWizardDialog
                open={openWizard}
                onClose={() => setOpenWizard(false)}
                mainColor={mainColor}
                onSuccess={(msg) => { load(); setNotification({ open: true, message: msg, severity: 'success' }); }}
            /> */}

            <Snackbar
                open={notification.open} autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default RouteListsPage;