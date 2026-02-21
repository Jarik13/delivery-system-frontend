import React from 'react';
import {
    Paper, TableContainer, Table, TableHead, TableRow,
    TableCell, TableBody, Box, Typography, CircularProgress, Divider, alpha
} from '@mui/material';
import { LocalShipping } from '@mui/icons-material';
import WaybillRow from './WaybillRow';

const WaybillsTable = ({ waybills, loading, mainColor }) => (
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
                            <TableCell sx={{ fontWeight: 700 }}>Номер</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Загальна вага</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Об'єм</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Відправлень</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Створив</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Дата створення</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {waybills.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#bbb' }}>
                                        <LocalShipping sx={{ fontSize: 48 }} />
                                        <Typography variant="body2">Накладних не знайдено</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            waybills.map(w => (
                                <WaybillRow key={w.id} waybill={w} mainColor={mainColor} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        )}
        <Divider />
    </Paper>
);

export default WaybillsTable;