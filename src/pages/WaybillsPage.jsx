import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert,
    Button, Menu, MenuItem, ListItemIcon, ListItemText,
    Divider, LinearProgress, CircularProgress, Tooltip,
} from '@mui/material';
import {
    Receipt, Add, FileDownload, Close,
    TableChart, PictureAsPdf, Description, DataObject,
} from '@mui/icons-material';
import WaybillsTable from '../components/waybills/WaybillsTable';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const EXPORT_FORMATS = [
    { key: 'xlsx', label: 'Excel (.xlsx)', ext: 'xlsx', icon: <TableChart sx={{ color: '#217346' }} /> },
    { key: 'csv', label: 'CSV (.csv)', ext: 'csv', icon: <Description sx={{ color: '#f57c00' }} /> },
    { key: 'pdf', label: 'PDF (.pdf)', ext: 'pdf', icon: <PictureAsPdf sx={{ color: '#d32f2f' }} /> },
    { key: 'json', label: 'JSON (.json)', ext: 'json', icon: <DataObject sx={{ color: '#1565c0' }} /> },
];

const filterFields = [
    { name: 'number', label: 'Номер накладної', type: 'text' },
];

const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 Б';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} КБ`;
    return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
};

const formatEta = (seconds) => {
    if (!seconds || !isFinite(seconds) || seconds <= 0) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m} хв ${s} с` : `${s} с`;
};

const NO_PROGRESS = {
    active: false,
    percent: 0,
    loaded: 0,
    total: 0,
    speed: 0,
    eta: null,
    label: '',
};

const WaybillsPage = () => {
    const mainColor = GROUP_COLORS[ITEM_GROUP_MAP['waybills']] || '#673ab7';

    const [waybills, setWaybills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({ number: '' });
    const [openWizard, setOpenWizard] = useState(false);
    const [exportAnchor, setExportAnchor] = useState(null);
    const [progress, setProgress] = useState(NO_PROGRESS);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

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
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    const cancelExport = () => {
        abortRef.current?.abort();
        setProgress(NO_PROGRESS);
    };

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

            const res = await DictionaryApi.exportFile('waybills/export', {
                format: fmt.key,
                ...activeFilters,
            }, {
                signal: abortRef.current.signal,

                onDownloadProgress: (progressEvent) => {
                    const { loaded, total: rawTotal } = progressEvent;
                    const total = rawTotal || 0;
                    const now = Date.now();
                    const { startTime, lastLoaded, lastTime } = statsRef.current;

                    const dtMs = now - lastTime;
                    const dlBytes = loaded - lastLoaded;
                    const speed = dtMs > 50 ? (dlBytes / dtMs) * 1000 : 0;

                    const eta = speed > 0 && total > 0
                        ? (total - loaded) / speed
                        : null;

                    const percent = total > 0
                        ? Math.min(Math.round((loaded / total) * 100), 99)
                        : null;

                    statsRef.current = { startTime, lastLoaded: loaded, lastTime: now };

                    setProgress({
                        active: true,
                        percent,
                        loaded,
                        total,
                        speed,
                        eta,
                        label: fmt.label,
                    });
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

            setNotification({ open: true, message: `Експорт у ${fmt.label} успішно завершено`, severity: 'success' });

        } catch (e) {
            setProgress(NO_PROGRESS);

            if (e?.code === 'ERR_CANCELED' || e?.name === 'AbortError' || e?.name === 'CanceledError') {
                return;
            }

            console.error('Export error:', e);
            const message = e.response?.data?.message || e.message || 'Невідома помилка';
            setNotification({ open: true, message: `Помилка експорту: ${message}`, severity: 'error' });
        }
    };

    const isIndeterminate = progress.active && progress.percent === null;
    const isDeterminate = progress.active && progress.percent !== null;

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
                        {progress.active && (
                            <Box sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                                minWidth: 160, mr: 0.5,
                            }}>
                                <Typography variant="caption" sx={{
                                    color: 'white', fontWeight: 700, lineHeight: 1.3, fontSize: 12,
                                }}>
                                    {isDeterminate
                                        ? `${progress.percent}%`
                                        : 'Підготовка файлу...'}
                                    {progress.loaded > 0 && (
                                        <span style={{ fontWeight: 400, marginLeft: 4 }}>
                                            {formatBytes(progress.loaded)}
                                            {progress.total > 0 && ` / ${formatBytes(progress.total)}`}
                                        </span>
                                    )}
                                </Typography>
                                <Typography variant="caption" sx={{
                                    color: 'rgba(255,255,255,0.72)', fontSize: 10, lineHeight: 1.3,
                                }}>
                                    {progress.speed > 0 && `${formatBytes(Math.round(progress.speed))}/с`}
                                    {progress.eta && `  ·  ще ~${formatEta(progress.eta)}`}
                                    {!progress.speed && !progress.eta && `Завантаження ${progress.label}...`}
                                </Typography>
                            </Box>
                        )}

                        {progress.active ? (
                            <Tooltip title="Скасувати завантаження">
                                <Button
                                    variant="contained" size="small"
                                    startIcon={<Close fontSize="small" />}
                                    onClick={cancelExport}
                                    sx={{
                                        bgcolor: 'rgba(255,80,80,0.25)',
                                        color: 'white',
                                        border: '1px solid rgba(255,100,100,0.45)',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: 'rgba(255,80,80,0.4)' },
                                    }}
                                >
                                    Скасувати
                                </Button>
                            </Tooltip>
                        ) : (
                            <>
                                <Button
                                    variant="contained" size="small"
                                    startIcon={<FileDownload />}
                                    onClick={(e) => setExportAnchor(e.currentTarget)}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                                        border: '1px solid rgba(255,255,255,0.35)', fontWeight: 600,
                                        backdropFilter: 'blur(4px)',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                                    }}
                                >
                                    Експорт
                                </Button>

                                <Menu
                                    anchorEl={exportAnchor}
                                    open={Boolean(exportAnchor)}
                                    onClose={() => setExportAnchor(null)}
                                    PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 200, boxShadow: 4 } }}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                >
                                    <Box sx={{ px: 2, py: 1 }}>
                                        <Typography variant="caption" color="text.secondary"
                                            fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                                            Оберіть формат
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    {EXPORT_FORMATS.map((fmt) => (
                                        <MenuItem key={fmt.key} onClick={() => handleExport(fmt)}
                                            sx={{ py: 1.25, '&:hover': { bgcolor: alpha(mainColor, 0.06) } }}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>{fmt.icon}</ListItemIcon>
                                            <ListItemText
                                                primary={fmt.label}
                                                primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                                            />
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </>
                        )}

                        <Button
                            variant="contained" size="small"
                            startIcon={<Add />}
                            onClick={() => setOpenWizard(true)}
                            sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                        >
                            Створити накладну
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={() => { setFilters({ number: '' }); setPage(0); }}
                fields={filterFields}
                searchPlaceholder="Номер накладної..."
            />

            <WaybillsTable waybills={waybills} loading={loading} mainColor={mainColor} />

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Накладних:"
                rowsPerPageOptions={[10, 15, 25, 50]}
            />

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification(n => ({ ...n, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default WaybillsPage;