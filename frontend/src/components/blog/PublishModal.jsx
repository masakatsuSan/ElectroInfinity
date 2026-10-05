import { useState, useEffect } from 'react'
import { X, Send, Hash, FileText, Tag, Image, MessageSquare } from 'lucide-react'

const TOPICS = [
  { value: '', label: 'Select topic...' },
  { value: 'academics', label: 'Academics' },
  { value: 'placements', label: 'Placements' },
  { value: 'projects', label: 'Projects' },
  { value: 'campus-life', label: 'Campus Life' },
  { value: 'tech', label: 'Tech' },
  { value: 'career', label: 'Career' },
]

export default function PublishModal({ isOpen, onClose, onPublish, post, loading }) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [topic, setTopic] = useState('')
  const [allowResponses, setAllowResponses] = useState(true)
  const [cover, setCover] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen && post) {
      setTitle(post.title || '')
      setSubtitle(post.subtitle || '')
      setExcerpt(post.excerpt || '')
      setTags(post.tags || [])
      setTopic(post.topic || '')
      setAllowResponses(post.allowResponses !== false)
      setCover(post.cover || '')
      setErrors({})
    }
  }, [isOpen, post])

  const handleAddTag = (e) => {
    e.preventDefault()
    const val = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (val && !tags.includes(val) && tags.length < 5) {
      setTags([...tags, val])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const validate = () => {
    const errs = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (tags.length === 0) errs.tags = 'Add at least one tag'
    if (tags.length > 5) errs.tags = 'Maximum 5 tags allowed'
    if (!topic) errs.topic = 'Select a topic'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onPublish({
      title: title.trim(),
      subtitle: subtitle.trim(),
      excerpt: excerpt.trim() || title.trim(),
      tags,
      topic,
      allowResponses,
      cover: cover.trim(),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-canvas rounded-2xl shadow-modal border border-divider-soft overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <h2 className="font-sans text-[15px] font-semibold text-ink">Publish Story</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block font-sans text-[13px] font-medium text-ink mb-1.5">
              Title <span className="text-error">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Your story title"
            />
            {errors.title && <p className="font-sans text-[11px] text-error mt-1">{errors.title}</p>}
          </div>

          {/* Subtitle */}
          <div>
            <label className="block font-sans text-[13px] font-medium text-ink mb-1.5">
              Subtitle
            </label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="input w-full"
              placeholder="A short subtitle (optional)"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block font-sans text-[13px] font-medium text-ink mb-1.5">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="input w-full resize-none"
              rows={3}
              placeholder="Auto-filled from first paragraph if left empty"
              maxLength={500}
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block font-sans text-[13px] font-medium text-ink mb-1.5">
              Topic <span className="text-error">*</span>
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input w-full"
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.topic && <p className="font-sans text-[11px] text-error mt-1">{errors.topic}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block font-sans text-[13px] font-medium text-ink mb-1.5">
              Tags <span className="text-error">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-soft border border-hairline text-[13px] font-medium text-ink"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-ink-muted hover:text-ink transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="input flex-1"
                placeholder="Add a tag..."
                maxLength={30}
              />
              <button
                type="submit"
                disabled={!tagInput.trim() || tags.length >= 5}
                className="button-secondary !py-2 !px-4 text-[13px] disabled:opacity-50"
              >
                Add
              </button>
            </form>
            {errors.tags && <p className="font-sans text-[11px] text-error mt-1">{errors.tags}</p>}
            <p className="font-sans text-[11px] text-ink-muted mt-1">{tags.length}/5 tags</p>
          </div>

          {/* Cover */}
          <div>
            <label className="block font-sans text-[13px] font-medium text-ink mb-1.5">
              Cover Image URL
            </label>
            <input
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              className="input w-full"
              placeholder="https://..."
            />
            {cover && (
              <img
                src={cover}
                alt="Cover preview"
                className="w-full h-40 object-cover rounded-lg mt-2 border border-hairline"
              />
            )}
          </div>

          {/* Allow responses */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-ink-muted" />
              <span className="font-sans text-[13px] text-ink">Allow responses</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowResponses(!allowResponses)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                allowResponses ? 'bg-primary' : 'bg-surface-strong'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  allowResponses ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-hairline bg-surface-soft/50">
          <button onClick={onClose} className="button-secondary" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="button-primary">
            <Send size={16} />
            {loading ? 'Publishing...' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
