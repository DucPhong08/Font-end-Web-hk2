import React from 'react';
import { Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { TaskPayload, UserProfile } from '@services/types/types';

interface TaskTableContentProps {
    loading: boolean;
    error: any;
    onReload: () => void;
    searchText: string;
    setSearchText: (text: string) => void;
    filteredTasks: TaskPayload[];
    columns: ColumnsType<TaskPayload>;
    currentPage: number;
    totalTasks: number;
    onPageChange: (page: number) => void;
    teamId?: string;
    onEditTask: (task: TaskPayload) => Promise<void>;
    onDeleteTask: (taskId: string | number) => Promise<void>;
    teamMembers?: UserProfile[];
    onAssignTask?: (taskId: number, userId: number) => Promise<void>;
    scroll?: { x: number | string };
}

const TaskTableContent: React.FC<TaskTableContentProps> = ({
    loading,
    error,
    filteredTasks,
    columns,
    currentPage,
    totalTasks,
    onPageChange,
    scroll,
}) => {
    return (
        <Table
            columns={columns}
            dataSource={filteredTasks}
            loading={loading}
            rowKey="id"
            pagination={{
                current: currentPage,
                total: totalTasks,
                onChange: onPageChange,
                pageSize: 10,
                showSizeChanger: false,
                className: 'px-4 py-3',
                position: ['bottomCenter'],
            }}
            className="custom-table"
            rowClassName="hover:bg-gray-50 transition-colors duration-200"
            scroll={scroll}
        />
    );
};

export default TaskTableContent;
