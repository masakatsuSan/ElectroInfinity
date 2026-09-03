const test = require('node:test')
const assert = require('node:assert/strict')

const { canApprove, isPlatformAdmin, isSameBatchCr } = require('../src/utils/canApprove')

const admin = { _id: 'a1', role: 'admin', batch: '2024-2028' }
const superAdmin = { _id: 's1', role: 'super_admin', batch: '2024-2028' }
const crSame = { _id: 'c1', role: 'cr', batch: '2024-2028' }
const crOther = { _id: 'c2', role: 'cr', batch: '2023-2027' }
const crNoBatch = { _id: 'c3', role: 'cr', batch: '' }
const student = { _id: 'st1', role: 'student', batch: '2024-2028' }
const owner = { _id: 'o1', role: 'student', batch: '2024-2028' }
const ownerOtherBatch = { _id: 'o2', role: 'student', batch: '2023-2027' }

test('admin and super_admin can always approve', () => {
  assert.equal(canApprove(admin, owner), true)
  assert.equal(canApprove(superAdmin, owner), true)
  assert.equal(canApprove(admin, ownerOtherBatch), true)
})

test('CR can approve only same-batch items', () => {
  assert.equal(canApprove(crSame, owner), true)
  assert.equal(canApprove(crOther, owner), false)
  assert.equal(canApprove(crSame, ownerOtherBatch), false)
})

test('CR with empty batch cannot approve', () => {
  assert.equal(canApprove(crNoBatch, owner), false)
})

test('student cannot approve', () => {
  assert.equal(canApprove(student, owner), false)
})

test('null actor cannot approve', () => {
  assert.equal(canApprove(null, owner), false)
  assert.equal(canApprove(undefined, owner), false)
})

test('isPlatformAdmin / isSameBatchCr helpers', () => {
  assert.equal(isPlatformAdmin(admin), true)
  assert.equal(isPlatformAdmin(crSame), false)
  assert.equal(isPlatformAdmin(null), false)
  assert.equal(isSameBatchCr(crSame, owner), true)
  assert.equal(isSameBatchCr(crSame, ownerOtherBatch), false)
  assert.equal(isSameBatchCr(admin, owner), false)
  assert.equal(isSameBatchCr(null, owner), false)
})
