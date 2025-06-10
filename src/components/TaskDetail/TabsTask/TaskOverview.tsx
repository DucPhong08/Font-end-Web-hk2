import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, Input, Select, DatePicker, Tag, Space, Spin, message } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { TaskDetailsProps } from '../type';
import {
    getPriorityColor,
    getPriorityText,
    getStatusColor,
    getStatusText,
    getRoleColor,
    getRoleText,
} from '../../TaskTable/tableState';
import getMembers from '@services/teamServices/teamMembers/getMembersTeam';
import { TeamMemberInfo } from '@services/teamServices/teamMembers/getMembersTeam';

const { TextArea } = Input;

interface TaskOverviewProps {
    task: TaskDetailsProps['task'];
    isEditing: boolean;
    form: any;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    onDelete: () => void;
    teamId?: TaskDetailsProps['teamId'];
}

const TaskOverview: React.FC<TaskOverviewProps> = ({
    task,
    isEditing,
    form,
    onEdit,
    onCancel,
    onSave,
    onDelete,
    teamId,
}) => {
    const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFullTitle, setShowFullTitle] = useState(false);

    const fetchTeamMembers = useCallback(async () => {
        if (!teamId) return;
        setLoading(true);
        try {
            const members = await getMembers(Number(teamId));
            setTeamMembers(members);
        } catch (error) {
            console.error('Error fetching team members:', error);
            message.error('Không thể tải danh sách thành viên đội.');
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        fetchTeamMembers();
    }, [fetchTeamMembers]);

    useEffect(() => {
        if (isEditing) {
            form.setFieldsValue({
                title: task.title,
                status: task.status,
                assigned_user_id: task.assigned_user_id,
                priority: task.priority,
                start_time: task.start_time ? dayjs(task.start_time) : null,
                end_time: task.end_time ? dayjs(task.end_time) : null,
                description: task.description,
            });
        } else {
            form.resetFields();
            setShowFullTitle(false);
        }
    }, [isEditing, task, form]);

    const assignedUser = teamMembers.find((user) => user.id === task.assigned_user_id);

    return (
        <>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800">Thông tin công việc</h3>
                <Space size="middle">
                    {isEditing ? (
                        <>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={onSave}
                                className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !font-semibold !shadow-sm !transition-all !duration-200"
                                aria-label="Lưu thay đổi"
                            >
                                Lưu
                            </Button>
                            <Button
                                icon={<CloseOutlined />}
                                onClick={onCancel}
                                className="!border-gray-300 !text-gray-600 hover:!border-red-400 hover:!text-red-500 !rounded-lg !shadow-sm !transition-all !duration-200"
                                aria-label="Hủy chỉnh sửa"
                            >
                                Hủy
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={onEdit}
                                className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !font-semibold !shadow-sm !transition-all !duration-200"
                                aria-label="Chỉnh sửa công việc"
                            >
                                Chỉnh sửa
                            </Button>
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={onDelete}
                                className="!bg-red-600 hover:!bg-red-700 !rounded-lg !font-semibold !shadow-sm !transition-all !duration-200"
                                aria-label="Xóa công việc"
                            >
                                Xóa
                            </Button>
                        </>
                    )}
                </Space>
            </div>

            {/* Form Section */}
            <Form form={form} layout="vertical" className="space-y-6">
                {/* Title */}
                <div>
                    <label className="text-gray-700 font-semibold mb-2 block">Tiêu đề</label>
                    {isEditing ? (
                        <Form.Item
                            name="title"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                            validateTrigger={['onBlur', 'onSubmit']}
                        >
                            <Input
                                className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300 text-xl sm:text-2xl"
                                aria-label="Tiêu đề công việc"
                            />
                        </Form.Item>
                    ) : (
                        <div className="flex flex-col">
                            <div
                                className={`font-medium text-gray-800 text-xl sm:text-2xl ${
                                    showFullTitle
                                        ? 'whitespace-normal'
                                        : 'max-w-[350px] sm:max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap'
                                }`}
                                title={!showFullTitle ? task.title : undefined}
                            >
                                {task.title}
                            </div>
                            {task.title.length > 30 && (
                                <button
                                    type="button"
                                    className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 self-start underline transition-colors duration-200"
                                    onClick={() => setShowFullTitle((prev) => !prev)}
                                    aria-label={showFullTitle ? 'Ẩn tiêu đề đầy đủ' : 'Xem tiêu đề đầy đủ'}
                                >
                                    {showFullTitle ? 'Ẩn bớt' : 'Xem thêm'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="text-gray-700 font-semibold mb-2 block">Trạng thái</label>
                        {isEditing ? (
                            <Form.Item name="status" rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}>
                                <Select
                                    className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                                    allowClear
                                    popupClassName="rounded-lg shadow-lg"
                                    aria-label="Trạng thái công việc"
                                >
                                    <Select.Option value="todo">Chưa thực hiện</Select.Option>
                                    <Select.Option value="in_progress">Đang thực hiện</Select.Option>
                                    <Select.Option value="done">Hoàn thành</Select.Option>
                                </Select>
                            </Form.Item>
                        ) : (
                            <Tag
                                color={getStatusColor(task.status)}
                                className="px-4 py-1 text-sm font-medium rounded-full shadow-sm"
                            >
                                {getStatusText(task.status)}
                            </Tag>
                        )}
                    </div>
                    <div>
                        <label className="text-gray-700 font-semibold mb-2 block">Độ ưu tiên</label>
                        {isEditing ? (
                            <Form.Item
                                name="priority"
                                rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên!' }]}
                            >
                                <Select
                                    className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                                    allowClear
                                    popupClassName="rounded-lg shadow-lg"
                                    aria-label="Độ ưu tiên công việc"
                                >
                                    <Select.Option value="low">Thấp</Select.Option>
                                    <Select.Option value="medium">Trung bình</Select.Option>
                                    <Select.Option value="high">Cao</Select.Option>
                                </Select>
                            </Form.Item>
                        ) : (
                            <Tag
                                color={getPriorityColor(task.priority)}
                                className="px-4 py-1 text-sm font-medium rounded-full shadow-sm"
                            >
                                {getPriorityText(task.priority)}
                            </Tag>
                        )}
                    </div>
                </div>

                {/* Start and End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="text-gray-700 font-semibold mb-2 block">Thời gian bắt đầu</label>
                        {isEditing ? (
                            <Form.Item name="start_time">
                                <DatePicker
                                    showTime
                                    format="DD/MM/YYYY HH:mm"
                                    className="w-full rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                                    popupClassName="rounded-lg shadow-lg"
                                    aria-label="Thời gian bắt đầu"
                                />
                            </Form.Item>
                        ) : (
                            <p className="text-gray-800">
                                {task.start_time ? dayjs(task.start_time).format('DD/MM/YYYY HH:mm') : '-'}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-gray-700 font-semibold mb-2 block">Thời gian kết thúc</label>
                        {isEditing ? (
                            <Form.Item name="end_time">
                                <DatePicker
                                    showTime
                                    format="DD/MM/YYYY HH:mm"
                                    className="w-full rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                                    popupClassName="rounded-lg shadow-lg"
                                    aria-label="Thời gian kết thúc"
                                />
                            </Form.Item>
                        ) : (
                            <p className="text-gray-800">
                                {task.end_time ? dayjs(task.end_time).format('DD/MM/YYYY HH:mm') : '-'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Assigned User */}
                {teamId && (
                    <div>
                        <label className="text-gray-700 font-semibold mb-2 block">Người thực hiện</label>
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Spin aria-label="Đang tải danh sách thành viên" />
                            </div>
                        ) : isEditing ? (
                            <Form.Item
                                name="assigned_user_id"
                                rules={[{ required: true, message: 'Vui lòng chọn người thực hiện!' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Chọn người thực hiện"
                                    filterOption={(input, option) =>
                                        (option?.label as string).toLowerCase().includes(input.toLowerCase())
                                    }
                                    className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                                    aria-label="Người thực hiện"
                                >
                                    {teamMembers.map((user) => (
                                        <Select.Option key={user.id} value={user.id}>
                                            {`${user.full_name} (${getRoleText(user.role)})`}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        ) : (
                            <div className="flex items-center">
                                {assignedUser ? (
                                    <>
                                        <span className="font-medium text-gray-800">{assignedUser.full_name}</span>
                                        <Tag
                                            color={getRoleColor(assignedUser.role)}
                                            className="ml-2 text-xs rounded-full shadow-sm"
                                        >
                                            {getRoleText(assignedUser.role)}
                                        </Tag>
                                    </>
                                ) : (
                                    <span className="text-gray-500">Chưa giao</span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="text-gray-700 font-semibold mb-2 block">Mô tả</label>
                    {isEditing ? (
                        <Form.Item
                            name="description"
                            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                            validateTrigger={['onBlur', 'onSubmit']}
                        >
                            <Input.TextArea
                                rows={4}
                                className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                                aria-label="Mô tả công việc"
                            />
                        </Form.Item>
                    ) : (
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{task.description || '-'}</p>
                    )}
                </div>
            </Form>
        </>
    );
};

export default TaskOverview;
