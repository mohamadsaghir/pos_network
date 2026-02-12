const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use((req, res, next) => {
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        res.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        // Note: CSP might break dev tools like HMR, so we use a more lenient one for dev or skip it if it causes issues.
        // res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:5000;");
        next();
    });
};
