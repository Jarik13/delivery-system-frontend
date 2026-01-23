import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import GenericTable from './GenericTable';
import { MENU_GROUPS } from '../constants/dictionaries';

// Імпортуємо нові сторінки
import BranchesPage from '../pages/BranchesPage';
import PostomatsPage from '../pages/PostomatsPage';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<h2>Головна</h2>} />
            
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/postomats" element={<PostomatsPage />} />

            {MENU_GROUPS.flatMap(group => group.items).map((item) => (
                item.path !== 'branches' && item.path !== 'postomats' && (
                    <Route 
                        key={item.path} 
                        path={`/${item.path}`} 
                        element={
                            <GenericTable 
                                endpoint={item.endpoint} 
                                title={item.label} 
                                columns={item.columns} 
                            />
                        } 
                    />
                )
            ))}
        </Routes>
    );
};

export default AppRoutes;