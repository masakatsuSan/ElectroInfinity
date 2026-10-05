import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Typography } from '@tiptap/extension-typography'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { uploadBlogImage } from '../../api/posts'
import { fromBlocks, toBlocks } from '../../utils/blogBlocks'
import { ChevronLeft, Send, MoreHorizontal, Image as ImageIcon, Type, Heading1, List, Quote, Code, Minus, Link2, Bold, Italic, Underline as UnderlineIcon } from 'lucide-react'

const lowlight = createLowlight(common)

const SLASH_ITEMS = [
  { type: 'paragraph', label: 'Text', description: 'Just start writing with plain text.', icon: Type },
  { type: 'heading', label: 'Heading', description: 'Big section heading.', icon: Heading1 },
  { type: 'bulletList', label: 'Bulleted List', description: 'Create a simple bullet list.', icon: List },
  { type: 'codeBlock', label: 'Code Block', description: 'Capture a code snippet.', icon: Code },
  { type: 'quote', label: 'Quote', description: 'Capture a quote.', icon: Quote },
  { type: 'horizontalRule', label: 'Divider', description: 'Visually divide blocks.', icon: Minus },
  { type: 'image', label: 'Image', description: 'Upload an image from your device.', icon: ImageIcon },
]

const PLACEHOLDER = 'Write your story…'

function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active ? 'true' : 'false'}
      title={title}
      className="data-[active=true]:text-primary text-ink-muted hover:text-primary p-1.5 rounded transition-colors"
    >
      {children}
    </button>
  )
}

