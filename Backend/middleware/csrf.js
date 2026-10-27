const crypto = require('crypto');

/**
 * Double-submit / Session-based CSRF Protection Middleware
 */
function csrfProtection(req, res, next) {
    // Initialize CSRF token in session if not present
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }

    // Set readable cookie for SPA/frontend AJAX clients
    res.cookie('XSRF-TOKEN', req.session.csrfToken, {
        httpOnly: false, // Accessible by JavaScript to attach to HTTP headers
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    // Exclude safe HTTP methods from verification
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    // Exclude public auth endpoints from CSRF verification
    const exemptPaths = ['/api/auth/login', '/api/auth/logout'];
    if (exemptPaths.includes(req.path)) {
        return next();
    }

    // Verify token for state-changing operations
    const clientToken = req.headers['x-csrf-token'] || (req.body && req.body._csrf);

    if (!clientToken || clientToken !== req.session.csrfToken) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Invalid or missing CSRF token. Please refresh the page.'
        });
    }

    next();
}

module.exports = csrfProtection;

