const fs = require('fs')
const p = 'frontend/src/pages/attendance/FacultyAttendance.jsx'
let c = fs.readFileSync(p, 'utf8')
const lines = c.split('\n')
// Normalize line 457 (index 456) indentation to 12 spaces, matching siblings
const idx = 457 - 1
if (lines[idx] && lines[idx].includes("['take', ' Take Attendance'")) {
  lines[idx] = '            ' + lines[idx].trimStart()
  fs.writeFileSync(p, lines.join('\n'))
  console.log('patched line 457 ->')
  console.log((idx+1) + ' | ' + lines[idx])
} else {
  console.log('line 457 pattern not found; current:')
  console.log((idx+1) + ' | ' + lines[idx])
}
