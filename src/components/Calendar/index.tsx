import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, Button, Modal, List, Spin, Tag, ConfigProvider, Calendar, Avatar, Tooltip, Tabs } from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisH, faBell } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import TaskForm from '@/components/TaskForm';
import { TaskPayload, Reminder } from '@services/types/types';
import { getReminders } from '@services/remiderService';
import { EVENT_COLORS, STATUS_TAGS, PRIORITY_TAGS, getEventColor } from '../TaskTable/tableState';

interface CalendarComponentProps {
    tasks: TaskPayload[];
    loading?: boolean;
    onTaskCreated?: (taskData: TaskPayload) => void;
}

const CalendarComponent = ({ tasks, loading = false, onTaskCreated }: CalendarComponentProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTask, setSelectedTask] = useState<TaskPayload | null>(null);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const data = await getReminders({ is_read: '0' });
                setReminders(data.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchReminders();
    }, []);

    const selectedDateTasks = useMemo(() => {
        if (!selectedDate) return [];
        return tasks.filter((task) => {
            const start = dayjs(task.start_time);
            const end = dayjs(task.end_time);
            const date = dayjs(selectedDate);
            return (
                (start.isSame(date, 'day') || start.isBefore(date)) && (end.isSame(date, 'day') || end.isAfter(date))
            );
        });
    }, [selectedDate, tasks]);

    const handleDateSelect = useCallback((date: Dayjs) => {
        setSelectedDate(date.toDate());
        setIsViewModalOpen(true);
    }, []);

    const handleTaskSubmit = useCallback(
        (taskData: TaskPayload) => {
            if (selectedTask) {
                const updatedTask = {
                    ...selectedTask,
                    ...taskData,
                };
                onTaskCreated?.(updatedTask);
            } else {
                onTaskCreated?.(taskData);
            }
            setIsModalOpen(false);
            setSelectedTask(null);
        },
        [onTaskCreated, selectedTask],
    );

    const handleEditTask = (task: TaskPayload) => {
        if (!task.id) return toast.error('Không tìm thấy ID công việc');
        setSelectedTask(task);
        setIsModalOpen(true);
        setIsViewModalOpen(false);
    };

    const dateCellRender: CalendarProps<Dayjs>['cellRender'] = useCallback(
        (date: Dayjs) => {
            const dayTasks = tasks.filter((task) => {
                const start = dayjs(task.start_time);
                const end = dayjs(task.end_time);
                return (
                    (start.isSame(date, 'day') || start.isBefore(date)) &&
                    (end.isSame(date, 'day') || end.isAfter(date))
                );
            });

            const allTaskIds = tasks.map((task) => task.id?.toString());

            const dayReminders = reminders.filter(
                (reminder) =>
                    allTaskIds.includes(reminder.task_id.toString()) && dayjs(reminder.created_at).isSame(date, 'day'),
            );

            if (dayTasks.length === 0 && dayReminders.length === 0) return null;

            const maxDisplay = 5;
            const displayTasks = dayTasks.slice(0, maxDisplay);
            const extraCount = dayTasks.length - maxDisplay;

            return (
                <div className="absolute inset-1 flex flex-col justify-between overflow-hidden">
                    <div className="text-[10px] md:text-sm mt-8 md:mt-0 font-semibold text-gray-600 md:text-left text-right">
                        {dayTasks.length > 0 && <span>{dayTasks.length} công việc</span>}
                        <span
                            className={`ml-2 ${dayReminders.length === 0 ? 'text-gray-400 font-light italic' : 'text-red-500'}`}
                        >
                            <FontAwesomeIcon icon={faBell} className="mr-1" />
                            {dayReminders.length}
                        </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                        {displayTasks.map((task, index) => (
                            <Tooltip key={index} title={task.title}>
                                <Avatar
                                    size={20}
                                    style={{
                                        backgroundColor: getEventColor(task.status, task.priority),
                                        fontSize: 10,
                                    }}
                                >
                                    {task.title.charAt(0).toUpperCase()}
                                </Avatar>
                            </Tooltip>
                        ))}
                        {extraCount > 0 && (
                            <Tooltip title={`+${extraCount} công việc`}>
                                <Avatar size={20} style={{ backgroundColor: '#d9d9d9', fontSize: 10 }}>
                                    <FontAwesomeIcon icon={faEllipsisH} />
                                </Avatar>
                            </Tooltip>
                        )}
                    </div>
                </div>
            );
        },
        [tasks, reminders],
    );

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: EVENT_COLORS.in_progress,
                    fontFamily: 'Inter, sans-serif',
                    borderRadius: 8,
                },
                components: {
                    Button: { borderRadius: 8, controlHeight: 44, paddingInline: 20 },
                    Modal: { borderRadius: 12, padding: 24 },
                    Card: { borderRadius: 12 },
                },
            }}
        >
            <div className="sm:p-6 space-y-4 text-base sm:text-sm overflow-hidden">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Lịch công việc</h1>
                    <Button
                        type="primary"
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={() => {
                            setIsModalOpen(true);
                            setSelectedTask(null);
                        }}
                    >
                        Thêm công việc
                    </Button>
                </div>

                <Card className="shadow">
                    <Spin spinning={loading} tip="Đang tải công việc...">
                        <Calendar
                            onSelect={handleDateSelect}
                            cellRender={dateCellRender}
                            className="custom-calendar 
                                [&_.ant-picker-calendar-table]:table-fixed 
                                [&_.ant-picker-cell]:p-0 
                                [&_.ant-picker-cell]:m-0 
                                [&_.ant-picker-calendar-date]:p-0 
                                [&_.ant-picker-calendar-date]:m-0 
                                [&_.ant-picker-cell-inner]:p-0 
                                [&_.ant-picker-calendar-cell]:p-0 
                                [&_.ant-picker-calendar-cell]:m-0 
                                overflow-hidden"
                        />
                    </Spin>
                </Card>

                <Modal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                    title={selectedTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
                >
                    <TaskForm
                        key={selectedTask?.id || 'new'}
                        taskId={selectedTask?.id}
                        initialValues={
                            selectedTask
                                ? {
                                      title: selectedTask.title,
                                      description: selectedTask.description,
                                      status: selectedTask.status,
                                      priority: selectedTask.priority,
                                      date: [dayjs(selectedTask.start_time), dayjs(selectedTask.end_time)],
                                  }
                                : undefined
                        }
                        onTaskCreated={handleTaskSubmit}
                        onClose={() => setIsModalOpen(false)}
                    />
                </Modal>

                <Modal
                    open={isViewModalOpen}
                    onCancel={() => setIsViewModalOpen(false)}
                    title={
                        <div>
                            <div className="text-xl font-bold">
                                Chi tiết ngày {selectedDate ? dayjs(selectedDate).format('DD/MM/YYYY') : ''}
                            </div>
                        </div>
                    }
                    footer={null}
                    width={window.innerWidth < 640 ? '95%' : 700}
                    className="calendar-modal"
                >
                    <Tabs defaultActiveKey="tasks" className="calendar-tabs">
                        <Tabs.TabPane tab="Công việc" key="tasks">
                            <div className="max-h-[60vh] overflow-y-auto pr-2">
                                <List
                                    dataSource={selectedDateTasks}
                                    renderItem={(task) => (
                                        <List.Item
                                            key={task.id}
                                            onClick={() => handleEditTask(task)}
                                            className="hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        style={{
                                                            backgroundColor: getEventColor(task.status, task.priority),
                                                        }}
                                                    >
                                                        {task.title.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                }
                                                title={<span className="line-clamp-1 font-medium">{task.title}</span>}
                                                description={
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        <Tag color={STATUS_TAGS[task.status]?.color}>
                                                            {STATUS_TAGS[task.status]?.text}
                                                        </Tag>
                                                        <Tag color={PRIORITY_TAGS[task.priority]?.color}>
                                                            {PRIORITY_TAGS[task.priority]?.text}
                                                        </Tag>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: 'Không có công việc nào trong ngày này.' }}
                                />
                            </div>
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Nhắc nhở" key="reminders">
                            <div className="max-h-[60vh] overflow-y-auto pr-2">
                                <List
                                    dataSource={
                                        selectedDate
                                            ? (() => {
                                                  const allTaskIds = tasks.map((task) => task.id?.toString());
                                                  return reminders.filter(
                                                      (reminder) =>
                                                          allTaskIds.includes(reminder.task_id.toString()) &&
                                                          dayjs(reminder.created_at).isSame(dayjs(selectedDate), 'day'),
                                                  );
                                              })()
                                            : []
                                    }
                                    renderItem={(reminder) => {
                                        const task = tasks.find(
                                            (task) => task.id?.toString() === reminder.task_id.toString(),
                                        );
                                        const taskTitle = task ? task.title : 'Không rõ công việc';

                                        return (
                                            <List.Item
                                                key={reminder.id}
                                                className="hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                <List.Item.Meta
                                                    avatar={
                                                        <FontAwesomeIcon icon={faBell} className="text-red-500 mt-1" />
                                                    }
                                                    title={
                                                        <div className="flex flex-col">
                                                            <span className="line-clamp-1 font-medium">
                                                                {taskTitle}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {dayjs(reminder.created_at).format('HH:mm DD/MM/YYYY')}
                                                            </span>
                                                        </div>
                                                    }
                                                    description={
                                                        <span className="line-clamp-2 text-gray-600">
                                                            {reminder.mes}
                                                        </span>
                                                    }
                                                />
                                            </List.Item>
                                        );
                                    }}
                                    locale={{ emptyText: 'Không có nhắc nhở nào trong ngày này.' }}
                                />
                            </div>
                        </Tabs.TabPane>
                    </Tabs>
                </Modal>
            </div>
        </ConfigProvider>
    );
};

export default CalendarComponent;
