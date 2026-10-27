/**
 * Authentication and Role-Based Authorization Middleware
 */

/**
 * Ensures the client has an active authenticated session
 */
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.'
    });
}

/**
 * Restricts access to specific user roles (e.g. 'ADMIN', 'MANAGER')
 * @param  {...string} allowedRoles 
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const userRole = req.session.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`
            });
        }

        next();
    };
}

/**
 * Restricts employee record access so employees can ONLY access their own records,
 * while ADMIN and MANAGER can access records of all employees.
 */
function requireSelfOrManager(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    const { role, employee_id } = req.session.user;

    // Admin and Manager can access any record
    if (role === 'ADMIN' || role === 'MANAGER') {
        return next();
    }

    // Check if the requested employee ID matches the logged-in employee ID
    const targetEmployeeId = parseInt(req.params.employeeId || req.query.employeeId || req.body.employee_id, 10);

    if (targetEmployeeId && targetEmployeeId !== employee_id) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: You are not authorized to view or modify another employee’s record.'
        });
    }

    next();
}

module.exports = {
    isAuthenticated,
    requireRole,
    requireSelfOrManager
};

