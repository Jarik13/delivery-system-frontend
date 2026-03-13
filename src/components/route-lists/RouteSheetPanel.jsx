import React from 'react';
import {
    TableRow, TableCell, Collapse, Box, Typography,
    Table, TableHead, TableBody, alpha,
} from '@mui/material';
import RouteSheetItemRow from './RouteSheetItemRow';

const RouteSheetPanel = ({ open, shipments = [], mainColor }) => (
    <TableRow>
        <TableCell colSpan={9} sx={{ p: 0, borderBottom: 'none' }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{
                    bgcolor: alpha(mainColor, 0.02),
                    borderTop: `1px solid ${alpha(mainColor, 0.15)}`,
                }}>
                    {shipments.length === 0 ? (
                        <Typography variant="caption" color="text.secondary"
                            sx={{ display: 'block', p: 2, pl: 4 }}>
                            Посилок немає
                        </Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ pl: 4, py: 0.5, fontSize: 11, color: '#999', width: 40 }}>#</TableCell>
                                    <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999' }}>Трек-номер</TableCell>
                                    <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999' }}>Отримувач та адреса</TableCell>
                                    <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999' }}>Вага</TableCell>
                                    <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999' }}>Оплата</TableCell>
                                    <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999' }}>Статус доставки</TableCell>
                                    <TableCell sx={{ py: 0.5, fontSize: 11, color: '#999' }}>Час вручення</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {shipments.map((s, i) => (
                                    <RouteSheetItemRow key={s.id} item={s} idx={i} mainColor={mainColor} />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Box>
            </Collapse>
        </TableCell>
    </TableRow>
);

export default RouteSheetPanel;