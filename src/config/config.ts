const config = {
    development: {
        baseUrl: 'http://localhost:5000/api',
        timeout: 5000,
        retryAttempts: 3,
    },
    production: {
        baseUrl: 'https://web-hk2.onrender.com/api',
        timeout: 10000,
        retryAttempts: 5,
    },
};

const env = process.env.NODE_ENV || 'development';
export const API_BASE_URL = config[env as keyof typeof config].baseUrl;
