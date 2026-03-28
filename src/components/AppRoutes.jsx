import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GenericTable from './GenericTable';
import { MENU_GROUPS } from '../constants/dictionaries';
import { ROLES, E, D, ED, EDC, C, A, EDCA } from '../constants/roles';
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
import AdminPage from '../pages/AdminPage';
import CourierPage from '../pages/CourierPage';
import ProfilePage from '../pages/ProfilePage';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { auth } = useAuth();
    if (!auth) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(auth.role))
        return <Navigate to={getDefaultPath(auth.role)} replace />;
    return children;
};


const getDefaultPath = (role) => {
    switch (role) {
        case ROLES.COURIER: return '/courier';
        case ROLES.DRIVER: return '/trips';
        case ROLES.ADMIN: return '/admin';
        case ROLES.SUPER_ADMIN: return '/super-admin';
        default: return '/shipments';
    }
};

const AppRoutes = () => {
    const { auth } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={
                auth
                    ? <Navigate to={auth.role === ROLES.SUPER_ADMIN ? '/super-admin' : getDefaultPath(auth.role)} replace />
                    : <LoginPage />
            } />

            <Route path="/super-admin" element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                    <SuperAdminPage />
                </ProtectedRoute>
            } />

            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                    <AdminPage />
                </ProtectedRoute>
            } />

            <Route path="/courier" element={
                <ProtectedRoute allowedRoles={[ROLES.COURIER]}>
                    <CourierPage />
                </ProtectedRoute>
            } />

            <Route path="/profile" element={
                <ProtectedRoute allowedRoles={EDCA}>
                    <ProfilePage />
                </ProtectedRoute>
            } />

            <Route path="/" element={
                <ProtectedRoute allowedRoles={EDCA}>
                    <Navigate to={auth ? getDefaultPath(auth.role) : '/login'} replace />
                </ProtectedRoute>
            } />

            <Route path="/shipments" element={<ProtectedRoute allowedRoles={E}><ShipmentsPage /></ProtectedRoute>} />
            <Route path="/parcels" element={<ProtectedRoute allowedRoles={E}><ParcelsPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute allowedRoles={E}><PaymentsPage /></ProtectedRoute>} />
            <Route path="/returns" element={<ProtectedRoute allowedRoles={E}><ReturnsPage /></ProtectedRoute>} />
            <Route path="/branches" element={<ProtectedRoute allowedRoles={E}><BranchesPage /></ProtectedRoute>} />
            <Route path="/postomats" element={<ProtectedRoute allowedRoles={E}><PostomatsPage /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute allowedRoles={ED}><TripsPage /></ProtectedRoute>} />
            <Route path="/waybills" element={<ProtectedRoute allowedRoles={ED}><WaybillsPage /></ProtectedRoute>} />
            <Route path="/route-lists" element={<ProtectedRoute allowedRoles={EDC}><RouteListsPage /></ProtectedRoute>} />
            <Route path="/routes" element={<ProtectedRoute allowedRoles={D}><RoutesPage /></ProtectedRoute>} />

            {MENU_GROUPS.flatMap(group => group.items).map((item) =>
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
            )}

            <Route path="*" element={<h2>Сторінку не знайдено</h2>} />
        </Routes>
    );
};

export default AppRoutes;