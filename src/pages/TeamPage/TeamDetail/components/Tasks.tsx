import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TaskPayload, UserProfile, UpdateAssignmentPayload } from '@services/types/types';
import TaskForm from '@components/TaskForm';
import TaskTable from '@components/TaskTable';
import getAllTaskTeam from '@services/taskServices/getAllTaskTeam';
import { updateTask, deleteTask } from '@services/taskServices';
import { getMembersTeam, updateAssignment } from '@services/teamServices';
import { useMessage } from '@hooks/useMessage';
import { TeamMemberInfo } from '@services/teamServices/teamMembers/getMembersTeam';
import dayjs from 'dayjs';

interface TasksProps {
    teamId: string | undefined;
}

const Tasks = ({ teamId }: TasksProps) => {
    const { message, contextHolder } = useMessage();
    const [tasks, setTasks] = useState<TaskPayload[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);
    const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
    const [filters, setFilters] = useState<any>({});

    const fetchTeamMembers = useCallback(async () => {
        if (!teamId) return;

        try {
            const response = await getMembersTeam(Number(teamId));
            if (Array.isArray(response)) {
                const convertedMembers: UserProfile[] = response.map((member: TeamMemberInfo) => ({
                    id: member.id,
                    full_name: member.full_name,
                    role: member.role,
                    avatar_url: '',
                    email: member.full_name.toLowerCase().replace(/\s+/g, '') + '@example.com',
                }));
                setTeamMembers(convertedMembers);
            } else {
                throw new Error('Dữ liệu thành viên không hợp lệ');
            }
        } catch (error: any) {
            message.error({
                key: 'fetch-team-members-error',
                content: error.message || 'Không thể lấy danh sách thành viên',
            });
        }
    }, [teamId, message]);

    const fetchTasks = useCallback(async () => {
        if (!teamId) return;

        const key = 'fetchTasks';
        try {
            setLoading(true);
            const response = await getAllTaskTeam(teamId, {
                page: currentPage,
                limit: 10,
                ...filters,
            });

            if (response?.tasksTeam) {
                const formattedTasks = response.tasksTeam.map((task: TaskPayload) => ({
                    ...task,
                    start_time: dayjs(task.start_time).format('YYYY-MM-DD HH:mm:ss'),
                    end_time: dayjs(task.end_time).format('YYYY-MM-DD HH:mm:ss'),
                }));

                const sortedTasks = [...formattedTasks].sort(
                    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
                );
                setTasks(sortedTasks);
                setTotalTasks(response.totalItems || response.tasksTeam.length);
            } else {
                throw new Error('Dữ liệu không hợp lệ');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Không thể tải danh sách công việc';
            setError(errorMessage);
            message.error({ key, content: errorMessage });
        } finally {
            setLoading(false);
        }
    }, [teamId, currentPage, filters, message]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleUpdateTask = useCallback(
        async (taskData: TaskPayload) => {
            if (!taskData.id) {
                message.error({ key: 'updateTask', content: 'Không tìm thấy ID công việc' });
                return;
            }

            const key = 'updateTask';
            try {
                const taskId = taskData.id;
                let numericId: number;

                if (typeof taskId === 'string') {
                    numericId = parseInt(taskId, 10);
                    if (isNaN(numericId)) {
                        throw new Error('ID công việc không hợp lệ');
                    }
                } else if (typeof taskId === 'number') {
                    numericId = taskId;
                } else {
                    throw new Error('ID công việc không hợp lệ');
                }

                message.loading({ key, content: 'Đang cập nhật công việc...' });

                const updatedTaskData: TaskPayload = {
                    ...taskData,
                    team_id: teamId || '',
                };

                await updateTask(numericId, updatedTaskData);
                await fetchTasks();
                message.success({ key, content: 'Cập nhật công việc thành công!' });
            } catch (err: any) {
                message.error({ key, content: err.message || 'Không thể cập nhật công việc' });
            }
        },
        [teamId, message, fetchTasks],
    );

    const handleDeleteTask = useCallback(
        async (taskId: string | number) => {
            const key = 'deleteTask';
            try {
                const numericId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
                if (isNaN(numericId)) {
                    throw new Error('ID công việc không hợp lệ');
                }

                message.loading({ key, content: 'Đang xóa công việc...' });
                await deleteTask(numericId);
                await fetchTasks();
                message.success({ key, content: 'Xóa công việc thành công!' });
            } catch (err: any) {
                message.error({ key, content: err.message || 'Không thể xóa công việc' });
            }
        },
        [message, fetchTasks],
    );

    const handleAssignTask = useCallback(
        async (taskId: number, memberId: number) => {
            if (!teamId) return;

            const key = 'assignTask';
            try {
                message.loading({ key, content: 'Đang phân công công việc...' });

                const payload: UpdateAssignmentPayload = {
                    taskId,
                    userId: memberId,
                };

                await updateAssignment(payload);
                await fetchTasks();
                message.success({ key, content: 'Phân công công việc thành công!' });
            } catch (err: any) {
                message.error({ key, content: err.message || 'Không thể phân công công việc' });
            }
        },
        [teamId, fetchTasks, message],
    );

    const handleFilter = (values: any) => {
        setFilters(values);
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchTasks();
        fetchTeamMembers();
    }, [fetchTasks, fetchTeamMembers]);

    return (
        <>
            {contextHolder}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-semibold text-gray-800 m-0">Danh sách công việc</h1>
            </div>

            <TaskTable
                tasks={tasks}
                loading={loading}
                error={error}
                onReload={fetchTasks}
                onEditTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAssignTask={handleAssignTask}
                currentPage={currentPage}
                totalTasks={totalTasks}
                onPageChange={handlePageChange}
                teamId={teamId}
                teamMembers={teamMembers}
                onTaskCreated={() => setIsModalVisible(true)}
                onFilter={handleFilter}
            />

            <Modal
                title={
                    <div className="flex items-center">
                        <PlusOutlined className="mr-2" />
                        Thêm công việc
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
                className="task-modal"
            >
                <TaskForm
                    onTaskCreated={() => {
                        fetchTasks();
                        setIsModalVisible(false);
                    }}
                    onClose={() => setIsModalVisible(false)}
                    teamId={teamId}
                />
            </Modal>
        </>
    );
};

export default Tasks;
