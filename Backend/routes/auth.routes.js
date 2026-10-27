const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * POST /api/auth/login
 * Authenticates user credentials, sets session, and regenerates session ID to prevent fixation attacks
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Both username and password are required.'
            });
        }

        // Fetch user with employee and department metadata
        const queryText = `
            SELECT 
                u.user_id,
                u.employee_id,
                u.username,
                u.password_hash,
                u.role,
                u.is_active,
                e.employee_code,
                e.full_name,
                e.email,
                e.designation,
                e.department_id,
                d.department_name
            FROM users u
            JOIN employees e ON u.employee_id = e.employee_id
            JOIN departments d ON e.department_id = d.department_id
            WHERE LOWER(u.username) = LOWER($1);
        `;
        const result = await db.query(queryText, [username.trim()]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated. Please contact your system administrator.'
            });
        }

        // Verify bcrypt password hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        // Session regeneration to prevent session fixation attacks
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                return res.status(500).json({ success: false, message: 'Login session initialization failed.' });
            }

            req.session.user = {
                user_id: user.user_id,
                employee_id: user.employee_id,
                employee_code: user.employee_code,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                email: user.email,
                designation: user.designation,
                department_id: user.department_id,
                department_name: user.department_name
            };

            return res.status(200).json({
                success: true,
                message: 'Authentication successful.',
                user: req.session.user
            });
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during authentication.'
        });
    }
});

/**
 * POST /api/auth/logout
 * Destroys session and clears cookie
 */
router.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Could not log out.' });
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({ success: true, message: 'Successfully logged out.' });
        });
    } else {
        return res.status(200).json({ success: true, message: 'Session already terminated.' });
    }
});

/**
 * GET /api/auth/me
 * Retrieves current logged-in user profile
 */
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.status(200).json({
            success: true,
            user: req.session.user
        });
    }
    return res.status(401).json({
        success: false,
        message: 'No active session.'
    });
});

/**
 * GET /api/auth/demo-users
 * Retrieves list of all available active user accounts for easy sign-in selection
 */
router.get('/demo-users', async (req, res) => {
    try {
        const queryText = `
            SELECT 
                u.user_id,
                u.username,
                u.role,
                u.employee_id,
                e.employee_code,
                e.full_name,
                e.designation,
                e.department_id,
                d.department_name
            FROM users u
            JOIN employees e ON u.employee_id = e.employee_id
            JOIN departments d ON e.department_id = d.department_id
            WHERE u.is_active = TRUE
            ORDER BY d.department_id, u.role DESC, e.employee_id;
        `;
        const result = await db.query(queryText);
        res.json({ success: true, users: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/auth/switch-user
 * Seamlessly switch active session to any employee without manual re-login
 */
router.post('/switch-user', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, message: 'Username is required.' });
        }

        const queryText = `
            SELECT 
                u.user_id,
                u.employee_id,
                u.username,
                u.role,
                u.is_active,
                e.employee_code,
                e.full_name,
                e.email,
                e.designation,
                e.department_id,
                d.department_name
            FROM users u
            JOIN employees e ON u.employee_id = e.employee_id
            JOIN departments d ON e.department_id = d.department_id
            WHERE LOWER(u.username) = LOWER($1);
        `;
        const result = await db.query(queryText, [username.trim()]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = result.rows[0];
        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'User is inactive.' });
        }

        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Session regeneration failed.' });
            }
            req.session.user = {
                user_id: user.user_id,
                employee_id: user.employee_id,
                employee_code: user.employee_code,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                email: user.email,
                designation: user.designation,
                department_id: user.department_id,
                department_name: user.department_name
            };
            return res.json({ success: true, user: req.session.user });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

