import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Lenis from '@studio-freight/lenis'
import Navbar         from './components/Navbar'
import Footer         from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import OrganicBlobs   from './components/OrganicBlobs'
import ForumFlipOverlay from './components/ForumFlipOverlay'
import OhmNo from './components/OhmNo'

// Public pages
import Home         from './pages/Home'
import About        from './pages/About'
import Faculty      from './pages/Faculty'
import Resources    from './pages/Resources'
import Courses      from './pages/Courses'
import SubjectDetails from './pages/SubjectDetails'
import Labs         from './pages/Labs'
import Contact      from './pages/Contact'
import Placements   from './pages/Placements'
import Achievements from './pages/Achievements'
import AchievementDetails from './pages/AchievementDetails'
import Announcements  from './pages/Announcements'
import Calendar     from './pages/Calendar'
import Gallery      from './pages/Gallery'
import Projects     from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'

// Auth pages
import Login    from './pages/Login'
import Activate        from './pages/Activate'
import ForgotPassword  from './pages/ForgotPassword'

// Student pages
import Students  from './pages/Students'
import Forum     from './pages/Forum'
import Directory from './pages/Directory'
import Dashboard from './pages/Dashboard'

// Admin pages
import AdminLayout    from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminResources from './pages/admin/AdminResources'
import AdminStudents  from './pages/admin/AdminStudents'
import AdminDeadlines from './pages/admin/AdminDeadlines'
import AdminRoutines  from './pages/admin/AdminRoutines'
import AdminAttendance from './pages/admin/AdminAttendance'
import AdminFaculty from './pages/admin/AdminFaculty'
import AdminLabs from './pages/admin/AdminLabs'
import AdminCourses from './pages/admin/AdminCourses'
import AdminGallery from './pages/admin/AdminGallery'
import AdminContact from './pages/admin/AdminContact'
import AdminRooms from './pages/admin/AdminRooms'
import AdminProjects from './pages/admin/AdminProjects'
import AdminCalendar from './pages/admin/AdminCalendar'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminAchievements from './pages/admin/AdminAchievements'

// Attendance pages
import FacultyAttendance from './pages/attendance/FacultyAttendance'
import StudentAttendance from './pages/attendance/StudentAttendance'
import FacultyDashboard   from './pages/faculty/FacultyDashboard'
const NotFound = () => <OhmNo />
// Motion settings for page transitions
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

const AnimatedRoute = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    className="flex flex-col flex-1 w-full h-full"
  >
    {children}
  </motion.div>
);

