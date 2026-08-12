import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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

const NotFound = () => (
  <div className="page-wrap pt-32 pb-20 min-h-screen text-center">
    <h1 className="font-display text-[56px] leading-none tracking-[-0.28px] mb-4">
      Page not found
    </h1>
    <p className="text-body-muted text-[17px]">The page you're looking for doesn't exist.</p>
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
    className="w-full h-full flex-1 flex flex-col"
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
    <div className="min-h-screen flex flex-col relative z-0">
      <OrganicBlobs />
      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="/forum"   element={null} />
        <Route path="*"        element={<Navbar />} />
      </Routes>

      <main className="flex-1 flex flex-col">
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
        <Route path="*"        element={<Footer />} />
      </Routes>

    </div>
  )
}
