import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert, Button, Chip, Tabs, Tab,
    Menu, MenuItem, ListItemIcon, ListItemText, Divider, LinearProgress, Tooltip,
} from '@mui/material';
import {
    Assignment, Add, FlashOn, Archive, FileDownload, Close
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import RouteListsTable from '../components/route-lists/RouteListsTable';
import RouteListWizardDialog from '../components/route-lists/RouteListWizardDialog';
import AddShipmentDialog from '../components/route-lists/AddShipmentDialog';
import RouteListEditDialog from '../components/route-lists/RouteListEditDialog';
import RouteListDeleteDialog from '../components/route-lists/RouteListDeleteDialog';
import { EXPORT_FORMATS, NO_PROGRESS, formatBytes, formatEta } from '../constants/export';

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
    const [exportAnchor, setExportAnchor] = useState(null);
    const [progress, setProgress] = useState(NO_PROGRESS);

    const [addShipmentRouteList, setAddShipmentRouteList] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [sortField, setSortField] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const abortRef = useRef(null);
    const statsRef = useRef({ startTime: 0, lastLoaded: 0, lastTime: 0 });

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
                    couriers: c.data.content || c.data || [],
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

            const params = {
                ...activeFilters,
                ...(sortField ? { sort: `${sortField},${sortDir}` } : {}),
            };

            const res = await DictionaryApi.getAll('route-lists', page, rowsPerPage, params);
            setItems(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            setNotification({ open: true, message: 'Помилка завантаження', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters, getTabStatusIds, sortField, sortDir]);

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
        setSortField(null);
        setSortDir('asc');
        setFilters(prev => ({ ...prev, statuses: [] }));
    };

    const handleSortChange = ({ field, dir }) => {
        setSortField(field);
        setSortDir(dir);
        setPage(0);
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

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await DictionaryApi.delete('route-lists', deleteItem.id);
            setNotification({ open: true, message: `Лист ML-${deleteItem.number} видалено`, severity: 'success' });
            load();
        } catch (e) {
            setNotification({ open: true, message: 'Помилка при видаленні', severity: 'error' });
        } finally {
            setDeleting(false);
            setDeleteItem(null);
        }
    };

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

    const clearSelection = () => setSelectedIds(new Set());
    const cancelExport = () => { abortRef.current?.abort(); setProgress(NO_PROGRESS); };

    const handleExport = async (fmt) => {
        setExportAnchor(null);
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        statsRef.current = { startTime: Date.now(), lastLoaded: 0, lastTime: Date.now() };
        setProgress({ ...NO_PROGRESS, active: true, percent: null, label: fmt.label });

        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => {
                    if (Array.isArray(v)) return v.length > 0;
                    return v !== '' && v !== null;
                })
            );
            const exportParams = selectedIds.size > 0
                ? { format: fmt.key, ids: [...selectedIds].join(',') }
                : { format: fmt.key, ...activeFilters };

            const res = await DictionaryApi.exportFile('route-lists/export', exportParams, {
                signal: abortRef.current.signal,
                onDownloadProgress: (e) => {
                    const { loaded, total: rawTotal } = e;
                    const total = rawTotal || 0;
                    const now = Date.now();
                    const { startTime, lastLoaded, lastTime } = statsRef.current;
                    const dtMs = now - lastTime;
                    const speed = dtMs > 50 ? ((loaded - lastLoaded) / dtMs) * 1000 : 0;
                    const eta = speed > 0 && total > 0 ? (total - loaded) / speed : null;
                    const percent = total > 0 ? Math.min(Math.round((loaded / total) * 100), 99) : null;
                    statsRef.current = { startTime, lastLoaded: loaded, lastTime: now };
                    setProgress({ active: true, percent, loaded, total, speed, eta, label: fmt.label });
                },
            });

            setProgress(p => ({ ...p, percent: 100, eta: null, speed: 0 }));
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `route-lists_${new Date().toISOString().slice(0, 10)}.${fmt.ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setTimeout(() => setProgress(NO_PROGRESS), 600);

            const scope = selectedIds.size > 0
                ? `${selectedIds.size} лист${selectedIds.size === 1 ? '' : 'ів'}`
                : 'всі маршрутні листи';
            setNotification({ open: true, message: `Експортовано ${scope} у ${fmt.label}`, severity: 'success' });
        } catch (e) {
            setProgress(NO_PROGRESS);
            if (e?.code === 'ERR_CANCELED' || e?.name === 'AbortError' || e?.name === 'CanceledError') return;
            setNotification({
                open: true,
                message: `Помилка експорту: ${e.response?.data?.message || e.message || 'Невідома помилка'}`,
                severity: 'error',
            });
        }
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

    const isIndeterminate = progress.active && progress.percent === null;
    const isDeterminate = progress.active && progress.percent !== null;
    const selectionCount = selectedIds.size;

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                mb: 2, borderRadius: 3, overflow: 'hidden', position: 'relative',
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                {progress.active && (
                    <LinearProgress
                        variant={isIndeterminate ? 'indeterminate' : 'determinate'}
                        value={isDeterminate ? progress.percent : undefined}
                        sx={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: 3, zIndex: 2,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            '& .MuiLinearProgress-bar': { bgcolor: 'rgba(255,255,255,0.9)' },
                        }}
                    />
                )}

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

                        {selectionCount > 0 && !progress.active && (
                            <Chip
                                label={`Вибрано: ${selectionCount}`}
                                size="small"
                                onDelete={clearSelection}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700,
                                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' },
                                }}
                            />
                        )}

                        {progress.active && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 160 }}>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: 12 }}>
                                    {isDeterminate ? `${progress.percent}%` : 'Підготовка...'}
                                    {progress.loaded > 0 && (
                                        <span style={{ fontWeight: 400, marginLeft: 4 }}>
                                            {formatBytes(progress.loaded)}
                                            {progress.total > 0 && ` / ${formatBytes(progress.total)}`}
                                        </span>
                                    )}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', fontSize: 10 }}>
                                    {progress.speed > 0 && `${formatBytes(Math.round(progress.speed))}/с`}
                                    {progress.eta && `  ·  ще ~${formatEta(progress.eta)}`}
                                    {!progress.speed && `Завантаження ${progress.label}...`}
                                </Typography>
                            </Box>
                        )}

                        {progress.active ? (
                            <Tooltip title="Скасувати завантаження">
                                <Button variant="contained" size="small"
                                    startIcon={<Close fontSize="small" />} onClick={cancelExport}
                                    sx={{
                                        bgcolor: 'rgba(255,80,80,0.25)', color: 'white',
                                        border: '1px solid rgba(255,100,100,0.45)', fontWeight: 600,
                                        '&:hover': { bgcolor: 'rgba(255,80,80,0.4)' },
                                    }}>
                                    Скасувати
                                </Button>
                            </Tooltip>
                        ) : (
                            <>
                                <Tooltip title={selectionCount > 0
                                    ? `Експортувати ${selectionCount} вибраних`
                                    : 'Експортувати всі маршрутні листи'}>
                                    <Button variant="contained" size="small"
                                        startIcon={<FileDownload />}
                                        onClick={(e) => setExportAnchor(e.currentTarget)}
                                        sx={{
                                            bgcolor: selectionCount > 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                                            color: 'white', border: '1px solid rgba(255,255,255,0.35)',
                                            fontWeight: 600, backdropFilter: 'blur(4px)',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                        }}>
                                        {selectionCount > 0 ? `Експорт (${selectionCount})` : 'Експорт'}
                                    </Button>
                                </Tooltip>

                                <Menu
                                    anchorEl={exportAnchor} open={Boolean(exportAnchor)}
                                    onClose={() => setExportAnchor(null)}
                                    PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 220, boxShadow: 4 } }}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                >
                                    <Box sx={{ px: 2, py: 1 }}>
                                        <Typography variant="caption" color="text.secondary"
                                            fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                                            {selectionCount > 0
                                                ? `Експорт ${selectionCount} вибраних`
                                                : 'Експорт всіх маршрутних листів'}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    {EXPORT_FORMATS.map((fmt) => (
                                        <MenuItem key={fmt.key} onClick={() => handleExport(fmt)}
                                            sx={{ py: 1.25, '&:hover': { bgcolor: alpha(mainColor, 0.06) } }}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>{fmt.icon}</ListItemIcon>
                                            <ListItemText primary={fmt.label}
                                                primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </>
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
                onAddShipment={(item) => setAddShipmentRouteList(item)}
                onEdit={(item) => setEditItem(item)}
                onDelete={(item) => setDeleteItem(item)}
                onSortChange={handleSortChange}
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

            <AddShipmentDialog
                open={Boolean(addShipmentRouteList)}
                onClose={() => setAddShipmentRouteList(null)}
                onSuccess={(msg) => {
                    setAddShipmentRouteList(null);
                    load();
                    setNotification({ open: true, message: msg, severity: 'success' });
                }}
                mainColor={mainColor}
                routeList={addShipmentRouteList}
            />

            <RouteListEditDialog
                open={Boolean(editItem)}
                item={editItem}
                onClose={() => setEditItem(null)}
                onSuccess={(msg) => {
                    setEditItem(null);
                    load();
                    setNotification({ open: true, message: msg, severity: 'success' });
                }}
                mainColor={mainColor}
                references={references}
            />

            <RouteListDeleteDialog
                open={Boolean(deleteItem)}
                item={deleteItem}
                loading={deleting}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDeleteConfirm}
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