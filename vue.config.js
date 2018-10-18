module.exports = {
    baseUrl: process.env.NODE_ENV === 'production'
        ? '/gaussian-process-vue/'
        : '/'
}