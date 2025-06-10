export interface LoginResponse {
    token: string;
}
//=============================
export interface UserProfile {
    id?: number;
    email?: string;
    role?: string;
    status?: 'active' | 'locked' | 'banned';
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
    gender?: string;
    date_of_birth?: string | null;
    address?: string | null;
    bio?: string | null;
}

export interface UpdateUserProfile {
    full_name?: string;
    phone_number?: string;
    avatar: string | File;
    gender?: string;
    date_of_birth?: string | null;
    address?: string | null;
    bio?: string | null;
}
//===========================
export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}
//=========================
export interface TaskPayload {
    id?: string;
    title: string;
    team_id?: string | null;
    start_time: string;
    end_time: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assigned_user_id?: string | number | null;
    creator_name?: string;
    created_at?: string;
}

// ====================

export interface TaskNote {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    full_name: string;
}

export interface TaskAttachment {
    id: number;
    task_id: number;
    user_id: number;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    created_at: string;
    updated_at: string;
    full_name: string;
}

export interface TaskNotesAndAttachments {
    id: number;
    task_id: number;
    user_id: number;
    content?: string;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    created_at: string;
    updated_at: string;
    full_name: string;
}

//===========================
export interface TaskComment {
    id: number;
    task_id: number;
    user_id: number; // ID người comment
    full_name: string;
    comment: string; // Nội dung comment
    is_from_assignee: boolean; // Có phải từ người được giao task không
    created_at: string;
}
//==================================
export interface CreateTeamPayload {
    name: string;
    description?: string;
}
export interface UpdateTeamPayload {
    name?: string;
    description?: string;
    avatar?: File | null;
}
export interface Team {
    id: number;
    name: string;
    description: string;
    avatar_url: string | null;
    created_at: string;
    creator_id: number;
    creator_name: string;
    creator_email: string;
}
export interface GetTeamsResponseData {
    data: Team[];
    pagination: {
        currentPage: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ======================
export interface UpdateAssignmentPayload {
    taskId: number;
    userId: number;
}
export interface TaskAssignment {
    id: number;
    task_id: number;
    user_id: number | null;
    assigned_by: number | null;
    assigned_at: string;
    updated_at: string;
}
//============================
export interface Reminder {
    id: number;
    user_id: number;
    task_id: number;
    start_time?: string;
    end_time?: string;
    mes?: string;
    is_sent?: boolean;
    is_read?: boolean;
    type?: 'task' | 'assignment';
    created_at?: string;
}

export interface TeamTasksResponse {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    tasksTeam: TaskPayload[];
}
//===========================
export interface MemberStatistics {
    message: string;
    user_info: {
        id: number;
        full_name: string;
        role: string;
        joined_at: string;
        avatar_url: string;
        months_in_team: number;
    };
    task_statistics: {
        total_created_tasks: number;
        completed_tasks: string;
        pending_tasks: string;
        assigned_tasks: number;
        completion_rate: string;
        pending_rate: string;
        high_priority_rate: string;
        total_comments: number;
        total_notes: number;
        activity_score: string;
    };
    performance_metrics: {
        avg_completion_time: number;
        min_completion_time: number;
        max_completion_time: number;
        avg_delay_time: number;
    };
    active_tasks: Array<{
        id: number;
        title: string;
        status: string;
        priority: string;
        end_time: string;
        days_remaining: number;
        comment_count: number;
        note_count: number;
        is_overdue: boolean;
    }>;
    chart_data: {
        taskStatus: {
            labels: string[];
            data: string[];
        };
        taskPriority: {
            labels: string[];
            data: string[];
        };
        weeklyProgress: {
            labels: string[];
            completed: string[];
            pending: string[];
        };
    };
}

// statistics
export interface TaskCompletion {
    completed: string;
    todo: string;
    in_progress: string;
    completion_rate: string;
}

export interface TaskDistribution {
    personal: {
        count: string;
        percentage: string;
    };
    team: {
        count: string;
        percentage: string;
    };
}

export interface TimeStats {
    date: string;
    total: number;
    completed: string;
    todo: string;
    in_progress: string;
    completion_rate: string;
}

export interface PriorityStats {
    priority: string;
    total: number;
    completed: string;
    todo: string;
    in_progress: string;
    completion_rate: string;
}

export interface StatisticsResponse {
    selected_period: string;
    all_time: {
        total_tasks: number;
        task_completion: TaskCompletion;
        task_distribution: TaskDistribution;
    };
    period_stats: {
        total_tasks: number;
        task_completion: TaskCompletion;
        task_distribution: TaskDistribution;
    };
    details: {
        time_stats: TimeStats[];
        priority_stats: PriorityStats[];
    };
}
//===========================
export interface UserLog {
    id?: string;
    action: string;
    description: string;
    ip_address: string;
    created_at: string;
    email: string;
    full_name: string;
}

export interface GetUserLogsResponse {
    logs: UserLog[];
}

export interface User {
    id: number;
    email: string;
    full_name: string;
    role?: 'admin' | 'member';
    status?: 'active' | 'locked' | 'banned';
    created_at: string;
    updated_at: string;
    gender: string;
    phone_number?: string;
    avatar_url?: string;
    date_of_birth?: string;
    address?: string;
    bio?: string;
}

export interface GetUsersResponse {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    users: User[];
}

export interface GetUsersParams {
    page?: number;
    limit?: number;
    gender?: 'male' | 'female' | 'other';
}

export interface CreateUserParams {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'member';
    status: 'active' | 'locked' | 'banned';
}

export interface CreateUserResponse {
    id: number;
    email: string;
    full_name: string;
    role: string;
    created_at?: string;
}
