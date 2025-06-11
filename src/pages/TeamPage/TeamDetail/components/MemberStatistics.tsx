import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, Tag, Progress } from 'antd';
import { getMemberStatistics } from '@services/teamServices';
import { useMessage } from '@hooks/useMessage';
import { MemberStatistics as MemberStatisticsData } from '@services/types/types';
import {
    UserOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FireOutlined,
    TrophyOutlined,
    CalendarOutlined,
    CommentOutlined,
    FileTextOutlined,
} from '@ant-design/icons';

const STATUS_MAP = {
    todo: 'Chưa bắt đầu',
    in_progress: 'Đang thực hiện',
    done: 'Hoàn thành',
} as const;

const PRIORITY_MAP = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
} as const;

const STATUS_COLORS = {
    todo: '#f59e0b',
    in_progress: '#3b82f6',
    done: '#10b981',
};

const PRIORITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
};

interface MemberStatisticsProps {
    teamId: number;
    userId: number;
    onClose?: () => void;
}

const StatisticCard = ({
    title,
    value,
    suffix,
    icon,
    color = '#1890ff',
    bgGradient,
}: {
    title: string;
    value: number;
    suffix?: string;
    icon?: React.ReactNode;
    color?: string;
    bgGradient?: string;
}) => (
    <Card
        className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 h-full"
        style={{
            background: bgGradient || `linear-gradient(135deg, ${color}25 0%, ${color}10 100%)`,
            minHeight: '120px',
        }}
        bodyStyle={{ height: '100%', display: 'flex', alignItems: 'center' }}
    >
        <Statistic
            title={<span className="text-gray-700 font-semibold">{title}</span>}
            value={value}
            suffix={suffix}
            prefix={icon}
            valueStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.5rem' }}
        />
    </Card>
);

