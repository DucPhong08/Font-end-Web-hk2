import apiRequest from '../common/apiRequest';

export const logout = async () => {
    try {
        const response = await apiRequest('/auth/logout', 'POST', null, true);
        if (!response.success) {
            throw new Error(response.message || 'Đăng xuất thất bại');
        }
        return response;
    } catch (error) {
        throw error;
    }
};
