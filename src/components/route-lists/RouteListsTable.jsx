import React from 'react';
import {
    Paper, TableContainer, Table, TableHead, TableRow,
    TableCell, TableBody, Box, Typography, CircularProgress,
    Divider, alpha, Tooltip,
} from '@mui/material';
import { AssignmentInd } from '@mui/icons-material';
import RouteListRow from './RouteListRow';

const RouteListsTable = ({ items, loading, mainColor, onRefresh }) => {
    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                    <CircularProgress sx={{ color: mainColor }} />
                </Box>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(mainColor, 0.05) }}>
                                <TableCell width={48} />
                                <TableCell sx={{ fontWeight: 700 }}>Номер листа</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Кур'єр</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Статус</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Прогрес</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Загальна вага</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Дата формування</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#bbb' }}>
                                            <AssignmentInd sx={{ fontSize: 48 }} />
                                            <Typography variant="body2">Маршрутних листів не знайдено</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map(item => (
                                    <RouteListRow
                                        key={item.id}
                                        item={item}
                                        mainColor={mainColor}
                                        onRefresh={onRefresh}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Divider />
        </Paper>
    );
};

export default RouteListsTable;