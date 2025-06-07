import {
    CheckCircleOutlined,
    TeamOutlined,
    UserOutlined,
    LineChartOutlined,
    ReloadOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Spin, Typography, message, Button, DatePicker, Tabs, Progress, theme } from 'antd';
import type { Dayjs } from 'dayjs';
import * as React from 'react';
import { useUser } from '../../contexts/useAuth/userContext';
import { getAdminStats } from '../../services/statisticsServices';
import { AdminStatistics } from '../../services/types/types';
import dayjs from 'dayjs';
import { Area } from '@ant-design/charts';


const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { useToken } = theme;

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalTeams: number;
    activeTasks: number;
    newUsersToday: number;
    taskCompletionRate: number;
}

const AdminDashboardPage: React.FC = () => {
    const { token } = useToken();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { user } = useUser();
    const [stats, setStats] = React.useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalTeams: 0,
        activeTasks: 0,
        newUsersToday: 0,
        taskCompletionRate: 0,
    });
    const [adminStats, setAdminStats] = React.useState<AdminStatistics | null>(null);
    const [dateRange, setDateRange] = React.useState<[Dayjs, Dayjs]>([dayjs().subtract(7, 'days'), dayjs()]);
    const [activityData, setActivityData] = React.useState<any[]>([]);

    const fetchStats = async (): Promise<void> => {
        if (!user || user.role !== 'admin') return;

        try {
            setLoading(true);
            setError(null);

            const adminStatsResponse = await getAdminStats('week');
            setAdminStats(adminStatsResponse);

            if (adminStatsResponse) {
                const { statistics } = adminStatsResponse;
                setStats({
                    totalUsers: statistics.user_registration.total,
                    activeUsers: statistics.tasks.personal.total + statistics.tasks.team.total,
                    totalTeams: statistics.teams.total,
                    activeTasks: statistics.tasks.personal.total + statistics.tasks.team.total,
                    newUsersToday: statistics.user_registration.details[0]?.new_users || 0,
                    taskCompletionRate: calculateTaskCompletionRate(statistics),
                });

                setActivityData(generateActivityData(statistics));
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Không thể tải dữ liệu dashboard');
            message.error('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchStats();
    }, []);

    const calculateTaskCompletionRate = (statistics: AdminStatistics['statistics']): number => {
        const totalTasks = statistics.tasks.personal.total + statistics.tasks.team.total;
        return totalTasks === 0 ? 0 : Math.round((statistics.tasks.personal.total / totalTasks) * 100);
    };

    const generateActivityData = (statistics: AdminStatistics['statistics']) => {
        return statistics.user_registration.details.map((detail, index) => ({
            date: dayjs().subtract(index, 'days').format('YYYY-MM-DD'),
            type: 'Người dùng mới',
            value: detail.new_users,
        }));
    };

    const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
        if (dates) {
            setDateRange(dates);
            fetchStats();
        }
    };

    const statItems = [
        {
            title: 'Tổng Người Dùng',
            value: stats.totalUsers,
            icon: <UserOutlined style={{ fontSize: 24 }} />,
            color: token.colorPrimary,
            trend: {
                value: stats.newUsersToday,
                text: 'người dùng mới hôm nay',
                positive: true,
            },
        },
        {
            title: 'Người Dùng Hoạt Động',
            value: stats.activeUsers,
            icon: <UserOutlined style={{ fontSize: 24 }} />,
            color: '#52c41a',
            trend: {
                value: Math.round((stats.activeUsers / stats.totalUsers) * 100),
                text: '% hoạt động',
                positive: stats.activeUsers / stats.totalUsers > 0.5,
            },
        },
        {
            title: 'Tổng Nhóm',
            value: stats.totalTeams,
            icon: <TeamOutlined style={{ fontSize: 24 }} />,
            color: '#722ed1',
            trend: {
                value: adminStats?.statistics.teams.details[0]?.new_teams || 0,
                text: 'nhóm mới trong tuần',
                positive: true,
            },
        },
        {
            title: 'Nhiệm Vụ Hoàn Thành',
            value: stats.activeTasks,
            icon: <CheckCircleOutlined style={{ fontSize: 24 }} />,
            color: '#fa8c16',
            trend: {
                value: stats.taskCompletionRate,
                text: '% hoàn thành',
                positive: stats.taskCompletionRate > 50,
            },
        },
    ];

    const activityConfig = {
        data: activityData,
        xField: 'date',
        yField: 'value',
        seriesField: 'type',
        smooth: true,
        animation: {
            appear: {
                animation: 'path-in',
                duration: 2000,
            },
        },
        legend: {
            position: 'top-right',
        },
        xAxis: {
            type: 'time',
            mask: 'DD/MM',
            label: {
                style: {
                    fill: token.colorTextSecondary,
                },
            },
            line: {
                style: {
                    stroke: token.colorBorder,
                },
            },
        },
        yAxis: {
            label: {
                style: {
                    fill: token.colorTextSecondary,
                },
            },
            grid: {
                line: {
                    style: {
                        stroke: token.colorBorderSecondary,
                    },
                },
            },
        },
        areaStyle: () => {
            return {
                fill: `l(270) 0:#ffffff00 1:${token.colorPrimary}`,
            };
        },
        line: {
            size: 3,
            color: token.colorPrimary,
        },
        point: {
            size: 4,
            shape: 'circle',
            style: {
                fill: token.colorPrimary,
                stroke: token.colorBgContainer,
                lineWidth: 2,
            },
        },
        tooltip: {
            showMarkers: true,
            domStyles: {
                'g2-tooltip': {
                    backgroundColor: token.colorBgElevated,
                    boxShadow: token.boxShadowSecondary,
                    color: token.colorText,
                    borderRadius: token.borderRadiusLG,
                },
            },
        },
    };

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                <Spin size="large" />
                <Text type="secondary">Đang tải dữ liệu...</Text>
            </div>
        );
    }

    const renderStatCard = (item: (typeof statItems)[0]) => (
        <Card
            bordered={false}
            style={{
                borderRadius: token.borderRadiusLG,
                boxShadow: token.boxShadowSecondary,
                height: '100%',
            }}
            bodyStyle={{
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
            }}
        >
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                }}
            >
                {item.icon}
            </div>
            <div style={{ flex: 1 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                    {item.title}
                </Text>
                <Title level={3} style={{ margin: '8px 0', fontSize: 24 }}>
                    {item.value}
                </Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {item.trend.positive ? (
                        <ArrowUpOutlined style={{ color: '#52c41a' }} />
                    ) : (
                        <ArrowDownOutlined style={{ color: '#f5222d' }} />
                    )}
                    <Text type={item.trend.positive ? 'success' : 'danger'}>
                        {item.trend.value} {item.trend.text}
                    </Text>
                </div>
            </div>
        </Card>
    );

    const renderDashboardContent = () => (
        <div style={{ padding: 24 }}>
            <Row gutter={[24, 24]}>
                {statItems.map((item, index) => (
                    <Col key={index} xs={24} sm={12} md={12} lg={6}>
                        {renderStatCard(item)}
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: token.borderRadiusLG,
                            boxShadow: token.boxShadowSecondary,
                        }}
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Title level={5} style={{ margin: 0 }}>
                                    Biểu đồ hoạt động người dùng
                                </Title>
                                <RangePicker
                                    value={dateRange}
                                    onChange={handleDateRangeChange as any}
                                    style={{ width: 256 }}
                                    allowClear={false}
                                />
                            </div>
                        }
                    >
                        <Area {...activityConfig} height={300} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: token.borderRadiusLG,
                            boxShadow: token.boxShadowSecondary,
                            height: '100%',
                        }}
                        title={<Title level={5}>Tỷ lệ hoàn thành nhiệm vụ</Title>}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Progress
                                type="dashboard"
                                percent={stats.taskCompletionRate}
                                strokeColor={{
                                    '0%': token.colorPrimary,
                                    '100%': token.colorSuccess,
                                }}
                                width={200}
                                format={(percent) => (
                                    <div style={{ textAlign: 'center' }}>
                                        <Title level={3}>{percent}%</Title>
                                        <Text type="secondary">Tỷ lệ hoàn thành</Text>
                                    </div>
                                )}
                            />
                            <div style={{ marginTop: 24, width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Tổng nhiệm vụ</Text>
                                    <Text strong>{stats.activeTasks}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                    <Text type="secondary">Hoàn thành</Text>
                                    <Text strong>
                                        {Math.round((stats.activeTasks * stats.taskCompletionRate) / 100)}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: token.borderRadiusLG,
                            boxShadow: token.boxShadowSecondary,
                            height: '100%',
                        }}
                        title={<Title level={5}>Phân bổ người dùng</Title>}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <Progress
                                    type="circle"
                                    percent={Math.round((stats.activeUsers / stats.totalUsers) * 100)}
                                    width={150}
                                    strokeColor={token.colorSuccess}
                                    format={(percent) => (
                                        <div>
                                            <Title level={4} style={{ margin: 0 }}>
                                                {percent}%
                                            </Title>
                                            <Text type="secondary">Hoạt động</Text>
                                        </div>
                                    )}
                                />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <Progress
                                    type="circle"
                                    percent={Math.round(
                                        ((stats.totalUsers - stats.activeUsers) / stats.totalUsers) * 100,
                                    )}
                                    width={150}
                                    strokeColor={token.colorError}
                                    format={(percent) => (
                                        <div>
                                            <Title level={4} style={{ margin: 0 }}>
                                                {percent}%
                                            </Title>
                                            <Text type="secondary">Không hoạt động</Text>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    return (
        <div style={{ background: token.colorBgLayout }}>
            <div
                style={{
                    padding: '16px 24px',
                    background: token.colorBgContainer,
                    boxShadow: token.boxShadowTertiary,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        Dashboard
                    </Title>
                    <Text type="secondary">Thống kê và phân tích hệ thống</Text>
                </div>
                <Button type="primary" icon={<ReloadOutlined />} onClick={fetchStats} loading={loading}>
                    Làm mới
                </Button>
            </div>

            <Tabs defaultActiveKey="dashboard" style={{ padding: '0 24px', marginTop: 16 }} tabBarStyle={{ margin: 0 }}>
                <TabPane tab="Tổng quan" key="dashboard">
                    {renderDashboardContent()}
                </TabPane>
            </Tabs>
        </div>
    );
};

export default AdminDashboardPage;
