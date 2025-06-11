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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const debouncedSearchTitle = useDebounce(searchTitle, 500);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                if (typeof newValue === 'string') {
                    // Chỉ kiểm tra khi input rỗng hoặc chỉ chứa khoảng trắng
                    if (!newValue.trim()) {
                        form.setFields([
                            {
                                name: field,
                                errors: ['Giá trị không được để trống'],
                            },
                        ]);
                        return;
                    }
                    newValue = newValue.trim();
                }
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
        // Kiểm tra và xử lý các giá trị filter
        const processedValues = { ...values };

        // Xử lý các trường string
        Object.keys(processedValues).forEach((key) => {
            if (typeof processedValues[key] === 'string') {
                // Chỉ kiểm tra khi input rỗng hoặc chỉ chứa khoảng trắng
                if (!processedValues[key].trim()) {
                    delete processedValues[key];
                    return;
                }
                processedValues[key] = processedValues[key].trim();
            }
        });

        setFilters(processedValues);
        onPageChange(1);
    };

    const handleSearch = (value: string) => {
        // Chỉ kiểm tra khi input rỗng hoặc chỉ chứa khoảng trắng
        if (!value.trim()) {
            return;
        }
        setSearchTitle(value);
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
            align: 'center' as const,
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
                            className="animate-fade-in hover:border-blue-400 focus:border-blue-400 transition-all duration-200"
                            onPressEnter={() => handleFieldSave(record, 'title')}
                            defaultValue={record.title}
                            autoFocus
                            suffix={
                                <Space size="small">
                                    <Button
                                        type="text"
                                        icon={<FontAwesomeIcon icon={faSave} className="text-green-500" />}
                                        onClick={() => handleFieldSave(record, 'title')}
                                        className="!p-0 !h-6"
                                    />
                                    <Button
                                        type="text"
                                        icon={<FontAwesomeIcon icon={faTimes} className="text-red-500" />}
                                        onClick={() => handleFieldCancel()}
                                        className="!p-0 !h-6"
                                    />
                                </Space>
                            }
                        />
                    </Form.Item>
                ) : (
                    <span
                        className="font-medium hover:text-blue-500 transition-all duration-200 cursor-pointer truncate block max-w-[120px] sm:max-w-[200px]"
                        onClick={() => handleFieldEdit(record, 'title')}
                    >
                        {record.title}
                    </span>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: '12%',
            align: 'center' as const,
            className: '!w-[100px] sm:!w-[120px]',
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
                            className="hover:border-blue-400 focus:border-blue-400 transition-all duration-200"
                            onBlur={() => handleFieldSave(record, 'status')}
                            autoFocus
                        >
                            <Select.Option value="todo">Chưa thực hiện</Select.Option>
                            <Select.Option value="in_progress">Đang thực hiện</Select.Option>
                            <Select.Option value="done">Hoàn thành</Select.Option>
                        </Select>
                    </Form.Item>
                ) : (
                    <Tag
                        color={getStatusColor(record.status)}
                        className="px-2 py-1 text-xs sm:text-sm hover:opacity-80 transition-opacity duration-200 cursor-pointer"
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
                            className="hover:border-blue-400 focus:border-blue-400 transition-all duration-200"
                            onBlur={() => handleFieldSave(record, 'priority')}
                            autoFocus
                        >
                            <Select.Option value="low">Thấp</Select.Option>
                            <Select.Option value="medium">Trung bình</Select.Option>
                            <Select.Option value="high">Cao</Select.Option>
                        </Select>
                    </Form.Item>
                ) : (
                    <Tag
                        color={getPriorityColor(record.priority)}
                        className="px-2 py-1 text-xs sm:text-sm hover:opacity-80 transition-opacity duration-200 cursor-pointer"
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
                      align: 'center' as const,
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
                                      className="w-full hover:border-blue-400 focus:border-blue-400 transition-all duration-200"
                                      autoFocus
                                  >
                                      {teamMembers.map((user: UserProfile) => (
                                          <Select.Option
                                              key={user.id}
                                              value={user.id}
                                              label={`${user.full_name} (${getRoleText(user.role)})`}
                                          >
                                              <div className="flex items-center justify-between">
                                                  <span className="font-medium">{user.full_name}</span>
                                                  <Tag color={getRoleColor(user.role)} className="ml-2">
                                                      {getRoleText(user.role)}
                                                  </Tag>
                                              </div>
                                          </Select.Option>
                                      ))}
                                  </Select>
                              </Form.Item>
                          ) : (
                              <span
                                  className="text-gray-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer"
                                  onClick={() => handleFieldEdit(record, 'assigned_user_id')}
                              >
                                  {assignedUser ? (
                                      <div className="flex items-center">
                                          <span className="truncate max-w-[80px] sm:max-w-[120px]">
                                              {assignedUser.full_name}
                                          </span>
                                          <Tag color={getRoleColor(assignedUser.role)} className="ml-2 flex-shrink-0">
                                              {getRoleText(assignedUser.role)}
                                          </Tag>
                                      </div>
                                  ) : (
                                      'Chưa giao'
                                  )}
                              </span>
                          );
                      },
                  },
              ]
            : []),
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'start_time',
            key: 'start_time',
            width: '15%',
            align: 'center' as const,
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
                const format = date.year() === currentYear ? 'DD/MM' : 'DD/MM/YYYY';

                return isEditing ? (
                    <Form.Item name="start_time" style={{ margin: 0 }}>
                        <DatePicker
                            showTime
                            format="YYYY-MM-DD HH:mm"
                            defaultValue={date}
                            className="w-full hover:border-blue-400 focus:border-blue-400 transition-all duration-200"
                            onOk={(date) => handleDateChange(record, 'start_time', date)}
                            autoFocus
                        />
                    </Form.Item>
                ) : (
                    <span
                        className="text-gray-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer text-xs sm:text-sm"
                        onClick={() => handleFieldEdit(record, 'start_time')}
                    >
                        {date.format(format)}
                    </span>
                );
            },
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'end_time',
            key: 'end_time',
            width: '15%',
            align: 'center' as const,
            ellipsis: true,
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
                const format = date.year() === currentYear ? 'DD/MM' : 'DD/MM/YYYY';

                return isEditing ? (
                    <Form.Item name="end_time" style={{ margin: 0 }}>
                        <DatePicker
                            showTime
                            format="YYYY-MM-DD HH:mm"
                            defaultValue={date}
                            className="w-full hover:border-blue-400 focus:border-blue-400 transition-all duration-200"
                            onOk={(date) => handleDateChange(record, 'end_time', date)}
                            autoFocus
                        />
                    </Form.Item>
                ) : (
                    <span
                        className="text-gray-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer text-xs sm:text-sm"
                        onClick={() => handleFieldEdit(record, 'end_time')}
                    >
                        {date.format(format)}
                    </span>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '15%',
            align: 'center' as const,
            className: '!w-[120px]',
            render: (_: any, record: TaskPayload) => {
                return (
                    <Space className="animate-fade-in w-full justify-center" size="small">
                        <Button
                            type="text"
                            icon={<FontAwesomeIcon icon={faEye} className="text-blue-600" />}
                            className="!px-2 !py-1 bg-blue-100 hover:bg-blue-200 hover:text-blue-800 rounded-full transition-all duration-200 shadow-sm"
                            onClick={() => handleViewDetail(record)}
                        >
                            {!isMobile && 'Xem'}
                        </Button>
                        <Popconfirm
                            title="Bạn có chắc chắn muốn xóa công việc này?"
                            onConfirm={() => {
                                const taskId = record.id;
                                if (taskId) {
                                    handleDeleteTask(taskId);
                                }
                            }}
                            okText="Có"
                            cancelText="Không"
                            okButtonProps={{ danger: true, className: 'bg-red-600 hover:bg-red-700 rounded-lg' }}
                            cancelButtonProps={{ className: 'rounded-lg' }}
                        >
                            <Button
                                type="text"
                                icon={<FontAwesomeIcon icon={faTrash} className="text-red-600" />}
                                className="!px-2 !py-1 bg-red-100 hover:bg-red-200 hover:text-red-800 rounded-full transition-all duration-200 shadow-sm"
                            />
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
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={onTaskCreated}
                            className="!flex !items-center"
                        >
                            <span className="hidden sm:inline">Thêm công việc</span>
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <Tooltip title="Làm mới">
                            <Button icon={<ReloadOutlined />} onClick={handleReset} className="!flex !items-center" />
                        </Tooltip>
                        <div className="relative flex-1 sm:flex-none">
                            <Input
                                placeholder="Tìm kiếm..."
                                prefix={<SearchOutlined />}
                                value={searchTitle}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full sm:w-48 md:w-64"
                                allowClear
                            />
                        </div>
                        <Tooltip title="Lọc">
                            <Button
                                icon={<FilterOutlined />}
                                onClick={() => setIsFilterModalVisible(true)}
                                className="!flex !items-center"
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>

            <Form form={form} component={false}>
                <div className="overflow-x-auto">
                    <TaskTableContent
                        loading={loading}
                        error={error}
                        onReload={onReload}
                        searchText={searchTitle}
                        setSearchText={setSearchTitle}
                        filteredTasks={localTasks}
                        columns={columns}
                        currentPage={currentPage}
                        totalTasks={totalTasks}
                        onPageChange={onPageChange}
                        teamId={teamId}
                        onEditTask={onEditTask}
                        onDeleteTask={handleDeleteTask}
                        teamMembers={teamMembers}
                        onAssignTask={onAssignTask}
                        scroll={{ x: 'max-content' }}
                    />
                </div>
            </Form>

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onFilter={handleFilter}
                teamId={teamId}
                teamMembers={teamMembers}
            />

            <Drawer
                title={<div className="text-xl font-semibold text-gray-800">Chi tiết công việc</div>}
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                closable
                destroyOnHidden
                width={window.innerWidth < 768 ? '100%' : '50%'}
            >
                <div className="p-6">{renderTaskDetails()}</div>
            </Drawer>
        </div>
    );
};

export default TaskTable;
