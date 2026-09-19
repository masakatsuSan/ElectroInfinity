import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Lenis from '@studio-freight/lenis'
import Navbar         from './components/Navbar'
import Footer         from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import OrganicBlobs   from './components/OrganicBlobs'
import ForumFlipOverlay from './components/ForumFlipOverlay'
import OhmNo from './components/OhmNo'
import RouteFallback from './components/RouteFallback'
import { NotificationProvider } from './context/NotificationContext'
import { PAGE_VARIANTS, PAGE_TRANSITION } from './utils/motion'

// Public pages — lazily loaded so the entry chunk only carries the app shell.
// Each page's code (and its heavy dependencies) arrives when the route is
// actually visited; see AnimatedRoute's <Suspense> fallback below.
const Home          = lazy(() => import('./pages/Home'))
const About         = lazy(() => import('./pages/About'))
const Faculty       = lazy(() => import('./pages/Faculty'))
const Resources     = lazy(() => import('./pages/Resources'))
const ResourceFolders = lazy(() => import('./pages/ResourceFolders'))
const Courses       = lazy(() => import('./pages/Courses'))
const SubjectDetails = lazy(() => import('./pages/SubjectDetails'))
const Labs          = lazy(() => import('./pages/Labs'))
const Contact       = lazy(() => import('./pages/Contact'))
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'))
const Placements    = lazy(() => import('./pages/Placements'))
const Achievements  = lazy(() => import('./pages/Achievements'))
const AchievementDetails = lazy(() => import('./pages/AchievementDetails'))
const Announcements = lazy(() => import('./pages/Announcements'))
const Calendar      = lazy(() => import('./pages/Calendar'))
const Gallery       = lazy(() => import('./pages/Gallery'))
const Projects      = lazy(() => import('./pages/Projects'))
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'))
const Profile       = lazy(() => import('./pages/Profile'))
const EditProfile   = lazy(() => import('./pages/EditProfile'))
const Notifications = lazy(() => import('./pages/Notifications'))

// MyProfile redirect component
const MyProfile = lazy(() => import('./pages/MyProfile'))

// Auth pages
const Login           = lazy(() => import('./pages/Login'))
const Activate        = lazy(() => import('./pages/Activate'))
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'))