export default function TipTapEditor({
  content = [],
  onChange,
  title = '',
  subtitle = '',
  onTitleChange,
  onSubtitleChange,
  placeholder = PLACEHOLDER,
  className = '',
  saveStatus = 'Saved',
  onSaveStatusChange,
  onPublish,
  onBack,
  readOnly = false,
}) {
  const fileInputRef = useRef(null)
  const skipUpdateRef = useRef(false)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashPosition, setSlashPosition] = useState(null)
  const [slashFilter, setSlashFilter] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showMobileToolbar, setShowMobileToolbar] = useState(false)
  const [plusMenu, setPlusMenu] = useState({ show: false, top: 0, left: 0 })
  const menuRef = useRef(null)
  const titleRef = useRef(null)
  const plusMenuRef = useRef(null)
  const editorWrapperRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: { HTMLAttributes: { class: 'my-8 border-t border-hairline' } },
        codeBlock: false,
        code: { HTMLAttributes: { class: 'font-mono text-[13px] bg-surface-soft text-ink/80 rounded px-1.5 py-0.5' } },
        blockquote: {
          HTMLAttributes: { class: 'border-l-4 border-border-strong bg-surface-soft py-3 pl-5 italic my-6' },
        },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-6 space-y-2 my-4' } },
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
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg border border-hairline my-4' },
      }),
      Placeholder.configure({
        placeholder: () => placeholder,
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: {
          class: 'not-prose rounded-lg bg-surface-soft p-4 font-mono text-[13px] text-ink whitespace-pre-wrap break-words my-4',
        },
      }),
    ],
    content: fromBlocks(content),
    editable: !readOnly,
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of items) {
          if (item.type.indexOf('image') !== -1) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) return true
            const formData = new FormData()
            formData.append('image', file)
            uploadBlogImage(formData)
              .then((res) => {
                const url = res.data?.url || res.data?.path
                if (url && view) {
                  const { schema } = view.state
                  const node = schema.nodes.image.create({ src: url, alt: file.name })
                  const tr = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(tr)
                }
              })
              .catch((err) => console.error('Image paste failed:', err))
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      if (skipUpdateRef.current) return
      const blocks = toBlocks(editor.getJSON())
      onChange(blocks)
      scheduleAutosave()
    },
  })

  // Autosave with debounce
  const autosaveTimerRef = useRef(null)
  const scheduleAutosave = useCallback(() => {
    if (onSaveStatusChange) onSaveStatusChange('Saving...')
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      if (onSaveStatusChange) onSaveStatusChange('Saved')
    }, 2000)
  }, [onSaveStatusChange])

  // Save to localStorage on changes
  useEffect(() => {
    if (!editor) return
    const state = { title, subtitle, blocks: toBlocks(editor.getJSON()), savedAt: Date.now() }
    try {
      localStorage.setItem('ei_blog_draft', JSON.stringify(state))
    } catch {}
  }, [title, subtitle, content, editor])

  // Load from localStorage on mount
  useEffect(() => {
    if (!editor) return
    try {
      const saved = localStorage.getItem('ei_blog_draft')
      if (saved) {
        const state = JSON.parse(saved)
        if (state.title && onTitleChange) onTitleChange(state.title)
        if (state.subtitle && onSubtitleChange) onSubtitleChange(state.subtitle)
        if (state.blocks && state.blocks.length && !content.length) {
          skipUpdateRef.current = true
          editor.commands.setContent(fromBlocks(state.blocks), false, { preserveMarks: false })
          skipUpdateRef.current = false
          onChange(state.blocks)
        }
      }
    } catch {}
  }, [editor])

  // Sync external content changes
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

  // Word count and read time
  const { words, minutes } = useMemo(() => {
    if (!editor) return { words: 0, minutes: 0 }
    const text = editor.getText()
    const w = text.split(/\s+/).filter(Boolean).length
    return { words: w, minutes: Math.max(1, Math.round(w / 200)) }
  }, [editor, content, title, subtitle])

  // Handle title keydown - Enter moves to body
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      editor?.commands.focus()
    }
  }

  // Handle link
  const handleLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href || 'https://'
    const url = window.prompt('Enter URL', previousUrl)
    if (url === null) return
    if (url.trim()) {
      editor.chain().focus().setLink({ href: url.trim() }).run()
    } else if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
    }
  }, [editor])

  // Image upload
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

  // Drag and drop
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (!file || !editor) return
    const formData = new FormData()
    formData.append('image', file)
    uploadBlogImage(formData)
      .then((res) => {
        const url = res.data?.url || res.data?.path
        if (url) {
          editor.chain().focus().setImage({ src: url, alt: file.name, title: '' }).run()
        }
      })
      .catch((err) => console.error('Image upload failed:', err))
  }

  // Slash commands
  useEffect(() => {
    if (!editor) return
    const updateSlash = () => {
      const { state } = editor
      const { $from } = state.selection
      const currentLine = $from.nodeBefore?.text || $from.nodeAfter?.text || ''
      const lastSlash = currentLine.lastIndexOf('/')
      if (lastSlash === -1) {
        setSlashOpen(false)
        setSlashFilter('')
        return
      }
      const afterSlash = currentLine.slice(lastSlash + 1)
      const spaceAfterSlash = afterSlash.includes(' ')
      if (spaceAfterSlash) {
        setSlashOpen(false)
        setSlashFilter('')
        return
      }
      const coords = editor.view.coordsAtPos($from.pos - afterSlash.length)
      setSlashOpen(true)
      setSlashPosition({ top: coords.bottom + 4, left: coords.left })
      setSlashFilter(afterSlash)
    }
    editor.on('update', updateSlash)
    return () => editor.off('update', updateSlash)
  }, [editor])

  // "+" inserter: show on empty paragraphs (Medium-style)
  const updatePlusMenu = useCallback(() => {
    if (!editor) return
    const { state } = editor
    const { $from, empty } = state.selection
    const parent = $from.parent
    const isEmptyParagraph =
      parent.type.name === 'paragraph' &&
      parent.content.size === 0 &&
      $from.parentOffset === 0

    if (isEmptyParagraph && empty) {
      const wrapper = editorWrapperRef.current
      if (!wrapper) {
        setPlusMenu({ show: false, top: 0, left: 0 })
        return
      }
      const coords = editor.view.coordsAtPos($from.pos)
      const rect = wrapper.getBoundingClientRect()
      setPlusMenu({
        show: true,
        top: coords.top - rect.top - 8,
        left: coords.left - rect.left - 36,
      })
    } else {
      setPlusMenu({ show: false, top: 0, left: 0 })
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    editor.on('update', updatePlusMenu)
    editor.on('selectionUpdate', updatePlusMenu)
    updatePlusMenu()
    return () => {
      editor.off('update', updatePlusMenu)
      editor.off('selectionUpdate', updatePlusMenu)
    }
  }, [editor, updatePlusMenu])

  const filteredSlashItems = useMemo(() => {
    const q = slashFilter.trim().toLowerCase()
    if (!q) return SLASH_ITEMS
    return SLASH_ITEMS.filter((item) => item.label.toLowerCase().includes(q) || item.type.includes(q))
  }, [slashFilter])

  const handleSlashSelect = (type) => {
    if (!editor) return
    const { state } = editor
    const { $from } = state.selection
    const currentLine = $from.nodeBefore?.text || ''
    const lastSlash = currentLine.lastIndexOf('/')
    if (lastSlash >= 0) {
      const start = $from.pos - currentLine.length + lastSlash
      editor.chain().focus().deleteRange({ from: start, to: $from.pos }).run()
    }
    setSlashOpen(false)
    setSlashFilter('')
    insertNode(type)
  }

  const insertNode = useCallback(
    (type) => {
      if (!editor) return
      if (type === 'image') {
        fileInputRef.current?.click()
        return
      }

      const blockJsonMap = {
        paragraph: { type: 'paragraph' },
        heading: { type: 'heading', attrs: { level: 2 } },
        quote: { type: 'blockquote', content: [{ type: 'paragraph' }] },
        bulletList: {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
        },
        codeBlock: { type: 'codeBlock' },
        horizontalRule: { type: 'horizontalRule' },
      }

      const node = blockJsonMap[type]
      if (node) {
        editor.chain().focus().insertContent(node).run()
      }
    },
    [editor],
  )

  // Active formats
  const activeFormats = useMemo(() => {
    if (!editor) return {}
    return {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      code: editor.isActive('code'),
      link: editor.isActive('link'),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      quote: editor.isActive('blockquote'),
      codeBlock: editor.isActive('codeBlock'),
    }
  }, [editor, editor?.isActive])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleLink()
      }
      if (e.key === 'Escape') {
        setSlashOpen(false)
        setShowMenu(false)
      }
    }
    editor.view.dom.addEventListener('keydown', handleKeyDown)
    return () => editor.view.dom.removeEventListener('keydown', handleKeyDown)
  }, [editor, handleLink])

  if (!editor) return null

  return (
    <div className={`ei-medium-editor relative ${className}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Minimal top bar */}
      {onBack && (
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
            title="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-ink-muted font-sans">{saveStatus}</span>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
                title="More options"
              >
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-divider-soft bg-canvas shadow-modal py-2 z-50">
                  <div className="px-3 pb-2 pt-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Statistics</p>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-[13px] text-ink">Words</span>
                    <span className="text-[13px] font-medium text-ink-muted">{words.toLocaleString()}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-[13px] text-ink">Read time</span>
                    <span className="text-[13px] font-medium text-ink-muted">{minutes} min read</span>
                  </div>
                  <div className="h-px bg-divider-soft my-2" />
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      onPublish?.()
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] text-ink hover:bg-surface-soft transition-colors flex items-center gap-2"
                  >
                    <Send size={14} />
                    Publish
                  </button>
                </div>
              )}
            </div>
            {onPublish && (
              <button
                onClick={onPublish}
                className="button-primary !py-2 !px-4 text-[13px]"
              >
                Publish
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor column */}
      <div className="max-w-[680px] mx-auto">
        {/* Title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          placeholder="Title"
          className="w-full font-serif text-display-lg text-ink placeholder:text-ink-muted/40 bg-transparent border-none outline-none mb-3 leading-[1.15] tracking-[0]"
          readOnly={readOnly}
        />

        {/* Subtitle */}
        <input
          type="text"
          value={subtitle}
          onChange={(e) => onSubtitleChange?.(e.target.value)}
          placeholder="Subtitle (optional)"
          className="w-full font-serif text-body-large text-ink-muted placeholder:text-ink-muted/40 bg-transparent border-none outline-none mb-8 leading-[1.4]"
          readOnly={readOnly}
        />

        {/* TipTap editor */}
        <div
          ref={editorWrapperRef}
          className="transition-colors relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <EditorContent
            editor={editor}
            className="focus:outline-none [&_.tiptap]:min-h-[300px] [&_.tiptap]:text-[20px] [&_.tiptap]:leading-[1.7] [&_.tiptap]:text-ink [&_.tiptap]:font-serif"
          />

          {/* "+" inserter on empty line */}
          {plusMenu.show && (
            <div
              ref={plusMenuRef}
              className="absolute z-50 flex items-center"
              style={{ top: plusMenu.top, left: plusMenu.left }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-1.5 bg-canvas border border-divider-soft rounded-full shadow-modal p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenu({ show: false, top: 0, left: 0 })
                    insertNode('image')
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-primary hover:bg-surface-soft transition-colors"
                  title="Insert Image"
                >
                  <ImageIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenu({ show: false, top: 0, left: 0 })
                    insertNode('heading')
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-primary hover:bg-surface-soft transition-colors"
                  title="Heading"
                >
                  <Heading1 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenu({ show: false, top: 0, left: 0 })
                    insertNode('bulletList')
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-primary hover:bg-surface-soft transition-colors"
                  title="Bulleted List"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenu({ show: false, top: 0, left: 0 })
                    insertNode('quote')
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-primary hover:bg-surface-soft transition-colors"
                  title="Quote"
                >
                  <Quote size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenu({ show: false, top: 0, left: 0 })
                    insertNode('codeBlock')
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-primary hover:bg-surface-soft transition-colors"
                  title="Code Block"
                >
                  <Code size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenu({ show: false, top: 0, left: 0 })
                    insertNode('horizontalRule')
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-primary hover:bg-surface-soft transition-colors"
                  title="Divider"
                >
                  <Minus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bubble menu */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150, zIndex: 50 }}
        className="flex items-center gap-0.5 bg-canvas border border-divider-soft rounded-full shadow-modal px-1.5 py-1 text-ink"
      >
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={activeFormats.bold} title="Bold (Ctrl+B)">
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={activeFormats.italic} title="Italic (Ctrl+I)">
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={activeFormats.underline} title="Underline">
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <div className="w-px h-5 bg-divider-soft mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={activeFormats.h2} title="Heading 2">
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={handleLink} active={activeFormats.link} title="Link (Ctrl+K)">
          <Link2 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={activeFormats.quote} title="Quote">
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={activeFormats.codeBlock} title="Code block">
          <Code size={14} />
        </ToolbarButton>
      </BubbleMenu>

      {/* Slash command menu */}
      {slashOpen && (
        <div
          className="ei-slash-menu fixed z-50 w-72 max-h-72 overflow-y-auto rounded-xl border border-divider-soft bg-canvas shadow-modal py-2"
          style={{ top: slashPosition?.top, left: slashPosition?.left }}
        >
          <div className="px-3 pb-2 pt-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Basic Blocks</p>
          </div>
          {filteredSlashItems.length === 0 && (
            <p className="px-3 pb-2 text-[13px] text-ink-muted">No results found.</p>
          )}
          {filteredSlashItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleSlashSelect(item.type)}
                className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-surface-soft transition-colors"
              >
                <span className="text-ink-muted">
                  <Icon size={16} />
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-medium text-ink">{item.label}</span>
                  <span className="block text-[11px] text-ink-muted leading-tight">{item.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Drag and drop overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-canvas/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-primary bg-surface-soft">
            <ImageIcon size={32} className="text-primary" />
            <p className="text-sm font-medium text-ink">Drop image to upload</p>
          </div>
        </div>
      )}
    </div>
  )
}
