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
import LoginPage from '../pages/LoginPage';
import SuperAdminPage from '../pages/SuperAdminPage';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { auth } = useAuth();
    if (!auth) return <Navigate to="/login" replace />;
    if (requiredRole && auth.role !== requiredRole) return <Navigate to="/" replace />;
    return children;
};

const AppRoutes = () => {
    const { auth } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={
                auth
                    ? <Navigate to={auth.role === 'ROLE_SUPER_ADMIN' ? '/admin' : '/'} replace />
                    : <LoginPage />
            } />

            <Route path="/admin" element={
                <ProtectedRoute requiredRole="ROLE_SUPER_ADMIN">
                    <SuperAdminPage />
                </ProtectedRoute>
            } />

            <Route path="/" element={
                <ProtectedRoute>
                    <Navigate to="/shipments" replace />
                </ProtectedRoute>
            } />

            <Route path="/branches" element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />
            <Route path="/postomats" element={<ProtectedRoute><PostomatsPage /></ProtectedRoute>} />
            <Route path="/routes" element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
            <Route path="/parcels" element={<ProtectedRoute><ParcelsPage /></ProtectedRoute>} />
            <Route path="/shipments" element={<ProtectedRoute><ShipmentsPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/returns" element={<ProtectedRoute><ReturnsPage /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
            <Route path="/waybills" element={<ProtectedRoute><WaybillsPage /></ProtectedRoute>} />
            <Route path="/route-lists" element={<ProtectedRoute><RouteListsPage /></ProtectedRoute>} />

            {MENU_GROUPS.flatMap(group => group.items).map((item) => (
                !item.isCustomPage && (
                    <Route
                        key={item.path}
                        path={`/${item.path}`}
                        element={
                            <ProtectedRoute>
                                <GenericTable
                                    endpoint={item.endpoint}
                                    title={item.label}
                                    columns={item.columns}
                                />
                            </ProtectedRoute>
                        }
                    />
                )
            ))}

            <Route path="*" element={<h2>Сторінку не знайдено</h2>} />
        </Routes>
    );
};

export default AppRoutes;