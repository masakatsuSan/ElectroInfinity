import { describe, it, expect } from 'vitest'
import { toBlocks, fromBlocks, BLOCK_TYPES, cleanStr } from '../utils/blogBlocks'

describe('blogBlocks: span creation', () => {
  it('extracts bold/italic/underline/code/link from marks', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            {
              type: 'text',
              text: 'bold',
              marks: [{ type: 'bold' }],
            },
            {
              type: 'text',
              text: ' and ',
              marks: [{ type: 'italic' }, { type: 'underline' }],
            },
            {
              type: 'text',
              text: 'link',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
            },
            {
              type: 'text',
              text: 'code',
              marks: [{ type: 'code' }],
            },
          ],
        },
      ],
    }
    const blocks = toBlocks(doc)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('paragraph')
    expect(blocks[0].text).toHaveLength(5)
    expect(blocks[0].text[0]).toMatchObject({ t: 'Hello ', bold: false })
    expect(blocks[0].text[1]).toMatchObject({ t: 'bold', bold: true })
    expect(blocks[0].text[2]).toMatchObject({ t: ' and ', italic: true, underline: true })
    expect(blocks[0].text[3]).toMatchObject({ t: 'link', link: 'https://example.com' })
    expect(blocks[0].text[4]).toMatchObject({ t: 'code', code: true })
  })

  it('merges consecutive spans with identical marks', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hel' },
            { type: 'text', text: 'lo' },
          ],
        },
      ],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0].text).toHaveLength(1)
    expect(blocks[0].text[0].t).toBe('Hello')
  })

  it('preserves link href in the link field', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'click',
              marks: [{ type: 'link', attrs: { href: 'https://x.test/a' } }],
            },
          ],
        },
      ],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0].text[0].link).toBe('https://x.test/a')
  })
})

describe('blogBlocks: block types', () => {
  it('converts heading with level', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] }],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0]).toMatchObject({ type: 'heading', level: 2, text: [{ t: 'Title' }] })
  })

  it('converts heading level clamped to 1-3', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 5 }, content: [{ type: 'text', text: 'X' }] }],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0].level).toBe(3)
  })

  it('converts paragraph', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body text' }] }],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0]).toMatchObject({ type: 'paragraph', text: [{ t: 'Body text' }] })
  })

  it('converts empty paragraph to empty text array', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph' }] }
    const blocks = toBlocks(doc)
    expect(blocks[0].text).toEqual([])
  })

  it('converts bulletList to list with listStyle bullet', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
          ],
        },
      ],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0].type).toBe('list')
    expect(blocks[0].listStyle).toBe('bullet')
    expect(blocks[0].items).toHaveLength(2)
    expect(blocks[0].items[0].spans[0].t).toBe('one')
    expect(blocks[0].items[1].spans[0].t).toBe('two')
  })

  it('converts orderedList to list with listStyle number', () => {
    const doc = { type: 'doc', content: [{ type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'first' }] }] }] }] }
    const blocks = toBlocks(doc)
    expect(blocks[0].listStyle).toBe('number')
    expect(blocks[0].items[0].spans[0].t).toBe('first')
  })

  it('converts blockquote to quote', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote text' }] }],
        },
      ],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0]).toMatchObject({ type: 'quote', text: [{ t: 'Quote text' }] })
  })

  it('converts codeBlock with language', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'codeBlock', attrs: { language: 'js' }, content: [{ type: 'text', text: 'const x = 1' }] }],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0]).toMatchObject({ type: 'code', language: 'js', text: [{ t: 'const x = 1' }] })
  })

  it('converts horizontalRule to divider', () => {
    const doc = { type: 'doc', content: [{ type: 'horizontalRule' }] }
    const blocks = toBlocks(doc)
    expect(blocks[0].type).toBe('divider')
  })

  it('converts image with src, alt, title as caption', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'image', attrs: { src: 'https://x.test/img.png', alt: 'desc', title: 'caption here' } }],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0]).toMatchObject({
      type: 'image',
      src: 'https://x.test/img.png',
      alt: 'desc',
      caption: 'caption here',
    })
  })

  it('converts textAlign attr to align', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'text', text: 'hi' }] }],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0].align).toBe('center')
  })

  it('ignores unknown node types', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'table', content: [] }, { type: 'paragraph', content: [{ type: 'text', text: 'ok' }] }],
    }
    const blocks = toBlocks(doc)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('paragraph')
  })
})

