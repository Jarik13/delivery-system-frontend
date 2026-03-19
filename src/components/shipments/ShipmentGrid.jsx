import React from 'react';
import { Grid } from '@mui/material';
import ShipmentCard from './ShipmentCard';
import { isShipmentEditable } from '../../constants/shipmentConstants';

const ShipmentGrid = ({
    shipments, mainColor, statusColors,
    expandedHistory, expandedFinance, movements,
    onDelete, onToggleHistory, onToggleFinance, onEdit,
}) => (
    <Grid container spacing={3} sx={{ m: 0, width: '100%', display: 'flex', flexWrap: 'wrap' }}>
        {shipments.map((s) => (
            <Grid item key={s.id} xs={12} sm={6} md={4} lg={3} xl={2.4} sx={{ display: 'flex', flexGrow: 1 }}>
                <ShipmentCard
                    s={s}
                    mainColor={mainColor}
                    statusColors={statusColors}
                    isHistoryExpanded={expandedHistory[s.id]}
                    isFinanceExpanded={expandedFinance[s.id]}
                    history={movements[s.id] || []}
                    onDelete={onDelete}
                    onToggleHistory={onToggleHistory}
                    onToggleFinance={onToggleFinance}
                    onEdit={onEdit}
                    editable={isShipmentEditable(s.shipmentStatusName)}
                />
            </Grid>
        ))}
    </Grid>
);

export default ShipmentGrid;