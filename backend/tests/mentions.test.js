const test = require('node:test')
const assert = require('node:assert/strict')

const {
  extractMentionHandles,
  getUserHandle,
  resolveMentions,
} = require('../src/utils/mentions')

test('extractMentionHandles extracts handles from text', () => {
  assert.deepEqual(extractMentionHandles('Hi @alice and @bob'), ['alice', 'bob'])
  assert.deepEqual(extractMentionHandles('No mentions here'), [])
  assert.deepEqual(extractMentionHandles(''), [])
  assert.deepEqual(extractMentionHandles(null), [])
  assert.deepEqual(extractMentionHandles(undefined), [])
})

test('extractMentionHandles deduplicates handles', () => {
  assert.deepEqual(extractMentionHandles('@alice @alice @bob'), ['alice', 'bob'])
})

test('extractMentionHandles lowercases handles', () => {
  assert.deepEqual(extractMentionHandles('@Alice @BOB'), ['alice', 'bob'])
})

test('extractMentionHandles only matches @ at word boundaries', () => {
  assert.deepEqual(extractMentionHandles('email@test.com'), [])
  assert.deepEqual(extractMentionHandles('Hi @alice(test)'), ['alice'])
  assert.deepEqual(extractMentionHandles('prefix@alice'), [])
})

test('getUserHandle returns handle from rollNumber when present', () => {
  assert.equal(getUserHandle({ rollNumber: 'EE123', name: 'Alice' }), '@ee123')
})

test('getUserHandle falls back to name when rollNumber is absent', () => {
  assert.equal(getUserHandle({ name: 'Alice Smith' }), '@alicesmith')
})

test('getUserHandle returns empty string for empty user', () => {
  assert.equal(getUserHandle({}), '')
  assert.equal(getUserHandle(null), '')
  assert.equal(getUserHandle(undefined), '')
})

test('getUserHandle strips whitespace and special chars from name', () => {
  assert.equal(getUserHandle({ name: 'Alice Bob!@#' }), '@alicebob')
})

function createMockFindUsers(users) {
  return () => ({
    select: () => ({
      limit: () => Promise.resolve(users),
    }),
  })
}

test('resolveMentions returns empty mentions for text without handles', async () => {
  const result = await resolveMentions('Hello world', { actorId: 'u1' })
  assert.equal(result.text, 'Hello world')
  assert.deepEqual(result.mentions, [])
})

test('resolveMentions resolves exact rollNumber match', async () => {
  const users = [
    { _id: 'u2', name: 'Alice', rollNumber: 'EE123' },
  ]
  const findUsers = createMockFindUsers(users)
  const result = await resolveMentions('Hi @ee123 please review', {
    actorId: 'u1',
    findUsers,
  })
  assert.deepEqual(result.mentions, ['u2'])
})

test('resolveMentions excludes self from mentions', async () => {
  const users = [
    { _id: 'u1', name: 'Alice', rollNumber: 'EE123' },
    { _id: 'u2', name: 'Bob', rollNumber: 'EE456' },
  ]
  const findUsers = createMockFindUsers(users)
  const result = await resolveMentions('Hi @ee123 and @ee456', {
    actorId: 'u1',
    findUsers,
  })
  assert.deepEqual(result.mentions, ['u2'])
})

test('resolveMentions resolves exact name match', async () => {
  const users = [
    { _id: 'u2', name: 'Alice', rollNumber: 'EE456' },
  ]
  const findUsers = createMockFindUsers(users)
  const result = await resolveMentions('Hi @alice please review', {
    actorId: 'u1',
    findUsers,
  })
  assert.deepEqual(result.mentions, ['u2'])
})

test('resolveMentions excludes unresolvable handles', async () => {
  const users = [
    { _id: 'u2', name: 'Bob', rollNumber: 'EE456' },
  ]
  const findUsers = createMockFindUsers(users)
  const result = await resolveMentions('Hi @alice please review', {
    actorId: 'u1',
    findUsers,
  })
  assert.deepEqual(result.mentions, [])
})

test('resolveMentions deduplicates users mentioned multiple times', async () => {
  const users = [
    { _id: 'u2', name: 'Alice', rollNumber: 'EE123' },
  ]
  const findUsers = createMockFindUsers(users)
  const result = await resolveMentions('@ee123 @ee123 @EE123', {
    actorId: 'u1',
    findUsers,
  })
  assert.deepEqual(result.mentions, ['u2'])
})

test('resolveMentions respects maxMentions option', async () => {
  const users = [
    { _id: 'u2', name: 'User1', rollNumber: 'R1' },
    { _id: 'u3', name: 'User2', rollNumber: 'R2' },
    { _id: 'u4', name: 'User3', rollNumber: 'R3' },
  ]
  const findUsers = createMockFindUsers(users)
  const result = await resolveMentions(
    '@r1 @r2 @r3 @r1 @r2',
    { actorId: 'u1', findUsers, maxMentions: 2 },
  )
  assert.equal(result.mentions.length, 2)
  assert.deepEqual(result.mentions, ['u2', 'u3'])
})

test('resolveMentions gracefully handles findUsers errors', async () => {
  const findUsers = () => { throw new Error('DB error') }
  const result = await resolveMentions('Hi @ee123', {
    actorId: 'u1',
    findUsers,
  })
  assert.deepEqual(result.mentions, [])
})

test('resolveMentions handles findUsers returning non-query', async () => {
  const findUsers = () => null
  const result = await resolveMentions('Hi @ee123', {
    actorId: 'u1',
    findUsers,
  })
  assert.deepEqual(result.mentions, [])
})
