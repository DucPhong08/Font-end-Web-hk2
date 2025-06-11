import apiRequest from '../common/apiRequest';
import { UserProfile } from '../types/types';

const viewProfileOtherUser = async (id: string): Promise<UserProfile> => {
    const res = await apiRequest<{ profile: UserProfile }>(`/user/profile/${id}`, 'GET', null, true);

    if (!res.success || !res.data?.profile) {
        throw new Error(res.message || 'Không thể lấy thông tin người dùng.');
    }

    return res.data.profile;
};

export default viewProfileOtherUser;
