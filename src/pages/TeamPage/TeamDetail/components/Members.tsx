import React, { useState, useEffect, useCallback } from 'react';
import { Table, Avatar, Button, Space, Modal, Form, Select, Popconfirm } from 'antd';
import { UserAddOutlined, UserDeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getMembersTeam, changeRoleUserTeam, inviteMember, removeMember } from '@services/teamServices';
import type { TeamMemberInfo } from '@services/teamServices/teamMembers/getMembersTeam';
import searchUsers from '@services/userServices/searchUsers';
import { UserProfile } from '@services/types/types';
import debounce from 'lodash/debounce';
import { useMessage } from '@hooks/useMessage';
import { ROLES } from '@common/constant';

const MESSAGES = {
    FETCH_ERROR: 'Có lỗi xảy ra khi tải danh sách thành viên',
    UPDATE_SUCCESS: 'Cập nhật vai trò thành công!',
    UPDATE_ERROR: 'Cập nhật vai trò thất bại',
    ADD_SUCCESS: 'Thêm thành viên thành công!',
    ADD_ERROR: 'Thêm thành viên thất bại',
    DELETE_SUCCESS: 'Đã xóa thành viên khỏi nhóm!',
    DELETE_ERROR: 'Xóa thành viên thất bại',
    DELETE_CONFIRM: (name: string) => `Bạn có chắc chắn muốn xóa thành viên ${name} khỏi nhóm?`,
};

type RoleType = typeof ROLES.ADMIN | typeof ROLES.MEMBER;

interface MembersProps {
    teamId: string | undefined;
    onMemberChange?: () => void;
}

