import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Select, Spin } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { getMemberStatistics } from '@/services/statisticsServices';
import { useMessage } from '@/hooks/useMessage';
import { StatisticsResponse } from '@services/types/types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const { Option } = Select;

const Dashboard = () => {
    const [stats, setStats] = useState<StatisticsResponse | null>(null);
    const [period, setPeriod] = useState<string>('month');
    const [loading, setLoading] = useState(false);
    const { message } = useMessage();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMemberStatistics(period);
            setStats(data);
        } catch (error: any) {
            message.error({
                key: 'fetch-stats-error',
                content: error.message || 'Không thể tải thống kê',
            });
        } finally {
            setLoading(false);
        }
    }, [period, message]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (!stats) {
        return (
            <div className="p-4 sm:p-6 bg-gray-50 min-h-screen flex justify-center items-center">
                <Spin spinning={loading} tip="Đang tải dữ liệu..." size="large" />
            </div>
        );
    }

    const taskStatusData = {
        labels: ['Chưa thực hiện', 'Đang thực hiện', 'Hoàn thành'],
        datasets: [
            {
                data: [
                    parseInt(stats.period_stats.task_completion.todo),
                    parseInt(stats.period_stats.task_completion.in_progress),
                    parseInt(stats.period_stats.task_completion.completed),
                ],
                backgroundColor: ['#2563eb', '#f59e0b', '#15803d'],
                borderColor: ['#ffffff', '#ffffff', '#ffffff'],
                borderWidth: 2,
            },
        ],
    };

    const taskDistributionData = {
        labels: ['Cá nhân', 'Nhóm'],
        datasets: [
            {
                data: [
                    parseInt(stats.period_stats.task_distribution.personal.count),
                    parseInt(stats.period_stats.task_distribution.team.count),
                ],
                backgroundColor: ['#7c3aed', '#06b6d4'],
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleFont: { size: 14, family: 'Inter, sans-serif' },
                bodyFont: { size: 12, family: 'Inter, sans-serif' },
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { display: false },
                ticks: { color: '#374151', font: { size: 12, family: 'Inter, sans-serif' } },
            },
            y: {
                grid: { display: false },
                ticks: { color: '#374151', font: { size: 12, family: 'Inter, sans-serif' } },
            },
        },
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    font: { size: 12, family: 'Inter, sans-serif' },
                    color: '#374151',
                    padding: 20,
                },
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleFont: { size: 14, family: 'Inter, sans-serif' },
                bodyFont: { size: 12, family: 'Inter, sans-serif' },
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <Spin
                spinning={loading}
                tip="Đang tải dữ liệu..."
                size="large"
                className="flex justify-center items-center"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Thống kê công việc</h1>
                    <Select
                        value={period}
                        onChange={setPeriod}
                        className="w-full sm:w-40 rounded-md"
                        options={[
                            { value: 'week', label: 'Tuần này' },
                            { value: 'month', label: 'Tháng này' },
                            { value: 'year', label: 'Năm nay' },
                        ]}
                    />
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Tổng nhiệm vụ</span>}
                                value={stats.period_stats.total_tasks}
                                prefix={<FileTextOutlined className="text-blue-600" />}
                                valueStyle={{ color: '#2563eb', fontSize: '24px', fontWeight: 500 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Đang thực hiện</span>}
                                value={stats.period_stats.task_completion.in_progress}
                                prefix={<ClockCircleOutlined className="text-yellow-600" />}
                                valueStyle={{ color: '#f59e0b', fontSize: '24px', fontWeight: 500 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Hoàn thành</span>}
                                value={stats.period_stats.task_completion.completed}
                                prefix={<CheckCircleOutlined className="text-green-600" />}
                                valueStyle={{ color: '#15803d', fontSize: '24px', fontWeight: 500 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Tỷ lệ hoàn thành</span>}
                                value={stats.period_stats.task_completion.completion_rate}
                                prefix={<BarChartOutlined className="text-purple-600" />}
                                valueStyle={{ color: '#7c3aed', fontSize: '24px', fontWeight: 500 }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} className="mt-6">
                    <Col xs={24} md={12}>
                        <Card
                            title={<span className="text-lg font-semibold text-gray-800">Trạng thái nhiệm vụ</span>}
                            className="rounded-xl shadow-sm border border-gray-200 bg-white"
                        >
                            <div className="h-64 sm:h-80 w-full">
                                <Bar data={taskStatusData} options={chartOptions} />
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card
                            title={<span className="text-lg font-semibold text-gray-800">Phân bố nhiệm vụ</span>}
                            className="rounded-xl shadow-sm border border-gray-200 bg-white"
                        >
                            <div className="h-64 sm:h-80 w-full max-w-md mx-auto">
                                <Pie data={taskDistributionData} options={pieOptions} />
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} className="mt-6">
                    <Col xs={24} md={12}>
                        <Card
                            title={<span className="text-lg font-semibold text-gray-800">Phân bố nhiệm vụ</span>}
                            className="rounded-xl shadow-sm border border-gray-200 bg-white"
                        >
                            <Progress
                                percent={parseFloat(stats.period_stats.task_distribution.personal.percentage)}
                                status="active"
                                strokeColor={{ '0%': '#7c3aed', '100%': '#06b6d4' }}
                                className="mb-4"
                            />
                            <div className="text-sm text-gray-500 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>Cá nhân:</span>
                                    <span className="font-medium text-gray-700">
                                        {stats.period_stats.task_distribution.personal.count} tasks
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Nhóm:</span>
                                    <span className="font-medium text-gray-700">
                                        {stats.period_stats.task_distribution.team.count} tasks
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Spin>
        </div>
    );
};

export default Dashboard;
