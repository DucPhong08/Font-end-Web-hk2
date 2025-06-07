import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';

import * as React from 'react';
import {
    createUser,
    deleteUser,
    getAllUsers,
    getUserLogs,
    updateUserRole,
    updateUserStatus,
} from '../../services/adminServices';
import type {
    UserProfile,
    AdminUserCreate,
    AdminUserRoleUpdate,
    AdminUserStatusUpdate,
    AdminLog,
    AdminUserResponse,
    AdminUsersListResponse,
} from '../../services/types/types';

const { Option } = Select;

interface UserFormData {
    full_name: string;
    email: string;
    password?: string;
    role: string;
    status: 'active' | 'inactive' | 'banned';
}

interface QueryParams {
    search?: string;
    role?: string;
    status?: string;
    page: number;
    limit: number;
}

// Hàm chuyển đổi từ AdminUserResponse sang UserProfile
const mapAdminUserToProfile = (user: AdminUserResponse): UserProfile => ({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status as 'active' | 'inactive' | 'banned',
    full_name: user.full_name || '',
    avatar_url: '', // Giá trị mặc định
    phone_number: '',
    gender: '',
    date_of_birth: null,
    address: null,
    bio: null,
});

const UserManagementPage: React.FC = () => {
    const [form] = Form.useForm();
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [total, setTotal] = React.useState(0);
    const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10 });
    const [modalVisible, setModalVisible] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
    const [queryParams, setQueryParams] = React.useState<QueryParams>({
        page: 1,
        limit: 10,
    });

    // Logs state
    const [logModalVisible, setLogModalVisible] = React.useState(false);
    const [logs, setLogs] = React.useState<AdminLog[]>([]);
    const [logUserName, setLogUserName] = React.useState<string>('');
    const [loadingLogs, setLoadingLogs] = React.useState(false);

    // Fetch user logs with userId parameter
    const fetchUserLogs = async (userId: number, fullName: string) => {
        try {
            setLoadingLogs(true);
            const res = await getUserLogs(userId);
            setLogs(res.logs || []);
            setLogUserName(fullName);
            setLogModalVisible(true);
        } catch {
            message.error('Không thể tải nhật ký người dùng');
        } finally {
            setLoadingLogs(false);
        }
    };

    // Fetch users with filters
    const fetchUsers = React.useCallback(async () => {
        try {
            setLoading(true);
            const { page, limit, search, role, status } = queryParams;

            // Tạo query params
            const queryParamsObj: Record<string, string> = {
                page: page.toString(),
                limit: limit.toString(),
            };

            if (search) queryParamsObj.search = search;
            if (role) queryParamsObj.role = role;
            if (status) queryParamsObj.status = status;

            const response = await getAllUsers(queryParamsObj);
            setUsers(response.users?.map(mapAdminUserToProfile) || []);
            setTotal(response.total || 0);
            setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize: limit,
            }));
        } catch {
            message.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleTableChange = (pag: any) => {
        setPagination(pag);
        setQueryParams({
            ...queryParams,
            page: pag.current,
            limit: pag.pageSize,
        });
    };

    const handleSearch = (value: string) => {
        setQueryParams({
            ...queryParams,
            search: value,
            page: 1,
        });
    };

    const handleRoleFilter = (value: string) => {
        setQueryParams({
            ...queryParams,
            role: value,
            page: 1,
        });
    };

    const handleStatusFilter = (value: string) => {
        setQueryParams({
            ...queryParams,
            status: value,
            page: 1,
        });
    };

    const handleAddUser = () => {
        setEditingUser(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEditUser = (record: UserProfile) => {
        setEditingUser(record);
        form.setFieldsValue({
            full_name: record.full_name || '',
            email: record.email,
            role: record.role || 'member',
            status: record.status || 'active',
        });
        setModalVisible(true);
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            await deleteUser(userId.toString());
            message.success('Xóa người dùng thành công');
            fetchUsers();
        } catch {
            message.error('Không thể xóa người dùng');
        }
    };

    const handleUpdateRole = async (userId: number, role: string) => {
        try {
            const payload: AdminUserRoleUpdate = { userId, role };
            await updateUserRole(payload);
            message.success('Cập nhật quyền thành công');
            fetchUsers();
        } catch {
            message.error('Không thể cập nhật quyền');
        }
    };

    const handleUpdateStatus = async (userId: number, status: 'active' | 'inactive' | 'banned') => {
        try {
            const payload: AdminUserStatusUpdate = { userId, status };
            await updateUserStatus(payload);
            message.success('Cập nhật trạng thái thành công');
            fetchUsers();
        } catch {
            message.error('Không thể cập nhật trạng thái');
        }
    };

    const handleSubmit = async (values: UserFormData) => {
        try {
            setLoading(true);
            if (editingUser) {
                await handleUpdateRole(editingUser.id || 0, values.role);
                await handleUpdateStatus(editingUser.id || 0, values.status);
                message.success('Cập nhật người dùng thành công');
            } else {
                const payload: AdminUserCreate = {
                    email: values.email,
                    password: values.password || '',
                    full_name: values.full_name,
                    role: values.role,
                };
                await createUser(payload);
                message.success('Tạo người dùng thành công');
            }

            setModalVisible(false);
            fetchUsers();
        } catch (error) {
            message.error('Lỗi xử lý: ' + (error instanceof Error ? error.message : 'Không rõ lỗi'));
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: 'Họ tên',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string, record: UserProfile) => (
                <div>
                    <div>{text || 'Chưa cập nhật'}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>{record.email}</div>
                </div>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            filters: [
                { text: 'Admin', value: 'admin' },
                { text: 'Member', value: 'member' },
            ],
            onFilter: (value: string | number | boolean, record: UserProfile) => {
                if (typeof value === 'string') {
                    return record.role === value;
                }
                return false;
            },
            render: (text: string, record: UserProfile) => (
                <Select
                    value={record.role}
                    style={{ width: 100 }}
                    onChange={(value: string) => handleUpdateRole(record.id || 0, value)}
                >
                    <Option value="admin">Admin</Option>
                    <Option value="member">Member</Option>
                </Select>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Hoạt động', value: 'active' },
                { text: 'Khóa', value: 'inactive' },
                { text: 'Bị cấm', value: 'banned' },
            ],
            onFilter: (value: string | number | boolean, record: UserProfile) => {
                if (typeof value === 'string') {
                    return record.status === value;
                }
                return false;
            },
            render: (text: string, record: UserProfile) => (
                <Select
                    value={record.status}
                    style={{ width: 100 }}
                    onChange={(value: any) => handleUpdateStatus(record.id || 0, value)}
                >
                    <Option value="active">Hoạt động</Option>
                    <Option value="inactive">Khóa</Option>
                    <Option value="banned">Bị cấm</Option>
                </Select>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            width: 160,
            render: (_: any, record: UserProfile) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditUser(record)}
                        size="small"
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa người dùng này?"
                        onConfirm={() => handleDeleteUser(record.id || 0)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                    <Button
                        onClick={() => fetchUserLogs(record.id || 0, record.full_name || 'Người dùng')}
                        size="small"
                    >
                        Nhật ký
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card
                title="Quản lý người dùng"
                extra={
                    <Space>
                        <Input.Search
                            allowClear
                            placeholder="Tìm kiếm người dùng"
                            onSearch={handleSearch}
                            style={{ width: 240 }}
                            enterButton={<SearchOutlined />}
                        />
                        <Select
                            placeholder="Lọc theo vai trò"
                            style={{ width: 120 }}
                            onChange={handleRoleFilter}
                            allowClear
                        >
                            <Option value="admin">Admin</Option>
                            <Option value="member">Member</Option>
                        </Select>
                        <Select
                            placeholder="Lọc theo trạng thái"
                            style={{ width: 120 }}
                            onChange={handleStatusFilter}
                            allowClear
                        >
                            <Option value="active">Hoạt động</Option>
                            <Option value="inactive">Khóa</Option>
                            <Option value="banned">Bị cấm</Option>
                        </Select>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
                            Thêm người dùng
                        </Button>
                    </Space>
                }
            >
                <Table
                    rowKey="id"
                    dataSource={users}
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                    }}
                    onChange={handleTableChange}
                />
            </Card>

            {/* Modal Thêm/Sửa người dùng */}
            <Modal
                open={modalVisible}
                title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={loading}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        role: 'member',
                        status: 'active',
                    }}
                >
                    <Form.Item
                        label="Họ tên"
                        name="full_name"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input placeholder="Nhập họ tên" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input placeholder="Nhập email" disabled={!!editingUser} />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                            ]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu" />
                        </Form.Item>
                    )}

                    <Form.Item label="Vai trò" name="role">
                        <Select>
                            <Option value="admin">Admin</Option>
                            <Option value="member">Member</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Trạng thái" name="status">
                        <Select>
                            <Option value="active">Hoạt động</Option>
                            <Option value="inactive">Khóa</Option>
                            <Option value="banned">Bị cấm</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Nhật ký người dùng */}
            <Modal
                open={logModalVisible}
                title={`Nhật ký của ${logUserName}`}
                onCancel={() => setLogModalVisible(false)}
                footer={<Button onClick={() => setLogModalVisible(false)}>Đóng</Button>}
                width={800}
                destroyOnClose
            >
                <Table
                    rowKey="id"
                    dataSource={logs}
                    loading={loadingLogs}
                    pagination={{ pageSize: 10 }}
                    columns={[
                        {
                            title: 'Thời gian',
                            dataIndex: 'created_at',
                            key: 'created_at',
                            render: (text: string) => new Date(text).toLocaleString(),
                        },
                        { title: 'Hành động', dataIndex: 'action', key: 'action' },
                        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
                    ]}
                />
            </Modal>
        </div>
    );
};

export default UserManagementPage;
