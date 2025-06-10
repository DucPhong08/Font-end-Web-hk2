import apiRequest from '../common/apiRequest';

export interface UpdateUserBody {
    status?: 'active' | 'banned';
    role?: 'admin' | 'member';
    full_name?: string;
    resetPassword?: boolean;
}

export interface UpdateUserResponse {
    success: boolean;
    message: string;
    data: {
        id: number;
        status: string;
        role: string;
        full_name: string;
    };
}

const updateUserApi = async (userId: string, body: UpdateUserBody): Promise<UpdateUserResponse> => {
    try {
        const response = await apiRequest<UpdateUserResponse>(`/admin/users/${userId}`, 'PUT', body, true);

        if (!response.success || !response.data) {
            throw new Error(response.message || 'Không thể cập nhật thông tin người dùng');
        }

        return response.data;
    } catch (error) {
        console.error('Error in updateUser service:', error);
        throw error;
    }
};

export default updateUserApi;
