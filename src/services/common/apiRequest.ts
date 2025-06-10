import { getToken } from '../../utils/auth/authUtils';
import { API_BASE_URL } from '@/config/config';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

async function apiRequest<T = any>(
    endpoint: string,
    method: string = 'GET',
    body: any = null,
    requiresAuth: boolean = true,
): Promise<ApiResponse<T>> {
    try {
        const headers: HeadersInit = {};

        if (requiresAuth) {
            const token = getToken();
            if (!token) {
                return { success: false, message: 'Bạn cần đăng nhập để thực hiện thao tác này.' };
            }
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options: RequestInit = {
            method,
            headers,
        };

        if (body) {
            if (body instanceof FormData) {
                options.body = body;
            } else {
                headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: data.message || data.error || 'Đã xảy ra lỗi không xác định.',
            };
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error('API Request Error:', error);
        return {
            success: false,
            message: 'Không thể kết nối đến server.',
        };
    }
}

export default apiRequest;
