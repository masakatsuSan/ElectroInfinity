const axios = require('axios')

;(async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhN2ZkZWRhYjhhY2QxMmU1MWJjMWQ1MSIsImlhdCI6MTc4OTk3NzcyMCwiZXhwIjoxNzkwNTgyNTIwfQ.g-2Zw5RomJUvE_EcZd6s9CghosWM-gdNflDYNmGGnUI'
  const id = '6ab0e4b1917d65ed87f68e2d' // the test.pdf upload

  // Test preview WITH a Range header (real PDF viewer behaviour)
  try {
    const r = await axios.get(`http://localhost:5000/api/resources/${id}/preview`, {
      headers: { Authorization: 'Bearer ' + token, Range: 'bytes=0-1023' },
      responseType: 'stream',
      timeout: 15000,
      validateStatus: () => true,
    })
    console.log('PREVIEW+RANGE status=', r.status, 'content-type=', r.headers['content-type'], 'content-range=', r.headers['content-range'])
    let bytes = 0
    r.data.on('data', (c) => { bytes += c.length })
    r.data.on('end', () => { console.log('BYTES', bytes) })
    r.data.on('error', (e) => { console.log('STREAM ERR', e.message) })
    await new Promise((res) => r.data.on('end', res))
  } catch (e) {
    console.log('PREVIEW+RANGE FAIL', e.message, e.response?.status)
  }
})()