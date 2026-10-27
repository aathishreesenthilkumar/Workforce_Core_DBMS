const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');

test('API & Security Middleware Integration Tests', async (t) => {
    await t.test('TC-API-01: Health check endpoint responds with UP status', async () => {
        const res = await request(app).get('/api/health');
        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'UP');
    });

    await t.test('TC-API-02: Unauthenticated request to /api/employees is rejected with 401', async () => {
        const res = await request(app).get('/api/employees');
        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
    });

    await t.test('TC-API-03: Unauthenticated request to /api/attendance is rejected with 401', async () => {
        const res = await request(app).get('/api/attendance');
        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
    });

    await t.test('TC-API-04: Unauthenticated request to /api/leave is rejected with 401', async () => {
        const res = await request(app).get('/api/leave');
        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
    });

    await t.test('TC-API-05: Unauthenticated request to /api/payroll is rejected with 401', async () => {
        const res = await request(app).get('/api/payroll');
        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
    });

    await t.test('TC-API-06: Login with empty fields returns 400 Bad Request', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
    });

    await t.test('TC-API-07: Static frontend assets are served correctly', async () => {
        const res = await request(app).get('/login.html');
        assert.equal(res.status, 200);
        assert.ok(res.text.includes('Employee Portal'));
    });
});

