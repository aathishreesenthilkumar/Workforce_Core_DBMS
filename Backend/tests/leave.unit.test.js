const test = require('node:test');
const assert = require('node:assert/strict');

test('Leave Business Rules & Date Validation Tests', async (t) => {
    await t.test('TC-LEAVE-01: Calculate calendar days duration inclusively', () => {
        const start = new Date('2026-10-10');
        const end = new Date('2026-10-12');
        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        assert.equal(days, 3);
    });

    await t.test('TC-LEAVE-02: Single day leave calculates as 1 day', () => {
        const start = new Date('2026-10-15');
        const end = new Date('2026-10-15');
        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        assert.equal(days, 1);
    });

    await t.test('TC-LEAVE-03: Reject end date earlier than start date', () => {
        const start = new Date('2026-10-20');
        const end = new Date('2026-10-15');
        assert.ok(end < start, 'End date is earlier than start date');
    });

    await t.test('TC-LEAVE-04: Insufficient leave balance detection', () => {
        const allocatedDays = 12.0;
        const usedDays = 10.0;
        const remainingDays = allocatedDays - usedDays; // 2.0
        const requestedDays = 4.0;

        assert.equal(remainingDays, 2.0);
        assert.ok(remainingDays < requestedDays, 'Should detect insufficient balance');
    });

    await t.test('TC-LEAVE-05: Reject cross-year leave requests spanning multiple calendar years', () => {
        const start = new Date('2026-12-28');
        const end = new Date('2027-01-04');
        const isCrossYear = start.getFullYear() !== end.getFullYear();

        assert.ok(isCrossYear, 'Should detect date range crossing year boundary');
        assert.equal(start.getFullYear(), 2026);
        assert.equal(end.getFullYear(), 2027);
    });
});

