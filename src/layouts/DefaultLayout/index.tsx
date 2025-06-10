import React, { useCallback, useState, useEffect } from 'react';
import { Layout, Modal, Button, Space } from 'antd';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DefaultLayoutProps from './type';
import Sidebar from './Sidebar';
import { sidebarRoutes, adminSidebarRoutes } from '@/routes';
import { useUser } from '@contexts/useAuth/userContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMessage } from '@/hooks/useMessage';

const { Content } = Layout;

const DefaultLayout = ({ children }: DefaultLayoutProps) => {
    const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
    const [isManualCollapsed, setIsManualCollapsed] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const { user, logout: originalLogout } = useUser();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | null>(() => {
        return localStorage.getItem('selectedRole') as 'admin' | 'member' | null;
    });

    const navigate = useNavigate();
    const location = useLocation();
    const { message, contextHolder } = useMessage();

    const isMd = windowWidth >= 768;

    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth;
            setWindowWidth(newWidth);

            if (!isManualCollapsed) {
                setCollapsed(newWidth < 768);
            }
        };

        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isManualCollapsed]);

    const handleCollapse = useCallback(() => {
        setCollapsed((prev) => {
            setIsManualCollapsed(true);
            return !prev;
        });
    }, []);

    useEffect(() => {
        if (!user) return;

        const isFirstLogin = !localStorage.getItem('selectedRole') && user.role === 'admin';

        if (user.role === 'admin' && !location.pathname.startsWith('/admin') && selectedRole !== 'member') {
            navigate('/admin');
            if (isFirstLogin) setIsModalVisible(true);
        } else if (user.role === 'admin' && selectedRole === null) {
            setIsModalVisible(true);
        }
    }, [user, location.pathname, navigate, selectedRole]);

    const handleRoleSelect = useCallback(
        (role: 'admin' | 'member') => {
            setSelectedRole(role);
            localStorage.setItem('selectedRole', role);
            setIsModalVisible(false);
            navigate(role === 'admin' ? '/admin' : '/dashboard');
        },
        [navigate],
    );

    const handleSettingsClick = useCallback(() => {
        if (user?.role !== 'admin') {
            message.info({ key: 'settings', content: 'Tính năng này đang phát triển' });
            return;
        }
        setIsModalVisible(true);
    }, [user?.role, message]);

    const handleLogout = useCallback(() => {
        originalLogout();
        setSelectedRole(null);
        localStorage.removeItem('selectedRole');
        navigate('/login');
    }, [originalLogout, navigate]);

    const routes = location.pathname.startsWith('/admin') ? adminSidebarRoutes : sidebarRoutes;

    const overlay = !isMd && !collapsed;

    return (
        <>
            {contextHolder}

            {user?.role === 'admin' && (
                <Modal
                    title="Chọn quyền truy cập"
                    open={isModalVisible}
                    onCancel={() => {
                        if (selectedRole === null) {
                            handleRoleSelect('member');
                        } else {
                            setIsModalVisible(false);
                        }
                    }}
                    footer={null}
                    centered
                    maskClosable={false}
                    closable={selectedRole !== null}
                >
                    <div className="text-center">
                        <p className="mb-6 text-gray-600">
                            Xin chào {user?.full_name}, bạn muốn truy cập hệ thống với quyền nào?
                        </p>
                        <Space size="large">
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => handleRoleSelect('admin')}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Quản trị viên
                            </Button>
                            <Button
                                size="large"
                                onClick={() => handleRoleSelect('member')}
                                className="hover:bg-gray-100"
                            >
                                Người dùng
                            </Button>
                        </Space>
                    </div>
                </Modal>
            )}

            <Layout
                className="transition-all duration-300 bg-white"
                style={{
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '100vh',
                    overflow: 'hidden',
                }}
            >
                <Sidebar
                    collapsed={collapsed}
                    routes={routes}
                    overlay={overlay}
                    onCloseOverlay={() => setCollapsed(true)}
                />
                <Layout className="flex flex-col h-screen">
                    <Header
                        collapsed={collapsed}
                        onCollapse={handleCollapse}
                        onSettingsClick={handleSettingsClick}
                        logout={handleLogout}
                        user={user}
                    />
                    <Content
                        className="relative p-6 overflow-y-auto bg-slate-50"
                        style={{
                            flex: 1,
                            overflowX: 'hidden',
                        }}
                    >
                        {children}
                    </Content>
                    <Footer />
                </Layout>
            </Layout>
        </>
    );
};

export default DefaultLayout;
