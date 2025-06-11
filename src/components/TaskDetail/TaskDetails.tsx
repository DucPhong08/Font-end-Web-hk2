import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, Modal, Form } from 'antd';
import dayjs from 'dayjs';
import { TaskNotesAndAttachments, TaskComment, TaskPayload } from '@services/types/types';
import { getTaskComments, createTaskComment, updateTaskComment, deleteTaskComment } from '@services/teamServices';
import { getNAbyTask, createNA, deleteN } from '@services/taskServices';
import TaskForm from '@components/TaskForm';
import { TaskDetailsProps } from './type';
import TaskOverview from './TabsTask/TaskOverview';
import NotesAndAttachments from './TabsTask/NotesAndAttachments';
import Comments from './TabsTask/Comments';
import { useMessage } from '@/hooks/useMessage';
import { updateAssignment } from '@services/teamServices';
function TaskDetails({ task: initialTask, onEditTask, onDeleteTask, onReload, teamId }: TaskDetailsProps) {
    const [task, setTask] = useState<TaskPayload>(initialTask);
    const [notesAndAttachments, setNotesAndAttachments] = useState<TaskNotesAndAttachments[]>([]);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [newNote, setNewNote] = useState('');
    const [newFile, setNewFile] = useState<File | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { message: useMessageMessage, contextHolder } = useMessage();

    const memoizedNotification = useMemo(() => useMessageMessage, []);

    useEffect(() => {
        setTask(initialTask);
    }, [initialTask]);

    const handleFileSizeError = useCallback(() => {
        memoizedNotification.error({ key: 'fileSize', content: 'Tệp phải nhỏ hơn 10MB!' });
    }, [memoizedNotification]);

    const fetchComments = useCallback(async () => {
        if (!task.id) return;
        try {
            const response = await getTaskComments(Number(task.id));
            setComments(Array.isArray(response) ? response : []);
        } catch (error) {
            memoizedNotification.error({ key: 'fetchComments', content: 'Không thể tải bình luận' });
            setComments([]);
        }
    }, [task.id, memoizedNotification]);

    const fetchNotesAndAttachments = useCallback(async () => {
        if (!task.id) return;
        try {
            const response = await getNAbyTask(Number(task.id));
            setNotesAndAttachments(response || []);
        } catch (error) {
            memoizedNotification.error({ key: 'fetchNotes', content: 'Không thể tải ghi chú và tệp đính kèm' });
            setNotesAndAttachments([]);
        }
    }, [task.id, memoizedNotification]);

    useEffect(() => {
        if (!task.id) return;

        let isMounted = true;

        const fetchData = async () => {
            try {
                const [commentsResponse, notesResponse] = await Promise.all([
                    getTaskComments(Number(task.id)),
                    getNAbyTask(Number(task.id)),
                ]);

                if (isMounted) {
                    setComments(Array.isArray(commentsResponse) ? commentsResponse : []);
                    setNotesAndAttachments(notesResponse || []);
                }
            } catch (error) {
                if (isMounted) {
                    memoizedNotification.error({ key: 'fetchData', content: 'Không thể tải dữ liệu' });
                    setComments([]);
                    setNotesAndAttachments([]);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [task.id, memoizedNotification]);

    const handleAddNoteAndFile = useCallback(async () => {
        if (!task.id || (!newNote.trim() && !newFile)) return;
        const key = 'addNoteAndFile';
        try {
            memoizedNotification.loading({ key, content: 'Đang thêm ghi chú và tệp đính kèm...' });
            setLoading(true);
            await createNA(Number(task.id), {
                note: newNote.trim() || undefined,
                file: newFile || undefined,
            });
            setNewNote('');
            setNewFile(null);
            await fetchNotesAndAttachments();
            memoizedNotification.success({ key, content: 'Thêm ghi chú và tệp đính kèm thành công!' });
        } catch (error) {
            memoizedNotification.error({ key, content: 'Không thể thêm ghi chú và tệp đính kèm' });
        } finally {
            setLoading(false);
        }
    }, [newNote, newFile, task.id, fetchNotesAndAttachments, memoizedNotification]);

    const handleDeleteNote = useCallback(
        async (noteId: number) => {
            const key = 'deleteNote';
            try {
                memoizedNotification.loading({ key, content: 'Đang xóa ghi chú...' });
                await deleteN(noteId);
                await fetchNotesAndAttachments();
                memoizedNotification.success({ key, content: 'Xóa ghi chú thành công!' });
            } catch (error) {
                memoizedNotification.error({ key, content: 'Không thể xóa ghi chú' });
            }
        },
        [fetchNotesAndAttachments, memoizedNotification],
    );

    const handleFileChange = useCallback((info: any) => {
        if (info.file.status === 'done') {
            setNewFile(info.file.originFileObj);
        }
    }, []);

    const handleAddComment = useCallback(async () => {
        if (!newComment.trim() || !task.id) return;
        const key = 'addComment';
        try {
            memoizedNotification.loading({ key, content: 'Đang thêm bình luận...' });
            setLoading(true);
            await createTaskComment(Number(task.id), newComment.trim());
            setNewComment('');
            await fetchComments();
            memoizedNotification.success({ key, content: 'Thêm bình luận thành công!' });
        } catch (error) {
            memoizedNotification.error({ key, content: 'Không thể thêm bình luận' });
        } finally {
            setLoading(false);
        }
    }, [newComment, task.id, fetchComments, memoizedNotification]);

    const handleDeleteComment = useCallback(
        async (commentId: number) => {
            const key = 'deleteComment';
            try {
                memoizedNotification.loading({ key, content: 'Đang xóa bình luận...' });
                await deleteTaskComment(commentId);
                await fetchComments();
                memoizedNotification.success({ key, content: 'Xóa bình luận thành công!' });
            } catch (error) {
                memoizedNotification.error({ key, content: 'Không thể xóa bình luận' });
            }
        },
        [fetchComments, memoizedNotification],
    );

    const handleEditComment = useCallback((comment: TaskComment) => {
        setEditingCommentId(comment.id);
        setEditCommentText(comment.comment);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingCommentId(null);
        setEditCommentText('');
    }, []);

    const handleSaveEdit = useCallback(
        async (commentId: number) => {
            const key = 'saveEdit';
            try {
                const trimmedComment = editCommentText.trim();
                if (!trimmedComment) {
                    memoizedNotification.error({ key, content: 'Bình luận không được để trống' });
                    return;
                }

                memoizedNotification.loading({ key, content: 'Đang cập nhật bình luận...' });
                setLoading(true);
                await updateTaskComment(commentId, trimmedComment);
                await fetchComments();
                setEditingCommentId(null);
                setEditCommentText('');
                memoizedNotification.success({ key, content: 'Cập nhật bình luận thành công!' });
            } catch (error) {
                memoizedNotification.error({ key, content: 'Không thể cập nhật bình luận' });
            } finally {
                setLoading(false);
            }
        },
        [editCommentText, fetchComments, memoizedNotification],
    );

    const handleEditTask = useCallback(
        async (taskData: any) => {
            const key = 'editTask';
            try {
                // Trim all string values and validate
                const trimmedData = {
                    ...taskData,
                    title: taskData.title?.trim(),
                    description: taskData.description?.trim(),
                };

                // Validate required fields
                if (!trimmedData.title) {
                    memoizedNotification.error({ key, content: 'Tiêu đề không được để trống' });
                    return;
                }

                if (!trimmedData.description || trimmedData.description.replace(/<[^>]+>/g, '').trim() === '') {
                    memoizedNotification.error({ key, content: 'Mô tả không được để trống' });
                    return;
                }

                const updatedTask = {
                    ...task,
                    ...trimmedData,
                    start_time: taskData.date[0].format('YYYY-MM-DD HH:mm:ss'),
                    end_time: taskData.date[1].format('YYYY-MM-DD HH:mm:ss'),
                };

                memoizedNotification.loading({ key, content: 'Đang cập nhật công việc...' });
                await onEditTask(updatedTask);
                setIsEditModalVisible(false);
                onReload?.();
                memoizedNotification.success({ key, content: 'Cập nhật công việc thành công!' });
            } catch (error) {
                memoizedNotification.error({ key, content: 'Không thể cập nhật công việc' });
            }
        },
        [onEditTask, onReload, memoizedNotification, task],
    );

    const handleDeleteTask = useCallback(async () => {
        if (!task.id) return;
        const key = 'deleteTask';
        try {
            memoizedNotification.loading({ key, content: 'Đang xóa công việc...' });
            await onDeleteTask(task.id);
            window.location.reload();
        } catch (error) {
            memoizedNotification.error({ key, content: 'Không thể xóa công việc' });
        }
    }, [task.id, onDeleteTask, memoizedNotification]);

    const handleEdit = useCallback(() => {
        form.setFieldsValue({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            start_time: dayjs(task.start_time),
            end_time: dayjs(task.end_time),
            assigned_user_id: task.assigned_user_id,
        });
        setIsEditing(true);
    }, [form, task]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        form.resetFields();
    }, [form]);

    const handleSave = useCallback(async () => {
        try {
            const values = await form.validateFields();

            const trimmedValues = {
                ...values,
                title: values.title?.trim(),
                description: values.description?.trim(),
            };

            if (!trimmedValues.title) {
                form.setFields([
                    {
                        name: 'title',
                        errors: ['Tiêu đề không được để trống'],
                    },
                ]);
                return;
            }

            if (!trimmedValues.description || trimmedValues.description.replace(/<[^>]+>/g, '').trim() === '') {
                form.setFields([
                    {
                        name: 'description',
                        errors: ['Mô tả không được để trống'],
                    },
                ]);
                return;
            }

            const updatedTask = {
                ...task,
                ...trimmedValues,
                start_time: trimmedValues.start_time
                    ? trimmedValues.start_time.format('YYYY-MM-DD HH:mm:ss')
                    : task.start_time,
                end_time: trimmedValues.end_time ? trimmedValues.end_time.format('YYYY-MM-DD HH:mm:ss') : task.end_time,
            };

            if (trimmedValues.assigned_user_id && trimmedValues.assigned_user_id !== task.assigned_user_id) {
                await updateAssignment({
                    taskId: Number(task.id),
                    userId: trimmedValues.assigned_user_id,
                });
                updatedTask.assigned_user_id = trimmedValues.assigned_user_id;
            }

            setTask(updatedTask);
            setIsEditing(false);

            memoizedNotification.loading({ key: 'saveTask', content: 'Đang lưu thay đổi...' });
            await onEditTask(updatedTask);
            onReload?.();
            memoizedNotification.success({ key: 'saveTask', content: 'Lưu thay đổi thành công!' });
        } catch (error) {
            console.error(error);
            memoizedNotification.error({ key: 'saveTask', content: 'Không thể lưu thay đổi' });
        }
    }, [form, task, onEditTask, onReload, memoizedNotification]);

    const items = [
        {
            key: '1',
            label: 'Tổng quan',
            children: (
                <TaskOverview
                    task={task}
                    isEditing={isEditing}
                    form={form}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                    onSave={handleSave}
                    onDelete={handleDeleteTask}
                    teamId={teamId}
                />
            ),
        },
        {
            key: '2',
            label: 'Ghi chú & Tệp đính kèm',
            children: (
                <NotesAndAttachments
                    notesAndAttachments={notesAndAttachments}
                    newNote={newNote}
                    newFile={newFile}
                    loading={loading}
                    onNoteChange={setNewNote}
                    onFileChange={handleFileChange}
                    onAddNoteAndFile={handleAddNoteAndFile}
                    onDeleteNote={handleDeleteNote}
                    onRemoveFile={() => setNewFile(null)}
                    onFileSizeError={handleFileSizeError}
                />
            ),
        },
        {
            key: '3',
            label: 'Bình luận',
            children: (
                <Comments
                    comments={comments}
                    newComment={newComment}
                    editingCommentId={editingCommentId}
                    editCommentText={editCommentText}
                    onCommentChange={setNewComment}
                    onEditCommentTextChange={setEditCommentText}
                    onAddComment={handleAddComment}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    loading={loading}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {contextHolder}

            <Tabs defaultActiveKey="notes" items={items} />

            <Modal
                title="Chỉnh sửa công việc"
                open={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                footer={null}
                width={700}
                className="task-modal"
            >
                <TaskForm
                    onTaskCreated={(updatedTask) => {
                        setTask(updatedTask);
                        setIsEditModalVisible(false);
                        onReload?.();
                    }}
                    onClose={() => setIsEditModalVisible(false)}
                    initialValues={{
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        date: [dayjs(task.start_time), dayjs(task.end_time)],
                    }}
                    taskId={task.id}
                    teamId={teamId}
                />
            </Modal>
        </div>
    );
}

export default TaskDetails;
