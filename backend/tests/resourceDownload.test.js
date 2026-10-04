const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

const {
  resolveDirectDownloadUrl,
  resolveExternalLink,
  deriveLinkFileName,
} = require('../src/utils/resourceLinks')
const {
  buildCloudinaryDownloadUrl,
  buildPdfDownloadName,
  buildPublicPdfId,
} = require('../src/utils/cloudinaryUrl')

// ── Stub the Resource model BEFORE the router is required ──────────────────
// routes/resources.js captures `Resource` at require time, so the stub has to be
// installed first. Requiring a mongoose model does not open a connection, so
// this test never touches the database.
const Resource = require('../src/models/Resource')

const FIXTURES = {
  'drive-share-page': { fileUrl: 'https://drive.google.com/file/d/1AbC_dEf/view?usp=sharing' },
  'drive-open':       { fileUrl: 'https://drive.google.com/open?id=1AbC_dEf' },
  'drive-normalised': { fileUrl: 'https://drive.google.com/uc?export=download&id=1AbC_dEf' },
  'drive-doc':        { fileUrl: 'https://docs.google.com/document/d/1AbC_dEf/edit' },
  'cloudinary-raw':   { fileUrl: 'https://res.cloudinary.com/demo/raw/upload/v123/electro-infinity/notes/notes-1.pdf', fileName: 'Network Theory.pdf', title: 'NT' },
  'cloudinary-image': { fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/electro-infinity/pyqs/q.png', fileName: 'q.png', title: 'Q' },
  // Stored names that predate the fl_attachment naming: blank, extension-less,
  // and percent-encoded. All must still download as "<something>.pdf".
  'cloudinary-blank': { fileUrl: 'https://res.cloudinary.com/demo/raw/upload/v9/electro-infinity/notes/abc123', fileName: '', title: 'Network Theory' },
  'cloudinary-no-ext': { fileUrl: 'https://res.cloudinary.com/demo/raw/upload/v9/electro-infinity/notes/legacy-name', fileName: 'legacy-name', title: 'Legacy' },
  'cloudinary-encoded': { fileUrl: 'https://res.cloudinary.com/demo/raw/upload/v9/electro-infinity/notes/my%20notes%20%281%29', fileName: 'my notes (1).pdf', title: 'notes' },
  'cloudinary-nothing': { fileUrl: 'https://res.cloudinary.com/demo/raw/upload/v9/electro-infinity/notes/xyz', fileName: '', title: '' },
  'plain-url':        { fileUrl: 'https://example.com/notes.pdf' },
  'drive-folder':     { fileUrl: 'https://drive.google.com/drive/folders/1AbC_dEf' },
  'drive-form':       { fileUrl: 'https://docs.google.com/forms/d/e/1AbC_dEf/viewform' },
  'no-file':          { fileUrl: '' },
}

let increments = []
Resource.findByIdAndUpdate = async (id, update) => {
  increments.push([id, update])
  const fixture = FIXTURES[id]
  if (!fixture) return null
  return { _id: id, ...fixture, downloadCount: 3 }
}

const router = require('../src/routes/resources')

function request(path, init) {
  return new Promise((resolve, reject) => {
    const app = express()
    app.use('/api/resources', router)
    const server = app.listen(0, async () => {
      const { port } = server.address()
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/resources${path}`, {
          redirect: 'manual',
          ...init,
        })
        const location = res.headers.get('location')
        let body = null
        if (res.status < 300 || res.status >= 400) body = await res.json()
        resolve({ status: res.status, location, body })
      } catch (err) {
        reject(err)
      } finally {
        server.close()
      }
    })
  })
}

const DRIVE_DIRECT = 'https://drive.google.com/uc?export=download&confirm=t&id=1AbC_dEf'

// ── The bug: the Download button used to stream Drive's HTML share page ────
test('GET /:id/download never serves file bytes — it only redirects', async () => {
  const { status, location } = await request('/drive-share-page/download')

  assert.equal(status, 303)
  assert.equal(location, DRIVE_DIRECT)
  // The API host must never appear in the download target.
  assert.equal(location.includes('/api/'), false)
})

test('every Google Drive link shape resolves to the same direct-download URL', async () => {
  for (const id of ['drive-share-page', 'drive-open', 'drive-normalised', 'drive-doc']) {
    const { status, location } = await request(`/${id}/download`)
    assert.equal(status, 303, id)
    assert.equal(location, DRIVE_DIRECT, id)
  }
})

// ── Cloudinary delivery URLs, pinned to measured behaviour ─────────────────
// Measured against the live account (asset electro-infinity/notes/
// Unit-1-Notes-final-1790359756175):
//   /raw/upload/v123/x                             -> 200, filename="x"
//   /raw/upload/fl_attachment/v123/x               -> 200, filename="file"
//   /raw/upload/fl_attachment:Notes/v123/x         -> 200, filename="Notes"
//   /raw/upload/fl_attachment:Notes.pdf/v123/x     -> 400
//   /raw/upload/fl_attachment:Notes%252Epdf/v123/x -> 200, filename="Notes.pdf"
//
// A bare fl_attachment makes Cloudinary send the literal `filename="file"`, so
// raw assets must carry a NAMED flag — and the name's dots must be encoded
// twice, because a literal "." in the path is what Cloudinary answers with 400.
test('GET /:id/download names a raw Cloudinary download "<something>.pdf"', async () => {
  const raw = await request('/cloudinary-raw/download')
  assert.equal(raw.status, 303)
  assert.equal(
    raw.location,
    'https://res.cloudinary.com/demo/raw/upload/fl_attachment:Network_Theory%252Epdf/v123/electro-infinity/notes/notes-1.pdf',
    'double-encoded dot: the only form Cloudinary accepts *and* names correctly'
  )
  // The literal dot is what triggers the 400 — it must never appear unencoded.
  const flag = raw.location.split('/upload/')[1].split('/')[0]
  assert.ok(!flag.slice(flag.indexOf(':') + 1).includes('.'), 'no literal dot in the flag value')
  assert.ok(flag.includes('%252E'), 'dot must be double-encoded')
  assert.ok(!/fl_attachment\/v/.test(raw.location), 'a bare flag would save as "file"')
  // Version segment stays AFTER the transformation.
  assert.ok(raw.location.indexOf('/fl_attachment:') < raw.location.search(/\/v\d+\//))
})

test('GET /:id/download adds a bare fl_attachment to image assets', async () => {
  const image = await request('/cloudinary-image/download')
  assert.equal(image.status, 303)
  assert.equal(
    image.location,
    'https://res.cloudinary.com/demo/image/upload/fl_attachment/v1/electro-infinity/pyqs/q.png'
  )
  assert.ok(!/fl_attachment:/.test(image.location), 'images keep the bare flag')
  // The version segment has to stay AFTER the transformation.
  assert.ok(image.location.indexOf('/fl_attachment/') < image.location.search(/\/v\d+\//))
})

test('every raw Cloudinary download carries an encoded name ending in .pdf', async () => {
  for (const id of [
    'cloudinary-raw',
    'cloudinary-blank',
    'cloudinary-no-ext',
    'cloudinary-encoded',
    'cloudinary-nothing',
  ]) {
    const { status, location } = await request(`/${id}/download`)
    assert.equal(status, 303, id)

    const named = /fl_attachment:([^/]+)\//.exec(location)
    assert.ok(named, `${id}: raw download must carry an fl_attachment name`)

    // %252E is what Cloudinary turns back into "." in the header.
    const name = decodeURIComponent(decodeURIComponent(named[1]))
    assert.ok(name.endsWith('.pdf'), `${id}: "${name}" must end in .pdf`)
    assert.ok(!name.includes('.pdf.pdf'), `${id}: "${name}" must not double the extension`)

    // The asset itself is untouched: the public_id tail is unchanged.
    const tail = location.split('/').slice(-4).join('/')
    assert.ok(!tail.includes('fl_attachment'), `${id}: flag must not leak into the public_id`)
  }
})

test('the download name falls back fileName -> title -> document', async () => {
  const blank = await request('/cloudinary-blank/download')
  assert.ok(decodeURIComponent(decodeURIComponent(/fl_attachment:([^/]+)\//.exec(blank.location)[1])).includes('Network_Theory'))

  const nothing = await request('/cloudinary-nothing/download')
  assert.equal(
    decodeURIComponent(decodeURIComponent(/fl_attachment:([^/]+)\//.exec(nothing.location)[1])),
    'document.pdf'
  )
})

test('a percent-encoded stored name is decoded before sanitising', async () => {
  const r = await request('/cloudinary-encoded/download')
  const name = decodeURIComponent(decodeURIComponent(/fl_attachment:([^/]+)\//.exec(r.location)[1]))
  assert.equal(name, 'my_notes_1.pdf')
  assert.ok(!name.includes('20'), `"${name}" must not keep the %20 escapes as literal digits`)
})

test('buildCloudinaryDownloadUrl is idempotent (never stacks two flags)', () => {
  const raw = 'https://res.cloudinary.com/demo/raw/upload/v9/a/b'
  const once = buildCloudinaryDownloadUrl(raw, 'x.pdf')
  const twice = buildCloudinaryDownloadUrl(once, 'x.pdf')
  assert.equal(once.match(/fl_attachment/g).length, 1)
  assert.equal(twice.match(/fl_attachment/g).length, 1)
  assert.equal(once, twice)

  const image = 'https://res.cloudinary.com/demo/image/upload/v1/a/b.png'
  const iOnce = buildCloudinaryDownloadUrl(image)
  const iTwice = buildCloudinaryDownloadUrl(iOnce)
  assert.equal(iOnce.match(/fl_attachment/g).length, 1)
  assert.equal(iOnce, iTwice)
})

test('a legacy fl_attachment left by an older deploy is replaced, not stacked', () => {
  // A bare flag can end up in a stored fileUrl from an earlier deploy.
  const legacy =
    'https://res.cloudinary.com/demo/raw/upload/fl_attachment/v9/electro-infinity/notes/abc'
  const rebuilt = buildCloudinaryDownloadUrl(legacy, 'Notes.pdf')
  assert.equal(rebuilt.match(/fl_attachment/g).length, 1, 'must not stack a second flag')
  assert.equal(
    rebuilt,
    'https://res.cloudinary.com/demo/raw/upload/fl_attachment:Notes%252Epdf/v9/electro-infinity/notes/abc'
  )
})

test('GET /:id/download leaves any other external URL unchanged', async () => {
  const { status, location } = await request('/plain-url/download')
  assert.equal(status, 303)
  assert.equal(location, 'https://example.com/notes.pdf')
})

test('GET /:id/download rejects a Drive folder link instead of redirecting to it', async () => {
  const { status, body } = await request('/drive-folder/download')
  assert.equal(status, 400)
  assert.match(body.error, /folder/i)
})

test('GET /:id/download rejects a Google Form link (no real file behind it)', async () => {
  const { status, body } = await request('/drive-form/download')
  assert.equal(status, 400)
})

test('GET /:id/download returns 404 for a resource with no file and for an unknown id', async () => {
  const noFile = await request('/no-file/download')
  assert.equal(noFile.status, 404)

  const unknown = await request('/000000000000000000000000/download')
  assert.equal(unknown.status, 404)
  assert.deepEqual(unknown.body, { success: false, error: 'Not found' })
})

test('GET /:id/download counts every attempt', async () => {
  increments = []
  await request('/drive-share-page/download')
  await request('/drive-folder/download')
  assert.equal(increments.length, 2)
  assert.ok(increments.every(([, u]) => u.$inc.downloadCount === 1))
})

test('POST /:id/download/increment reports the same direct URL /download redirects to', async () => {
  const direct = await request('/drive-share-page/download')
  const { status, body } = await request('/drive-share-page/download/increment', { method: 'POST' })

  assert.equal(status, 200)
  assert.equal(body.data.isGoogleDrive, true)
  assert.equal(body.data.directUrl, direct.location)
})

// ── public_id for new direct uploads ───────────────────────────────────────
// Raw assets only keep an extension in the delivered URL when the extension is
// part of the public_id, so new uploads must pin one.
test('buildPublicPdfId produces a folder-scoped, unique, .pdf public_id', () => {
  const id = buildPublicPdfId('Network Theory.pdf', 'resources')
  assert.ok(id.startsWith('resources/'), id)
  assert.ok(id.endsWith('.pdf'), id)
  assert.match(id, /^[\w/-]+\.pdf$/, 'no spaces or punctuation Cloudinary would reject')
  assert.ok(!id.includes('.pdf.pdf'))

  assert.notEqual(buildPublicPdfId('Network Theory.pdf'), buildPublicPdfId('Network Theory.pdf'))
  // An existing extension is replaced, not appended, whatever its case.
  const upper = buildPublicPdfId('notes.PDF')
  assert.ok(upper.endsWith('.pdf') && !upper.endsWith('.pdf.pdf'), upper)
  assert.match(upper, /^resources\/notes-[\da-z]{6}\.pdf$/)
  assert.ok(buildPublicPdfId('x.pdf').endsWith('.pdf'))
  assert.ok(buildPublicPdfId(undefined).endsWith('.pdf'), 'a missing name still yields a valid id')
})

test('buildPdfDownloadName always returns a safe .pdf name', () => {
  assert.equal(buildPdfDownloadName('Network Theory.pdf'), 'Network_Theory.pdf')
  assert.equal(buildPdfDownloadName('notes.pdf.pdf'), 'notes_pdf.pdf')
  assert.equal(buildPdfDownloadName('  spaced  out .pdf  '), 'spaced_out.pdf')
  assert.equal(buildPdfDownloadName('', 'Network Theory'), 'Network_Theory.pdf')
  assert.equal(buildPdfDownloadName('', ''), 'document.pdf')
  assert.equal(buildPdfDownloadName('.pdf'), 'document.pdf')
  assert.equal(buildPdfDownloadName('my%20notes%20%281%29.pdf'), 'my_notes_1.pdf')

  for (const input of ['emoji 🎉.pdf', '__edges__.pdf', 'a'.repeat(300) + '.pdf', 'ünïcode — dash.pdf']) {
    const out = buildPdfDownloadName(input)
    assert.ok(out.endsWith('.pdf'), `${input} -> ${out}`)
    assert.match(out, /^[\w.-]+$/, `${input} -> ${out} must be URL/header safe`)
    assert.ok(!out.startsWith('_') && !out.endsWith('_'), `${input} -> ${out}`)
  }
})

// ── Create / update validation ─────────────────────────────────────────────
test('resolveExternalLink normalises a Drive share link on save', () => {
  assert.deepEqual(resolveExternalLink('https://drive.google.com/file/d/1AbC/view?usp=sharing'), {
    ok: true,
    url: 'https://drive.google.com/uc?export=download&id=1AbC',
    isGoogleDrive: true,
  })
  assert.equal(resolveExternalLink('  https://example.com/a.pdf  ').url, 'https://example.com/a.pdf')
})

test('resolveExternalLink rejects folder, form and non-http links', () => {
  assert.equal(resolveExternalLink('https://drive.google.com/drive/folders/1AbC').ok, false)
  assert.equal(resolveExternalLink('https://drive.google.com/drive/u/0/folders/1AbC').ok, false)
  assert.equal(resolveExternalLink('https://docs.google.com/forms/d/e/1AbC/viewform').ok, false)
  assert.equal(resolveExternalLink('drive.google.com/file/d/1AbC/view').ok, false)
  assert.equal(resolveExternalLink('').ok, false)
})

test('deriveLinkFileName names a Drive resource after its title, not after "/view"', () => {
  assert.equal(
    deriveLinkFileName('https://drive.google.com/uc?export=download&id=1AbC', {
      isGoogleDrive: true,
      title: 'Power System-I Notes',
    }),
    'Power System-I Notes.pdf'
  )
  assert.equal(
    deriveLinkFileName('https://drive.google.com/uc?export=download&id=1AbC', {
      isGoogleDrive: true,
      title: '',
    }),
    'document.pdf'
  )
  assert.equal(
    deriveLinkFileName('https://example.com/dir/a.pdf', { isGoogleDrive: false }),
    'a.pdf'
  )
})

test('resolveDirectDownloadUrl is safe for any stored fileUrl', () => {
  assert.equal(resolveDirectDownloadUrl({}).status, 404)
  assert.equal(resolveDirectDownloadUrl({ fileUrl: '   ' }).status, 404)
  assert.equal(resolveDirectDownloadUrl({ fileUrl: 'ftp://host/a.pdf' }).status, 500)
  assert.equal(resolveDirectDownloadUrl({ fileUrl: 'javascript:alert(1)' }).status, 500)
})

test('buildCloudinaryDownloadUrl passes non-Cloudinary URLs through', () => {
  assert.equal(buildCloudinaryDownloadUrl('https://example.com/a.pdf'), 'https://example.com/a.pdf')
  assert.equal(buildCloudinaryDownloadUrl(''), '')
  assert.equal(buildCloudinaryDownloadUrl(null), null)
})