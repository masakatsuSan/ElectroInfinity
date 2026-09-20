const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

// ── Stub the Resource model BEFORE the router is required ──────────────────
// routes/resources.js captures `Resource` at require time, so the stub has to
// be installed first. Requiring a mongoose model does not open a connection,
// so this test never touches the database.
const Resource = require('../src/models/Resource')

const FIXTURE = [
  { _id: '1', title: 'Notes A', type: 'notes', semester: 5, subject: 'Power System-I' },
  { _id: '2', title: 'Notes B', type: 'notes', semester: 5, subject: 'Power System-I' },
]

let calls = []

function chainable() {
  const chain = {
    populate() { return chain },
    sort() { return chain },
    lean() { calls.push(['lean']); return chain },
    skip(n) { calls.push(['skip', n]); return chain },
    limit(n) { calls.push(['limit', n]); return chain },
    then(resolve) { resolve(FIXTURE) }, // makes `await query` resolve
  }
  return chain
}

Resource.find = (filter) => {
  calls.push(['find', filter])
  return chainable()
}
Resource.countDocuments = async (filter) => {
  calls.push(['countDocuments', filter])
  return 42
}

const router = require('../src/routes/resources')

function request(path) {
  return new Promise((resolve, reject) => {
    const app = express()
    app.use('/api/resources', router)
    const server = app.listen(0, async () => {
      const { port } = server.address()
      try {
        const res = await fetch(`http://127.0.0.1:${port}${path}`)
        resolve({ status: res.status, body: await res.json() })
      } catch (err) {
        reject(err)
      } finally {
        server.close()
      }
    })
  })
}

test('GET /api/resources without params keeps the existing response shape', async () => {
  calls = []
  const { status, body } = await request('/api/resources')

  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.deepEqual(body.data, FIXTURE)
  // The live frontend reads body.data — no extra or renamed keys allowed.
  assert.deepEqual(Object.keys(body), ['success', 'data'])
  // No paging work is done when the caller does not ask for it.
  assert.equal(calls.some((c) => c[0] === 'skip'), false)
  assert.equal(calls.some((c) => c[0] === 'limit'), false)
  assert.equal(calls.some((c) => c[0] === 'countDocuments'), false)
  // The lean() optimisation is always applied.
  assert.equal(calls.some((c) => c[0] === 'lean'), true)
})

test('GET /api/resources?page=2&limit=5 applies skip/limit and returns meta', async () => {
  calls = []
  const { status, body } = await request('/api/resources?page=2&limit=5')

  assert.equal(status, 200)
  assert.deepEqual(body.data, FIXTURE)
  assert.equal(body.page, 2)
  assert.equal(body.limit, 5)
  assert.equal(body.total, 42)
  assert.equal(body.totalPages, 9)
  assert.deepEqual(calls.find((c) => c[0] === 'skip'), ['skip', 5])
  assert.deepEqual(calls.find((c) => c[0] === 'limit'), ['limit', 5])
  assert.equal(calls.some((c) => c[0] === 'countDocuments'), true)
})

test('GET /api/resources clamps an unreasonable limit', async () => {
  const { body } = await request('/api/resources?limit=99999')
  assert.equal(body.limit, 200)
})

test('GET /api/resources passes filters through to the query', async () => {
  calls = []
  await request('/api/resources?type=pyqs&semester=5&subject=Power%20System-I')
  assert.deepEqual(calls.find((c) => c[0] === 'find')[1], {
    type: 'pyqs',
    semester: 5,
    subject: 'Power System-I',
  })
})