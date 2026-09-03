function isPlatformAdmin(user) {
  return !!(user && (user.role === 'admin' || user.role === 'super_admin'))
}

function isSameBatchCr(user, owner) {
  if (!user || !owner) return false
  if (user.role !== 'cr') return false
  if (!user.batch || !owner.batch) return false
  return String(user.batch) === String(owner.batch)
}

function canApprove(actor, owner) {
  if (!actor) return false
  if (isPlatformAdmin(actor)) return true
  if (isSameBatchCr(actor, owner)) return true
  return false
}

module.exports = { canApprove, isPlatformAdmin, isSameBatchCr }
