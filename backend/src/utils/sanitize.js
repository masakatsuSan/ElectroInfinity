function sanitizeString(val) {
  if (val === undefined || val === null) return ''
  return String(val).replace(/<[^>]*>/g, '').trim()
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed)
    if (/^https?:$/.test(parsed.protocol)) {
      return trimmed
    }
    return null
  } catch {
    return null
  }
}

function sanitizeSpans(spans) {
  if (!Array.isArray(spans)) return []
  return spans
    .filter((s) => s && typeof s.t === 'string')
    .map((s) => ({
      t: sanitizeString(s.t),
      bold: !!s.bold,
      italic: !!s.italic,
      underline: !!s.underline,
      code: !!s.code,
      link: s.link ? sanitizeUrl(s.link) : null,
    }))
    .filter((s) => s.t.length > 0)
}

function sanitizeBlock(block) {
  if (!block || typeof block !== 'object') return null
  const type = block.type
  const valid = ['heading', 'paragraph', 'image', 'quote', 'list', 'code', 'divider']
  if (!valid.includes(type)) return null

  const safe = {
    id: typeof block.id === 'string' ? block.id : undefined,
    type,
    align: ['left', 'center', 'right'].includes(block.align) ? block.align : 'left',
  }

  if (type === 'heading') {
    const level = parseInt(block.level) || 1
    safe.level = Math.max(1, Math.min(3, level))
    safe.text = sanitizeSpans(block.text || [])
  } else if (type === 'paragraph') {
    safe.text = sanitizeSpans(block.text || [])
  } else if (type === 'image') {
    safe.src = sanitizeUrl(block.src) || ''
    safe.alt = sanitizeString(block.alt || '').slice(0, 500)
    safe.caption = sanitizeString(block.caption || '').slice(0, 500)
  } else if (type === 'quote') {
    safe.text = sanitizeSpans(block.text || [])
  } else if (type === 'list') {
    safe.listStyle = ['bullet', 'number'].includes(block.listStyle) ? block.listStyle : 'bullet'
    safe.items = Array.isArray(block.items) ? block.items.map(sanitizeSpans).filter((a) => a.length > 0) : []
  } else if (type === 'code') {
    safe.language = sanitizeString(block.language || '').slice(0, 50)
    safe.text = sanitizeSpans(block.text || [])
  }

  return safe
}

function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return []
  const sanitized = blocks.map(sanitizeBlock).filter(Boolean)
  return sanitized.slice(0, 200)
}

module.exports = {
  sanitizeString,
  sanitizeUrl,
  sanitizeSpans,
  sanitizeBlock,
  sanitizeBlocks,
}
