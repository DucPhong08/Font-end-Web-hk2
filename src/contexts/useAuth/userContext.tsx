import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getMeProfile } from '../../services/userServices';
import loginApi from '../../services/authServices/login';
import { logout as logoutApi } from '../../services/authServices';
import { UserProfile } from '../../services/types/types';
import { clearToken, getToken, saveToken } from '../../utils/auth/authUtils';
import { useMessage } from '@/hooks/useMessage';

interface UserContextType {
    user: UserProfile | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    fetchUserInfo: () => Promise<void>;
    isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(getToken());
    const [user, setUser] = useState<UserProfile | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { message } = useMessage();

    useEffect(() => {
        if (token) {
            const newSocket = io('http://localhost:5000', {
                auth: { token },
                reconnection: false,
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Connected to Socket.IO');
                newSocket.emit('authenticate', token);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from Socket.IO');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket.IO connection error:', error);
                handleSessionExpired();
            });

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [token]);

    const logout = useCallback(async () => {
        try {
            await logoutApi();
            if (socket) {
                socket.emit('logout');
                socket.disconnect();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearToken();
            localStorage.removeItem('full_name');
            localStorage.removeItem('role');
            setToken(null);
            setUser(null);
            setSocket(null);
            window.location.href = '/';
        }
    }, [socket]);

    const handleSessionExpired = useCallback(() => {
        message.error({ key: 'session-expired', content: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' });
        if (socket) {
            socket.emit('forceLogout');
            socket.disconnect();
        }
        logout();
    }, [logout, message, socket]);

    const fetchUserInfo = useCallback(async () => {
        if (!token) return;
        try {
            const userInfo = await getMeProfile();
            setUser(userInfo);
            if (userInfo.full_name) {
                localStorage.setItem('full_name', userInfo.full_name);
            }
            if (userInfo.role) {
                localStorage.setItem('role', userInfo.role);
            }
        } catch (error: any) {
            console.error('Lỗi khi lấy user info:', error);
            if (error?.response?.status === 401) {
                handleSessionExpired();
            } else {
                logout();
            }
        }
    }, [token, logout, handleSessionExpired]);

    const login = async (email: string, password: string) => {
        try {
            const res = await loginApi(email, password);
            const receivedToken = res.data?.token;
            if (!receivedToken) throw new Error('Sai tài khoản hoặc mất khẩu');
            saveToken(receivedToken);
            setToken(receivedToken);

            const userInfo = await getMeProfile();

            const allowedRoles = ['admin', 'member'];
            if (!userInfo.role || !allowedRoles.includes(userInfo.role)) {
                logout();
                throw new Error('Bạn không có quyền truy cập');
            }

            if (userInfo.full_name) {
                localStorage.setItem('full_name', userInfo.full_name);
            }
            if (userInfo.role) {
                localStorage.setItem('role', userInfo.role);
            }
            setUser(userInfo);
        } catch (error) {
            throw error;
        }
    };

    useEffect(() => {
        if (token) fetchUserInfo();
    }, [token, fetchUserInfo]);

    useEffect(() => {
        const checkSessionInterval = setInterval(
            () => {
                if (token) {
                    fetchUserInfo().catch(() => {
                        handleSessionExpired();
                    });
                }
            },
            30 * 60 * 1000,
        );

        return () => clearInterval(checkSessionInterval);
    }, [token, fetchUserInfo, handleSessionExpired]);

    return (
        <UserContext.Provider value={{ user, token, login, logout, fetchUserInfo, isAuthenticated: !!user && !!token }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser phải dùng trong UserProvider');
    return context;
};
