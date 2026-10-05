const MARK_TYPES = ['bold', 'italic', 'underline', 'code']
const BLOCK_TYPES = ['heading', 'paragraph', 'image', 'quote', 'list', 'code', 'divider']

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  if (typeof require === 'function') {
    try {
      const { randomUUID } = require('crypto')
      return randomUUID()
    } catch (_) {}
  }
  return 'block-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11)
}

function cleanStr(val) {
  if (val === undefined || val === null) return ''
  return String(val).replace(/<[^>]*>/g, '').trim()
}

function spansEqual(a, b) {
  return (
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.code === b.code &&
    a.link === b.link
  )
}

function spanFromText(node) {
  const marks = {}
  if (Array.isArray(node.marks)) {
    for (const mark of node.marks) {
      if (MARK_TYPES.includes(mark.type)) {
        marks[mark.type] = true
      } else if (mark.type === 'link') {
        const href = mark.attrs?.href
        marks.link = href ? String(href) : null
      }
    }
  }
  return {
    t: node.text || '',
    bold: !!marks.bold,
    italic: !!marks.italic,
    underline: !!marks.underline,
    code: !!marks.code,
    link: marks.link || null,
  }
}

function extractSpans(content) {
  if (!Array.isArray(content)) return []
  const raw = []
  for (const node of content) {
    if (node.type === 'text' && node.text) {
      raw.push(spanFromText(node))
    } else if (node.content) {
      raw.push(...extractSpans(node.content))
    }
  }
  const merged = []
  for (const span of raw) {
    const last = merged[merged.length - 1]
    if (last && spansEqual(last, span)) {
      last.t += span.t
    } else {
      merged.push({ ...span })
    }
  }
  return merged.filter((s) => s.t.length > 0)
}

function extractInlineContent(node) {
  if (!node.content) return []
  const result = []
  for (const child of node.content) {
    if (child.type === 'text') {
      result.push(child)
    } else if (child.content) {
      result.push(...extractInlineContent(child))
    } else {
      result.push(child)
    }
  }
  return result
}

function listItemSpans(listItem) {
  const collected = []
  if (listItem.content) {
    for (const child of listItem.content) {
      if (child.type === 'paragraph') {
        collected.push(...extractSpans(child.content || []))
      } else if (child.content) {
        collected.push(...extractSpans(extractInlineContent(child)))
      }
    }
  }
  return collected
}

function buildTextNodes(spans) {
  const nodes = []
  for (const span of spans || []) {
    if (!span.t || !span.t.length) continue
    const marks = []
    if (span.bold) marks.push({ type: 'bold' })
    if (span.italic) marks.push({ type: 'italic' })
    if (span.underline) marks.push({ type: 'underline' })
    if (span.code) marks.push({ type: 'code' })
    if (span.link) marks.push({ type: 'link', attrs: { href: span.link } })
    const node = { type: 'text', text: span.t }
    if (marks.length) node.marks = marks
    nodes.push(node)
  }
  return nodes
}

function blockToNode(block) {
  const align = block.align && block.align !== 'left' ? block.align : 'left'
  const textAlign = align

  if (block.type === 'paragraph') {
    return { type: 'paragraph', attrs: { textAlign }, content: buildTextNodes(block.text) }
  }

  if (block.type === 'heading') {
    const level = Math.max(1, Math.min(3, parseInt(block.level) || 1))
    return { type: 'heading', attrs: { level, textAlign }, content: buildTextNodes(block.text) }
  }

  if (block.type === 'list') {
    const listNode = block.listStyle === 'number' ? 'orderedList' : 'bulletList'
    const items = block.items || []
    return {
      type: listNode,
      attrs: { textAlign },
      content: items.map((item) => {
        const spans = Array.isArray(item) ? item : (item.spans || item || [])
        return {
          type: 'listItem',
          attrs: { textAlign },
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign },
              content: buildTextNodes(spans),
            },
          ],
        }
      }),
    }
  }

  if (block.type === 'quote') {
    return {
      type: 'blockquote',
      attrs: { textAlign },
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign },
          content: buildTextNodes(block.text),
        },
      ],
    }
  }

  if (block.type === 'code') {
    return {
      type: 'codeBlock',
      attrs: { language: cleanStr(block.language || '') || null, textAlign },
      content: buildTextNodes(block.text),
    }
  }

  if (block.type === 'divider') {
    return { type: 'horizontalRule' }
  }

  if (block.type === 'image') {
    return {
      type: 'image',
      attrs: {
        src: block.src || '',
        alt: block.alt || '',
        title: block.caption || '',
        textAlign,
      },
    }
  }

  return null
}

function nodeToBlock(node) {
  const type = node.type
  const align = node.attrs?.textAlign || 'left'

  if (type === 'paragraph' || type === 'heading') {
    const text = extractSpans(node.content || [])
    const block = { id: generateId(), type: type === 'heading' ? 'heading' : 'paragraph', text, align }
    if (type === 'heading') {
      block.level = Math.max(1, Math.min(3, parseInt(node.attrs?.level) || 1))
    }
    return block
  }

  if (type === 'bulletList' || type === 'orderedList') {
    const items = (node.content || [])
      .filter((li) => li.type === 'listItem')
      .map((li) => ({ spans: listItemSpans(li) }))
    return {
      id: generateId(),
      type: 'list',
      listStyle: type === 'orderedList' ? 'number' : 'bullet',
      items,
      align,
    }
  }

  if (type === 'blockquote') {
    const text = extractSpans(extractInlineContent({ content: node.content }))
    return { id: generateId(), type: 'quote', text, align }
  }

  if (type === 'codeBlock') {
    return {
      id: generateId(),
      type: 'code',
      language: cleanStr(node.attrs?.language || ''),
      text: extractSpans(node.content || []),
      align,
    }
  }

  if (type === 'horizontalRule') {
    return { id: generateId(), type: 'divider' }
  }

  if (type === 'image') {
    return {
      id: generateId(),
      type: 'image',
      src: node.attrs?.src || '',
      alt: cleanStr(node.attrs?.alt || ''),
      caption: cleanStr(node.attrs?.title || ''),
      align,
    }
  }

  return null
}

export function toBlocks(tiptapDoc) {
  const doc = tiptapDoc?.type === 'doc' ? tiptapDoc : { type: 'doc', content: Array.isArray(tiptapDoc) ? tiptapDoc : [] }
  const content = doc.content || []
  const blocks = []
  for (const node of content) {
    const block = nodeToBlock(node)
    if (block) blocks.push(block)
  }
  return blocks
}

export function fromBlocks(blocks) {
  const content = (Array.isArray(blocks) ? blocks : [])
    .map(blockToNode)
    .filter(Boolean)
  return { type: 'doc', content }
}

export { BLOCK_TYPES, MARK_TYPES, generateId, cleanStr }

export function isExternalLink(url) {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.hostname !== window.location.hostname
  } catch {
    return true
  }
}

