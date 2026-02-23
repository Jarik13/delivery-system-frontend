import React from 'react';
import { Grid } from '@mui/material';

import ShipmentCard from './ShipmentCard';

const ShipmentGrid = ({
    shipments,
    mainColor,
    statusColors,
    expandedHistory,
    expandedFinance,
    movements,
    onDelete,
    onToggleHistory,
    onToggleFinance
}) => {
    return (
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
                    />
                </Grid>
            ))}
        </Grid>
    );
};

export default ShipmentGrid;