describe('blogBlocks: fromBlocks round-trip', () => {
  it('converts paragraph block back to Tiptap JSON', () => {
    const blocks = [{ id: 'a', type: 'paragraph', text: [{ t: 'Hello', bold: true }], align: 'left' }]
    const doc = fromBlocks(blocks)
    expect(doc.type).toBe('doc')
    expect(doc.content[0].type).toBe('paragraph')
    expect(doc.content[0].content[0]).toMatchObject({ type: 'text', text: 'Hello', marks: [{ type: 'bold' }] })
  })

  it('converts heading block back to Tiptap JSON', () => {
    const blocks = [{ id: 'a', type: 'heading', level: 3, text: [{ t: 'H3' }], align: 'left' }]
    const doc = fromBlocks(blocks)
    expect(doc.content[0]).toMatchObject({ type: 'heading', attrs: { level: 3 } })
    expect(doc.content[0].content[0].text).toBe('H3')
  })

  it('converts list block back to bulletList', () => {
    const blocks = [
      {
        id: 'a',
        type: 'list',
        listStyle: 'bullet',
        items: [{ spans: [{ t: 'item' }] }],
        align: 'left',
      },
    ]
    const doc = fromBlocks(blocks)
    expect(doc.content[0].type).toBe('bulletList')
    expect(doc.content[0].content[0].type).toBe('listItem')
    expect(doc.content[0].content[0].content[0].content[0].text).toBe('item')
  })

  it('converts list block back to orderedList', () => {
    const blocks = [
      {
        id: 'a',
        type: 'list',
        listStyle: 'number',
        items: [{ spans: [{ t: 'first' }] }],
        align: 'left',
      },
    ]
    const doc = fromBlocks(blocks)
    expect(doc.content[0].type).toBe('orderedList')
  })

  it('converts quote, code, divider, image back to Tiptap JSON', () => {
    const blocks = [
      { id: '1', type: 'quote', text: [{ t: 'quoted' }], align: 'left' },
      { id: '2', type: 'code', language: 'ts', text: [{ t: 'const x' }], align: 'left' },
      { id: '3', type: 'divider' },
      { id: '4', type: 'image', src: 'https://x.test/i.png', alt: 'alt', caption: 'cap', align: 'center' },
    ]
    const doc = fromBlocks(blocks)
    expect(doc.content[0].type).toBe('blockquote')
    expect(doc.content[1]).toMatchObject({ type: 'codeBlock', attrs: { language: 'ts' } })
    expect(doc.content[2].type).toBe('horizontalRule')
    expect(doc.content[3]).toMatchObject({
      type: 'image',
      attrs: { src: 'https://x.test/i.png', alt: 'alt', title: 'cap', textAlign: 'center' },
    })
  })

  it('handles empty blocks array', () => {
    const doc = fromBlocks([])
    expect(doc.type).toBe('doc')
    expect(doc.content).toEqual([])
  })

  it('handles items as raw span arrays (no spans wrapper)', () => {
    const blocks = [
      {
        id: 'a',
        type: 'list',
        listStyle: 'number',
        items: [[{ t: 'direct' }]],
        align: 'left',
      },
    ]
    const doc = fromBlocks(blocks)
    expect(doc.content[0].content[0].content[0].content[0].text).toBe('direct')
  })
})

describe('blogBlocks: full round-trip', () => {
  it('paragraph → blocks → doc → blocks preserves content', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title', marks: [{ type: 'bold' }] }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Body ', marks: [{ type: 'italic' }] }, { type: 'text', text: 'here' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item 1' }] }] }] },
      ],
    }
    const blocks = toBlocks(doc)
    const back = fromBlocks(blocks)
    const blocks2 = toBlocks(back)
    expect(blocks2).toHaveLength(3)
    expect(blocks2[0].type).toBe('heading')
    expect(blocks2[0].level).toBe(1)
    expect(blocks2[0].text).toHaveLength(1)
    expect(blocks2[0].text[0]).toMatchObject({ t: 'Title', bold: true })
    expect(blocks2[1].text).toHaveLength(2)
    expect(blocks2[1].text[0]).toMatchObject({ t: 'Body ', italic: true })
    expect(blocks2[1].text[1].t).toBe('here')
    expect(blocks2[2].type).toBe('list')
    expect(blocks2[2].listStyle).toBe('bullet')
    expect(blocks2[2].items[0].spans[0].t).toBe('item 1')
  })

  it('image with caption round-trips', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'image', attrs: { src: 'https://x.test/img.png', alt: 'alt text', title: 'My caption' } }],
    }
    const blocks = toBlocks(doc)
    const back = fromBlocks(blocks)
    expect(back.content[0].attrs.title).toBe('My caption')
    expect(back.content[0].attrs.alt).toBe('alt text')
  })

  it('code block with language round-trips', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'codeBlock', attrs: { language: 'python' }, content: [{ type: 'text', text: 'print(1)' }] }],
    }
    const blocks = toBlocks(doc)
    expect(blocks[0].language).toBe('python')
    const back = fromBlocks(blocks)
    expect(back.content[0].attrs.language).toBe('python')
  })
})

describe('blogBlocks: cleanStr', () => {
  it('strips angle-bracket tags but keeps text content', () => {
    expect(cleanStr('<b>bold</b>text')).toBe('boldtext')
  })
  it('handles null/undefined', () => {
    expect(cleanStr(null)).toBe('')
    expect(cleanStr(undefined)).toBe('')
  })
})

describe('blogBlocks: BLOCK_TYPES export', () => {
  it('includes all required block types', () => {
    expect(BLOCK_TYPES).toEqual(['heading', 'paragraph', 'image', 'quote', 'list', 'code', 'divider'])
  })
})
