function slugify(str) {
  return String(str)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'post'
}

function uniqueSlug(slug, used = []) {
  if (!used.includes(slug)) return slug
  let i = 2
  while (used.includes(`${slug}-${i}`)) i++
  return `${slug}-${i}`
}

module.exports = { slugify, uniqueSlug }
