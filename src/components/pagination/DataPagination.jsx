import React from 'react';
import { Box, TablePagination } from '@mui/material';

const DataPagination = ({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    label = "Рядків:",
    rowsPerPageOptions = [10, 20, 50],
}) => {
    return (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <TablePagination
                component="div"
                count={count}
                page={page}
                onPageChange={onPageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    onRowsPerPageChange(parseInt(e.target.value, 10));
                }}
                rowsPerPageOptions={rowsPerPageOptions}
                labelRowsPerPage={label}
                labelDisplayedRows={({ from, to, count }) => 
                    `${from}–${to} з ${count !== -1 ? count : `більше ніж ${to}`}`
                }
            />
        </Box>
    );
};

export default DataPagination;