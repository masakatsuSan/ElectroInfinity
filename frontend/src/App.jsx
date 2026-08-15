import { useEffect } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Lenis from '@studio-freight/lenis'
import Navbar         from './components/Navbar'
import Footer         from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import OrganicBlobs   from './components/OrganicBlobs'

// Public pages
import Home         from './pages/Home'
import About        from './pages/About'
import Faculty      from './pages/Faculty'
import Resources    from './pages/Resources'
import Courses      from './pages/Courses'
import SubjectDetails from './pages/SubjectDetails'
import Events       from './pages/Events'
import Labs         from './pages/Labs'
import Contact      from './pages/Contact'
import Placements   from './pages/Placements'
import Achievements from './pages/Achievements'
import Gallery      from './pages/Gallery'

// Auth pages
import Login    from './pages/Login'
import Activate        from './pages/Activate'
import ForgotPassword  from './pages/ForgotPassword'

// Student pages
import Students  from './pages/Students'
import Forum     from './pages/Forum'
import Directory from './pages/Directory'

// Admin pages
import AdminLayout    from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminNotices   from './pages/admin/AdminNotices'
import AdminResources from './pages/admin/AdminResources'
import AdminEvents    from './pages/admin/AdminEvents'
import AdminStudents  from './pages/admin/AdminStudents'
import AdminDeadlines from './pages/admin/AdminDeadlines'
import AdminRoutines  from './pages/admin/AdminRoutines'
import AdminAttendance from './pages/admin/AdminAttendance'

// Attendance pages
import FacultyAttendance from './pages/attendance/FacultyAttendance'
import StudentAttendance from './pages/attendance/StudentAttendance'

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen pt-32 pb-20 text-center page-wrap">
    <motion.div 
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="relative mb-8"
    >
      {/* Broken Bulb / Plug icon instead of dollar sign */}
      <motion.svg 
        width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
        animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="text-primary opacity-80"
        strokeLinecap="round" strokeLinejoin="round"
      >
        {/* lightbulb-off icon paths */}
        <path d="M16.8 9.2c.5-1.1.8-2.4.8-3.7A5.5 5.5 0 0 0 12 0c-1.3 0-2.6.3-3.7.8"/>
        <path d="m2 2 20 20"/>
        <path d="M6.3 6.3c-.9 1.4-1.3 3.1-1.3 4.7 0 2.8 1.9 4 3 5v2c0 1.1.9 2 2 2h4c.7 0 1.3-.3 1.7-.8"/>
        <path d="M10 22h4"/>
      </motion.svg>
      {/* Little sparks */}
      <motion.circle cx="4" cy="4" r="1.5" fill="currentColor" className="absolute top-0 left-0 text-red-500"
        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} />
      <motion.circle cx="20" cy="8" r="1" fill="currentColor" className="absolute right-0 text-yellow-500 top-4"
        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
      <motion.circle cx="18" cy="20" r="2" fill="currentColor" className="absolute bottom-0 text-primary right-2"
        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.8 }} />
    </motion.div>

    <h1 className="font-display text-[56px] leading-none tracking-tight mb-6 text-ink">
      404 — Ohm No! ⚡
    </h1>
    
    <div className="text-body-muted text-[17px] max-w-md mx-auto space-y-4 mb-10">
      <p>This page has officially resisted existence.</p>
      <p>
        The voltage is missing,<br/>
        the current refuses to flow,<br/>
        and Kirchhoff is asking questions.
      </p>
      <p>Probably best to head back before the circuit explodes.</p>
    </div>

    <Link to="/" className="inline-flex items-center gap-2 button-primary">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      Take Me Back
    </Link>
  </div>
)

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
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="relative z-0 flex flex-col min-h-screen">
      <OrganicBlobs />
      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="/forum"   element={null} />
        <Route path="/attendance/faculty" element={null} />
        <Route path="*"        element={<Navbar />} />
      </Routes>

      <main className="flex flex-col flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* ── Public ── */}
            <Route path="/"             element={<AnimatedRoute><Home /></AnimatedRoute>} />
            <Route path="/about"        element={<AnimatedRoute><About /></AnimatedRoute>} />
            <Route path="/faculty"      element={<AnimatedRoute><Faculty /></AnimatedRoute>} />
            <Route path="/laboratory"   element={<AnimatedRoute><Labs /></AnimatedRoute>} />
            <Route path="/courses"      element={<AnimatedRoute><Courses /></AnimatedRoute>} />
            <Route path="/courses/:courseId" element={<AnimatedRoute><SubjectDetails /></AnimatedRoute>} />
            <Route path="/resources"    element={<AnimatedRoute><Resources /></AnimatedRoute>} />
            <Route path="/events"       element={<AnimatedRoute><Events /></AnimatedRoute>} />
            <Route path="/placements"   element={<AnimatedRoute><Placements /></AnimatedRoute>} />
            <Route path="/gallery"      element={<AnimatedRoute><Gallery /></AnimatedRoute>} />
            <Route path="/achievements" element={<AnimatedRoute><Achievements /></AnimatedRoute>} />
            <Route path="/contact"      element={<AnimatedRoute><Contact /></AnimatedRoute>} />

            {/* ── Auth ── */}
            <Route path="/login"            element={<AnimatedRoute><Login /></AnimatedRoute>} />
            <Route path="/activate"         element={<AnimatedRoute><Activate /></AnimatedRoute>} />
            <Route path="/forgot-password"  element={<AnimatedRoute><ForgotPassword /></AnimatedRoute>} />

            {/* ── Forum ── */}
            <Route path="/forum" element={
              <AnimatedRoute>
                <ProtectedRoute><Forum /></ProtectedRoute>
              </AnimatedRoute>
            }/>

            {/* ── Student ── */}
            <Route path="/students" element={
              <AnimatedRoute>
                <ProtectedRoute><Students /></ProtectedRoute>
              </AnimatedRoute>
            }/>

            {/* ── Attendance ── */}
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

            {/* ── Admin ── */}
            <Route path="/admin/*" element={
              <AnimatedRoute>
                <ProtectedRoute role="cr, admin">
                  <Routes>
                    <Route element={<AdminLayout />}>
                      <Route index             element={<AdminDashboard />} />
                      <Route path="notices"    element={<AdminNotices />} />
                      <Route path="resources"  element={<AdminResources />} />
                      <Route path="events"     element={<AdminEvents />} />
                      <Route path="students"   element={<AdminStudents />} />
                      <Route path="deadlines"  element={<AdminDeadlines />} />
                      <Route path="routines"   element={<AdminRoutines />} />
                      <Route path="attendance" element={<AdminAttendance />} />
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
        <Route path="/attendance/faculty" element={null} />
        <Route path="*"        element={<Footer />} />
      </Routes>

    </div>
  )
}
