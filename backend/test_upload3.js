const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')

;(async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhN2ZkZWRhYjhhY2QxMmU1MWJjMWQ1MSIsImlhdCI6MTc4OTk3NzcyMCwiZXhwIjoxNzkwNTgyNTIwfQ.g-2Zw5RomJUvE_EcZd6s9CghosWM-gdNflDYNmGGnUI'

  const pdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 70 250 Td (Test PDF) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000345 00000 n \nstartxref\n433\n%%EOF'

  const name = 'my notes (1).pdf'
  const pdfPath = 'C:\\Users\\sumit\\AppData\\Local\\Temp\\kilo\\t.pdf'
  fs.writeFileSync(pdfPath, pdfContent)
  const fd = new FormData()
  fd.append('file', fs.createReadStream(pdfPath), { contentType: 'application/pdf', filename: name })
  fd.append('title', 'Test Resource')
  fd.append('type', 'notes')
  fd.append('semester', '5')
  fd.append('subject', 'Power System-I')
  try {
    const r = await axios.post('http://localhost:5000/api/resources', fd, {
      headers: { Authorization: 'Bearer ' + token, ...fd.getHeaders() },
      maxRedirects: 0,
      validateStatus: () => true,
    })
    console.log('STATUS', r.status)
    console.log('DATA', r.data)
  } catch (e) {
    console.log('ERR', e.message)
    if (e.response) {
      console.log('STATUS', e.response.status)
      console.log('DATA', e.response.data)
    }
  }
})()