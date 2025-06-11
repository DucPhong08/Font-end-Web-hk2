import React, { useState, useCallback } from 'react';
import { Typography, Button, Spin, Alert, Modal, Form, Input, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import TeamCard from '../components/TeamCard';
import { getCreatedTeams, createTeam, updateTeam, deleteTeam } from '@services/teamServices';
import { Team } from '@services/types/types';
import { TeamState } from '../type';
import { useMessage } from '@hooks/useMessage';
import useDebounce from '@hooks/useDebounce';

const { Title } = Typography;

function CreatedTeamsPage() {
    const { message, contextHolder } = useMessage();
    const [isCollapsed] = useState<boolean>(false);
    const [state, setState] = useState<TeamState>({
        teams: [],
        loading: false,
        error: null,
        total: 0,
        page: 1,
        hasMore: true,
        fetchedPages: [],
    });

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [form] = Form.useForm();
    const [searchTitle, setSearchTitle] = useState('');
    const debouncedSearchTitle = useDebounce(searchTitle, 500);

    const limitPerPage = 4;

    const fetchTeams = useCallback(
        async (pageNumber: number) => {
            if (state.fetchedPages.includes(pageNumber) || state.loading) return;

            setState((prev) => ({ ...prev, loading: true, error: null }));
            try {
                const res = await getCreatedTeams(pageNumber, limitPerPage, debouncedSearchTitle);
                const responseData = res.data;
                if (res.success && responseData && Array.isArray(responseData.data)) {
                    setState((prev) => ({
                        ...prev,
                        teams: [
                            ...prev.teams,
                            ...responseData.data.filter(
                                (newTeam: Team) => !prev.teams.some((team) => team.id === newTeam.id),
                            ),
                        ],
                        total: responseData.pagination.total,
                        fetchedPages: [...prev.fetchedPages, pageNumber],
                        hasMore: pageNumber * limitPerPage < responseData.pagination.total,
                    }));
                }
            } catch (err: any) {
                const errorMessage = err.message || 'Lỗi khi tải nhóm đã tạo';
                setState((prev) => ({ ...prev, error: errorMessage }));
                message.error({ key: 'fetch-error', content: errorMessage });
            } finally {
                setState((prev) => ({ ...prev, loading: false }));
            }
        },
        [state.loading, state.fetchedPages, message, debouncedSearchTitle],
    );

    React.useEffect(() => {
        setState((prev) => ({ ...prev, teams: [], page: 1, fetchedPages: [] }));
        fetchTeams(1);
    }, [debouncedSearchTitle]);

    React.useEffect(() => {
        fetchTeams(state.page);
    }, [state.page, fetchTeams]);

    const handleSeeMore = useCallback(() => {
        setState((prev) => (!prev.loading && prev.hasMore ? { ...prev, page: prev.page + 1 } : prev));
    }, []);

    const handleOpenCreateModal = () => {
        setEditingTeam(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleOpenEditModal = (team: Team) => {
        setEditingTeam(team);
        form.setFieldsValue(team);
        setIsModalVisible(true);
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setEditingTeam(null);
        form.resetFields();
    };

    const handleSaveTeam = async (values: any) => {
        const loadingKey = 'save-team';
        message.loading({ key: loadingKey, content: 'Đang lưu...' });

        try {
            if (editingTeam) {
                const res = await updateTeam(editingTeam.id, values);
                if (res.success) {
                    setState((prev) => ({
                        ...prev,
                        teams: prev.teams.map((team) => (team.id === editingTeam.id ? { ...team, ...values } : team)),
                    }));
                    message.success({ key: loadingKey, content: 'Cập nhật nhóm thành công!' });
                } else {
                    message.error({ key: loadingKey, content: res.message || 'Lỗi khi cập nhật nhóm' });
                }
            } else {
                const res = await createTeam(values);
                if (res.success) {
                    setState((prev) => ({
                        ...prev,
                        teams: [],
                        page: 1,
                        fetchedPages: [],
                        total: prev.total + 1,
                    }));
                    message.success({ key: loadingKey, content: 'Tạo nhóm mới thành công!' });
                } else {
                    message.error({ key: loadingKey, content: res.message || 'Lỗi khi tạo nhóm mới' });
                }
            }
            handleCancelModal();
        } catch (error: any) {
            message.error({ key: loadingKey, content: error.message || 'Có lỗi xảy ra' });
        }
    };

    const handleDeleteTeam = useCallback(
        async (teamId: number) => {
            const loadingKey = 'delete-team';
            message.loading({ key: loadingKey, content: 'Đang xóa nhóm...' });

            try {
                await deleteTeam(teamId);
                setState((prev) => ({
                    ...prev,
                    teams: prev.teams.filter((team) => team.id !== teamId),
                    total: prev.total - 1,
                }));
                message.success({ key: loadingKey, content: 'Xóa nhóm thành công!' });
            } catch (error: any) {
                message.error({ key: loadingKey, content: error.message || 'Có lỗi xảy ra khi xóa nhóm' });
            }
        },
        [message],
    );

    return (
        <>
            {contextHolder}
            <div className="flex justify-between flex-col md:flex-row items-center mb-6">
                <div className="flex items-center gap-4">
                    <Title level={3} className="m-0">
                        Nhóm đã tạo
                    </Title>
                </div>
                <Space>
                    <Input
                        placeholder="Tìm kiếm team..."
                        prefix={<FontAwesomeIcon icon={faSearch} />}
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        className="w-64"
                        allowClear
                    />
                    <Button
                        type="primary"
                        icon={<FontAwesomeIcon icon={faUserPlus} className="md:mr-2" />}
                        onClick={handleOpenCreateModal}
                    >
                        <span className="hidden md:inline">Tạo nhóm mới</span>
                    </Button>
                </Space>
            </div>

            {state.error && <Alert message={state.error} type="error" className="mb-4" />}
            {state.teams.length === 0 && !state.loading && <p>Chưa có nhóm nào được tạo.</p>}
            {!isCollapsed && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
                        {state.teams.map((team) => (
                            <TeamCard
                                key={team.id}
                                id={team.id}
                                name={team.name}
                                description={team.description}
                                avatar_url={team.avatar_url}
                                created_at={team.created_at}
                                creator_name={team.creator_name}
                                type="created"
                                onEdit={() => handleOpenEditModal(team)}
                                onDelete={() => handleDeleteTeam(team.id)}
                            />
                        ))}
                    </div>
                    {state.loading && <Spin tip="Đang tải..." className="block mx-auto my-4" />}
                    <div className="text-center mt-4 space-x-4">
                        {!state.loading && state.hasMore && <Button onClick={handleSeeMore}>Xem thêm</Button>}
                        {state.teams.length > 4 && (
                            <Button
                                onClick={() => {
                                    setState((prev) => ({
                                        ...prev,
                                        teams: prev.teams.slice(0, 4),
                                        page: 1,
                                        fetchedPages: [],
                                        hasMore: true,
                                    }));
                                }}
                            >
                                Thu gọn
                            </Button>
                        )}
                    </div>
                </>
            )}

            <Modal
                title={editingTeam ? 'Chỉnh sửa nhóm' : 'Tạo nhóm mới'}
                open={isModalVisible}
                onCancel={handleCancelModal}
                onOk={() => form.submit()}
                confirmLoading={false}
            >
                <Form form={form} layout="vertical" onFinish={handleSaveTeam}>
                    <Form.Item
                        name="name"
                        label="Tên nhóm"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên nhóm!' },
                            {
                                validator: (_, value) => {
                                    if (!value || !value.trim()) {
                                        return Promise.reject('Tên nhóm không được để trống');
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[
                            {
                                validator: (_, value) => {
                                    if (value && !value.trim()) {
                                        return Promise.reject('Mô tả không được chỉ chứa khoảng trắng');
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}

export default CreatedTeamsPage;
