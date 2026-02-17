import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Button, Box, Typography, Snackbar, Alert, TablePagination, useTheme, alpha } from '@mui/material';
import { Add, LocalShipping } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import ShipmentGrid from '../components/ShipmentGrid';
import ShipmentWizardDialog from '../components/ShipmentWizardDialog';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';

const STATUS_COLORS = {
    'Створено': '#2196f3', 
    'Очікує надходження': '#90caf9', 
    'Прийнято у відділенні': '#673ab7',
    'Сортування термінал': '#00bcd4', 
    'У дорозі': '#ff9800', 
    'Прибув у відділення': '#8bc34a',
    'Видано кур\'єру': '#e91e63', 
    'Доставлено': '#2e7d32', 
    'Відмова': '#f44336',
    'Втрачено': '#b71c1c', 
    'Утилізовано': '#616161', 
    'default': '#9e9e9e'
};

const ShipmentsPage = () => {
    const theme = useTheme();
    const groupName = ITEM_GROUP_MAP['shipments'] || 'Керування логістикою';
    const mainColor = GROUP_COLORS[groupName] || '#673ab7';

    const [shipments, setShipments] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [stats, setStats] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const [expandedHistory, setExpandedHistory] = useState({});
    const [expandedFinance, setExpandedFinance] = useState({});
    const [movements, setMovements] = useState({});

    const [openWizard, setOpenWizard] = useState(false);
    const [references, setReferences] = useState({
        statuses: [], clients: [], shipmentTypes: [], parcelTypes: [], storageConditions: [], boxVariants: []
    });

    const [filters, setFilters] = useState({
        trackingNumber: '', shipmentStatusId: '', shipmentTypeId: '', parcelDescription: '',
        createdAtFrom: '', createdAtTo: '', issuedAtFrom: '', issuedAtTo: '',
        weightMin: 0, weightMax: 100, totalPriceMin: 0, totalPriceMax: 10000,
        deliveryPriceMin: 0, deliveryPriceMax: 5000, weightPriceMin: 0, weightPriceMax: 2000,
        distancePriceMin: 0, distancePriceMax: 2000, boxVariantPriceMin: 0, boxVariantPriceMax: 1000,
        specialPackagingPriceMin: 0, specialPackagingPriceMax: 1000, insuranceFeeMin: 0, insuranceFeeMax: 1000
    });

    useEffect(() => {
        const loadAllReferences = async () => {
            try {
                const [s, c, t, pt, sc, bv, statsRes] = await Promise.all([
                    DictionaryApi.getAll('shipment-statuses', 0, 100),
                    DictionaryApi.getAll('clients', 0, 1000),
                    DictionaryApi.getAll('shipment-types', 0, 100),
                    DictionaryApi.getAll('parcel-types', 0, 100),
                    DictionaryApi.getAll('storage-conditions', 0, 100),
                    DictionaryApi.getAll('box-variants', 0, 100),
                    DictionaryApi.getStatistics('shipments')
                ]);
                setReferences({
                    statuses: s.data.content || [],
                    clients: c.data.content || [],
                    shipmentTypes: t.data.content || [],
                    parcelTypes: pt.data.content || [],
                    storageConditions: sc.data.content || [],
                    boxVariants: bv.data.content || []
                });
                if (statsRes.data) {
                    setStats(statsRes.data);
                    const s = statsRes.data;
                    setFilters(prev => ({
                        ...prev, weightMin: s.minWeight, weightMax: s.maxWeight, totalPriceMin: s.minTotalPrice, totalPriceMax: s.maxTotalPrice
                    }));
                }
            } catch (e) { console.error(e); }
        };
        loadAllReferences();
    }, []);

    const loadTableData = useCallback(async () => {
        try {
            const activeFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== null));
            const response = await DictionaryApi.getAll('shipments', page, rowsPerPage, activeFilters);
            setShipments(response.data.content || []);
            setTotalElements(response.data.totalElements || 0);
        } catch (error) { console.error(error); }
    }, [page, rowsPerPage, filters]);

    useEffect(() => {
        const timer = setTimeout(() => { loadTableData(); }, 400);
        return () => clearTimeout(timer);
    }, [loadTableData]);

    const toggleHistory = async (shipmentId) => {
        if (expandedHistory[shipmentId]) {
            setExpandedHistory(prev => ({ ...prev, [shipmentId]: false }));
            return;
        }
        if (!movements[shipmentId]) {
            try {
                const response = await DictionaryApi.getMovement(shipmentId);
                setMovements(prev => ({ ...prev, [shipmentId]: response.data }));
            } catch (error) { console.error(error); }
        }
        setExpandedHistory(prev => ({ ...prev, [shipmentId]: true }));
    };

    const handleClearFilters = () => {
        setFilters({
            trackingNumber: '', shipmentStatusId: '', shipmentTypeId: '', parcelDescription: '',    
            createdAtFrom: '', createdAtTo: '', issuedAtFrom: '', issuedAtTo: '',
            weightMin: stats?.minWeight || 0, weightMax: stats?.maxWeight || 100, totalPriceMin: stats?.minTotalPrice || 0, totalPriceMax: stats?.maxTotalPrice || 10000,
            deliveryPriceMin: 0, deliveryPriceMax: 5000, weightPriceMin: 0, weightPriceMax: 2000,
            distancePriceMin: 0, distancePriceMax: 2000, boxVariantPriceMin: 0, boxVariantPriceMax: 1000,
            specialPackagingPriceMin: 0, specialPackagingPriceMax: 1000, insuranceFeeMin: 0, insuranceFeeMax: 1000
        });
        setPage(0);
    }

    const handleDelete = async (id) => {
        if (window.confirm('Видалити це відправлення?')) {
            try {
                await DictionaryApi.delete('shipments', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено успішно', severity: 'success' });
            } catch (error) { setNotification({ open: true, message: 'Помилка видалення', severity: 'error' }); }
        }
    };

    const filterFields = [
        { name: 'trackingNumber', label: 'Трек-номер', type: 'text', md: 3 },
        { name: 'shipmentStatusId', label: 'Статус', type: 'select', options: references.statuses, md: 3 },
        { name: 'shipmentTypeId', label: 'Тип доставки', type: 'select', options: references.shipmentTypes, md: 3 },
        { name: 'parcelDescription', label: 'Опис вмісту', type: 'text', md: 3 },
        { label: 'Вага (кг)', type: 'range', minName: 'weightMin', maxName: 'weightMax', min: stats?.minWeight || 0, max: stats?.maxWeight || 100, md: 4 },
        { label: 'Ціна загальна', type: 'range', minName: 'totalPriceMin', maxName: 'totalPriceMax', min: stats?.minTotalPrice || 0, max: stats?.maxTotalPrice || 10000, md: 4 }
    ];

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                color: 'white', borderRadius: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocalShipping fontSize="large" />
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Відправлення</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Керування логістичними маршрутами</Typography>
                    </Box>
                </Box>
                <Button variant="contained" sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold' }} 
                    startIcon={<Add />} onClick={() => setOpenWizard(true)}>
                    Створити ТТН
                </Button>
            </Paper>

            <DataFilters 
                filters={filters} 
                onChange={(k, v) => setFilters(p => ({...p, [k]: v}))} 
                onClear={handleClearFilters} 
                fields={filterFields} 
                searchPlaceholder="Трек-номер..."
                quickFilters={['shipmentStatusId', 'shipmentTypeId']}
            />

            <ShipmentGrid
                shipments={shipments} mainColor={mainColor} statusColors={STATUS_COLORS}
                expandedHistory={expandedHistory} expandedFinance={expandedFinance} movements={movements}
                onDelete={handleDelete} onToggleHistory={toggleHistory}
                onToggleFinance={(id) => setExpandedFinance(prev => ({ ...prev, [id]: !prev[id] }))}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <TablePagination component="div" count={totalElements} page={page} onPageChange={(e, n) => setPage(n)}
                    rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))} />
            </Box>

            <ShipmentWizardDialog
                open={openWizard}
                onClose={() => setOpenWizard(false)}
                mainColor={mainColor}
                references={references}
                onSuccess={(msg) => {
                    loadTableData();
                    setNotification({ open: true, message: msg, severity: 'success' });
                }}
            />

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({...notification, open: false})} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ShipmentsPage;