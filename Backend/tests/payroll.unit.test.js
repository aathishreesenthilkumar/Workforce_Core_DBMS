const test = require('node:test');
const assert = require('node:assert/strict');
const PayrollService = require('../services/payroll.service');

// Mathematical logic verification of corporate payroll calculation model
test('Payroll Formula Calculation Tests', async (t) => {
    await t.test('TC-PAY-01: Calculate Gross Salary accurately', () => {
        const basicSalary = 80000.00;
        const allowances = 18000.00;
        const bonus = 2000.00;

        const grossSalary = basicSalary + allowances + bonus;
        assert.equal(grossSalary, 100000.00);
    });

    await t.test('TC-PAY-02: Calculate Unpaid Leave (LWP) deduction accurately', () => {
        const basicSalary = 48000.00;
        const unpaidDays = 2.0;
        const dailyRate = basicSalary / 30.0; // 1600.00
        const unpaidDeduction = parseFloat((unpaidDays * dailyRate).toFixed(2));

        assert.equal(dailyRate, 1600.00);
        assert.equal(unpaidDeduction, 3200.00);
    });

    await t.test('TC-PAY-03: Calculate Net Salary with standard and unpaid deductions', () => {
        const basicSalary = 48000.00;
        const allowances = 10000.00;
        const bonus = 0.00;
        const deductions = 4800.00;
        const unpaidLeaveDeduction = 3200.00;

        const grossSalary = basicSalary + allowances + bonus; // 58000.00
        const netSalary = Math.max(0, grossSalary - deductions - unpaidLeaveDeduction); // 50000.00

        assert.equal(grossSalary, 58000.00);
        assert.equal(netSalary, 50000.00);
    });

    await t.test('TC-PAY-04: Prevent negative net salary', () => {
        const grossSalary = 10000.00;
        const excessiveDeductions = 15000.00;
        const netSalary = Math.max(0, grossSalary - excessiveDeductions);

        assert.equal(netSalary, 0.00);
    });

    await t.test('TC-PAY-05: Calculate overlapping unpaid leave days across month boundaries', () => {
        // Leave from Oct 30, 2026 to Nov 2, 2026 (4 calendar days total)
        const leaveStart = '2026-10-30';
        const leaveEnd = '2026-11-02';

        // October 2026 (month 10) should have exactly 2 days (Oct 30, Oct 31)
        const octDays = PayrollService.calculateMonthOverlapDays(leaveStart, leaveEnd, 2026, 10);
        assert.equal(octDays, 2);

        // November 2026 (month 11) should have exactly 2 days (Nov 1, Nov 2)
        const novDays = PayrollService.calculateMonthOverlapDays(leaveStart, leaveEnd, 2026, 11);
        assert.equal(novDays, 2);

        // December 2026 (month 12) should have 0 days
        const decDays = PayrollService.calculateMonthOverlapDays(leaveStart, leaveEnd, 2026, 12);
        assert.equal(decDays, 0);

        // Sum across months equals total duration
        assert.equal(octDays + novDays, 4);
    });

    await t.test('TC-PAY-06: Calculate overlapping unpaid leave days across year boundaries', () => {
        // Leave from Dec 30, 2026 to Jan 2, 2027 (4 calendar days total)
        const leaveStart = '2026-12-30';
        const leaveEnd = '2027-01-02';

        // December 2026 (month 12) should have exactly 2 days (Dec 30, Dec 31)
        const decDays = PayrollService.calculateMonthOverlapDays(leaveStart, leaveEnd, 2026, 12);
        assert.equal(decDays, 2);

        // January 2027 (month 1) should have exactly 2 days (Jan 1, Jan 2)
        const janDays = PayrollService.calculateMonthOverlapDays(leaveStart, leaveEnd, 2027, 1);
        assert.equal(janDays, 2);

        assert.equal(decDays + janDays, 4);
    });

    await t.test('TC-PAY-07: Filter salary structures by payroll month date and ignore future structures', () => {
        const structures = [
            { id: 1, basic: 50000, effective_from: '2025-01-01', effective_to: '2026-06-30' },
            { id: 2, basic: 60000, effective_from: '2026-07-01', effective_to: null },
            { id: 3, basic: 75000, effective_from: '2026-12-01', effective_to: null } // future-dated
        ];

        // Evaluating for October 2026 (2026-10-01 to 2026-10-31)
        const monthStart = '2026-10-01';
        const monthEnd = '2026-10-31';

        const valid = structures.filter(s =>
            s.effective_from <= monthEnd &&
            (s.effective_to === null || s.effective_to >= monthStart)
        ).sort((a, b) => new Date(b.effective_from) - new Date(a.effective_from));

        assert.equal(valid.length, 1);
        assert.equal(valid[0].id, 2);
        assert.equal(valid[0].basic, 60000);
    });
});

