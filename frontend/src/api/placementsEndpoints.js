// Centralised endpoint paths for the placements CRUD.
// Frontend service functions and backend routes share these exact segments
// so there is ONE definition of every path.
export const PLACEMENTS = {
  // Public reads
  STATS: '/placements/stats',
  RECRUITERS: '/placements/recruiters',
  PLACED_STUDENTS: '/placements/placed-students',
  ALUMNI: '/placements/alumni',
  OPENINGS: '/placements/openings',
  // Admin
  ADMIN: '/admin/placements',
  ADMIN_STATS: '/admin/placements/stats',
  ADMIN_RECRUITERS: '/admin/placements/recruiters',
  ADMIN_PLACED_STUDENTS: '/admin/placements/placed-students',
  ADMIN_ALUMNI: '/admin/placements/alumni',
  ADMIN_OPENINGS: '/admin/placements/openings',
}
