import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Input as AntInput, Tag, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { getUsersApi, createUserApi, updateUserApi, deleteUserApi } from '@/services/adminServices';
import type { ColumnsType } from 'antd/es/table';
import { CreateUserParams, User } from '@services/types/types';
import { UpdateUserBody } from '@services/adminServices/updateUser';
import { useMessage } from '@/hooks/useMessage';

const { Search } = AntInput;

type UserRole = 'admin' | 'member';
type UserStatus = 'active' | 'banned';

const UserManagement = () => {
    const { message, contextHolder } = useMessage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resetPasswordSwitch, setResetPasswordSwitch] = useState(false);
    const [isBannedSwitch, setIsBannedSwitch] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 576);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (editingUser) {
            form.setFieldsValue(editingUser);
            setResetPasswordSwitch(false);
            setIsBannedSwitch(editingUser.status === 'banned');
        } else {
            form.resetFields();
            setResetPasswordSwitch(false);
            setIsBannedSwitch(false);
        }
    }, [editingUser, form]);

    const fetchUsers = async (page = 1, pageSize = 10, search = '') => {
        setLoading(true);
        try {
            const response = await getUsersApi({
                page: page.toString(),
                limit: pageSize.toString(),
                fullName: search || undefined,
            });
            if (response?.data?.users) {
                setUsers(response.data.users);
                setPagination({
                    current: page,
                    pageSize: pageSize,
                    total: response.data.total || 0,
                });
            }
        } catch (error) {
            message.error({ key: 'fetch-users', content: 'Không thể tải danh sách người dùng' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(pagination.current, pagination.pageSize, searchText);
    }, [pagination.current, pagination.pageSize, searchText]);

    const handleCreateUser = async (values: CreateUserParams) => {
        try {
            await createUserApi(values);
            message.success({ key: 'create-user', content: 'Tạo người dùng thành công' });
            setModalVisible(false);
            form.resetFields();
            fetchUsers(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            message.error({ key: 'create-user', content: 'Không thể tạo người dùng' });
        }
    };

    const handleUpdateUser = async (values: any) => {
        if (!editingUser) return;
        try {
            const updateData: UpdateUserBody = {
                full_name: values.full_name,
                role: values.role,
                status: isBannedSwitch ? 'banned' : 'active',
                ...(resetPasswordSwitch && { resetPassword: true }),
            };

            await updateUserApi(editingUser.id.toString(), updateData);
            message.success({ key: 'update-user', content: 'Cập nhật người dùng thành công' });
            setModalVisible(false);
            form.resetFields();
            setResetPasswordSwitch(false);
            fetchUsers(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            message.error({ key: 'update-user', content: 'Không thể cập nhật người dùng' });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUserApi({ userId });
            message.success({ key: 'delete-user', content: 'Xóa người dùng thành công' });
            fetchUsers(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            message.error({ key: 'delete-user', content: 'Không thể xóa người dùng' });
        }
    };

    const handleSearch = (value: string) => {
        setSearchText(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleTableChange = (pagination: any) => {
        setPagination((prev) => ({
            ...prev,
            current: pagination.current,
            pageSize: pagination.pageSize,
        }));
    };

    const columns: ColumnsType<User> = React.useMemo(
        () => [
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                sorter: (a, b) => a.email.localeCompare(b.email),
                width: 200,
                render: (text: string) => <span className="font-medium text-gray-700">{text}</span>,
            },
            {
                title: 'Họ và tên',
                dataIndex: 'full_name',
                key: 'full_name',
                sorter: (a, b) => (a.full_name || '').localeCompare(b.full_name || ''),
                width: 200,
                render: (text: string) => <span className="text-gray-700">{text}</span>,
            },
            {
                title: 'Vai trò',
                dataIndex: 'role',
                key: 'role',
                render: (role: UserRole) => (
                    <Tag className="font-medium" color={role === 'admin' ? 'blue' : 'purple'}>
                        {role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                    </Tag>
                ),
                width: 130,
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status: UserStatus) => {
                    let color = 'default';
                    let text = '';
                    switch (status) {
                        case 'active':
                            color = 'green';
                            text = 'Hoạt động';
                            break;
                        case 'banned':
                            color = 'red';
                            text = 'Bị cấm';
                            break;
                        default:
                            color = 'default';
                            text = 'Không hoạt động';
                    }
                    return (
                        <Tag className="font-medium" color={color}>
                            {text}
                        </Tag>
                    );
                },
                width: 130,
            },
            {
                title: 'Ngày tạo',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) =>
                    new Date(date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    }),
                sorter: (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
                width: 150,
            },
            {
                title: 'Thao tác',
                key: 'action',
                fixed: 'right',
                width: isMobile ? 80 : 130,
                render: (_: any, record: User) => (
                    <Space size="small">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => {
                                setEditingUser(record);
                                setModalVisible(true);
                                setResetPasswordSwitch(false);
                                setIsBannedSwitch(record.status === 'banned');
                            }}
                            size="small"
                        >
                            {!isMobile && 'Sửa'}
                        </Button>
                        <Popconfirm
                            title="Bạn có chắc chắn muốn xóa người dùng này?"
                            onConfirm={() => handleDeleteUser(record.id.toString())}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                className="text-red-600 hover:text-red-800"
                                size="small"
                            />
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [isMobile],
    );

    const totalTableWidth = React.useMemo(() => {
        const baseWidth = 200 + 200 + 130 + 130 + 150;
        const actionColumnWidth = isMobile ? 80 : 130;
        return baseWidth + actionColumnWidth;
    }, [isMobile]);

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            {contextHolder}
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                    onClick={() => {
                        setEditingUser(null);
                        setModalVisible(true);
                        setResetPasswordSwitch(false);
                        setIsBannedSwitch(false);
                    }}
                >
                    Thêm người dùng
                </Button>
                <Search
                    placeholder="Tìm kiếm theo email hoặc họ và tên"
                    allowClear
                    enterButton={<SearchOutlined />}
                    onSearch={handleSearch}
                    className="w-full sm:w-80"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={users}
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
                    onChange={handleTableChange}
                    scroll={{ x: totalTableWidth }}
                    className="ant-table-custom"
                />
            </div>

            <Modal
                title={
                    <span className="text-lg font-semibold text-gray-800">
                        {editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
                    </span>
                }
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setResetPasswordSwitch(false);
                }}
                footer={null}
                className="rounded-lg"
                width={isMobile ? '90%' : 520}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={editingUser ? handleUpdateUser : handleCreateUser}
                    initialValues={editingUser || {}}
                    className="p-4"
                >
                    <Form.Item
                        name="email"
                        label={<span className="font-medium text-gray-700">Email</span>}
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input
                            disabled={!!editingUser}
                            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition duration-150 ease-in-out"
                        />
                    </Form.Item>

                    <Form.Item
                        name="full_name"
                        label={<span className="font-medium text-gray-700">Họ và tên</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition duration-150 ease-in-out" />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label={<span className="font-medium text-gray-700">Mật khẩu</span>}
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                            ]}
                        >
                            <Input.Password className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition duration-150 ease-in-out" />
                        </Form.Item>
                    )}

                    {editingUser && (
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Trạng thái</span>}
                            valuePropName="checked"
                        >
                            <Switch
                                checked={isBannedSwitch}
                                onChange={setIsBannedSwitch}
                                checkedChildren="Bị cấm"
                                unCheckedChildren="Hoạt động"
                                className="bg-gray-300"
                            />
                        </Form.Item>
                    )}

                    {editingUser && (
                        <Form.Item
                            label={<span className="font-medium text-gray-700">Đặt lại mật khẩu</span>}
                            valuePropName="checked"
                        >
                            <Switch
                                checked={resetPasswordSwitch}
                                onChange={setResetPasswordSwitch}
                                className="bg-gray-300"
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="role"
                        label={<span className="font-medium text-gray-700">Vai trò</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                    >
                        <Select>
                            <Select.Option value="member">Thành viên</Select.Option>
                            <Select.Option value="admin">Quản trị viên</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                        >
                            {editingUser ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
