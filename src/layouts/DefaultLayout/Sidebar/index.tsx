// Sidebar.tsx
import React, { useState, useLayoutEffect, useCallback, useMemo } from 'react';
import { Layout, Menu } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarFooter from './SidebarFooter';
import Route from '@/routes/type';

const { Sider } = Layout;

interface SidebarProps {
    collapsed: boolean;
    onCollapse?: (collapsed: boolean) => void;
    routes: Route[];
    overlay?: boolean;
    onCloseOverlay?: () => void;
}

const Sidebar = ({ collapsed, onCollapse, routes, overlay = false, onCloseOverlay }: SidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useLayoutEffect(() => {
        let timeoutId: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWindowWidth(window.innerWidth);
            }, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    const isMobile = windowWidth <= 768;

    useLayoutEffect(() => {
        if (onCollapse) {
            onCollapse(isMobile);
        }
    }, [isMobile, onCollapse]);

    const width = isMobile ? 200 : 256;
    const collapsedWidth = isMobile ? 40 : 60;

    const renderIcon = useCallback((icon?: any) => {
        if (!icon) return null;
        return (
            <div className="flex items-center justify-center w-5 h-5">
                <FontAwesomeIcon icon={icon} className="text-base" />
            </div>
        );
    }, []);

    const getMenuItem = useCallback(
        (route: Route) => {
            if (route.children?.length) {
                return {
                    key: route.path,
                    icon: renderIcon(route.icon),
                    label: route.name,
                    children: route.children.map((child) => ({
                        key: `${route.path}/${child.path}`,
                        icon: renderIcon(child.icon),
                        label: child.name,
                    })),
                };
            }

            return {
                key: route.path,
                icon: renderIcon(route.icon),
                label: route.name,
            };
        },
        [renderIcon],
    );

    const menuItems = useMemo(() => routes.map(getMenuItem), [routes, getMenuItem]);

    const handleMenuClick = useCallback(
        ({ key }: { key: string }) => {
            navigate(key);
            if (overlay && onCloseOverlay) {
                onCloseOverlay();
            }
        },
        [navigate, overlay, onCloseOverlay],
    );

    return (
        <>
            {/* Overlay đen chỉ hiện khi overlay bật và sidebar mở */}
            {overlay && !collapsed && (
                <div
                    onClick={onCloseOverlay}
                    className="fixed inset-0 bg-black bg-opacity-50 z-[10] transition-opacity duration-300"
                    aria-hidden="true"
                />
            )}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                onCollapse={onCollapse}
                width={width}
                collapsedWidth={collapsedWidth}
                className={`min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 shadow-xl transition-all duration-300 ease-out z-[20] ${
                    overlay && !collapsed ? 'fixed top-0 left-0 h-full' : ''
                }`}
                style={{
                    ...(overlay && !collapsed ? { position: 'fixed', height: '100vh' } : {}),
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    perspective: '1000px',
                    willChange: 'width, transform',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                breakpoint="md"
                onBreakpoint={(broken) => {
                    if (onCollapse) onCollapse(broken);
                }}
            >
                <div className="flex items-center justify-center p-4 border-b border-gray-700/50 h-16 backdrop-blur-sm">
                    <div
                        className="text-xl font-bold whitespace-nowrap transition-all duration-300 ease-out cursor-default select-none"
                        style={{
                            background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {collapsed ? 'TM' : 'Task Manager'}
                    </div>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    className="bg-transparent border-r-0"
                    style={{
                        padding: '8px 0',
                        fontSize: '14px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    inlineCollapsed={collapsed}
                />
                <SidebarFooter collapsed={collapsed} />
            </Sider>
        </>
    );
};

export default Sidebar;
