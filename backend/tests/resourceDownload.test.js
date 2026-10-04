const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

const {
  resolveDirectDownloadUrl,
  resolveExternalLink,
  deriveLinkFileName,
} = require('../src/utils/resourceLinks')

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
  'cloudinary-raw':   { fileUrl: 'https://res.cloudinary.com/demo/raw/upload/v123/electro-infinity/notes/notes-1.pdf' },
  'cloudinary-image': { fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/electro-infinity/pyqs/q.png' },
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

test('GET /:id/download redirects straight to the stored Cloudinary URL', async () => {
  const raw = await request('/cloudinary-raw/download')
  assert.equal(raw.status, 303)
  assert.equal(
    raw.location,
    'https://res.cloudinary.com/demo/raw/upload/fl_attachment/v123/electro-infinity/notes/notes-1.pdf',
    'fl_attachment makes Cloudinary answer with Content-Disposition: attachment'
  )
  assert.ok(raw.location.includes('/raw/upload/fl_attachment/'), 'flag goes after the delivery type')

  const image = await request('/cloudinary-image/download')
  assert.equal(image.status, 303)
  assert.equal(
    image.location,
    'https://res.cloudinary.com/demo/image/upload/fl_attachment/v1/electro-infinity/pyqs/q.png'
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

test('buildCloudinaryDownloadUrl does not double-apply the flag', () => {
  const { buildCloudinaryDownloadUrl } = require('../src/utils/cloudinaryUrl')
  const once = buildCloudinaryDownloadUrl('https://res.cloudinary.com/demo/raw/upload/v1/a.pdf')
  assert.equal(buildCloudinaryDownloadUrl(once), once)
  // Non-Cloudinary input is passed straight through.
  assert.equal(buildCloudinaryDownloadUrl('https://example.com/a.pdf'), 'https://example.com/a.pdf')
})