const PercentCard = ({
    title,
    value,
    color = '#1890ff',
    bgGradient,
}: {
    title: string;
    value: number;
    color?: string;
    bgGradient?: string;
}) => (
    <Card
        title={<span className="text-white font-bold">{title}</span>}
        className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 h-full"
        style={{
            background: bgGradient || `linear-gradient(135deg, ${color}90 0%, ${color}70 100%)`,
            minHeight: '160px',
        }}
        headStyle={{ 
            background: 'transparent', 
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff'
        }}
        bodyStyle={{ height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
        <div className="space-y-2">
            <Statistic
                value={value}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.8rem' }}
            />
            <Progress
                percent={value}
                showInfo={false}
                strokeColor="#ffffff"
                trailColor="rgba(255,255,255,0.3)"
            />
        </div>
    </Card>
);

const HourCard = ({
    title,
    value,
    color = '#1890ff',
    bgGradient,
}: {
    title: string;
    value: number;
    color?: string;
    bgGradient?: string;
}) => (
    <Card
        title={<span className="text-white font-bold">{title}</span>}
        className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 h-full"
        style={{
            background: bgGradient || `linear-gradient(135deg, ${color}90 0%, ${color}70 100%)`,
            minHeight: '160px',
        }}
        headStyle={{ 
            background: 'transparent', 
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff'
        }}
        bodyStyle={{ height: 'calc(100% - 57px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
        <Statistic
            value={value}
            precision={1}
            suffix="giờ"
            prefix={<ClockCircleOutlined style={{ color: '#ffffff' }} />}
            valueStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.5rem' }}
        />
    </Card>
);

function MemberStatistics({ teamId, userId, onClose }: MemberStatisticsProps) {
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState<MemberStatisticsData | null>(null);
    const { message, contextHolder } = useMessage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getMemberStatistics(teamId, userId);
                if (response.success && response.data) {
                    setStatistics(response.data);
                }
            } catch {
                message.error({
                    key: 'member-stats-error',
                    content: 'Không thể lấy thống kê thành viên',
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [message, teamId, userId]);

    const columns = useMemo(
        () => [
            {
                title: 'Tên công việc',
                dataIndex: 'title',
                key: 'title',
                render: (text: string) => <span className="font-semibold text-gray-800">{text}</span>,
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => (
                    <Tag color={STATUS_COLORS[status as keyof typeof STATUS_COLORS]} className="font-medium">
                        {STATUS_MAP[status as keyof typeof STATUS_MAP] || status}
                    </Tag>
                ),
            },
            {
                title: 'Ưu tiên',
                dataIndex: 'priority',
                key: 'priority',
                render: (priority: string) => (
                    <Tag color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]} className="font-medium">
                        {PRIORITY_MAP[priority as keyof typeof PRIORITY_MAP] || priority}
                    </Tag>
                ),
            },
            {
                title: 'Hạn chót',
                dataIndex: 'end_time',
                key: 'end_time',
                render: (date: string) => (
                    <span className="text-gray-700">
                        <CalendarOutlined className="mr-1" />
                        {new Date(date).toLocaleDateString('vi-VN')}
                    </span>
                ),
            },
            {
                title: 'Còn lại',
                dataIndex: 'days_remaining',
                key: 'days_remaining',
                render: (days: number) => (
                    <Tag color={days <= 3 ? 'red' : days <= 7 ? 'orange' : 'green'}>{days} ngày</Tag>
                ),
            },
            {
                title: 'Bình luận',
                dataIndex: 'comment_count',
                key: 'comment_count',
                render: (count: number) => (
                    <span className="text-blue-600 font-medium">
                        <CommentOutlined className="mr-1" />
                        {count}
                    </span>
                ),
            },
            {
                title: 'Ghi chú',
                dataIndex: 'note_count',
                key: 'note_count',
                render: (count: number) => (
                    <span className="text-green-600 font-medium">
                        <FileTextOutlined className="mr-1" />
                        {count}
                    </span>
                ),
            },
        ],
        [],
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    if (!statistics) return null;

    const { user_info, task_statistics, active_tasks, performance_metrics } = statistics;

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
            {contextHolder}

            {/* Header Section */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center space-x-4">
                    <div className="bg-white p-3 rounded-full">
                        <UserOutlined className="text-2xl text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2 text-white">
                            Thống kê thành viên: {user_info.full_name}
                        </h2>
                        <p className="text-blue-100 text-lg">Vai trò: {user_info.role}</p>
                        <p className="text-blue-100">
                            Tham gia từ: {new Date(user_info.joined_at).toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Task Overview */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={12} lg={12} xl={6}>
                    <StatisticCard
                        title="Tổng công việc đã tạo"
                        value={task_statistics.total_created_tasks}
                        icon={<FireOutlined style={{ color: '#ffffff' }} />}
                        color="#6366f1"
                        bgGradient="linear-gradient(135deg, #6366f190 0%, #8b5cf670 100%)"
                    />
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={6}>
                    <StatisticCard
                        title="Công việc đã phân công"
                        value={task_statistics.assigned_tasks}
                        icon={<UserOutlined style={{ color: '#ffffff' }} />}
                        color="#8b5cf6"
                        bgGradient="linear-gradient(135deg, #8b5cf690 0%, #a78bfa70 100%)"
                    />
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={6}>
                    <PercentCard
                        title="Hoàn thành"
                        value={parseFloat(task_statistics.completed_tasks) || 0}
                        color="#10b981"
                        bgGradient="linear-gradient(135deg, #10b98190 0%, #34d39970 100%)"
                    />
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={6}>
                    <PercentCard
                        title="Đang thực hiện"
                        value={parseFloat(task_statistics.pending_tasks) || 0}
                        color="#f59e0b"
                        bgGradient="linear-gradient(135deg, #f59e0b90 0%, #fbbf2470 100%)"
                    />
                </Col>
            </Row>

            {/* Performance Metrics */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={12} lg={12} xl={8}>
                    <PercentCard
                        title="Tỷ lệ hoàn thành"
                        value={parseFloat(task_statistics.completion_rate) || 0}
                        color="#059669"
                        bgGradient="linear-gradient(135deg, #05966990 0%, #10b98170 100%)"
                    />
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={8}>
                    <PercentCard
                        title="Tỷ lệ ưu tiên cao"
                        value={parseFloat(task_statistics.high_priority_rate) || 0}
                        color="#dc2626"
                        bgGradient="linear-gradient(135deg, #dc262690 0%, #ef444470 100%)"
                    />
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={8}>
                    <StatisticCard
                        title="Điểm hoạt động"
                        value={parseFloat(task_statistics.activity_score)}
                        icon={<TrophyOutlined style={{ color: '#ffffff' }} />}
                        color="#f59e0b"
                        bgGradient="linear-gradient(135deg, #f59e0b90 0%, #fbbf2470 100%)"
                    />
                </Col>
            </Row>

            {/* Active Tasks Table */}
            <Card
                title={
                    <span className="text-xl font-bold text-gray-800">
                        <CheckCircleOutlined className="mr-2 text-blue-600" />
                        Công việc đang thực hiện
                    </span>
                }
                className="shadow-xl border-0"
                style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                }}
            >
                <Table
                    dataSource={active_tasks}
                    rowKey="id"
                    pagination={false}
                    columns={columns}
                    className="shadow-sm"
                    rowClassName="hover:bg-blue-50 transition-colors duration-200"
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Time Performance */}
            <Card
                title={
                    <span className="text-xl font-bold text-gray-800">
                        <ClockCircleOutlined className="mr-2 text-green-600" />
                        Hiệu suất thời gian
                    </span>
                }
                className="shadow-xl border-0"
                style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={12} lg={12} xl={8}>
                        <HourCard
                            title="Thời gian trung bình"
                            value={performance_metrics.avg_completion_time}
                            color="#3b82f6"
                            bgGradient="linear-gradient(135deg, #3b82f690 0%, #60a5fa70 100%)"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={12} xl={8}>
                        <HourCard
                            title="Nhanh nhất"
                            value={performance_metrics.min_completion_time}
                            color="#10b981"
                            bgGradient="linear-gradient(135deg, #10b98190 0%, #34d39970 100%)"
                        />
                    </Col>
                    <Col xs={24} sm={24} md={24} lg={24} xl={8}>
                        <HourCard
                            title="Lâu nhất"
                            value={performance_metrics.max_completion_time}
                            color="#f59e0b"
                            bgGradient="linear-gradient(135deg, #f59e0b90 0%, #fbbf2470 100%)"
                        />
                    </Col>
                </Row>
            </Card>
        </div>
    );
}

export default MemberStatistics;