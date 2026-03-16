import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert,
    Button, Menu, MenuItem, ListItemIcon, ListItemText,
    Divider, LinearProgress, Tooltip, Chip,
} from '@mui/material';
import {
    Receipt, Add, FileDownload, Close,
    TableChart, PictureAsPdf, Description, DataObject,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import WaybillsTable from '../components/waybills/WaybillsTable';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import WaybillWizardDialog from '../components/waybills/WaybillWizardDialog';
import { EXPORT_FORMATS, NO_PROGRESS, formatBytes, formatEta } from '../constants/export';

const WaybillsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['waybills']] || '#673ab7';

    const [searchParams, setSearchParams] = useSearchParams();
    const highlightId = searchParams.get('highlight') ? Number(searchParams.get('highlight')) : null;
    const highlightRowRef = useRef(null);

    const [waybills, setWaybills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({
        number: '',
        totalWeightMin: 0,
        totalWeightMax: 5000,
        volumeMin: 0,
        volumeMax: 100,
        createdAtFrom: null,
        createdAtTo: null,
        createdById: null,
    });
    const [openWizard, setOpenWizard] = useState(false);
    const [exportAnchor, setExportAnchor] = useState(null);
    const [progress, setProgress] = useState(NO_PROGRESS);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [employees, setEmployees] = useState([]);

    const abortRef = useRef(null);
    const statsRef = useRef({ startTime: 0, lastLoaded: 0, lastTime: 0 });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );
            const res = await DictionaryApi.getAll('waybills', page, rowsPerPage, activeFilters);
            setWaybills(res.data.content || []);
            setTotalElements(res.data.totalElements || 0);
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        DictionaryApi.getAll('employees', 0, 1000, {})
            .then(res => setEmployees(res.data.content || []))
            .catch(console.error);
    }, []);

    const [statistics, setStatistics] = useState({ totalWeightMin: 0, totalWeightMax: 5000 });

    const filterFields = [
        { name: 'number', label: 'Номер накладної', type: 'text' },
        {
            name: 'weightRange',
            label: 'Вага (кг)',
            type: 'range',
            minName: 'totalWeightMin',
            maxName: 'totalWeightMax',
            min: statistics.totalWeightMin,
            max: statistics.totalWeightMax,
            step: 1,
        },
        {
            name: 'volumeRange',
            label: 'Об\'єм (м³)',
            type: 'range',
            minName: 'volumeMin',
            maxName: 'volumeMax',
            min: statistics.volumeMin,
            max: statistics.volumeMax,
            step: 1,
        },
        { name: 'createdAtFrom', label: 'Створено від', type: 'datetime' },
        { name: 'createdAtTo', label: 'Створено до', type: 'datetime' },
        {
            name: 'createdById',
            label: 'Оформив',
            type: 'select',
            options: employees.map(e => ({
                id: e.id,
                name: `${e.lastName} ${e.firstName} ${e.middleName}`,
            })),
        },
    ];

    useEffect(() => {
        DictionaryApi.getStatistics('waybills')
            .then(res => {
                const { totalWeightMin, totalWeightMax } = res.data;
                setStatistics({ totalWeightMin: totalWeightMin || 0, totalWeightMax: totalWeightMax || 5000 });
                setFilters(prev => ({
                    ...prev,
                    totalWeightMin: totalWeightMin || 0,
                    totalWeightMax: totalWeightMax || 5000,
                    volumeMin: res.data.volumeMin || 0,
                    volumeMax: res.data.volumeMax || 100,
                }));
            })
            .catch(console.error);
    }, []);

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
    }, [highlightId, loading, waybills]);

    useEffect(() => {
        if (!highlightId || loading || waybills.length === 0) return;
        const found = waybills.find(w => w.id === highlightId);
        if (!found) {
            setNotification({
                open: true,
                message: `Накладна №${highlightId} не знайдена на цій сторінці. Спробуйте пошук.`,
                severity: 'info',
            });
        }
    }, [highlightId, waybills, loading]);

    const handleWizardSuccess = (message) => {
        load();
        setNotification({ open: true, message, severity: 'success' });
    };

    const handleToggle = useCallback((id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const handleToggleAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.size === waybills.length
                ? new Set()
                : new Set(waybills.map(w => w.id))
        );
    }, [waybills]);

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
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );
            const exportParams = selectedIds.size > 0
                ? { format: fmt.key, ids: [...selectedIds].join(',') }
                : { format: fmt.key, ...activeFilters };

            const res = await DictionaryApi.exportFile('waybills/export', exportParams, {
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
            a.download = `waybills_${new Date().toISOString().slice(0, 10)}.${fmt.ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setTimeout(() => setProgress(NO_PROGRESS), 600);

            const scope = selectedIds.size > 0
                ? `${selectedIds.size} накладн${selectedIds.size === 1 ? 'у' : 'их'}`
                : 'всі накладні';
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
                    p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                            <Receipt fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Транспортні накладні</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                                Маніфести та перелік відправлень
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {highlightId && !loading && (
                            <Chip
                                label={`↓ Накладна #${highlightId}`}
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
                                <Tooltip title={selectionCount > 0 ? `Експортувати ${selectionCount} вибраних` : 'Експортувати всі накладні'}>
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
                                            {selectionCount > 0 ? `Експорт ${selectionCount} вибраних` : 'Експорт всіх накладних'}
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

                        <Button variant="contained" size="small" startIcon={<Add />}
                            onClick={() => setOpenWizard(true)}
                            sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}>
                            Створити накладну
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={() => {
                    setFilters({
                        number: '',
                        totalWeightMin: 0,
                        totalWeightMax: 5000,
                        volumeMin: 0,
                        volumeMax: 100,
                        createdAtFrom: null,
                        createdAtTo: null,
                        createdById: null,
                    });
                    setPage(0);
                }}
                fields={filterFields}
                searchPlaceholder="Номер накладної..."
                accentColor={mainColor}
                counts={{ total: totalElements }}
            />

            <WaybillsTable
                waybills={waybills}
                loading={loading}
                mainColor={mainColor}
                selected={[...selectedIds]}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
                highlightId={highlightId}
                highlightRowRef={highlightRowRef}
            />

            <WaybillWizardDialog
                open={openWizard}
                onClose={() => setOpenWizard(false)}
                mainColor={mainColor}
                onSuccess={handleWizardSuccess}
            />

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Накладних:"
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

export default WaybillsPage;