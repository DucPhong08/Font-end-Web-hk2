import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMessage } from '@/hooks/useMessage';
import { getToken } from '@/utils/auth/authUtils';
import { useUser } from '@/contexts/useAuth/userContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
    const { message, contextHolder } = useMessage();
    const token = getToken();
    const userRole = localStorage.getItem('role');

    if (!token) {
        message.error({
            key: 'auth',
            content: 'Vui lòng đăng nhập để tiếp tục',
        });
        return (
            <>
                {contextHolder}
                <Navigate to="/" replace />
            </>
        );
    }

    if (requireAdmin && userRole !== 'admin') {
        message.warning({
            key: 'admin',
            content: 'Bạn không có quyền truy cập trang này',
        });
        return (
            <>
                {contextHolder}
                <Navigate to="/dashboard" replace />
            </>
        );
    }

    return (
        <>
            {contextHolder}
            {children}
        </>
    );
};

export default ProtectedRoute;
