import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert, Button, Chip, Tabs, Tab,
} from '@mui/material';
import { Assignment, Add, FlashOn, Archive } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import RouteListsTable from '../components/route-lists/RouteListsTable';
import RouteListWizardDialog from '../components/route-lists/RouteListWizardDialog';

const ARCHIVE_ROUTE_LIST_STATUSES = ['Завершено', 'Скасовано'];

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
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const defaultFilters = {
        number: '',
        courierId: '',
        statuses: [],
        totalWeightMin: 0,
        totalWeightMax: 30,
    };
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        const loadRefs = async () => {
            try {
                const [s, c, statsRes] = await Promise.all([
                    DictionaryApi.getAll('route-list-statuses', 0, 100),
                    DictionaryApi.getAll('couriers', 0, 1000),
                    DictionaryApi.getStatistics('route-lists'),
                ]);
                setReferences({
                    statuses: s.data.content || [],
                    couriers: c.data.content || [],
                });
                if (statsRes.data) {
                    const d = statsRes.data;
                    setStats(d);
                    setFilters(prev => ({
                        ...prev,
                        totalWeightMin: d.totalWeightMin ?? 0,
                        totalWeightMax: d.totalWeightMax ?? 30,
                    }));
                }
            } catch (e) { console.error(e); }
        };
        loadRefs();
    }, []);

    const getTabStatusIds = useCallback(() => {
        if (filters.statuses.length > 0) return null;
        const archiveIds = references.statuses
            .filter(s => ARCHIVE_ROUTE_LIST_STATUSES.includes(s.name))
            .map(s => s.id);
        const activeIds = references.statuses
            .filter(s => !ARCHIVE_ROUTE_LIST_STATUSES.includes(s.name))
            .map(s => s.id);
        return activeTab === 0 ? activeIds : archiveIds;
    }, [activeTab, references.statuses, filters.statuses]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => {
                    if (Array.isArray(v)) return v.length > 0;
                    return v !== '' && v !== null;
                })
            );

            const tabStatusIds = getTabStatusIds();
            if (tabStatusIds && tabStatusIds.length > 0) {
                activeFilters.statuses = tabStatusIds;
            }

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
    }, [page, rowsPerPage, filters, getTabStatusIds]);

    const handleClear = () => {
        setFilters({
            ...defaultFilters,
            totalWeightMin: stats?.totalWeightMin ?? 0,
            totalWeightMax: stats?.totalWeightMax ?? 30,
        });
        setPage(0);
    };

    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
        setPage(0);
        setFilters(prev => ({ ...prev, statuses: [] }));
    };

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

    const tabStatuses = references.statuses.filter(s =>
        activeTab === 0 ? !ARCHIVE_ROUTE_LIST_STATUSES.includes(s.name) : ARCHIVE_ROUTE_LIST_STATUSES.includes(s.name)
    );

    const filterFields = [
        { name: 'number', label: 'Номер листа', type: 'text' },
        { name: 'statuses', label: 'Статус', type: 'checkbox-group', options: tabStatuses },
        {
            name: 'courierId',
            label: 'Кур\'єр',
            type: 'select',
            options: references.couriers.map(c => ({
                ...c,
                name: `${c.lastName || ''} ${c.firstName || ''} ${c.middleName || ''}`.trim() || `Кур'єр №${c.id}`
            })),
        },
        {
            name: 'totalWeightRange',
            label: 'Вага (кг)',
            type: 'range',
            minName: 'totalWeightMin',
            maxName: 'totalWeightMax',
            min: stats?.totalWeightMin ?? 0,
            max: stats?.totalWeightMax ?? 30,
        },
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
                                {activeTab === 0 ? 'Активні листи та поточні доставки' : 'Архів завершених та скасованих листів'}
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

                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        bgcolor: alpha(mainColor, 0.05),
                        borderBottom: `1px solid ${alpha(mainColor, 0.15)}`,
                        '& .MuiTab-root': { fontWeight: 600, minHeight: 48 },
                        '& .Mui-selected': { color: mainColor },
                        '& .MuiTabs-indicator': { bgcolor: mainColor },
                    }}
                >
                    <Tab icon={<FlashOn fontSize="small" />} iconPosition="start" label="Активні" />
                    <Tab icon={<Archive fontSize="small" />} iconPosition="start" label="Архівні" />
                </Tabs>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={handleClear}
                fields={filterFields}
                searchPlaceholder="Пошук листа за номером..."
                accentColor={mainColor}
                counts={{
                    total: totalElements,
                    ...(stats?.countByStatus
                        ? Object.fromEntries(
                            Object.entries(stats.countByStatus).map(([id, count]) => [`statuses_${id}`, count])
                        )
                        : {}),
                }}
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

            <RouteListWizardDialog
                open={openWizard}
                onClose={() => setOpenWizard(false)}
                onSuccess={() => { setOpenWizard(false); load(); }}
                mainColor={mainColor}
                references={references}
            />

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