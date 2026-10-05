const WORDS_PER_MINUTE = 200

export function computeReadingTime(blocks = []) {
  if (!blocks || !blocks.length) return { minutes: 0, words: 0 }
  let words = 0

  const count = (str) => {
    if (!str || !str.trim()) return
    const n = String(str).trim().split(/\s+/).length
    words += n
  }

  blocks.forEach((block) => {
    if (block.type === 'code') {
      count(block.language || '')
      ;(block.text || []).forEach((s) => count(s.t))
    } else if (block.type === 'list') {
      ;(block.items || []).forEach((item) => {
        const spans = item.spans || item || []
        spans.forEach((s) => count(s.t))
      })
    } else if (block.text) {
      block.text.forEach((s) => count(s.t))
    }
    if (block.caption) count(block.caption)
  })

  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  return { minutes, words }
}

export function formatReadingTime(blocks = []) {
  const { minutes } = computeReadingTime(blocks)
  return `${minutes} min read`
}
