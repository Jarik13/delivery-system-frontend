import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GenericTable from './GenericTable';
import { MENU_GROUPS, ROLES } from '../constants/dictionaries';
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

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { auth } = useAuth();
    if (!auth) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(auth.role))
        return <Navigate to="/" replace />;
    return children;
};

const ALL_EXCEPT_SUPER_ADMIN = [ROLES.EMPLOYEE, ROLES.DRIVER, ROLES.COURIER, ROLES.ADMIN];
const ED = [ROLES.EMPLOYEE, ROLES.DRIVER];
const CDA = [ROLES.COURIER, ROLES.DRIVER];

const AppRoutes = () => {
    const { auth } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={
                auth
                    ? <Navigate to={auth.role === ROLES.SUPER_ADMIN ? '/admin' : '/'} replace />
                    : <LoginPage />
            } />

            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                    <SuperAdminPage />
                </ProtectedRoute>
            } />

            <Route path="/" element={
                <ProtectedRoute allowedRoles={ALL_EXCEPT_SUPER_ADMIN}>
                    <Navigate to="/shipments" replace />
                </ProtectedRoute>
            } />

            <Route path="/branches" element={<ProtectedRoute allowedRoles={ED}><BranchesPage /></ProtectedRoute>} />
            <Route path="/postomats" element={<ProtectedRoute allowedRoles={ED}><PostomatsPage /></ProtectedRoute>} />
            <Route path="/routes" element={<ProtectedRoute allowedRoles={[ROLES.DRIVER]}><RoutesPage /></ProtectedRoute>} />
            <Route path="/parcels" element={<ProtectedRoute allowedRoles={ED}><ParcelsPage /></ProtectedRoute>} />
            <Route path="/shipments" element={<ProtectedRoute allowedRoles={ED}><ShipmentsPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute allowedRoles={ED}><PaymentsPage /></ProtectedRoute>} />
            <Route path="/returns" element={<ProtectedRoute allowedRoles={ED}><ReturnsPage /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute allowedRoles={[ROLES.DRIVER]}><TripsPage /></ProtectedRoute>} />
            <Route path="/waybills" element={<ProtectedRoute allowedRoles={[ROLES.DRIVER]}><WaybillsPage /></ProtectedRoute>} />
            <Route path="/route-lists" element={<ProtectedRoute allowedRoles={CDA}><RouteListsPage /></ProtectedRoute>} />

            {MENU_GROUPS.flatMap(group => group.items).map((item) => (
                !item.isCustomPage && (
                    <Route
                        key={item.path}
                        path={`/${item.path}`}
                        element={
                            <ProtectedRoute allowedRoles={item.roles}>
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