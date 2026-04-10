import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Tabs, Tab, CircularProgress, Alert,
    IconButton, Tooltip, Skeleton, alpha, Paper,
} from '@mui/material';
import { 
    Refresh, AddBox, TableChart, Storage, 
    DeleteForever, Key 
} from '@mui/icons-material';
import { DdlApi } from '../api/dictionaries';
import TableList from '../components/ddl/TableList';
import ColumnsTab from '../components/ddl/ColumnsTab';
import ConstraintsTab from '../components/ddl/ConstraintsTab';
import IndexesTab from '../components/ddl/IndexesTab';
import { CreateTableDialog } from '../components/ddl/dialogs/CreateTableDialog';
import { ConfirmDialog } from '../components/ddl/dialogs/ConfirmDialog';
import ForeignKeyDialog from '../components/ddl/dialogs/ForeignKeyDialog';

const MAIN_COLOR = '#f44336';

export default function DdlPage() {
    const [tables, setTables] = useState([]);
    const [loadingTables, setLoadingTables] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableInfo, setTableInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState(0);

    const [createTableOpen, setCreateTableOpen] = useState(false);
    const [fkDialogOpen, setFkDialogOpen] = useState(false);
    const [dropTableConfirm, setDropTableConfirm] = useState(false);
    const [dropTableError, setDropTableError] = useState('');

    const fetchTables = useCallback(async () => {
        setLoadingTables(true);
        try {
            const res = await DdlApi.getAllTables();
            setTables(res.data);
        } catch {
            setError('Не вдалось завантажити список таблиць');
        } finally {
            setLoadingTables(false);
        }
    }, []);

    const fetchTableInfo = useCallback(async (tableName) => {
        if (!tableName) return;
        setLoadingInfo(true);
        setError('');
        try {
            const res = await DdlApi.getTableInfo(tableName);
            setTableInfo(res.data);
        } catch {
            setError(`Не вдалось завантажити структуру таблиці "${tableName}"`);
            setTableInfo(null);
        } finally {
            setLoadingInfo(false);
        }
    }, []);

    useEffect(() => { fetchTables(); }, [fetchTables]);

    useEffect(() => {
        if (selectedTable) fetchTableInfo(selectedTable);
    }, [selectedTable, fetchTableInfo]);

    const handleSelectTable = (name) => {
        setSelectedTable(name);
        setTab(0);
        setTableInfo(null);
    };

    const handleRefresh = () => fetchTableInfo(selectedTable);

    const handleDropTable = async () => {
        try {
            await DdlApi.dropTable(selectedTable);
            setDropTableConfirm(false);
            setSelectedTable(null);
            setTableInfo(null);
            fetchTables();
        } catch (e) {
            setDropTableError(e.response?.data?.message ?? 'Не вдалось видалити таблицю');
            setDropTableConfirm(false);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            height: 'calc(100vh - 80px)',
            bgcolor: '#fafafa',
            overflow: 'hidden',
        }}>
            <TableList
                tables={tables}
                loading={loadingTables}
                selected={selectedTable}
                onSelect={handleSelectTable}
                mainColor={MAIN_COLOR}
            />

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3, py: 1.5,
                    borderBottom: `1px solid ${alpha(MAIN_COLOR, 0.12)}`,
                    bgcolor: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Storage sx={{ color: MAIN_COLOR, fontSize: 22 }} />
                        <Typography variant="h6" fontWeight={700} fontSize={16}>
                            {selectedTable
                                ? <><span style={{ color: '#9e9e9e', fontWeight: 400 }}>Таблиця / </span>{selectedTable}</>
                                : 'Керування структурою БД'
                            }
                        </Typography>
                        {tableInfo && (
                            <Typography variant="caption" color="text.disabled" sx={{
                                bgcolor: alpha(MAIN_COLOR, 0.07),
                                px: 1, py: 0.25, borderRadius: 1,
                                fontFamily: 'monospace',
                            }}>
                                {tableInfo.columns.length} колонок
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {selectedTable && (
                            <>
                                <Tooltip title="Зовнішні ключі (FK)">
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setFkDialogOpen(true)}
                                        sx={{ 
                                            bgcolor: alpha(MAIN_COLOR, 0.05),
                                            color: MAIN_COLOR,
                                            '&:hover': { bgcolor: alpha(MAIN_COLOR, 0.12) }
                                        }}
                                    >
                                        <Key sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Оновити">
                                    <IconButton size="small" onClick={handleRefresh} disabled={loadingInfo}>
                                        <Refresh sx={{ fontSize: 18, color: MAIN_COLOR }} />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title={`Видалити таблицю ${selectedTable}`}>
                                    <IconButton
                                        size="small"
                                        onClick={() => { setDropTableError(''); setDropTableConfirm(true); }}
                                        sx={{
                                            bgcolor: alpha('#f44336', 0.08),
                                            color: '#f44336',
                                            '&:hover': { bgcolor: alpha('#f44336', 0.18) },
                                        }}
                                    >
                                        <DeleteForever sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                        <Tooltip title="Створити нову таблицю">
                            <IconButton
                                size="small"
                                onClick={() => setCreateTableOpen(true)}
                                sx={{
                                    bgcolor: alpha(MAIN_COLOR, 0.08),
                                    color: MAIN_COLOR,
                                    '&:hover': { bgcolor: alpha(MAIN_COLOR, 0.15) },
                                }}
                            >
                                <AddBox sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                    {(error || dropTableError) && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => { setError(''); setDropTableError(''); }}>
                            {error || dropTableError}
                        </Alert>
                    )}

                    {!selectedTable ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '60%',
                            gap: 2,
                        }}>
                            <TableChart sx={{ fontSize: 64, color: alpha(MAIN_COLOR, 0.2) }} />
                            <Typography variant="h6" fontWeight={500} color="text.disabled">
                                Виберіть таблицю зі списку
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                                або створіть нову натиснувши кнопку вгорі
                            </Typography>
                        </Box>
                    ) : loadingInfo ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1.5 }} />
                            ))}
                        </Box>
                    ) : tableInfo ? (
                        <Paper elevation={0} sx={{
                            border: `1px solid ${alpha(MAIN_COLOR, 0.12)}`,
                            borderRadius: 2.5,
                            overflow: 'hidden',
                        }}>
                            <Tabs
                                value={tab}
                                onChange={(_, v) => setTab(v)}
                                sx={{
                                    borderBottom: `1px solid ${alpha(MAIN_COLOR, 0.12)}`,
                                    px: 2,
                                    '& .MuiTab-root': { fontSize: 13, fontWeight: 600, minHeight: 44 },
                                    '& .Mui-selected': { color: MAIN_COLOR },
                                    '& .MuiTabs-indicator': { bgcolor: MAIN_COLOR },
                                }}
                            >
                                <Tab label={`Колонки (${tableInfo.columns.length})`} />
                                <Tab label={`Constraints (${tableInfo.constraints.length})`} />
                                <Tab label={`Індекси (${tableInfo.indexes.length})`} />
                            </Tabs>

                            <Box sx={{ p: 2.5 }}>
                                {tab === 0 && (
                                    <ColumnsTab tableInfo={tableInfo} onRefresh={handleRefresh} mainColor={MAIN_COLOR} />
                                )}
                                {tab === 1 && (
                                    <ConstraintsTab tableInfo={tableInfo} onRefresh={handleRefresh} mainColor={MAIN_COLOR} />
                                )}
                                {tab === 2 && (
                                    <IndexesTab tableInfo={tableInfo} onRefresh={handleRefresh} mainColor={MAIN_COLOR} />
                                )}
                            </Box>
                        </Paper>
                    ) : null}
                </Box>
            </Box>

            <CreateTableDialog
                open={createTableOpen}
                mainColor={MAIN_COLOR}
                onClose={() => setCreateTableOpen(false)}
                onSuccess={() => { setCreateTableOpen(false); fetchTables(); }}
            />

            <ForeignKeyDialog
                open={fkDialogOpen}
                onClose={() => {
                    setFkDialogOpen(false);
                    handleRefresh();
                }}
                tableName={selectedTable}
                mainColor={MAIN_COLOR}
            />

            <ConfirmDialog
                open={dropTableConfirm}
                title={`Видалити таблицю "${selectedTable}"?`}
                message={`Таблицю "${selectedTable}" та всі її дані буде безповоротно видалено. Якщо на неї є зовнішні ключі — операція буде відхилена.`}
                confirmLabel="Видалити таблицю"
                dangerous
                onConfirm={handleDropTable}
                onClose={() => setDropTableConfirm(false)}
            />
        </Box>
    );
}