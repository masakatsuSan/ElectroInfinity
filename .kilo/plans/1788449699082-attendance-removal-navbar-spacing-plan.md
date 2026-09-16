# Attendance Removal & Navbar Spacing Plan

## Goal
Remove all attendance functionality from frontend and backend. Fix navbar dropdown/featured card spacing.

## Scope

### Remove (Attendance-Only)
- Frontend routes: AdminAttendance, FacultyAttendance, StudentAttendance
- Backend: attendance.js route, AttendanceRecord.js, Session.js models
- Services: attendanceSession.js
- Utils: geofence.js (backend/frontend if attendance-only)
- Components: Classroom3D.jsx, ClassroomPresence.jsx, PermissionBanner.jsx
- APIs: attendance.js
- Socket handlers: join-session, leave-session
- Notification: attendance_session enum/icon
- User model fields: assignedBatches, assignedCourses, teachingAssignments

### Retain
- Faculty Directory (frontend + backend service API)
- Faculty announcements (with scoping fix)
- Profile QR (backend qrcode shared dependency)

## Tasks

### 1. Frontend Removals
- `frontend\src\App.jsx`: Remove attendance page imports and /attendance/* routes
- `frontend\src\components\Navbar.jsx`: Remove attendance nav link, adjust dropdown spacing
- `frontend\pages\admin\AdminAttendance.jsx`: Delete file
- `frontend\pages\attendance\FacultyAttendance.jsx`: Delete
- `frontend\pages\attendance\StudentAttendance.jsx`: Delete
- `frontend\src\components\attendance/Classroom3D.jsx`: Delete
- `frontend\src\components\attendance/ClassroomPresence.jsx`: Delete
- `frontend\src\components/PermissionBanner.jsx`: Delete
- `frontend\src\utils/location.js`: Delete
- `frontend\src\utils/geofence.js`: Delete (if attendance-only)
- `frontend\src\utils/classroomMap.js`: Delete
- `frontend\src\utils/permissions.js`: Delete
- `frontend\src\utils/location.test.js`: Delete
- `frontend\src\api/attendance.js`: Delete
- `frontend\pages\admin\AdminDashboard.jsx`: Replace `getAdminFaculty` with Faculty Directory API
- `frontend\pages\admin\AdminLayout.jsx`: Remove attendance admin link
- `frontend\pages\faculty\FacultyDashboard.jsx`: Remove attendance tab
- `frontend\pages\Home.jsx`: Remove attendance reference
- `frontend\pages\Students.jsx`: Remove attendance tab/query
- `frontend\src\App.jsx`: Ensure socket.io client retains notification socket (remove session sockets only)

### 2. Backend Removals
- `backend\src\routes\attendance.js`: Delete file
- `backend\src\services\attendanceSession.js`: Delete
- `backend\src\models/Session.js`: Delete
- `backend\src\models/AttendanceRecord.js`: Delete
- `backend\src\utils/geofence.js`: Delete (if attendance-only)
- `backend\src\utils/notification.js`: Remove attendance_session icon/enum entry
- `backend\src\config\socket.js`: Remove join-session/leave-session handlers
- `backend\server.js`: Remove `/api/attendance` route import/use
- `backend\src\routes\admin.js`: Remove activeSessions stat
- `backend\src\models\User.js`: Remove assignedBatches, assignedCourses, teachingAssignments
- `backend\seed_users.js`: Remove faculty assignedBatches/assignedCourses

### 3. Announcement Scoping Fix
- `backend\src\routes\announcements.js`: Replace `assignedBatches`/`teachingAssignments` scoping with Faculty Directory logic

### 4. Migration
- Script to delete existing AttendanceRecord and Session documents
- User confirmation: delete attendance_session notification documents NOT purged

### 5. Dependency Cleanup
- `frontend\package.json`: Remove @react-three/fiber, @react-three/drei, three (confirm no other usage)
- `backend\package.json`: No changes (qrcode retained for profile)

### 6. Navbar Spacing Fix
- Adjust dropdown inner gap and featured card padding to reduce vertical space
- Target: `gap-2 px-2 py-1.5` on dropdown, `w-60 p-2.5` on featured cards

### 7. Validation
- Run backend tests: `npm test` in backend directory
- Verify Vite compiles on localhost:5174
- Confirm Faculty Directory functionality intact
