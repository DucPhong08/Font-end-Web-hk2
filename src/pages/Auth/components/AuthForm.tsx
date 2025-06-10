import React, { useState } from 'react';
import Login from './login';
import Register from './register';
import Overlay from './Overlay';

const AuthForm = () => {
    const [isLoginActive, setIsLoginActive] = useState(true);

    const toggleActive = () => setIsLoginActive((prev) => !prev);
    const switchToLogin = () => setIsLoginActive(true);

    return (
        <div
            className="relative w-full mx-auto min-h-screen bg-white shadow-lg flex flex-col md:flex-row overflow-hidden items-center"
            style={{
                backgroundImage:
                    'url("https://images.unsplash.com/photo-1545972154-9bb223aac798?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=3050&q=80&exp=8&con=-15&sat=-75")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100vw',
            }}
        >
            <div
                className={`relative w-full md:w-1/2 transition-all duration-700 ease-in-out transform
          ${isLoginActive ? 'mt-24 md:mt-0' : 'mt-0'}
        `}
            >
                <div
                    className={`absolute inset-0 transition-all duration-700 ease-in-out transform
            ${
                isLoginActive
                    ? 'opacity-100 scale-100 z-20 relative'
                    : 'opacity-0 scale-75 z-10 pointer-events-none absolute'
            }
          `}
                >
                    <Login />
                </div>
                <div
                    className={`absolute inset-0 transition-all duration-700 ease-in-out transform
            ${
                !isLoginActive
                    ? 'opacity-100 scale-100 z-20 relative'
                    : 'opacity-0 scale-75 z-10 pointer-events-none absolute'
            }
          `}
                >
                    <Register onRegisterSuccess={switchToLogin} />
                </div>
            </div>

            <div className="w-full md:w-1/2 mt-auto md:mt-0">
                <Overlay isLoginActive={isLoginActive} toggleActive={toggleActive} />
            </div>
        </div>
    );
};

export default AuthForm;
