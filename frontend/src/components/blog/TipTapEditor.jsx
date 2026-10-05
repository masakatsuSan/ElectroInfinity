import { useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Typography } from '@tiptap/extension-typography'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import { uploadBlogImage } from '../../api/posts'
import { fromBlocks, toBlocks } from '../../utils/blogBlocks'

const DRAG_HANDLE_CLASS = 'ei-drag-handle'
const DRAG_OVER_CLASS = 'ei-drag-over'

const BLOCK_INSERT_OPTIONS = [
  { type: 'paragraph', label: 'Paragraph', icon: '¶' },
  { type: 'heading', label: 'Heading', icon: 'H1' },
  { type: 'quote', label: 'Quote', icon: '"' },
  { type: 'bulletList', label: 'List', icon: '•' },
  { type: 'codeBlock', label: 'Code', icon: '</>' },
  { type: 'horizontalRule', label: 'Divider', icon: '—' },
  { type: 'image', label: 'Image', icon: '🖼' },
]

function DragHandleSVG() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ink-muted/40 hover:text-ink-muted"
    >
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="12" cy="9" r="1" />
      <circle cx="12" cy="15" r="1" />
    </svg>
  )
}

function insertBlockNode(editor, type) {
  const blockJsonMap = {
    paragraph: { type: 'paragraph' },
    heading: { type: 'heading', attrs: { level: 2 } },
    quote: { type: 'blockquote', content: [{ type: 'paragraph' }] },
    codeBlock: { type: 'codeBlock' },
    horizontalRule: { type: 'horizontalRule' },
  }

  if (type === 'image') return

  const node = blockJsonMap[type]
  if (!node) return

  editor.commands.insertContent(node)
}

