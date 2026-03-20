import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Button, Box, Typography, Snackbar, Alert, alpha, Tabs, Tab } from '@mui/material';
import { Add, LocalShipping, Archive, FlashOn } from '@mui/icons-material';
import { DictionaryApi } from '../api/dictionaries';
import DataFilters from '../components/DataFilters';
import ShipmentGrid from '../components/shipments/ShipmentGrid';
import ShipmentWizardDialog from '../components/shipments/ShipmentWizardDialog';
import { GROUP_COLORS, ITEM_GROUP_MAP } from '../constants/menuConfig';
import DataPagination from '../components/pagination/DataPagination';
import { SHIPMENT_STATUS_COLORS, getStatusColor } from '../constants/statusColors';

const ARCHIVE_STATUSES = ['Доставлено', 'Відмова', 'Втрачено', 'Утилізовано'];

const ShipmentsPage = () => {
    const groupName = ITEM_GROUP_MAP['shipments'] || 'Керування логістикою';
    const mainColor = GROUP_COLORS[groupName] || '#673ab7';

    const [shipments, setShipments] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [stats, setStats] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [activeTab, setActiveTab] = useState(0);

    const [expandedHistory, setExpandedHistory] = useState({});
    const [expandedFinance, setExpandedFinance] = useState({});
    const [movements, setMovements] = useState({});
    const [openWizard, setOpenWizard] = useState(false);
    const [editingShipment, setEditingShipment] = useState(null);

    const [references, setReferences] = useState({
        statuses: [], clients: [], shipmentTypes: [],
        parcelTypes: [], storageConditions: [], boxVariants: []
    });

    const defaultFilters = {
        trackingNumber: '',
        shipmentStatuses: [],
        shipmentTypes: [],
        parcelDescription: '',
        createdAtFrom: '', createdAtTo: '',
        issuedAtFrom: '', issuedAtTo: '',
        weightMin: 0, weightMax: 100,
        totalPriceMin: 0, totalPriceMax: 10000,
        deliveryPriceMin: 0, deliveryPriceMax: 5000,
        weightPriceMin: 0, weightPriceMax: 2000,
        distancePriceMin: 0, distancePriceMax: 2000,
        boxVariantPriceMin: 0, boxVariantPriceMax: 1000,
        specialPackagingPriceMin: 0, specialPackagingPriceMax: 1000,
        insuranceFeeMin: 0, insuranceFeeMax: 1000,
    };

    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        const loadAllReferences = async () => {
            try {
                const [s, c, t, pt, sc, bv, statsRes, payTypes] = await Promise.all([
                    DictionaryApi.getAll('shipment-statuses', 0, 100),
                    DictionaryApi.getAll('clients', 0, 1000),
                    DictionaryApi.getAll('shipment-types', 0, 100),
                    DictionaryApi.getAll('parcel-types', 0, 100),
                    DictionaryApi.getAll('storage-conditions', 0, 100),
                    DictionaryApi.getAll('box-variants', 0, 100),
                    DictionaryApi.getStatistics('shipments'),
                    DictionaryApi.getAll('payment-types', 0, 100)
                ]);

                setReferences({
                    statuses: (s.data.content || []).map(st => ({
                        ...st,
                        color: getStatusColor(SHIPMENT_STATUS_COLORS, st.name)
                    })),
                    clients: c.data.content || [],
                    shipmentTypes: t.data.content || [],
                    parcelTypes: pt.data.content || [],
                    storageConditions: sc.data.content || [],
                    boxVariants: bv.data.content || [],
                    paymentTypes: payTypes.data.content || [],
                });

                if (statsRes.data) {
                    const d = statsRes.data;
                    setStats(d);
                    setFilters(prev => ({
                        ...prev,
                        weightMin: d.minWeight, weightMax: d.maxWeight,
                        totalPriceMin: d.minTotalPrice, totalPriceMax: d.maxTotalPrice,
                        deliveryPriceMin: d.minDeliveryPrice, deliveryPriceMax: d.maxDeliveryPrice,
                        weightPriceMin: d.minWeightPrice, weightPriceMax: d.maxWeightPrice,
                        distancePriceMin: d.minDistancePrice, distancePriceMax: d.maxDistancePrice,
                        boxVariantPriceMin: d.minBoxVariantPrice, boxVariantPriceMax: d.maxBoxVariantPrice,
                        specialPackagingPriceMin: d.minSpecialPackagingPrice, specialPackagingPriceMax: d.maxSpecialPackagingPrice,
                        insuranceFeeMin: d.minInsuranceFee, insuranceFeeMax: d.maxInsuranceFee,
                    }));
                }
            } catch (e) { console.error(e); }
        };
        loadAllReferences();
    }, []);

    const getTabStatusIds = useCallback(() => {
        if (filters.shipmentStatuses.length > 0) return null;
        const archiveIds = references.statuses
            .filter(s => ARCHIVE_STATUSES.includes(s.name))
            .map(s => s.id);
        const activeIds = references.statuses
            .filter(s => !ARCHIVE_STATUSES.includes(s.name))
            .map(s => s.id);
        return activeTab === 0 ? activeIds : archiveIds;
    }, [activeTab, references.statuses, filters.shipmentStatuses]);

    const loadTableData = useCallback(async () => {
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => {
                    if (Array.isArray(v)) return v.length > 0;
                    return v !== '' && v !== null;
                })
            );

            const tabStatusIds = getTabStatusIds();
            if (tabStatusIds && tabStatusIds.length > 0) {
                activeFilters.shipmentStatuses = tabStatusIds;
            }

            const response = await DictionaryApi.getAll('shipments', page, rowsPerPage, activeFilters);
            setShipments(response.data.content || []);
            setTotalElements(response.data.totalElements || 0);
        } catch (error) { console.error(error); }
    }, [page, rowsPerPage, filters, getTabStatusIds]);

    useEffect(() => {
        const timer = setTimeout(() => { loadTableData(); }, 400);
        return () => clearTimeout(timer);
    }, [loadTableData]);

    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue);
        setPage(0);
        setFilters(prev => ({ ...prev, shipmentStatuses: [] }));
        setExpandedHistory({});
        setExpandedFinance({});
    };

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
        setFilters(stats ? {
            ...defaultFilters,
            weightMin: stats.minWeight, weightMax: stats.maxWeight,
            totalPriceMin: stats.minTotalPrice, totalPriceMax: stats.maxTotalPrice,
            deliveryPriceMin: stats.minDeliveryPrice, deliveryPriceMax: stats.maxDeliveryPrice,
            weightPriceMin: stats.minWeightPrice, weightPriceMax: stats.maxWeightPrice,
            distancePriceMin: stats.minDistancePrice, distancePriceMax: stats.maxDistancePrice,
            boxVariantPriceMin: stats.minBoxVariantPrice, boxVariantPriceMax: stats.maxBoxVariantPrice,
            specialPackagingPriceMin: stats.minSpecialPackagingPrice, specialPackagingPriceMax: stats.maxSpecialPackagingPrice,
            insuranceFeeMin: stats.minInsuranceFee, insuranceFeeMax: stats.maxInsuranceFee,
        } : defaultFilters);
        setPage(0);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Видалити це відправлення?')) {
            try {
                await DictionaryApi.delete('shipments', id);
                loadTableData();
                setNotification({ open: true, message: 'Видалено успішно', severity: 'success' });
            } catch {
                setNotification({ open: true, message: 'Помилка видалення', severity: 'error' });
            }
        }
    };

    const handleEdit = (shipment) => {
        setEditingShipment(shipment);
        setOpenWizard(true);
    };

    const handleCloseWizard = () => {
        setOpenWizard(false);
        setEditingShipment(null);
    };

    const tabStatuses = references.statuses.filter(s =>
        activeTab === 0 ? !ARCHIVE_STATUSES.includes(s.name) : ARCHIVE_STATUSES.includes(s.name)
    );

    const filterFields = [
        { name: 'trackingNumber', label: 'Трек-номер', type: 'text' },
        { name: 'parcelDescription', label: 'Вміст', type: 'text' },
        { name: 'shipmentStatuses', label: 'Статус', type: 'checkbox-group', options: tabStatuses },
        { name: 'shipmentTypes', label: 'Тип доставки', type: 'checkbox-group', options: references.shipmentTypes },
        {
            name: 'weightRange', label: 'Вага (кг)', type: 'range',
            minName: 'weightMin', maxName: 'weightMax',
            min: stats?.minWeight || 0, max: stats?.maxWeight || 100,
        },
        {
            name: 'totalPriceRange', label: 'Загальна вартість', type: 'range',
            minName: 'totalPriceMin', maxName: 'totalPriceMax',
            min: stats?.minTotalPrice || 0, max: stats?.maxTotalPrice || 10000,
        },
        {
            name: 'deliveryPriceRange', label: 'Базовий тариф', type: 'range',
            minName: 'deliveryPriceMin', maxName: 'deliveryPriceMax',
            min: stats?.minDeliveryPrice || 0, max: stats?.maxDeliveryPrice || 5000,
        },
        {
            name: 'weightPriceRange', label: 'Доплата за вагу', type: 'range',
            minName: 'weightPriceMin', maxName: 'weightPriceMax',
            min: stats?.minWeightPrice || 0, max: stats?.maxWeightPrice || 2000,
        },
        {
            name: 'distancePriceRange', label: 'Доплата за відстань', type: 'range',
            minName: 'distancePriceMin', maxName: 'distancePriceMax',
            min: stats?.minDistancePrice || 0, max: stats?.maxDistancePrice || 2000,
        },
        {
            name: 'insuranceFeeRange', label: 'Страховий збір', type: 'range',
            minName: 'insuranceFeeMin', maxName: 'insuranceFeeMax',
            min: stats?.minInsuranceFee || 0, max: stats?.maxInsuranceFee || 1000,
        },
        {
            name: 'boxPriceRange', label: 'Ціна коробки', type: 'range',
            minName: 'boxVariantPriceMin', maxName: 'boxVariantPriceMax',
            min: stats?.minBoxVariantPrice || 0, max: stats?.maxBoxVariantPrice || 500,
        },
        {
            name: 'packPriceRange', label: 'Спец. пакування', type: 'range',
            minName: 'specialPackagingPriceMin', maxName: 'specialPackagingPriceMax',
            min: stats?.minSpecialPackagingPrice || 0, max: stats?.maxSpecialPackagingPrice || 500,
        },
        { name: 'createdAtFrom', label: 'Створено (від)', type: 'datetime' },
        { name: 'createdAtTo', label: 'Створено (до)', type: 'datetime' },
        { name: 'issuedAtFrom', label: 'Видано (від)', type: 'datetime' },
        { name: 'issuedAtTo', label: 'Видано (до)', type: 'datetime' },
    ];

    return (
        <Box sx={{ p: 2, pt: 0, width: '100%' }}>
            <Paper elevation={0} sx={{
                mb: 2, borderRadius: 3, overflow: 'hidden',
                boxShadow: `0 4px 20px ${alpha(mainColor, 0.25)}`,
            }}>
                <Box sx={{
                    p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.85)} 100%)`,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1.5, borderRadius: '16px', display: 'flex' }}>
                            <LocalShipping fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Відправлення</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {activeTab === 0 ? 'Активні відправлення в обробці' : 'Архів завершених відправлень'}
                            </Typography>
                        </Box>
                    </Box>
                    <Button variant="contained" size="small"
                        sx={{ bgcolor: 'white', color: mainColor, fontWeight: 'bold', '&:hover': { bgcolor: '#f5f5f5' } }}
                        startIcon={<Add />} onClick={() => { setEditingShipment(null); setOpenWizard(true); }}>
                        Створити ТТН
                    </Button>
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
                    <Tab
                        icon={<FlashOn fontSize="small" />}
                        iconPosition="start"
                        label={`Активні`}
                    />
                    <Tab
                        icon={<Archive fontSize="small" />}
                        iconPosition="start"
                        label={`Архів`}
                    />
                </Tabs>
            </Paper>

            <DataFilters
                filters={filters}
                onChange={(k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); }}
                onClear={handleClearFilters}
                fields={filterFields}
                searchPlaceholder="Трек-номер..."
                accentColor={mainColor}
                counts={{
                    total: totalElements,
                    ...(stats?.countByStatus
                        ? Object.fromEntries(
                            Object.entries(stats.countByStatus).map(([id, count]) => [`shipmentStatuses_${id}`, count])
                        )
                        : {}),
                    ...(stats?.countByType
                        ? Object.fromEntries(
                            Object.entries(stats.countByType).map(([id, count]) => [`shipmentTypes_${id}`, count])
                        )
                        : {}),
                }}
            />

            <ShipmentGrid
                shipments={shipments} mainColor={mainColor} statusColors={SHIPMENT_STATUS_COLORS}
                expandedHistory={expandedHistory} expandedFinance={expandedFinance} movements={movements}
                onDelete={handleDelete} onToggleHistory={toggleHistory}
                onToggleFinance={(id) => setExpandedFinance(prev => ({ ...prev, [id]: !prev[id] }))}
                onEdit={handleEdit}
            />

            <DataPagination
                count={totalElements}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(e, n) => setPage(n)}
                onRowsPerPageChange={(size) => { setRowsPerPage(size); setPage(0); }}
                label="Відправлень:"
            />

            <ShipmentWizardDialog
                open={openWizard}
                onClose={handleCloseWizard}
                mainColor={mainColor}
                references={references}
                shipmentToEdit={editingShipment}
                onSuccess={(msg) => {
                    loadTableData();
                    setNotification({ open: true, message: msg, severity: 'success' });
                }}
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

export default ShipmentsPage;