const Members = ({ teamId, onMemberChange }: MembersProps) => {
    const [form] = Form.useForm();
    const [members, setMembers] = useState<TeamMemberInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingKey, setEditingKey] = useState<number | null>(null);
    const [editingRole, setEditingRole] = useState<RoleType>(ROLES.MEMBER);
    const [searchValue, setSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const { message, contextHolder } = useMessage();

    const fetchMembers = useCallback(async () => {
        if (!teamId) return;
        try {
            setLoading(true);
            const response = await getMembersTeam(parseInt(teamId));
            setMembers(response);
            onMemberChange?.();
        } catch (error) {
            message.error({ key: 'fetch-members', content: MESSAGES.FETCH_ERROR });
        } finally {
            setLoading(false);
        }
    }, [teamId, message, onMemberChange]);

    const searchUsersDebounced = useCallback(
        debounce(async (value: string) => {
            if (!value.trim()) {
                setSearchResults([]);
                return;
            }
            try {
                setSearchLoading(true);
                const users = await searchUsers(value);
                setSearchResults(users);
            } catch (error) {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 500),
        [],
    );

    const handleSearch = useCallback(
        (value: string) => {
            setSearchValue(value);
            searchUsersDebounced(value);
        },
        [searchUsersDebounced],
    );

    const handleEdit = useCallback((record: TeamMemberInfo) => {
        setEditingKey(record.id);
        setEditingRole(record.role as RoleType);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingKey(null);
        setEditingRole(ROLES.MEMBER);
    }, []);

    const handleSaveRole = useCallback(
        async (id: number) => {
            if (!teamId) return;
            const loadingKey = 'update-role';
            try {
                message.loading({ key: loadingKey, content: 'Đang cập nhật vai trò...' });
                await changeRoleUserTeam(Number(teamId), id, editingRole);
                message.success({ key: loadingKey, content: MESSAGES.UPDATE_SUCCESS });
                setEditingKey(null);
                setEditingRole(ROLES.MEMBER);
                fetchMembers();
            } catch (error) {
                message.error({ key: loadingKey, content: MESSAGES.UPDATE_ERROR });
            }
        },
        [teamId, editingRole, fetchMembers, message],
    );

    const handleDeleteMember = useCallback(
        async (member: TeamMemberInfo) => {
            if (!teamId) return;
            const loadingKey = 'delete-member';
            try {
                message.loading({ key: loadingKey, content: 'Đang xóa thành viên...' });
                await removeMember(Number(teamId), member.id);
                message.success({ key: loadingKey, content: MESSAGES.DELETE_SUCCESS });
                fetchMembers();
            } catch (error) {
                message.error({ key: loadingKey, content: MESSAGES.DELETE_ERROR });
            }
        },
        [teamId, fetchMembers, message],
    );

    const handleAddMember = useCallback(() => {
        setIsModalVisible(true);
    }, []);

    const handleModalOk = useCallback(() => {
        form.validateFields().then(async (values) => {
            if (!teamId) return;
            const loadingKey = 'add-member';
            try {
                message.loading({ key: loadingKey, content: 'Đang thêm thành viên...' });
                await inviteMember(Number(teamId), values.user);
                message.success({ key: loadingKey, content: MESSAGES.ADD_SUCCESS });
                setIsModalVisible(false);
                form.resetFields();
                setSearchValue('');
                setSearchResults([]);
                fetchMembers();
            } catch (error) {
                message.error({ key: loadingKey, content: MESSAGES.ADD_ERROR });
            }
        });
    }, [form, teamId, fetchMembers, message]);

    const handleModalCancel = useCallback(() => {
        setIsModalVisible(false);
        form.resetFields();
        setSearchValue('');
        setSearchResults([]);
    }, [form]);

    const isEditing = useCallback((record: TeamMemberInfo) => record.id === editingKey, [editingKey]);

    const columns: ColumnsType<TeamMemberInfo> = [
        {
            title: 'Thành viên',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string, record: TeamMemberInfo) => (
                <Space>
                    <Avatar src={record.avatar_url}>{text[0]}</Avatar>
                    <span className="font-medium">{text}</span>
                </Space>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (_: any, record: TeamMemberInfo) => {
                const editable = isEditing(record);
                return editable ? (
                    <Select
                        value={editingRole}
                        onChange={(value) => setEditingRole(value as RoleType)}
                        className="w-full"
                    >
                        <Select.Option value={ROLES.ADMIN}>Quản trị viên</Select.Option>
                        <Select.Option value={ROLES.MEMBER}>Thành viên</Select.Option>
                    </Select>
                ) : (
                    <Space>
                        <span
                            className={`px-2 py-1 rounded-full text-sm ${
                                record.role === ROLES.CREATOR
                                    ? 'bg-purple-100 text-purple-800'
                                    : record.role === ROLES.ADMIN
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                            }`}
                        >
                            {record.role === ROLES.CREATOR
                                ? 'Người tạo'
                                : record.role === ROLES.ADMIN
                                  ? 'Quản trị viên'
                                  : 'Thành viên'}
                        </span>
                        {record.role !== ROLES.CREATOR && (
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                                aria-label={`Chỉnh sửa vai trò của ${record.full_name}`}
                            />
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: TeamMemberInfo) => {
                const editable = isEditing(record);
                return editable ? (
                    <Space>
                        <Button
                            type="text"
                            icon={<CheckOutlined />}
                            onClick={() => handleSaveRole(record.id)}
                            className="text-green-500"
                            aria-label="Lưu vai trò"
                        />
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={handleCancelEdit}
                            className="text-red-500"
                            aria-label="Hủy chỉnh sửa"
                        />
                    </Space>
                ) : (
                    <Space>
                        {record.role !== ROLES.CREATOR && (
                            <Popconfirm
                                title="Xác nhận xóa"
                                description={MESSAGES.DELETE_CONFIRM(record.full_name)}
                                onConfirm={() => handleDeleteMember(record)}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<UserDeleteOutlined />}
                                    aria-label={`Xóa thành viên ${record.full_name}`}
                                >
                                    Xóa
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        },
    ];

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    return (
        <div className="p-6">
            {contextHolder}
            <div className="mb-4">
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={handleAddMember}
                    aria-label="Thêm thành viên"
                >
                    Thêm thành viên
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={members}
                rowKey="id"
                loading={loading}
                pagination={false}
                className="bg-white rounded-lg shadow"
            />

            <Modal
                title="Thêm thành viên mới"
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="Thêm"
                cancelText="Hủy"
                width={500}
                aria-labelledby="add-member-modal"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="user"
                        label="Tìm kiếm thành viên"
                        rules={[{ required: true, message: 'Vui lòng tìm và chọn thành viên' }]}
                    >
                        <Select
                            showSearch
                            value={searchValue}
                            placeholder="Nhập tên hoặc email để tìm kiếm"
                            defaultActiveFirstOption={false}
                            filterOption={false}
                            onSearch={handleSearch}
                            onChange={(value) => setSearchValue(value)}
                            notFoundContent={searchLoading ? 'Đang tìm kiếm...' : 'Không tìm thấy kết quả'}
                            loading={searchLoading}
                            optionLabelProp="label"
                        >
                            {searchResults.map((user) => (
                                <Select.Option key={user.id} value={user.id} label={user.full_name}>
                                    <Space>
                                        <Avatar size="small" src={user.avatar_url}>
                                            {user.full_name?.[0]?.toUpperCase() || '?'}
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.full_name}</div>
                                            <div className="text-gray-500 text-sm">{user.email}</div>
                                        </div>
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Members;