export default function App() {
  const location = useLocation()
  const lenisRef = useRef(null)
  const [forumFlip, setForumFlip] = useState(null)

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })

    lenisRef.current = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Scroll to top on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 1.2 })
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  return (
    <div className="relative z-0 flex flex-col min-h-screen">
      <OrganicBlobs />
      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="/forum"   element={null} />
        <Route path="/attendance/faculty" element={null} />
        <Route path="/login" element={null} />
        <Route path="/activate" element={null} />
        <Route path="/forgot-password" element={null} />
        <Route path="*" element={<Navbar onForumFlip={(data) => setForumFlip(data)} />} />
      </Routes>

        <main className="flex flex-col flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* â”€â”€ Public â”€â”€ */}
            <Route path="/"             element={<AnimatedRoute><Home /></AnimatedRoute>} />
            <Route path="/about"        element={<AnimatedRoute><About /></AnimatedRoute>} />
            <Route path="/faculty"      element={<AnimatedRoute><Faculty /></AnimatedRoute>} />
            <Route path="/laboratory"   element={<AnimatedRoute><Labs /></AnimatedRoute>} />
            <Route path="/courses"      element={<AnimatedRoute><Courses /></AnimatedRoute>} />
            <Route path="/subject/:id" element={<AnimatedRoute><SubjectDetails /></AnimatedRoute>} />
            <Route path="/resources"    element={<AnimatedRoute><Resources /></AnimatedRoute>} />
            <Route path="/placements"   element={<AnimatedRoute><Placements /></AnimatedRoute>} />
            <Route path="/calendar"     element={<AnimatedRoute><Calendar /></AnimatedRoute>} />
            <Route path="/gallery"      element={<AnimatedRoute><Gallery /></AnimatedRoute>} />
            <Route path="/achievements" element={<AnimatedRoute><Achievements /></AnimatedRoute>} />
            <Route path="/achievements/:id" element={<AnimatedRoute><AchievementDetails /></AnimatedRoute>} />
            <Route path="/announcements" element={<AnimatedRoute><Announcements /></AnimatedRoute>} />
            <Route path="/projects"     element={<AnimatedRoute><Projects /></AnimatedRoute>} />
            <Route path="/projects/:id" element={<AnimatedRoute><ProjectDetails /></AnimatedRoute>} />
            <Route path="/contact"      element={<AnimatedRoute><Contact /></AnimatedRoute>} />

            {/* â”€â”€ Auth â”€â”€ */}
            <Route path="/login"            element={<AnimatedRoute><Login /></AnimatedRoute>} />
            <Route path="/activate"         element={<AnimatedRoute><Activate /></AnimatedRoute>} />
            <Route path="/forgot-password"  element={<AnimatedRoute><ForgotPassword /></AnimatedRoute>} />

            {/* â”€â”€ Forum â”€â”€ */}
            <Route path="/forum" element={
              <AnimatedRoute>
                <ProtectedRoute><Forum /></ProtectedRoute>
              </AnimatedRoute>
            }/>

            {/* â”€â”€ Student â”€â”€ */}
            <Route path="/students" element={
              <AnimatedRoute>
                <ProtectedRoute><Students /></ProtectedRoute>
              </AnimatedRoute>
            }/>
            <Route path="/dashboard" element={
              <AnimatedRoute>
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              </AnimatedRoute>
            }/>

                        {/* â”€â”€ Faculty â”€â”€ */}
            <Route path="/faculty/dashboard" element={
              <AnimatedRoute>
                <ProtectedRoute role="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              </AnimatedRoute>
            }/>

            {/* â”€â”€ Attendance â”€â”€ */}
            <Route path="/attendance/faculty" element={
              <AnimatedRoute>
                <ProtectedRoute role="faculty">
                  <FacultyAttendance />
                </ProtectedRoute>
              </AnimatedRoute>
            }/>
            <Route path="/attendance/student" element={
              <AnimatedRoute>
                <ProtectedRoute role="student, cr">
                  <StudentAttendance />
                </ProtectedRoute>
              </AnimatedRoute>
            }/>

            {/* â”€â”€ Admin â”€â”€ */}
            <Route path="/admin/*" element={
              <AnimatedRoute>
                <ProtectedRoute role="cr, admin">
                  <Routes>
                    <Route element={<AdminLayout />}>
                      <Route index             element={<AdminDashboard />} />
                        <Route path="announcements" element={<AdminAnnouncements />} />
                        <Route path="resources"  element={<AdminResources />} />
                        <Route path="calendar"   element={<AdminCalendar />} />
                        <Route path="projects"   element={<AdminProjects />} />
                        <Route path="rooms"      element={<AdminRooms />} />
                        <Route path="students"   element={<AdminStudents />} />
                        <Route path="deadlines"  element={<AdminDeadlines />} />
                        <Route path="routines"   element={<AdminRoutines />} />
                        <Route path="attendance" element={<AdminAttendance />} />
                        <Route path="faculty"   element={<AdminFaculty />} />
                        <Route path="labs"      element={<AdminLabs />} />
                        <Route path="courses"   element={<AdminCourses />} />
                        <Route path="gallery"   element={<AdminGallery />} />
                        <Route path="achievements" element={<AdminAchievements />} />
                        <Route path="contact"   element={<AdminContact />} />
                    </Route>
                  </Routes>
                </ProtectedRoute>
              </AnimatedRoute>
            } />

            <Route path="*" element={<AnimatedRoute><NotFound /></AnimatedRoute>} />
          </Routes>
        </AnimatePresence>
      </main>

      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="/forum"   element={null} />
        <Route path="/attendance/*" element={null} />
        <Route path="*"        element={<Footer />} />
      </Routes>

      {forumFlip && (
        <ForumFlipOverlay
          triggerRect={forumFlip.rect}
          borderRadius={forumFlip.borderRadius}
          onClose={() => setForumFlip(null)}
        />
      )}

    </div>
  )
}