export default function TipTapEditor({ content = [], onChange, placeholder = 'Write your story…', className = '' }) {
  const fileInputRef = useRef(null)
  const skipUpdateRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: { HTMLAttributes: { class: 'my-6 border-t border-hairline' } },
        codeBlock: {
          HTMLAttributes: {
            class: 'not-prose rounded-lg bg-surface-soft p-4 font-mono text-[13px] text-ink whitespace-pre-wrap break-words',
          },
        },
        blockquote: {
          HTMLAttributes: { class: 'border-l-4 border-border-strong bg-surface-soft py-2 pl-4 italic' },
        },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-6 space-y-1' } },
        listItem: { HTMLAttributes: { class: 'mb-1' } },
      }),
      Underline,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg border border-hairline' },
      }),
      Placeholder.configure({
        placeholder: () => placeholder,
      }),
      Typography,
    ],
    content: fromBlocks(content),
    onUpdate: ({ editor }) => {
      if (skipUpdateRef.current) return
      const blocks = toBlocks(editor.getJSON())
      onChange(blocks)
    },
  })

  useEffect(() => {
    if (!editor) return

    const currentJSON = JSON.stringify(editor.getJSON())
    const targetJSON = JSON.stringify(fromBlocks(content))
    if (currentJSON !== targetJSON) {
      skipUpdateRef.current = true
      editor.commands.setContent(fromBlocks(content), false, { preserveMarks: false })
      skipUpdateRef.current = false
    }
  }, [content, editor])

  const setupDragHandles = useCallback(() => {
    if (!editor) return

    const dom = editor.view.dom
    const existingHandles = dom.querySelectorAll(`.${DRAG_HANDLE_CLASS}`)
    existingHandles.forEach((h) => {
      h.removeEventListener('dragstart', h._eiDragStart)
      h.removeEventListener('dragover', h._eiDragOver)
      h.removeEventListener('drop', h._eiDrop)
      h.removeEventListener('dragend', h._eiDragEnd)
      h.remove()
    })

    const wrappers = dom.querySelectorAll('.ei-drag-wrapper')
    wrappers.forEach((w) => {
      const child = w.firstElementChild
      if (child) w.parentNode?.insertBefore(child, w)
      w.remove()
    })

    const children = Array.from(dom.children || [])
    let blockIndex = 0

    children.forEach((child) => {
      if (child.nodeType !== 1) return

      const isEditorContent = child.classList.contains('is-editor-empty') || child.textContent !== undefined

      const draggable = child.classList.contains('prose-hr') ||
        child.classList.contains('prose-blockquote') ||
        child.classList.contains('prose-code') ||
        child.classList.contains('prose-h1') ||
        child.classList.contains('prose-h2') ||
        child.classList.contains('prose-h3') ||
        child.tagName === 'P' ||
        child.tagName === 'UL' ||
        child.tagName === 'OL' ||
        child.tagName === 'IMG'

      if (draggable) {
        const wrapper = document.createElement('div')
        wrapper.className = 'ei-drag-wrapper'
        wrapper.style.display = 'flex'
        wrapper.style.alignItems = 'flex-start'
        wrapper.style.gap = '6px'

        const handle = document.createElement('div')
        handle.className = DRAG_HANDLE_CLASS
        handle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="cursor:grab" class="text-ink-muted/40 hover:text-ink-muted"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="12" cy="9" r="1"/><circle cx="12" cy="15" r="1"/></svg>'
        handle.draggable = true
        handle.title = 'Drag to reorder'

        const idx = blockIndex
        handle._eiDragStart = (e) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('application/json', JSON.stringify({ from: idx }))
        }
        handle._eiDragOver = (e) => {
          e.preventDefault()
          if (e.dataTransfer.effectAllowed === 'move') {
            e.dataTransfer.dropEffect = 'move'
            const otherHandles = dom.querySelectorAll(`.${DRAG_HANDLE_CLASS}`)
            otherHandles.forEach((h) => h.classList.remove(DRAG_OVER_CLASS))
            handle.classList.add(DRAG_OVER_CLASS)
          }
        }
        handle._eiDrop = (e) => {
          e.preventDefault()
          const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}')
          const fromIdx = data.from
          const toIdx = idx

          const otherHandles = dom.querySelectorAll(`.${DRAG_HANDLE_CLASS}`)
          otherHandles.forEach((h) => h.classList.remove(DRAG_OVER_CLASS))

          if (fromIdx === null || fromIdx === toIdx) return

          const json = editor.getJSON()
          const blocks = toBlocks(json)
          if (blocks.length === 0 || fromIdx >= blocks.length || toIdx >= blocks.length) return

          const [moved] = blocks.splice(fromIdx, 1)
          blocks.splice(toIdx, 0, moved)

          const newJson = fromBlocks(blocks)
          skipUpdateRef.current = true
          editor.commands.setContent(newJson, false, { preserveMarks: false })
          skipUpdateRef.current = false
          onChange(blocks)
        }
        handle._eiDragEnd = () => {
          const otherHandles = dom.querySelectorAll(`.${DRAG_HANDLE_CLASS}`)
          otherHandles.forEach((h) => h.classList.remove(DRAG_OVER_CLASS))
        }

        handle.addEventListener('dragstart', handle._eiDragStart)
        handle.addEventListener('dragover', handle._eiDragOver)
        handle.addEventListener('drop', handle._eiDrop)
        handle.addEventListener('dragend', handle._eiDragEnd)

        wrapper.appendChild(handle)
        dom.replaceChild(wrapper, child)
        wrapper.appendChild(child)

        blockIndex++
      }
    })
  }, [editor, onChange])

  useEffect(() => {
    if (!editor) return
    setupDragHandles()
    editor.on('update', setupDragHandles)
    return () => {
      editor.off('update', setupDragHandles)
      if (editor) {
        const dom = editor.view.dom
        const handles = dom.querySelectorAll(`.${DRAG_HANDLE_CLASS}`)
        handles.forEach((h) => {
          h.removeEventListener('dragstart', h._eiDragStart)
          h.removeEventListener('dragover', h._eiDragOver)
          h.removeEventListener('drop', h._eiDrop)
          h.removeEventListener('dragend', h._eiDragEnd)
          h.remove()
        })
      }
    }
  }, [editor, setupDragHandles])

  const addBlock = useCallback(
    (type) => {
      if (!editor) return
      if (type === 'image') {
        fileInputRef.current?.click()
        return
      }

      insertBlockNode(editor, type)
      editor.commands.focus()
    },
    [editor],
  )

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return

      try {
        const formData = new FormData()
        formData.append('image', file)
        const res = await uploadBlogImage(formData)
        const url = res.data?.url || res.data?.path

        if (url) {
          editor.chain().focus().setImage({ src: url, alt: file.name, title: '' }).run()
        }
      } catch (err) {
        console.error('Image upload failed:', err)
      }
    },
    [editor],
  )

  if (!editor) return null

  return (
    <div className={`tiptap-editor-wrapper ${className}`}>
      <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />

      <div className="border border-divider-soft rounded-lg bg-canvas mb-3 p-2 flex flex-wrap gap-1 overflow-x-auto">
        {BLOCK_INSERT_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => addBlock(opt.type)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md text-ink-muted hover:text-ink hover:bg-soft-stone transition-colors flex-shrink-0"
            title={`Insert ${opt.label.toLowerCase()}`}
          >
            <span className="text-xs w-4 h-4 flex items-center justify-center">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      <BubbleMenu
        editor={editor}
        tippyOptions={{
          duration: [100, 100],
          offset: [10, 10],
          zIndex: 100,
        }}
        className="flex items-center gap-1 bg-canvas border border-divider-soft rounded-lg shadow-lg p-1 text-ink"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold') ? 'true' : 'false'}
          className="data-[active=true]:bg-primary data-[active=true]:text-on-primary p-1.5 rounded hover:bg-soft-stone transition-all"
          title="Bold"
        >
          <strong className="text-[13px] font-bold">B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive('italic') ? 'true' : 'false'}
          className="data-[active=true]:bg-primary data-[active=true]:text-on-primary p-1.5 rounded hover:bg-soft-stone transition-all"
          title="Italic"
        >
          <em className="text-[13px]">I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          data-active={editor.isActive('underline') ? 'true' : 'false'}
          className="data-[active=true]:bg-primary data-[active=true]:text-on-primary p-1.5 rounded hover:bg-soft-stone transition-all"
          title="Underline"
        >
          <u className="text-[13px]">U</u>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          data-active={editor.isActive('code') ? 'true' : 'false'}
          className="data-[active=true]:bg-primary data-[active=true]:text-on-primary p-1.5 rounded hover:bg-soft-stone transition-all font-mono"
          title="Inline code"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          onClick={async () => {
            const url = window.prompt('Enter URL', 'https://')
            if (url === null) return
            if (url.trim()) {
              editor.chain().focus().setLink({ href: url.trim() }).run()
            } else if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run()
            }
          }}
          data-active={editor.isActive('link') ? 'true' : 'false'}
          className="data-[active=true]:bg-primary data-[active=true]:text-on-primary p-1.5 rounded hover:bg-soft-stone transition-all"
          title="Link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.76l1-1a5 5 0 0 0-7.36-7.36L9 9.17"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.76l-1 1a5 5 0 0 0 7.36 7.36l.14-.13"></path>
          </svg>
        </button>

        <div className="w-px h-5 bg-divider-soft mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          data-active={editor.isActive({ textAlign: 'left' }) ? 'true' : 'false'}
          className="data-[active=true]:bg-primary data-[active=true]:text-on-primary p-1.5 rounded hover:bg-soft-stone transition-all"
          title="Align left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          data-active={editor.isActive({ textAlign: 'center' }) ? 'true' : 'false'}
          className="data-[active=true]:bg-primary data-[active=true]:text-on-primary p-1.5 rounded hover:bg-soft-stone transition-all"
          title="Align center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="6" y1="6" x2="18" y2="6"></line>
            <line x1="6" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="18" x2="18" y2="18"></line>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          data-active={editor.isActive({ textAlign: 'right' }) ? 'true' : 'false'}
          className="data-[active=true]:bg-primary data-[active=true]:text-on-primary p-1.5 rounded hover:bg-soft-stone transition-all"
          title="Align right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </BubbleMenu>

      <div className="border border-divider-soft rounded-lg bg-canvas min-h-[300px] p-4 prose prose-sm max-w-none focus-within:border-primary transition-colors">
        <EditorContent editor={editor} className="focus:outline-none" />
      </div>
    </div>
  )
}
