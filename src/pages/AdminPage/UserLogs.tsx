import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Select, Button, Input } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { getUserLogsApi } from '../../services/adminServices';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { ColumnsType } from 'antd/es/table';
import type { UserLog } from '../../services/types/types';
import { useMessage } from '@/hooks/useMessage';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Search } = Input;

const UserLogs = () => {
    const { message, contextHolder } = useMessage();
    const [logs, setLogs] = useState<UserLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<UserLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [actionFilter, setActionFilter] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 576);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchLogs = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const response = await getUserLogsApi({
                page: page.toString(),
                limit: pageSize.toString(),
                fullName: searchText || undefined,
            });

            setLogs(response.logs);
            setFilteredLogs(response.logs);
            setPagination({
                current: response.page,
                pageSize: response.limit,
                total: response.total,
            });
        } catch (error) {
            message.error({ key: 'fetch-logs', content: 'Không thể tải lịch sử hoạt động' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(pagination.current, pagination.pageSize);
    }, [searchText]);

    useEffect(() => {
        let tempLogs = [...logs];

        if (actionFilter) {
            tempLogs = tempLogs.filter((log) => log.action === actionFilter);
        }

        if (dateRange) {
            tempLogs = tempLogs.filter((log) => {
                const logDate = dayjs(log.created_at);
                return logDate.isAfter(dateRange[0].startOf('day')) && logDate.isBefore(dateRange[1].endOf('day'));
            });
        }

        setFilteredLogs(tempLogs);
    }, [logs, actionFilter, dateRange]);

    const columns: ColumnsType<UserLog> = React.useMemo(
        () => [
            {
                title: 'Thời gian',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) => (
                    <span className="font-medium text-gray-700">
                        {dayjs(date).format(isMobile ? 'DD/MM/YY HH:mm' : 'DD/MM/YYYY HH:mm:ss')}
                    </span>
                ),
                sorter: (a: UserLog, b: UserLog) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
                width: isMobile ? 100 : 160,
                responsive: ['xs', 'sm'],
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                render: (text: string) => <span className="text-gray-700">{text}</span>,
                sorter: (a: UserLog, b: UserLog) => a.email.localeCompare(b.email),
                width: isMobile ? 120 : 200,
                responsive: ['xs', 'sm'],
            },
            {
                title: 'Họ và tên',
                dataIndex: 'full_name',
                key: 'full_name',
                render: (text: string) => <span className="text-gray-700">{text}</span>,
                sorter: (a: UserLog, b: UserLog) => a.full_name.localeCompare(b.full_name),
                width: isMobile ? 100 : 180,
                responsive: ['xs', 'sm'],
            },
            {
                title: 'Hành động',
                dataIndex: 'action',
                key: 'action',
                render: (action: string) => (
                    <span className="font-medium text-blue-600">
                        {actionOptions.find((opt) => opt.value === action)?.label || action}
                    </span>
                ),
                width: isMobile ? 100 : 150,
                filters: [
                    { text: 'Đăng nhập', value: 'LOGIN' },
                    { text: 'Đăng xuất', value: 'LOGOUT' },
                    { text: 'Tạo nhóm', value: 'CREATE_TEAM' },
                    { text: 'Cập nhật thông tin', value: 'UPDATE_PROFILE' },
                    { text: 'Admin - Xem lịch sử tham gia', value: 'Admin - Xem lịch sử tham gia' },
                ],
                onFilter: (value, record) => record.action === value,
                responsive: ['xs', 'sm'],
            },
            {
                title: 'Mô tả',
                dataIndex: 'description',
                key: 'description',
                render: (text: string) => <span className="text-gray-600">{text}</span>,
                ellipsis: {
                    showTitle: true,
                },
                width: isMobile ? 100 : 250,
                responsive: ['sm'],
            },
            {
                title: 'Địa chỉ IP',
                dataIndex: 'ip_address',
                key: 'ip_address',
                render: (text: string) => <span className="text-gray-700">{text}</span>,
                width: isMobile ? 80 : 120,
                responsive: ['md'],
            },
        ],
        [isMobile],
    );

    const actionOptions = [
        { value: 'LOGIN', label: 'Đăng nhập' },
        { value: 'LOGOUT', label: 'Đăng xuất' },
        { value: 'CREATE_TEAM', label: 'Tạo nhóm' },
        { value: 'UPDATE_PROFILE', label: 'Cập nhật thông tin' },
        { value: 'Admin - Xem lịch sử tham gia', label: 'Admin - Xem lịch sử tham gia' },
    ];

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            {contextHolder}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">Lịch sử hoạt động người dùng</span>}
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2"
                        onClick={() => fetchLogs(pagination.current, pagination.pageSize)}
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                }
                className="rounded-xl shadow-sm border border-gray-200 bg-white"
            >
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <Search
                            placeholder="Tìm kiếm theo họ tên"
                            allowClear
                            enterButton={<SearchOutlined />}
                            onSearch={(value) => {
                                setSearchText(value);
                                setPagination((prev) => ({ ...prev, current: 1 }));
                            }}
                            className="w-full rounded-md"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <RangePicker
                            onChange={(dates) =>
                                dates && dates[0] && dates[1] ? setDateRange([dates[0], dates[1]]) : setDateRange(null)
                            }
                            format="DD/MM/YYYY"
                            placeholder={['Từ ngày', 'Đến ngày']}
                            className="w-full rounded-md"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <Select
                            placeholder="Lọc theo hành động"
                            allowClear
                            onChange={setActionFilter}
                            className="w-full rounded-md"
                            options={actionOptions}
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredLogs}
                    rowKey="id"
                    loading={{
                        spinning: loading,
                        tip: 'Đang tải dữ liệu...',
                    }}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        position: ['bottomCenter'],
                        className: 'py-4',
                    }}
                    onChange={(pagination) => fetchLogs(pagination.current, pagination.pageSize)}
                    scroll={{ x: 'max-content' }}
                    className="ant-table-custom"
                />
            </Card>
        </div>
    );
};

export default UserLogs;
