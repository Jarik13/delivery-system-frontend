import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, alpha, Snackbar, Alert,
    Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import {
    Receipt, Add, FileDownload,
    TableChart, PictureAsPdf, Description, DataObject
} from '@mui/icons-material';
import WaybillsTable from '../components/waybills/WaybillsTable';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import DataPagination from '../components/pagination/DataPagination';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const EXPORT_FORMATS = [
    { key: 'xlsx', label: 'Excel (.xlsx)', ext: 'xlsx', icon: <TableChart sx={{ color: '#217346' }} /> },
    { key: 'csv',  label: 'CSV (.csv)',    ext: 'csv',  icon: <Description sx={{ color: '#f57c00' }} /> },
    { key: 'pdf',  label: 'PDF (.pdf)',    ext: 'pdf',  icon: <PictureAsPdf sx={{ color: '#d32f2f' }} /> },
    { key: 'json', label: 'JSON (.json)',  ext: 'json', icon: <DataObject sx={{ color: '#1565c0' }} /> },
];

const filterFields = [
    { name: 'number', label: 'Номер накладної', type: 'text' },
];

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
    const [exporting, setExporting] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

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

    const handleExport = async (fmt) => {
        setExportAnchor(null);
        setExporting(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );

            const res = await DictionaryApi.exportFile('waybills/export', {
                format: fmt.key,
                ...activeFilters,
            });

            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `waybills_${new Date().toISOString().slice(0, 10)}.${fmt.ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setNotification({ open: true, message: `Експорт у ${fmt.label} успішно завершено`, severity: 'success' });
        } catch (e) {
            console.error('Export error:', e);
            const message = e.response?.data?.message || e.message || 'Невідома помилка';
            setNotification({ open: true, message: `Помилка експорту: ${message}`, severity: 'error' });
        } finally {
            setExporting(false);
        }
    };

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
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

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained" size="small"
                        startIcon={<FileDownload />}
                        disabled={exporting}
                        onClick={(e) => setExportAnchor(e.currentTarget)}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                            border: '1px solid rgba(255,255,255,0.35)', fontWeight: 600,
                            backdropFilter: 'blur(4px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                            '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)' },
                        }}
                    >
                        {exporting ? 'Експорт...' : 'Експорт'}
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
                            <Typography variant="caption" color="text.secondary" fontWeight={700}
                                sx={{ textTransform: 'uppercase', fontSize: 10 }}>
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

                    <Button
                        variant="contained" size="small"
                        startIcon={<Add />}
                        onClick={() => setOpenWizard(true)}
                        sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                        Створити накладну
                    </Button>
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