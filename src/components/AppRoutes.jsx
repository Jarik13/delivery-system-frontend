import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GenericTable from './GenericTable';
import { MENU_GROUPS } from '../constants/dictionaries';

import BranchesPage from '../pages/BranchesPage';
import PostomatsPage from '../pages/PostomatsPage';
import RoutesPage from '../pages/RoutesPage';
import ParcelsPage from '../pages/ParcelsPage';
import ShipmentsPage from '../pages/ShipmentsPage';
import TripsPage from '../pages/TripsPage';
import WaybillsPage from '../pages/WaybillsPage';
import RouteListsPage from '../pages/RouteListsPage';
import PaymentsPage from '../pages/PaymentsPage';
import ReturnsPage from '../pages/ReturnsPage';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/shipments" replace />} />

            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/postomats" element={<PostomatsPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/parcels" element={<ParcelsPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/waybills" element={<WaybillsPage />} />
            <Route path="/route-lists" element={<RouteListsPage />} />

            {MENU_GROUPS.flatMap(group => group.items).map((item) => (
                !item.isCustomPage && (
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

            <Route path="*" element={<h2>Сторінку не знайдено</h2>} />
        </Routes>
    );
};

export default AppRoutes;