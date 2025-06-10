const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@common': path.resolve(__dirname, 'src/common'),
            '@config': path.resolve(__dirname, 'src/config'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@services': path.resolve(__dirname, 'src/services'),
            '@pages': path.resolve(__dirname, 'src/pages'),
            '@contexts': path.resolve(__dirname, 'src/contexts'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@hooks': path.resolve(__dirname, 'src/hooks'),
            '@layouts': path.resolve(__dirname, 'src/layouts'),
            '@assets': path.resolve(__dirname, 'src/assets'),
            '@': path.resolve(__dirname, 'src/'),
        },
        configure: (webpackConfig) => {
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                path: require.resolve('path-browserify'),
                os: require.resolve('os-browserify/browser'),
                fs: false,
            };
            return webpackConfig;
        },
    },
};
