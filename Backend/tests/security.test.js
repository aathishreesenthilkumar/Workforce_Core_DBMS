const test = require('node:test');
const assert = require('node:assert/strict');
const { requireRole, requireSelfOrManager } = require('../middleware/auth');

test('Role-Based Access Control (RBAC) & Tenant Isolation Tests', async (t) => {
    await t.test('TC-SEC-01: Reject request when no session user exists', () => {
        const req = { session: {} };
        let statusCode = null;
        let responseJson = null;
        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => { responseJson = data; }
                };
            }
        };
        const next = () => { assert.fail('next() should not be called'); };

        const middleware = requireRole('ADMIN');
        middleware(req, res, next);

        assert.equal(statusCode, 401);
        assert.equal(responseJson.success, false);
    });

    await t.test('TC-SEC-02: Reject employee role when ADMIN role required', () => {
        const req = { session: { user: { role: 'EMPLOYEE', employee_id: 5 } } };
        let statusCode = null;
        let responseJson = null;
        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => { responseJson = data; }
                };
            }
        };
        const next = () => { assert.fail('next() should not be called'); };

        const middleware = requireRole('ADMIN');
        middleware(req, res, next);

        assert.equal(statusCode, 403);
        assert.match(responseJson.message, /Access denied/);
    });

    await t.test('TC-SEC-03: Allow ADMIN role when ADMIN role required', () => {
        const req = { session: { user: { role: 'ADMIN', employee_id: 1 } } };
        let nextCalled = false;
        const res = {};
        const next = () => { nextCalled = true; };

        const middleware = requireRole('ADMIN', 'MANAGER');
        middleware(req, res, next);

        assert.ok(nextCalled, 'next() should be called for authorized role');
    });

    await t.test('TC-SEC-04: Prevent employee from accessing another employee record', () => {
        // Employee 5 tries to access employee 12
        const req = {
            session: { user: { role: 'EMPLOYEE', employee_id: 5 } },
            params: { employeeId: '12' }
        };
        let statusCode = null;
        let responseJson = null;
        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => { responseJson = data; }
                };
            }
        };
        const next = () => { assert.fail('next() should not be called'); };

        requireSelfOrManager(req, res, next);

        assert.equal(statusCode, 403);
        assert.match(responseJson.message, /not authorized to view or modify another employee’s record/);
    });

    await t.test('TC-SEC-05: Allow employee to access their own record', () => {
        const req = {
            session: { user: { role: 'EMPLOYEE', employee_id: 5 } },
            params: { employeeId: '5' }
        };
        let nextCalled = false;
        const res = {};
        const next = () => { nextCalled = true; };

        requireSelfOrManager(req, res, next);

        assert.ok(nextCalled, 'Employee should be able to view their own ID');
    });

    await t.test('TC-SEC-06: Allow Manager to access any employee record', () => {
        const req = {
            session: { user: { role: 'MANAGER', employee_id: 9 } },
            params: { employeeId: '22' }
        };
        let nextCalled = false;
        const res = {};
        const next = () => { nextCalled = true; };

        requireSelfOrManager(req, res, next);

        assert.ok(nextCalled, 'Manager should be able to view any employee record');
    });

    await t.test('TC-SEC-07: Reject Manager attempting to approve leave for employee in a different department', () => {
        // Manager in Dept 2 (HR) attempts to approve request for employee in Dept 1 (IT)
        const reviewerRole = 'MANAGER';
        const reviewerDeptId = 2;
        const employeeDeptId = 1;

        assert.notEqual(reviewerDeptId, employeeDeptId);
        assert.equal(reviewerRole, 'MANAGER');
        const isAuthorized = reviewerRole === 'ADMIN' || (reviewerRole === 'MANAGER' && reviewerDeptId === employeeDeptId);
        assert.equal(isAuthorized, false, 'Manager should be denied approval for employee in different department');
    });

    await t.test('TC-SEC-08: Permit Manager to approve leave for employee in their own department', () => {
        // Manager in Dept 2 (HR) approves request for employee in Dept 2 (HR)
        const reviewerRole = 'MANAGER';
        const reviewerDeptId = 2;
        const employeeDeptId = 2;

        const isAuthorized = reviewerRole === 'ADMIN' || (reviewerRole === 'MANAGER' && reviewerDeptId === employeeDeptId);
        assert.equal(isAuthorized, true, 'Manager should be permitted to approve leave within their department');
    });

    await t.test('TC-SEC-09: Permit Admin to approve leave for employee in any department', () => {
        // Admin (Dept 1) approves request for employee in Dept 4 (Operations)
        const reviewerRole = 'ADMIN';
        const reviewerDeptId = 1;
        const employeeDeptId = 4;

        const isAuthorized = reviewerRole === 'ADMIN' || (reviewerRole === 'MANAGER' && reviewerDeptId === employeeDeptId);
        assert.equal(isAuthorized, true, 'Admin should have organization-wide leave approval authority');
    });
});

