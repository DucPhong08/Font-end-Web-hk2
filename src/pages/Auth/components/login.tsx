import { useUser } from '@contexts/useAuth/userContext';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '@hooks/useMessage';

const Login = () => {
    const { login, user } = useUser();
    const navigate = useNavigate();
    const { message, contextHolder } = useMessage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) throw new Error('Email không đúng định dạng');
            if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');

            await login(email, password);

            message.success({
                key: 'login',
                content: user?.role === 'admin' ? 'Chào mừng Admin!' : 'Đăng nhập thành công!',
            });

            if (user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Đăng nhập thất bại';
            message.error({
                key: 'login-error',
                content: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
            {contextHolder}
            <div className="w-full max-w-md bg-gray-100 p-6 md:p-8 rounded-lg shadow-lg">
                <div
                    className="text-xl font-bold whitespace-nowrap transition-all duration-300 cursor-default select-none text-center"
                    style={{
                        background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    Task Manager
                </div>
                <h2 className="font-semibold text-gray-800 mb-6 text-center text-sm md:text-base">Đăng nhập</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">Email</label>
                        <input
                            type="email"
                            placeholder="Nhập tài khoản (Đúng định dạng abc@xyz.com)"
                            className="w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm border-[#ccc]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="Nhập mật khẩu"
                            className="w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm border-[#ccc]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-md text-white font-semibold text-sm md:text-base bg-gradient-to-r from-blue-600 to-purple-600 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
