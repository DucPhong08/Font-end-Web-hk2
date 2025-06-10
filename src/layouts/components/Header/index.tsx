import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, Dropdown, Button, Badge, Space, Typography, List, Tag, Spin, Modal } from 'antd';
import {
    BellOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { getReminders, markReminderRead } from '@services/remiderService';
import { Reminder, UserProfile } from '@services/types/types';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface HeaderProps {
    collapsed: boolean;
    onCollapse: () => void;
    user: UserProfile | null;
    logout: () => void;
    onSettingsClick: () => void;
}

const formatTimeAgo = (date: string): string => {
    const now = dayjs();
    const reminderDate = dayjs(date);
    const diffInMinutes = now.diff(reminderDate, 'minute');
    const diffInHours = now.diff(reminderDate, 'hour');
    const diffInDays = now.diff(reminderDate, 'day');

    if (diffInMinutes < 0) return reminderDate.format('DD/MM/YYYY HH:mm');
    if (diffInDays <= 3) {
        if (diffInDays > 0) return `${diffInDays} ngày trước`;
        if (diffInHours > 0) return `${diffInHours} giờ trước`;
        return `${diffInMinutes} phút trước`;
    }
    return reminderDate.format('DD/MM/YYYY HH:mm');
};

const isNewReminder = (date: string): boolean => {
    const now = dayjs();
    const reminderDate = dayjs(date);
    const diffInDays = now.diff(reminderDate, 'day');
    return diffInDays <= 1;
};

function Header({ collapsed, onCollapse, user, logout, onSettingsClick }: HeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalReminders, setTotalReminders] = useState(0);
    const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { message, contextHolder } = useMessage();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTotalReminders = async () => {
            try {
                const response = await getReminders({
                    is_read: '0',
                    page: '1',
                    limit: '1',
                });
                setTotalReminders(response.pagination.total);
            } catch (error: any) {
                console.error('Error fetching total reminders:', error);
            }
        };
        fetchTotalReminders();
    }, []);

    const fetchReminders = useCallback(
        async (pageNum: number = 1) => {
            try {
                setLoading(true);
                const response = await getReminders({
                    is_read: '0',
                    page: pageNum.toString(),
                    limit: '5',
                });

                if (pageNum === 1) {
                    setReminders(response.data);
                } else {
                    setReminders((prev) => [...prev, ...response.data]);
                }

                setTotalReminders(response.pagination.total);
                setHasMore(response.data.length === 5);
                setPage(pageNum);
            } catch (error: any) {
                message.error(error.message || 'Không thể tải thông báo');
            } finally {
                setLoading(false);
            }
        },
        [message],
    );

    const handleReminderClick = (reminder: Reminder) => {
        setSelectedReminder(reminder);
        setIsModalOpen(true);
        setIsNotificationOpen(false);
    };

    const handleMarkAsRead = useCallback(
        async (id: number) => {
            try {
                await markReminderRead(id);
                setReminders((prev) =>
                    prev.map((reminder) => (reminder.id === id ? { ...reminder, is_read: true } : reminder)),
                );
                message.success({ key: 'markRead', content: 'Đã đánh dấu đã đọc' });
                setIsModalOpen(false);
                setSelectedReminder(null);
            } catch (error: any) {
                message.error({ key: 'markReadError', content: error.message || 'Không thể cập nhật trạng thái' });
            }
        },
        [message],
    );

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
                fetchReminders(page + 1);
            }
        },
        [fetchReminders, loading, hasMore, page],
    );

    useEffect(() => {
        if (isNotificationOpen) {
            fetchReminders(1);
        }
    }, [isNotificationOpen, fetchReminders]);

    const handleLogout = () => {
        message.loading({ key: 'logout', content: 'Đang đăng xuất...' });
        logout();
    };

    const userMenuItems = [
        {
            key: 'profile',
            label: 'Thông tin cá nhân',
            icon: <UserOutlined />,
            onClick: () => navigate('/user'),
        },
        {
            key: 'settings',
            label: 'Cài đặt',
            icon: <SettingOutlined />,
            onClick: onSettingsClick,
        },
        {
            key: 'logout',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            onClick: handleLogout,
            danger: true,
        },
    ];

    const getTypeColor = (type: string | undefined) => {
        switch (type) {
            case 'task':
                return 'green';
            case 'assignment':
                return 'blue';
            default:
                return 'default';
        }
    };

    const notificationContent = (
        <div className="w-[280px] sm:w-[320px] md:w-[360px] bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                    <Text strong className="text-gray-800 text-sm sm:text-base">
                        Thông báo
                    </Text>
                    <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{totalReminders} thông báo</div>
                </div>
                <Button
                    type="link"
                    onClick={() => navigate('/reminder')}
                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm "
                >
                    Xem tất cả
                </Button>
            </div>
            <div className="max-h-[320px] sm:max-h-[400px] overflow-y-auto" onScroll={handleScroll}>
                {loading && page === 1 ? (
                    <div className="flex justify-center items-center p-4 sm:p-6">
                        <Spin size="default" />
                    </div>
                ) : reminders.length > 0 ? (
                    <List
                        dataSource={reminders}
                        renderItem={(reminder) => (
                            <List.Item
                                key={reminder.id}
                                className=" hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors duration-200"
                                onClick={() => handleReminderClick(reminder)}
                            >
                                <List.Item.Meta
                                    className="ml-4"
                                    title={
                                        <div className="flex items-start">
                                            <span className="text-gray-800 text-xs md:text-sm ">
                                                <b className="block break-words max-w-[42ch] mb-2">{reminder.mes}</b>
                                                <div className="inline-flex items-center space-x-1">
                                                    {!reminder.is_read &&
                                                        reminder.start_time &&
                                                        isNewReminder(reminder.start_time) && (
                                                            <Tag
                                                                color="blue"
                                                                className="text-[8px] md:text-xs px-1 py-0 leading-3"
                                                            >
                                                                Mới
                                                            </Tag>
                                                        )}
                                                    {reminder.type && (
                                                        <Tag
                                                            color={getTypeColor(reminder.type)}
                                                            className="text-[8px] md:text-xs leading-3 my-1"
                                                        >
                                                            {reminder.type === 'task' ? 'Công việc' : 'Phân công'}
                                                        </Tag>
                                                    )}
                                                </div>
                                            </span>
                                        </div>
                                    }
                                    description={
                                        reminder.start_time && (
                                            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                                                {formatTimeAgo(reminder.start_time)}
                                            </p>
                                        )
                                    }
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <div className="p-4 sm:p-6 text-center text-gray-500">
                        <div className="text-gray-400 mb-1.5 sm:mb-2">
                            <BellOutlined className="text-lg sm:text-xl" />
                        </div>
                        <p className="text-xs sm:text-sm">Không có thông báo mới</p>
                    </div>
                )}
                {loading && page > 1 && (
                    <div className="flex justify-center p-1.5 sm:p-2">
                        <Spin size="small" />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {contextHolder}
            <Modal
                title={
                    <div className="flex items-center">
                        <span className="text-sm sm:text-base">Chi tiết thông báo</span>
                        {selectedReminder?.type && (
                            <Tag
                                color={getTypeColor(selectedReminder.type)}
                                className="ml-2 text-[8px] sm:text-[9px] px-1 py-0 leading-3"
                            >
                                {selectedReminder.type === 'task' ? 'Công việc' : 'Phân công'}
                            </Tag>
                        )}
                    </div>
                }
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setSelectedReminder(null);
                }}
                footer={[
                    <Button
                        key="markAsRead"
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => selectedReminder && handleMarkAsRead(selectedReminder.id)}
                        disabled={selectedReminder?.is_read}
                        className="text-xs sm:text-sm"
                    >
                        Đánh dấu đã đọc
                    </Button>,
                    <Button
                        key="close"
                        onClick={() => {
                            setIsModalOpen(false);
                            setSelectedReminder(null);
                        }}
                        className="text-xs sm:text-sm"
                    >
                        Đóng
                    </Button>,
                ]}
            >
                {selectedReminder && (
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center">
                            {!selectedReminder.is_read && (
                                <Tag color="blue" className="mr-2 text-[8px] sm:text-[9px] px-1 py-0 leading-3">
                                    Mới
                                </Tag>
                            )}
                            <span className="text-xs sm:text-sm text-gray-500">
                                {selectedReminder.start_time && formatTimeAgo(selectedReminder.start_time)}
                            </span>
                        </div>
                        <div className="text-gray-800 text-xs sm:text-sm">{selectedReminder.mes}</div>
                    </div>
                )}
            </Modal>
            <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex h-16 items-center justify-between">
                        <div className="flex items-start">
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={onCollapse}
                                className="!text-white hover:!text-gray-100 transition-colors duration-300"
                                style={{
                                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                                    width: window.innerWidth <= 768 ? 48 : 64,
                                    height: window.innerWidth <= 768 ? 48 : 64,
                                }}
                            />
                        </div>

                        <div className="flex items-center">
                            <Space size="middle" className="mr-4">
                                <Dropdown
                                    dropdownRender={() => (
                                        <div className="custom-dropdown md:relative fixed top-16 left-1/2 -translate-x-1/2 w-[90vw] max-w-[360px] md:top-0 md:left-auto md:translate-x-0">
                                            {notificationContent}
                                        </div>
                                    )}
                                    trigger={['click']}
                                    open={isNotificationOpen}
                                    onOpenChange={setIsNotificationOpen}
                                    placement="bottomRight"
                                >
                                    <Badge
                                        count={totalReminders}
                                        size="small"
                                        className="cursor-pointer"
                                        style={{
                                            boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)',
                                        }}
                                    >
                                        <Button
                                            type="text"
                                            icon={
                                                <BellOutlined className="text-white text-xl hover:text-gray-100 transition-all duration-300 ease-in-out transform hover:scale-110" />
                                            }
                                            className="hover:bg-white/10 rounded-full flex items-center justify-center w-10 h-10 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-white/20"
                                        />
                                    </Badge>
                                </Dropdown>

                                <Dropdown
                                    menu={{ items: userMenuItems }}
                                    trigger={['click']}
                                    open={isDropdownOpen}
                                    onOpenChange={setIsDropdownOpen}
                                    placement="bottomRight"
                                >
                                    <Button
                                        type="text"
                                        className="p-0 hover:bg-white/10 rounded-full flex items-center transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-white/20"
                                    >
                                        <Space className="px-2">
                                            {/* Ẩn text trên màn hình nhỏ */}
                                            <Text className="text-white text-sm font-medium md:block hidden hover:text-gray-100 transition-colors duration-300">
                                                Xin chào, {user?.full_name || 'User'}
                                            </Text>
                                            <Avatar
                                                src={user?.avatar_url}
                                                icon={<UserOutlined />}
                                                className="border-2 border-white/30 hover:border-white/50 transition-all duration-300 ease-in-out transform hover:scale-105"
                                            />
                                        </Space>
                                    </Button>
                                </Dropdown>
                            </Space>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}

export default Header;
