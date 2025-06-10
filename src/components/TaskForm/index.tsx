import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button } from 'antd';
import { createTask, updateTask } from '@services/taskServices';
import { TaskPayload } from '@services/types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useMessage } from '@/hooks/useMessage';

const { TextArea } = Input;

interface TaskFormProps {
    onTaskCreated?: (task: TaskPayload) => void;
    onClose?: () => void;
    initialValues?: {
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        date?: [dayjs.Dayjs, dayjs.Dayjs];
        assigned_user_id?: number | string | null;
    };
    taskId?: number | string;
    teamId?: string | null;
}

function TaskForm({ onTaskCreated, onClose, initialValues, taskId, teamId }: TaskFormProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!taskId;
    const { message, contextHolder } = useMessage();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                start_time: initialValues.date?.[0],
                end_time: initialValues.date?.[1],
            });
        }
    }, [initialValues, form]);

    const handleSubmit = async (values: any) => {
        const key = isEditing ? 'updateTask' : 'createTask';
        try {
            setLoading(true);
            message.loading({ key, content: isEditing ? 'Đang cập nhật công việc...' : 'Đang tạo công việc...' });

            const taskData: TaskPayload = {
                title: values.title,
                description: values.description || '',
                start_time: values.start_time
                    ? values.start_time.format('YYYY-MM-DD HH:mm:ss')
                    : dayjs().format('YYYY-MM-DD HH:mm:ss'),
                end_time: values.end_time
                    ? values.end_time.format('YYYY-MM-DD HH:mm:ss')
                    : dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                status: values.status || 'todo',
                priority: values.priority || 'medium',
                team_id: teamId || null,
            };

            if (isEditing && taskId) {
                const numericId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
                await updateTask(numericId, taskData);
                message.success({ key, content: 'Cập nhật công việc thành công!' });
            } else {
                await createTask(taskData);
                message.success({ key, content: 'Tạo công việc thành công!' });
            }

            form.resetFields();
            onTaskCreated?.(taskData);
            onClose?.();
        } catch (error: any) {
            if (error.message === 'Công việc với tên này đã tồn tại!') {
                message.error({ key, content: 'Tên công việc này đã tồn tại. Vui lòng chọn tên khác!' });
            } else if (error.message === 'Định dạng start_time không hợp lệ!') {
                message.error({ key, content: 'Định dạng thời gian không hợp lệ. Vui lòng kiểm tra lại!' });
            } else {
                message.error({ key, content: 'Có lỗi xảy ra khi xử lý công việc. Vui lòng thử lại!' });
            }
            console.error('Error handling task:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <Form form={form} layout="vertical" onFinish={handleSubmit} className=" p-4 bg-white ">
                <Form.Item
                    name="title"
                    label={<span className="text-gray-700 font-medium">Tiêu đề</span>}
                    rules={[
                        { required: true, message: 'Vui lòng nhập tiêu đề' },
                        { min: 3, message: 'Tiêu đề phải có ít nhất 3 ký tự' },
                        { max: 100, message: 'Tiêu đề không được vượt quá 100 ký tự' },
                    ]}
                >
                    <Input
                        placeholder="Nhập tiêu đề công việc"
                        className="rounded-md hover:border-blue-400 focus:border-blue-400"
                    />
                </Form.Item>

                <Form.Item name="description" label={<span className="text-gray-700 font-medium">Mô tả</span>}>
                    <TextArea
                        rows={4}
                        placeholder="Nhập mô tả công việc"
                        className="rounded-md hover:border-blue-400 focus:border-blue-400"
                    />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        name="start_time"
                        label={<span className="text-gray-700 font-medium">Thời gian bắt đầu</span>}
                    >
                        <DatePicker
                            showTime
                            format="YYYY-MM-DD HH:mm"
                            placeholder="Chọn thời gian bắt đầu"
                            className="w-full rounded-md hover:border-blue-400 focus:border-blue-400"
                        />
                    </Form.Item>

                    <Form.Item
                        name="end_time"
                        label={<span className="text-gray-700 font-medium">Thời gian kết thúc</span>}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        !getFieldValue('start_time') ||
                                        value.isAfter(getFieldValue('start_time'))
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Thời gian kết thúc phải sau thời gian bắt đầu!'));
                                },
                            }),
                        ]}
                    >
                        <DatePicker
                            showTime
                            format="YYYY-MM-DD HH:mm"
                            placeholder="Chọn thời gian kết thúc"
                            className="w-full rounded-md hover:border-blue-400 focus:border-blue-400"
                        />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item name="status" label={<span className="text-gray-700 font-medium">Trạng thái</span>}>
                        <Select
                            placeholder="Chọn trạng thái"
                            className="w-full rounded-md hover:border-blue-400 focus:border-blue-400"
                        >
                            <Select.Option value="todo">Chờ thực hiện</Select.Option>
                            <Select.Option value="in_progress">Đang thực hiện</Select.Option>
                            <Select.Option value="done">Hoàn thành</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="priority" label={<span className="text-gray-700 font-medium">Độ ưu tiên</span>}>
                        <Select
                            placeholder="Chọn độ ưu tiên"
                            className="w-full rounded-md hover:border-blue-400 focus:border-blue-400"
                        >
                            <Select.Option value="low">Thấp</Select.Option>
                            <Select.Option value="medium">Trung bình</Select.Option>
                            <Select.Option value="high">Cao</Select.Option>
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item className="mb-0">
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        className="w-full md:w-auto"
                        icon={isEditing ? <FontAwesomeIcon icon={faEdit} /> : <FontAwesomeIcon icon={faPlus} />}
                    >
                        {isEditing ? 'Cập nhật công việc' : 'Tạo công việc'}
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
}

export default TaskForm;