// Student pages
const Students  = lazy(() => import('./pages/Students'))
const Forum     = lazy(() => import('./pages/Forum'))
const Directory = lazy(() => import('./pages/Directory'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Search    = lazy(() => import('./pages/Search'))

// Network page
const Network = lazy(() => import('./pages/Network'))

// Admin pages
const AdminLayout    = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminResources = lazy(() => import('./pages/admin/AdminResources'))
const AdminResourceFolders = lazy(() => import('./pages/admin/AdminResourceFolders'))
const AdminStudents  = lazy(() => import('./pages/admin/AdminStudents'))
const AdminDeadlines = lazy(() => import('./pages/admin/AdminDeadlines'))
const AdminRoutines  = lazy(() => import('./pages/admin/AdminRoutines'))
const AdminFaculty   = lazy(() => import('./pages/admin/AdminFaculty'))
const AdminLabs      = lazy(() => import('./pages/admin/AdminLabs'))
const AdminCourses   = lazy(() => import('./pages/admin/AdminCourses'))
const AdminGallery   = lazy(() => import('./pages/admin/AdminGallery'))
const AdminContact   = lazy(() => import('./pages/admin/AdminContact'))
const AdminRooms     = lazy(() => import('./pages/admin/AdminRooms'))
const AdminProjects  = lazy(() => import('./pages/admin/AdminProjects'))
const AdminCalendar  = lazy(() => import('./pages/admin/AdminCalendar'))
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'))
const AdminAchievements = lazy(() => import('./pages/admin/AdminAchievements'))
const AdminYTLectures = lazy(() => import('./pages/admin/AdminYTLectures'))
const AdminLogin     = lazy(() => import('./pages/admin/AdminLogin'))
const AdminProfile   = lazy(() => import('./pages/admin/AdminProfile'))

// Faculty pages
const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'))
const FacultyLogin     = lazy(() => import('./pages/faculty/FacultyLogin'))
const FacultyActivate  = lazy(() => import('./pages/faculty/FacultyActivate'))
const NotFound = () => <OhmNo />

const AnimatedRoute = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={PAGE_VARIANTS}
    transition={PAGE_TRANSITION}
    className="flex flex-col flex-1 w-full h-full"
  >
    {/* Route code is fetched lazily; the skeleton replaces only the page area
        while the chunk arrives, so the shell never blanks out. */}
    <Suspense fallback={<RouteFallback />}>
      {children}
    </Suspense>
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
      smoothTouch: true,
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
    <NotificationProvider>
      <div className="relative z-0 flex flex-col min-h-screen overflow-x-hidden">
      <OrganicBlobs />
      <Routes>
        <Route path="/admin/*" element={null} />
        <Route path="/faculty/dashboard" element={null} />
        <Route path="/faculty/login" element={null} />
        <Route path="/faculty/activate" element={null} />
        <Route path="/forum" element={null} />
        <Route path="/login" element={null} />
        <Route path="/admin/login" element={null} />
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
            <Route path="/resources/folders" element={<AnimatedRoute><ResourceFolders /></AnimatedRoute>} />
            <Route path="/resources/folders/:id" element={<AnimatedRoute><ResourceFolders /></AnimatedRoute>} />
            <Route path="/placements"   element={<AnimatedRoute><Placements /></AnimatedRoute>} />
            <Route path="/calendar"     element={<AnimatedRoute><Calendar /></AnimatedRoute>} />
            <Route path="/gallery"      element={<AnimatedRoute><Gallery /></AnimatedRoute>} />
            <Route path="/achievements" element={<AnimatedRoute><Achievements /></AnimatedRoute>} />
            <Route path="/achievements/:id" element={<AnimatedRoute><AchievementDetails /></AnimatedRoute>} />
            <Route path="/announcements" element={<AnimatedRoute><Announcements /></AnimatedRoute>} />
            <Route path="/projects"     element={<AnimatedRoute><Projects /></AnimatedRoute>} />
            <Route path="/projects/:id" element={<AnimatedRoute><ProjectDetails /></AnimatedRoute>} />
            <Route path="/contact"      element={<AnimatedRoute><Contact /></AnimatedRoute>} />
            <Route path="/terms-and-conditions" element={<AnimatedRoute><TermsAndConditions /></AnimatedRoute>} />
<Route path="/profile/:id"  element={<AnimatedRoute><Profile /></AnimatedRoute>} />
<Route path="/profile/me" element={
  <AnimatedRoute>
    <ProtectedRoute><MyProfile /></ProtectedRoute>
  </AnimatedRoute>
} />
<Route path="/profile/edit" element={
              <AnimatedRoute>
                <ProtectedRoute><EditProfile /></ProtectedRoute>
              </AnimatedRoute>
            } />

            {/* â”€â”€ Auth â”€â”€ */}
            <Route path="/login"            element={<AnimatedRoute><Login /></AnimatedRoute>} />
            <Route path="/admin/login"      element={<AnimatedRoute><AdminLogin /></AnimatedRoute>} />
            <Route path="/faculty/login"    element={<AnimatedRoute><FacultyLogin /></AnimatedRoute>} />
            <Route path="/activate"         element={<AnimatedRoute><Activate /></AnimatedRoute>} />
            <Route path="/faculty/activate" element={<AnimatedRoute><FacultyActivate /></AnimatedRoute>} />
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
            <Route path="/network" element={
              <AnimatedRoute>
                <ProtectedRoute><Network /></ProtectedRoute>
              </AnimatedRoute>
            }/>
            <Route path="/search" element={
              <AnimatedRoute>
                <ProtectedRoute><Search /></ProtectedRoute>
              </AnimatedRoute>
            }/>

                        {/* â”€â”€ Faculty â”€â”€ */}
            <Route path="/faculty/dashboard" element={
              <AnimatedRoute>
                <ProtectedRoute role="faculty" loginPath="/faculty/login">
                  <FacultyDashboard />
                </ProtectedRoute>
              </AnimatedRoute>
            }/>

            <Route path="/notifications" element={
              <AnimatedRoute>
                <ProtectedRoute><Notifications /></ProtectedRoute>
              </AnimatedRoute>
            }/>

            {/* â”€â”€ Admin â”€â”€ */}
            <Route path="/admin/*" element={
              <AnimatedRoute>
                <ProtectedRoute role="cr, admin" loginPath="/admin/login">
                  <Routes>
<Route element={<AdminLayout />}>
  <Route index             element={<AdminDashboard />} />
    <Route path="profile"          element={<AdminProfile />} />
    <Route path="announcements" element={<AdminAnnouncements />} />
    <Route path="resources"  element={<AdminResources />} />
    <Route path="resource-folders" element={<AdminResourceFolders />} />
                        <Route path="calendar"   element={<AdminCalendar />} />
                        <Route path="projects"   element={<AdminProjects />} />
                        <Route path="rooms"      element={<AdminRooms />} />
                        <Route path="students"   element={<AdminStudents />} />
                        <Route path="deadlines"  element={<AdminDeadlines />} />
                        <Route path="routines"   element={<AdminRoutines />} />
                        <Route path="faculty"   element={<AdminFaculty />} />
                        <Route path="labs"      element={<AdminLabs />} />
                        <Route path="courses"   element={<AdminCourses />} />
                        <Route path="gallery"   element={<AdminGallery />} />
                    <Route path="achievements" element={<AdminAchievements />} />
                    <Route path="yt-lectures" element={<AdminYTLectures />} />
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
        <Route path="/faculty/dashboard" element={null} />
        <Route path="/faculty/login" element={null} />
        <Route path="/faculty/activate" element={null} />
        <Route path="/forum" element={null} />
        <Route path="/login" element={null} />
        <Route path="/admin/login" element={null} />
        <Route path="/activate" element={null} />
        <Route path="/forgot-password" element={null} />
        <Route path="*"        element={<Footer />} />
      </Routes>

      <AnimatePresence>
        {forumFlip && (
          <ForumFlipOverlay
            triggerRect={forumFlip.rect}
            borderRadius={forumFlip.borderRadius}
            onClose={() => setForumFlip(null)}
          />
        )}
      </AnimatePresence>

    </div>
    </NotificationProvider>
  )
}
