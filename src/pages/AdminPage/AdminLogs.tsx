import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Select, Space, Tag, Typography, message, Grid } from 'antd';
import type { AdminLog } from '../../services/adminServices/getAdminLogs';
import dayjs from 'dayjs';
import getAdminLogsApi from '../../services/adminServices/getAdminLogs';
import type { ColumnsType } from 'antd/es/table/interface';

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const AdminLogs = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.md; // Mobile if screen is below md

    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filters, setFilters] = useState({
        actionType: undefined as string | undefined,
        startDate: undefined as string | undefined,
        endDate: undefined as string | undefined,
    });

    const fetchLogs = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const response = await getAdminLogsApi({
                page: page.toString(),
                limit: pageSize.toString(),
                actionType: filters.actionType,
                startDate: filters.startDate,
                endDate: filters.endDate,
            });

            setLogs(response.logs);
            setPagination({
                current: response.page,
                pageSize: response.limit,
                total: response.total,
            });
        } catch (error: any) {
            message.error(error.message || 'Không thể tải danh sách log');
            setLogs([]);
            setPagination({
                current: 1,
                pageSize: 10,
                total: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(pagination.current, pagination.pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleTableChange = (pagination: any) => {
        fetchLogs(pagination.current, pagination.pageSize);
    };

    const handleDateRangeChange = (dates: any) => {
        if (dates) {
            setFilters({
                ...filters,
                startDate: dates[0]?.format('YYYY-MM-DD HH:mm:ss'),
                endDate: dates[1]?.format('YYYY-MM-DD HH:mm:ss'),
            });
        } else {
            setFilters({
                ...filters,
                startDate: undefined,
                endDate: undefined,
            });
        }
    };

    const handleActionTypeChange = (value: string) => {
        setFilters({
            ...filters,
            actionType: value,
        });
    };

    const getActionTypeColor = (type: string) => {
        switch (type) {
            case 'create':
                return 'green';
            case 'update':
                return 'blue';
            case 'delete':
                return 'red';
            case 'view':
                return 'purple';
            default:
                return 'default';
        }
    };

    const columns: ColumnsType<AdminLog> = React.useMemo(
        () => [
            {
                title: 'Thời gian',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) => (
                    <span className="font-medium text-gray-700">
                        {dayjs(date).format(isMobile ? 'DD/MM/YY HH:mm' : 'YYYY-MM-DD HH:mm:ss')}
                    </span>
                ),
                sorter: (a: AdminLog, b: AdminLog) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                width: isMobile ? 100 : 160,
                fixed: isMobile ? undefined : ('left' as 'left'),
                responsive: ['xs', 'sm'],
            },
            {
                title: 'Admin',
                dataIndex: 'admin_name',
                key: 'admin_name',
                render: (_: string, record: AdminLog) => (
                    <div>
                        <div className="font-medium text-gray-700">{record.admin_name}</div>
                        <div className="text-sm text-gray-500">{record.admin_email}</div>
                    </div>
                ),
                width: isMobile ? 120 : 200,
                responsive: ['xs', 'sm'],
            },
            {
                title: 'Hành động',
                dataIndex: 'action',
                key: 'action',
                render: (action: string, record: AdminLog) => (
                    <Space direction="vertical" size="small" style={{ maxWidth: isMobile ? 150 : 250 }}>
                        <Tag color={getActionTypeColor(record.action_type)} className="font-medium">
                            {record.action}
                        </Tag>
                        <div
                            className="text-sm text-gray-600 truncate"
                            style={{ maxWidth: isMobile ? 150 : 250 }}
                            title={record.description}
                        >
                            {record.description}
                        </div>
                    </Space>
                ),
                width: isMobile ? 150 : 250,
                responsive: ['xs', 'sm'],
            },
            {
                title: 'Thay đổi',
                dataIndex: 'changes',
                key: 'changes',
                render: (_: any, record: AdminLog) => {
                    if (!record.old_data && !record.new_data) return null;

                    return (
                        <div className="text-sm max-w-[400px] whitespace-pre-wrap break-words">
                            {record.old_data && (
                                <div className="text-red-500">
                                    <strong>Cũ:</strong> {JSON.stringify(record.old_data)}
                                </div>
                            )}
                            {record.new_data && (
                                <div className="text-green-500">
                                    <strong>Mới:</strong> {JSON.stringify(record.new_data)}
                                </div>
                            )}
                        </div>
                    );
                },
                width: isMobile ? 150 : 400,
                responsive: ['md'],
            },
            {
                title: 'IP',
                dataIndex: 'ip_address',
                key: 'ip_address',
                render: (text: string) => <span className="text-gray-700">{text}</span>,
                width: isMobile ? 80 : 120,
                responsive: ['lg'],
            },
        ],
        [isMobile],
    );

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <Card
                title={<span className="text-lg font-semibold text-gray-800">Lịch sử hoạt động Admin</span>}
                className="rounded-xl shadow-sm border border-gray-200 bg-white"
            >
                <Space
                    direction={isMobile ? 'vertical' : 'horizontal'}
                    size="middle"
                    className="mb-6 w-full flex flex-wrap gap-4"
                >
                    <RangePicker
                        onChange={handleDateRangeChange}
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        className="w-full md:w-[300px] rounded-md"
                        placeholder={['Từ ngày', 'Đến ngày']}
                    />
                    <Select
                        className="w-full md:w-[200px] rounded-md"
                        placeholder="Loại hành động"
                        allowClear
                        onChange={handleActionTypeChange}
                        options={[
                            { value: 'create', label: 'Tạo mới' },
                            { value: 'update', label: 'Cập nhật' },
                            { value: 'delete', label: 'Xóa' },
                            { value: 'view', label: 'Xem' },
                        ]}
                    />
                </Space>

                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="id"
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        position: ['bottomCenter'],
                        className: 'py-4',
                    }}
                    loading={{
                        spinning: loading,
                        tip: 'Đang tải dữ liệu...',
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    className="ant-table-custom"
                />
            </Card>
        </div>
    );
};

export default AdminLogs;
