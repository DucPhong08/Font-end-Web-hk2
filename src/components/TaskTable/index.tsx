import { useState, useEffect } from 'react';
import { Input, Space, Tag, Button, Drawer, Select, DatePicker, Form, Popconfirm, Table, Tooltip } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { TaskPayload, UserProfile } from '@services/types/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import useDebounce from '@hooks/useDebounce';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
    getPriorityColor,
    getPriorityText,
    getRoleColor,
    getRoleText,
    getStatusColor,
    getStatusText,
} from './tableState';
import { TaskTableContentProps } from './types';
import TaskDetails from '../TaskDetail/TaskDetails';
import FilterModal from './FilterModal';
import { SearchOutlined, FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import TaskTableContent from './TaskTableContent';

dayjs.extend(utc);

const TaskTable = ({
    tasks,
    loading,
    error,
    onReload,
    onEditTask,
    onDeleteTask,
    currentPage,
    totalTasks,
    onPageChange,
    teamId,
    teamMembers = [],
    onAssignTask,
    onTaskCreated,
    onFilter,
}: TaskTableContentProps) => {
    const [selectedTask, setSelectedTask] = useState<TaskPayload | null>(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [form] = Form.useForm();
    const [localTasks, setLocalTasks] = useState<TaskPayload[]>(tasks);
    const [editingField, setEditingField] = useState<{ id: string | number; field: string } | null>(null);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [searchTitle, setSearchTitle] = useState('');
    const [filters, setFilters] = useState<any>({});

    const debouncedSearchTitle = useDebounce(searchTitle, 500);

    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    useEffect(() => {
        if (onFilter) {
            onFilter({ ...filters, searchTitle: debouncedSearchTitle });
        }
    }, [debouncedSearchTitle, filters]);

    const handleFieldSave = async (record: TaskPayload, field: string) => {
        try {
            const value = await form.validateFields([field]);
            let newValue;

            if (field.includes('time')) {
                const date = dayjs(value[field]);
                if (!date.isValid()) {
                    return;
                }
                try {
                    newValue = date.format('YYYY-MM-DD HH:mm:ss');
                } catch (error) {
                    console.error('Error formatting date:', error);
                    return;
                }
            } else {
                newValue = value[field];
            }

            if (newValue !== record[field as keyof TaskPayload]) {
                const updatedTask = {
                    ...record,
                    [field]: newValue,
                } as TaskPayload;
                await onEditTask(updatedTask);
            }
            setEditingField(null);
            form.resetFields();
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

    const handleDateChange = (record: TaskPayload, field: string, date: dayjs.Dayjs | null) => {
        if (date) {
            try {
                const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
                if (formattedDate !== record[field as keyof TaskPayload]) {
                    const updatedTask = {
                        ...record,
                        [field]: formattedDate,
                    } as TaskPayload;
                    onEditTask(updatedTask);
                }
            } catch (error) {
                console.error('Error formatting date:', error);
            }
        }
        setEditingField(null);
        form.resetFields();
    };

    const handleDeleteTask = async (taskId: string | number) => {
        try {
            await onDeleteTask(taskId);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleFieldEdit = (record: TaskPayload, field: string) => {
        setEditingField({ id: record.id!, field });
        const value = record[field as keyof TaskPayload];
        form.setFieldsValue({
            [field]: field.includes('time') ? dayjs(value) : value,
        });
    };

    const handleFieldCancel = () => {
        setEditingField(null);
        form.resetFields();
    };

    const handleFilter = (values: any) => {
        setFilters(values);
        onPageChange(1);
    };

    const handleReset = () => {
        setSearchTitle('');
        setFilters({});
        form.resetFields();
        onPageChange(1);
    };

    const handleViewDetail = (task: TaskPayload) => {
        setSelectedTask(task);
        setDrawerVisible(true);
    };

    const columns: ColumnsType<TaskPayload> = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            width: '25%',
            align: 'left' as const,
            ellipsis: true,
            render: (_: any, record: TaskPayload) => {
                const isEditing = editingField?.id === record.id && editingField?.field === 'title';
                return isEditing ? (
                    <Form.Item
                        name="title"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input
                            className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                            onPressEnter={() => handleFieldSave(record, 'title')}
                            defaultValue={record.title}
                            autoFocus
                            suffix={
                                <Space size="small">
                                    <Button
                                        type="text"
                                        icon={<FontAwesomeIcon icon={faSave} className="text-green-600" />}
                                        onClick={() => handleFieldSave(record, 'title')}
                                        className="!p-0 !h-6 hover:scale-110 transition-transform duration-200"
                                        aria-label="Lưu tiêu đề"
                                    />
                                    <Button
                                        type="text"
                                        icon={<FontAwesomeIcon icon={faTimes} className="text-red-600" />}
                                        onClick={() => handleFieldCancel()}
                                        className="!p-0 !h-6 hover:scale-110 transition-transform duration-200"
                                        aria-label="Hủy chỉnh sửa"
                                    />
                                </Space>
                            }
                        />
                    </Form.Item>
                ) : (
                    <Tooltip title={record.title}>
                        <span
                            className="font-semibold text-gray-800 hover:text-indigo-600 transition-colors duration-200 cursor-pointer truncate block max-w-[150px] sm:max-w-[250px]"
                            onClick={() => handleFieldEdit(record, 'title')}
                        >
                            {record.title}
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: '12%',
            align: 'center' as const,
            responsive: ['sm'],
            filters: [
                { text: 'Chưa thực hiện', value: 'todo' },
                { text: 'Đang thực hiện', value: 'in_progress' },
                { text: 'Hoàn thành', value: 'done' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (_: any, record: TaskPayload) => {
                const isEditing = editingField?.id === record.id && editingField?.field === 'status';
                return isEditing ? (
                    <Form.Item
                        name="status"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                    >
                        <Select
                            className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                            onBlur={() => handleFieldSave(record, 'status')}
                            autoFocus
                            popupClassName="rounded-lg shadow-lg"
                        >
                            <Select.Option value="todo">Chưa thực hiện</Select.Option>
                            <Select.Option value="in_progress">Đang thực hiện</Select.Option>
                            <Select.Option value="done">Hoàn thành</Select.Option>
                        </Select>
                    </Form.Item>
                ) : (
                    <Tag
                        color={getStatusColor(record.status)}
                        className="px-3 py-1 text-sm font-medium rounded-full hover:opacity-90 transition-opacity duration-200 cursor-pointer shadow-sm"
                        onClick={() => handleFieldEdit(record, 'status')}
                    >
                        {getStatusText(record.status)}
                    </Tag>
                );
            },
        },
        {
            title: 'Độ ưu tiên',
            dataIndex: 'priority',
            key: 'priority',
            width: '12%',
            align: 'center' as const,
            responsive: ['sm'],
            filters: [
                { text: 'Thấp', value: 'low' },
                { text: 'Trung bình', value: 'medium' },
                { text: 'Cao', value: 'high' },
            ],
            onFilter: (value, record) => record.priority === value,
            render: (_: any, record: TaskPayload) => {
                const isEditing = editingField?.id === record.id && editingField?.field === 'priority';
                return isEditing ? (
                    <Form.Item
                        name="priority"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên!' }]}
                    >
                        <Select
                            className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                            onBlur={() => handleFieldSave(record, 'priority')}
                            autoFocus
                            popupClassName="rounded-lg shadow-lg"
                        >
                            <Select.Option value="low">Thấp</Select.Option>
                            <Select.Option value="medium">Trung bình</Select.Option>
                            <Select.Option value="high">Cao</Select.Option>
                        </Select>
                    </Form.Item>
                ) : (
                    <Tag
                        color={getPriorityColor(record.priority)}
                        className="px-3 py-1 text-sm font-medium rounded-full hover:opacity-90 transition-opacity duration-200 cursor-pointer shadow-sm"
                        onClick={() => handleFieldEdit(record, 'priority')}
                    >
                        {getPriorityText(record.priority)}
                    </Tag>
                );
            },
        },
        ...(teamId
            ? [
                  {
                      title: 'Người thực hiện',
                      dataIndex: 'assigned_user_id',
                      key: 'assigned_user_id',
                      width: '20%',
                      align: 'left' as const,
                      ellipsis: true,
                      render: (_: any, record: TaskPayload) => {
                          const isEditing =
                              editingField?.id === record.id && editingField?.field === 'assigned_user_id';
                          const assignedUser = teamMembers.find(
                              (user: UserProfile) => user.id === record.assigned_user_id,
                          );

                          return isEditing ? (
                              <Form.Item name="assigned_user_id" style={{ margin: 0 }}>
                                  <Select
                                      showSearch
                                      placeholder="Chọn người thực hiện"
                                      defaultValue={
                                          record.assigned_user_id ? Number(record.assigned_user_id) : undefined
                                      }
                                      value={record.assigned_user_id ? Number(record.assigned_user_id) : undefined}
                                      onChange={async (value: number) => {
                                          if (record.id && onAssignTask) {
                                              try {
                                                  await onAssignTask(Number(record.id), value);
                                                  const updatedTask = {
                                                      ...record,
                                                      assigned_user_id: value,
                                                  };
                                                  await onEditTask(updatedTask);
                                                  setEditingField(null);
                                              } catch (error) {
                                                  console.error('Error assigning task:', error);
                                              }
                                          }
                                      }}
                                      filterOption={(input, option) =>
                                          (option?.label as string).toLowerCase().includes(input.toLowerCase())
                                      }
                                      className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                                      popupClassName="rounded-lg shadow-lg"
                                      autoFocus
                                  >
                                      {teamMembers.map((user: UserProfile) => (
                                          <Select.Option
                                              key={user.id}
                                              value={user.id}
                                              label={`${user.full_name} (${getRoleText(user.role)})`}
                                          >
                                              <div className="flex items-center justify-between">
                                                  <span className="font-medium text-gray-800">{user.full_name}</span>
                                                  <Tag
                                                      color={getRoleColor(user.role)}
                                                      className="ml-2 rounded-full text-xs"
                                                  >
                                                      {getRoleText(user.role)}
                                                  </Tag>
                                              </div>
                                          </Select.Option>
                                      ))}
                                  </Select>
                              </Form.Item>
                          ) : (
                              <Tooltip
                                  title={
                                      assignedUser
                                          ? `${assignedUser.full_name} (${getRoleText(assignedUser.role)})`
                                          : 'Chưa giao'
                                  }
                              >
                                  <span
                                      className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 cursor-pointer flex items-center"
                                      onClick={() => handleFieldEdit(record, 'assigned_user_id')}
                                  >
                                      {assignedUser ? (
                                          <div className="flex items-center">
                                              <span className="truncate max-w-[100px] sm:max-w-[150px] font-medium">
                                                  {assignedUser.full_name}
                                              </span>
                                              <Tag
                                                  color={getRoleColor(assignedUser.role)}
                                                  className="ml-2 rounded-full text-xs"
                                              >
                                                  {getRoleText(assignedUser.role)}
                                              </Tag>
                                          </div>
                                      ) : (
                                          <span className="text-gray-400">Chưa giao</span>
                                      )}
                                  </span>
                              </Tooltip>
                          );
                      },
                  },
              ]
            : []),
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'start_time',
            key: 'start_time',
            width: '13%',
            align: 'center' as const,
            responsive: ['sm'],
            sorter: (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
            render: (_: any, record: TaskPayload) => {
                const isEditing = editingField?.id === record.id && editingField?.field === 'start_time';
                let date;
                try {
                    const timeStr = record.start_time;
                    if (timeStr.includes('T')) {
                        date = dayjs(timeStr);
                    } else {
                        date = dayjs(timeStr);
                    }
                    if (!date.isValid()) {
                        date = dayjs();
                    }
                } catch (error) {
                    date = dayjs();
                }
                const currentYear = dayjs().year();
                const format = date.year() === currentYear ? 'DD/MM HH:mm' : 'DD/MM/YYYY HH:mm';

                return isEditing ? (
                    <Form.Item name="start_time" style={{ margin: 0 }}>
                        <DatePicker
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            defaultValue={date}
                            className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                            onOk={(date) => handleDateChange(record, 'start_time', date)}
                            autoFocus
                            popupClassName="rounded-lg shadow-lg"
                        />
                    </Form.Item>
                ) : (
                    <Tooltip title={date.format('DD/MM/YYYY HH:mm')}>
                        <span
                            className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 cursor-pointer text-sm"
                            onClick={() => handleFieldEdit(record, 'start_time')}
                        >
                            {date.format(format)}
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'end_time',
            key: 'end_time',
            width: '13%',
            align: 'center' as const,
            responsive: ['sm'],
            sorter: (a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime(),
            render: (_: any, record: TaskPayload) => {
                const isEditing = editingField?.id === record.id && editingField?.field === 'end_time';
                let date;
                try {
                    const timeStr = record.end_time;
                    if (timeStr.includes('T')) {
                        date = dayjs(timeStr);
                    } else {
                        date = dayjs(timeStr);
                    }
                    if (!date.isValid()) {
                        date = dayjs();
                    }
                } catch (error) {
                    date = dayjs();
                }
                const currentYear = dayjs().year();
                const format = date.year() === currentYear ? 'DD/MM HH:mm' : 'DD/MM/YYYY HH:mm';

                return isEditing ? (
                    <Form.Item name="end_time" style={{ margin: 0 }}>
                        <DatePicker
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            defaultValue={date}
                            className="rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                            onOk={(date) => handleDateChange(record, 'end_time', date)}
                            autoFocus
                            popupClassName="rounded-lg shadow-lg"
                        />
                    </Form.Item>
                ) : (
                    <Tooltip title={date.format('DD/MM/YYYY HH:mm')}>
                        <span
                            className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 cursor-pointer text-sm"
                            onClick={() => handleFieldEdit(record, 'end_time')}
                        >
                            {date.format(format)}
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '15%',
            align: 'center' as const,
            fixed: 'right' as const,
            render: (_: any, record: TaskPayload) => {
                return (
                    <Space className="animate-fade-in w-full justify-center" size="middle">
                        <Tooltip title="Xem chi tiết">
                            <Button
                                type="text"
                                onClick={() => handleViewDetail(record)}
                                icon={<FontAwesomeIcon icon={faEye} className="text-indigo-600" />}
                                className="!p-0 !h-8 hover:scale-110 transition-transform duration-200"
                                aria-label="Xem chi tiết công việc"
                            />
                        </Tooltip>
                        <Popconfirm
                            title="Xóa công việc"
                            description="Bạn có chắc chắn muốn xóa công việc này?"
                            onConfirm={() => {
                                const taskId = record.id;
                                if (taskId) {
                                    handleDeleteTask(taskId);
                                }
                            }}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true, className: 'rounded-lg' }}
                            cancelButtonProps={{ className: 'rounded-lg' }}
                        >
                            <Tooltip title="Xóa công việc">
                                <Button
                                    type="text"
                                    icon={<FontAwesomeIcon icon={faTrash} className="text-red-600" />}
                                    className="!p-0 !h-8 hover:scale-110 transition-transform duration-200"
                                    aria-label="Xóa công việc"
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    const renderTaskDetails = () => {
        if (!selectedTask) return null;
        return (
            <TaskDetails
                task={selectedTask}
                onEditTask={onEditTask}
                onDeleteTask={handleDeleteTask}
                onReload={onReload}
                teamId={teamId}
            />
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={onTaskCreated}
                            className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !font-semibold !shadow-sm !transition-all !duration-200 !flex !items-center"
                            aria-label="Thêm công việc mới"
                        >
                            <span className="hidden sm:inline">Thêm công việc</span>
                        </Button>
                    </div>
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <Tooltip title="Làm mới danh sách">
                            <Button
                                type="text"
                                icon={<ReloadOutlined className="text-gray-600" />}
                                onClick={handleReset}
                                className="!p-0 !h-10 hover:bg-gray-100 !rounded-lg !transition-all !duration-200"
                                aria-label="Làm mới"
                            />
                        </Tooltip>
                        <div className="relative flex-1 sm:flex-none">
                            <Input
                                placeholder="Tìm kiếm công việc..."
                                prefix={<SearchOutlined className="text-gray-500" />}
                                value={searchTitle}
                                onChange={(e) => setSearchTitle(e.target.value)}
                                className="w-full sm:w-64 rounded-lg border-gray-300 hover:border-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                                allowClear
                                aria-label="Tìm kiếm công việc"
                            />
                        </div>
                        <Tooltip title="Lọc công việc">
                            <Button
                                type="text"
                                icon={<FilterOutlined className="text-gray-600" />}
                                onClick={() => setIsFilterModalVisible(true)}
                                className="!p-0 !h-10 hover:bg-gray-100 !rounded-lg !transition-all !duration-200"
                                aria-label="Lọc công việc"
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <Form form={form} component={false}>
                <Table
                    columns={columns}
                    dataSource={localTasks}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        current: currentPage,
                        total: totalTasks,
                        onChange: onPageChange,
                        pageSize: 10,
                        showSizeChanger: false,
                        className: 'px-6 py-4',
                    }}
                    className="custom-table"
                    rowClassName="hover:bg-gray-50 transition-colors duration-200"
                    scroll={{ x: 'max-content' }}
                />
            </Form>

            {/* Filter Modal */}
            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onFilter={handleFilter}
                teamId={teamId}
                teamMembers={teamMembers}
            />

            {/* Task Details Drawer */}
            <Drawer
                title={
                    <div className="text-xl font-semibold text-gray-800 bg-gradient-to-r from-gray-50 to-white p-4 rounded-t-lg">
                        Chi tiết công việc
                    </div>
                }
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                closable
                destroyOnHidden
                width={window.innerWidth < 768 ? '100%' : 'min(50%, 600px)'}
                className="rounded-l-xl shadow-xl"
                closeIcon={<FontAwesomeIcon icon={faTimes} className="text-gray-600 hover:text-red-600" />}
            >
                <div className="p-6 space-y-6">{renderTaskDetails()}</div>
            </Drawer>
        </div>
    );
};

export default TaskTable;
