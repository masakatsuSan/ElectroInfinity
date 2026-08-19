const test = require('node:test')
const assert = require('node:assert/strict')

const { canViewBatchStudents } = require('../src/utils/studentAccess')

test('student can view only their own batch', () => {
  assert.equal(canViewBatchStudents({ role: 'student', batch: '2024-2028' }, '2024-2028'), true)
  assert.equal(canViewBatchStudents({ role: 'student', batch: '2024-2028' }, '2023-2027'), false)
})

test('CR and admins can view any batch roster', () => {
  assert.equal(canViewBatchStudents({ role: 'cr', batch: '2024-2028' }, '2023-2027'), true)
  assert.equal(canViewBatchStudents({ role: 'admin', batch: '2024-2028' }, '2023-2027'), true)
  assert.equal(canViewBatchStudents({ role: 'super_admin', batch: '2024-2028' }, '2023-2027'), true)
})
