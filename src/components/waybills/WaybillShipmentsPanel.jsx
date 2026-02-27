import React from 'react';
import {
    TableRow, TableCell, Collapse, Box, Typography,
    Table, TableHead, TableBody, TableContainer, alpha,
} from '@mui/material';
import WaybillShipmentRow from './WaybillShipmentRow';

const WaybillShipmentsPanel = ({ open, shipments = [], mainColor, colSpan = 8 }) => (
    <TableRow>
        <TableCell
            colSpan={colSpan}
            sx={{
                p: 0,
                borderBottom: 'none',
                maxWidth: 0,
                overflow: 'hidden',
            }}
        >
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{
                    bgcolor: alpha(mainColor, 0.02),
                    borderTop: `1px solid ${alpha(mainColor, 0.15)}`,
                    overflowX: 'auto',
                    width: '100%',
                }}>
                    {shipments.length === 0 ? (
                        <Typography variant="caption" color="text.secondary"
                            sx={{ display: 'block', p: 2, pl: 4 }}>
                            Відправлень немає
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table size="small" sx={{ minWidth: 700 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ pl: 4, py: 0.5, fontSize: 11, color: '#999', width: 40 }}>#</TableCell>
                                        <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>Трек-номер</TableCell>
                                        <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>Відправник</TableCell>
                                        <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>Отримувач</TableCell>
                                        <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>Маршрут</TableCell>
                                        <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>Вага</TableCell>
                                        <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>Вартість</TableCell>
                                        <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>Статус</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {shipments.map((s, i) => (
                                        <WaybillShipmentRow key={s.id} shipment={s} idx={i} mainColor={mainColor} />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Collapse>
        </TableCell>
    </TableRow>
);

export default WaybillShipmentsPanel;