import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Space, Spin } from 'antd';
import { UserOutlined, TeamOutlined, TagsOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getStatisticsApi } from '../../services/adminServices';
import type { GetStatisticsResponse, StatisticsPeriod } from '../../services/adminServices/getStatistics';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    LineElement,
    PointElement,
    Filler,
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    LineElement,
    PointElement,
    Filler,
);

const { Option } = Select;

const Statistics = () => {
    const [statistics, setStatistics] = useState<GetStatisticsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<StatisticsPeriod>('all');

    const fetchStatistics = useCallback(async (selectedPeriod: StatisticsPeriod) => {
        setLoading(true);
        try {
            const response = await getStatisticsApi({ period: selectedPeriod });
            setStatistics(response);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatistics(period);
    }, [period, fetchStatistics]);

    const sortMonthlyData = useCallback((data: any[]) => {
        return [...data].sort((a, b) => a.month.localeCompare(b.month));
    }, []);

    const filterDataByYear = useCallback((data: any[]) => {
        return data.filter((item) => item.month.startsWith('2025'));
    }, []);

    const calculateTotalFromMonthly = useCallback((data: any[], key: string) => {
        return data.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0);
    }, []);

    const totalUsers = useMemo(
        () =>
            period === 'all'
                ? calculateTotalFromMonthly(filterDataByYear(statistics?.statistics.users.monthly || []), 'new_users')
                : statistics?.statistics.users.total || 0,
        [period, statistics, calculateTotalFromMonthly, filterDataByYear],
    );

    const totalTasks = useMemo(
        () =>
            period === 'all'
                ? calculateTotalFromMonthly(
                      filterDataByYear(statistics?.statistics.tasks.personal.monthly || []),
                      'tasks',
                  ) +
                  calculateTotalFromMonthly(filterDataByYear(statistics?.statistics.tasks.team.monthly || []), 'tasks')
                : (statistics?.statistics.tasks.personal.total.tasks || 0) +
                  (statistics?.statistics.tasks.team.total.tasks || 0),
        [period, statistics, calculateTotalFromMonthly, filterDataByYear],
    );

    const totalCompleted = useMemo(
        () =>
            period === 'all'
                ? calculateTotalFromMonthly(
                      filterDataByYear(statistics?.statistics.completed_tasks.monthly || []),
                      'completed',
                  )
                : statistics?.statistics.completed_tasks.total || 0,
        [period, statistics, calculateTotalFromMonthly, filterDataByYear],
    );

    const taskTableData = useMemo(
        () => [
            {
                key: 'personal',
                type: 'Công việc cá nhân',
                total:
                    period === 'all'
                        ? calculateTotalFromMonthly(
                              filterDataByYear(statistics?.statistics.tasks.personal.monthly || []),
                              'tasks',
                          )
                        : statistics?.statistics.tasks.personal.total.tasks || 0,
                completed:
                    period === 'all'
                        ? calculateTotalFromMonthly(
                              filterDataByYear(statistics?.statistics.tasks.personal.monthly || []),
                              'completed',
                          )
                        : statistics?.statistics.tasks.personal.total.completed || '0',
            },
            {
                key: 'team',
                type: 'Công việc nhóm',
                total:
                    period === 'all'
                        ? calculateTotalFromMonthly(
                              filterDataByYear(statistics?.statistics.tasks.team.monthly || []),
                              'tasks',
                          )
                        : statistics?.statistics.tasks.team.total.tasks || 0,
                completed:
                    period === 'all'
                        ? calculateTotalFromMonthly(
                              filterDataByYear(statistics?.statistics.tasks.team.monthly || []),
                              'completed',
                          )
                        : statistics?.statistics.tasks.team.total.completed || '0',
            },
        ],
        [period, statistics, calculateTotalFromMonthly, filterDataByYear],
    );

    const userRegistrationData = useMemo(
        () => ({
            labels: statistics?.statistics.users.monthly
                ? sortMonthlyData(filterDataByYear(statistics.statistics.users.monthly)).map((detail) => detail.month)
                : [],
            datasets: [
                {
                    label: 'Người dùng mới',
                    data: statistics?.statistics.users.monthly
                        ? sortMonthlyData(filterDataByYear(statistics.statistics.users.monthly)).map(
                              (detail) => detail.new_users,
                          )
                        : [],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    tension: 0.4,
                    fill: true,
                },
            ],
        }),
        [statistics, sortMonthlyData, filterDataByYear],
    );

    const taskDistributionData = useMemo(
        () => ({
            labels: ['Cá nhân', 'Nhóm'],
            datasets: [
                {
                    data: statistics
                        ? [
                              statistics.statistics.tasks.personal.total.tasks,
                              statistics.statistics.tasks.team.total.tasks,
                          ]
                        : [],
                    backgroundColor: ['#2563eb', '#16a34a'],
                    borderColor: ['#ffffff', '#ffffff'],
                    borderWidth: 2,
                },
            ],
        }),
        [statistics],
    );

    const completedTasksData = useMemo(
        () => ({
            labels: statistics?.statistics.completed_tasks.monthly
                ? sortMonthlyData(filterDataByYear(statistics.statistics.completed_tasks.monthly)).map(
                      (detail) => detail.month,
                  )
                : [],
            datasets: [
                {
                    label: 'Công việc hoàn thành',
                    data: statistics?.statistics.completed_tasks.monthly
                        ? sortMonthlyData(filterDataByYear(statistics.statistics.completed_tasks.monthly)).map(
                              (detail) => detail.completed,
                          )
                        : [],
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.2)',
                    tension: 0.4,
                    fill: true,
                },
            ],
        }),
        [statistics, sortMonthlyData, filterDataByYear],
    );

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: {
                        font: { size: 12, family: 'Inter, sans-serif' },
                        color: '#374151',
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
        }),
        [],
    );

    const lineChartOptions = useMemo(
        () => ({
            ...chartOptions,
            scales: {
                x: {
                    ticks: { color: '#374151', font: { size: 12, family: 'Inter, sans-serif' } },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#374151',
                        font: { size: 12, family: 'Inter, sans-serif' },
                    },
                },
            },
        }),
        [chartOptions],
    );

    const taskTableColumns = useMemo(
        () => [
            {
                title: 'Loại',
                dataIndex: 'type',
                key: 'type',
                render: (text: string) => <span className="font-medium text-gray-700">{text}</span>,
                width: '33%',
            },
            {
                title: 'Tổng số',
                dataIndex: 'total',
                key: 'total',
                render: (text: number) => <span className="text-gray-700">{text}</span>,
                width: '33%',
            },
            {
                title: 'Đã hoàn thành',
                dataIndex: 'completed',
                key: 'completed',
                render: (text: string) => <span className="text-gray-700">{text}</span>,
                width: '33%',
            },
        ],
        [],
    );

    const handlePeriodChange = useCallback((value: StatisticsPeriod) => {
        setPeriod(value);
    }, []);

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <Spin
                spinning={loading}
                tip="Đang tải dữ liệu..."
                size="large"
                className="flex justify-center items-center"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Thống kê hệ thống</h1>
                    <Select
                        value={period}
                        onChange={handlePeriodChange}
                        className="w-full sm:w-40 rounded-md"
                        options={[
                            { value: 'all', label: 'Tất cả' },
                            { value: 'month', label: 'Tháng này' },
                            { value: 'year', label: 'Năm nay' },
                        ]}
                    />
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Tổng người dùng</span>}
                                value={totalUsers}
                                prefix={<UserOutlined className="text-blue-600" />}
                                valueStyle={{ color: '#2563eb', fontSize: '24px', fontWeight: 500 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Tổng công việc</span>}
                                value={totalTasks}
                                prefix={<TagsOutlined className="text-green-600" />}
                                valueStyle={{ color: '#16a34a', fontSize: '24px', fontWeight: 500 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Công việc hoàn thành</span>}
                                value={totalCompleted}
                                prefix={<CheckCircleOutlined className="text-purple-600" />}
                                valueStyle={{ color: '#7c3aed', fontSize: '24px', fontWeight: 500 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <Statistic
                                title={<span className="text-gray-600 font-medium">Tỷ lệ hoàn thành</span>}
                                value={totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0}
                                prefix={<TeamOutlined className="text-orange-600" />}
                                suffix="%"
                                valueStyle={{ color: '#ea580c', fontSize: '24px', fontWeight: 500 }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} className="mt-6">
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <span className="text-lg font-semibold text-gray-800">
                                    Tăng trưởng người dùng theo tháng
                                </span>
                            }
                            className="rounded-xl shadow-sm border border-gray-200 bg-white"
                        >
                            <div className="h-64 sm:h-80 w-full">
                                <Line data={userRegistrationData} options={lineChartOptions} />
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <span className="text-lg font-semibold text-gray-800">
                                    Công việc hoàn thành theo tháng
                                </span>
                            }
                            className="rounded-xl shadow-sm border border-gray-200 bg-white"
                        >
                            <div className="h-64 sm:h-80 w-full">
                                <Line data={completedTasksData} options={lineChartOptions} />
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} className="mt-6">
                    <Col xs={24}>
                        <Card
                            title={<span className="text-lg font-semibold text-gray-800">Phân bố công việc</span>}
                            className="rounded-xl shadow-sm border border-gray-200 bg-white"
                        >
                            <div className="h-64 sm:h-80 w-full max-w-md mx-auto">
                                <Pie data={taskDistributionData} options={chartOptions} />
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Card
                    title={<span className="text-lg font-semibold text-gray-800">Chi tiết công việc</span>}
                    className="mt-6 rounded-xl shadow-sm border border-gray-200 bg-white"
                >
                    <div className="overflow-x-auto">
                        <Table
                            columns={taskTableColumns}
                            dataSource={taskTableData}
                            pagination={false}
                            className="ant-table-custom"
                            scroll={{ x: 'max-content' }}
                        />
                    </div>
                </Card>
            </Spin>
        </div>
    );
};

export default Statistics;
