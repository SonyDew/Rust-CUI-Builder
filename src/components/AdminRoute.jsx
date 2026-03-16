import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="route-loader">Checking admin access...</div>;
    }

    if (!user) {
        return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
    }

    if (!isAdmin) {
        return <Navigate to="/error/403" replace />;
    }

    return children;
};

export default AdminRoute;
