function canViewBatchStudents(user, batch) {
  if (!user || !batch) return false

  const normalizedBatch = String(batch).trim()
  if (!normalizedBatch) return false

  const roles = ['admin', 'super_admin', 'cr']
  if (roles.includes(user.role)) return true

  return String(user.batch || '').trim() === normalizedBatch
}

module.exports = { canViewBatchStudents }
