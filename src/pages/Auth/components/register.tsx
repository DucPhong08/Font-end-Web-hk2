import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { registerApi } from '../../../services/authServices';
import { useUser } from '../../../contexts/useAuth/userContext';

interface RegisterProps {
    onRegisterSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
    const { login } = useUser();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName.trim() || fullName.trim().length < 2) {
            setError('Họ và tên phải có ít nhất 2 ký tự');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email không hợp lệ');
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            setError('Mật khẩu phải có ít nhất 6 ký tự, gồm chữ cái và số');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu và xác nhận mật khẩu không khớp');
            return;
        }

        setLoading(true);
        try {
            await registerApi(email, password, fullName);
            await login(email, password);

            toast.success('Đăng ký thành công! Chào mừng bạn đến với ứng dụng!', { autoClose: 2000 });

            setTimeout(() => {
                onRegisterSuccess();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Đăng ký thất bại');
            toast.error('Đăng ký thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md bg-gray-50 p-6 md:p-8 rounded-lg shadow-lg">
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
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center text-sm md:text-base">
                    Đăng ký tài khoản
                </h2>

                {error && <div className="mb-4 text-red-600 text-center font-medium text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">Họ và tên</label>
                        <input
                            type="text"
                            placeholder="Nhập tên"
                            className="w-full px-3 py-2 border-2  rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm border-[#ccc]"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">Email</label>
                        <input
                            type="email"
                            placeholder="Nhập tài khoản (Đúng định dạng abc@xyz.com)"
                            className="w-full px-3 py-2 border-2  rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm border-[#ccc]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="Tối thiểu 6 kí tự, bao gồm chữ và số"
                            className="w-full px-3 py-2 border-2  rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm border-[#ccc]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            placeholder="Xác nhận mật khẩu"
                            className="w-full px-3 py-2 border-2  rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm border-[#ccc]"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-md text-white font-semibold text-sm md:text-base bg-gradient-to-r from-blue-600 to-purple-600`}
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;
