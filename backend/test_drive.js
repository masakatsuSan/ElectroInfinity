const axios = require('axios')

;(async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhN2ZkZWRhYjhhY2QxMmU1MWJjMWQ1MSIsImlhdCI6MTc4OTk3NzcyMCwiZXhwIjoxNzkwNTgyNTIwfQ.g-2Zw5RomJUvE_EcZd6s9CghosWM-gdNflDYNmGGnUI'

  // Drive link upload
  try {
    const fd = new (require('form-data'))()
    fd.append('title', 'Drive Test')
    fd.append('type', 'notes')
    fd.append('semester', '5')
    fd.append('subject', 'Power System-I')
    fd.append('fileUrl', 'https://drive.google.com/file/d/1abc123/view')
    const r = await axios.post('http://localhost:5000/api/resources', fd, {
      headers: { Authorization: 'Bearer ' + token, ...fd.getHeaders() },
    })
    console.log('DRIVE UPLOAD OK')
    console.log(JSON.stringify(r.data, null, 2))
  } catch (e) {
    console.log('DRIVE UPLOAD FAIL', e.response?.status, e.response?.data)
  }
})()