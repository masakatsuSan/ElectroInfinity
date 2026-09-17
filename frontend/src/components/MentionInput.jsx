import { useEffect, useRef, useState } from 'react'
import { searchUsers } from '../api/profile'

const MENTION_BOUNDARY = /(^|[\s([{<"'`])@([A-Za-z0-9_]{0,64})$/

function normalizeHandle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '')
}

function getUserHandle(user) {
  const value = user?.rollNumber || user?.name
  return value ? `@${normalizeHandle(value)}` : ''
}

function findActiveMention(value, cursor) {
  const beforeCursor = String(value || '').slice(0, cursor)
  const match = beforeCursor.match(MENTION_BOUNDARY)
  if (!match) return null

  const query = match[2]
  return {
    query,
    start: beforeCursor.length - query.length - 1,
  }
}

export default function MentionInput({
  value = '',
  onChange,
  placeholder,
  className = '',
  multiline = false,
  excludeUserId,
  ...inputProps
}) {
  const [mention, setMention] = useState(null)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const cursorRef = useRef(value.length)
  const requestRef = useRef(0)
  const closeTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      requestRef.current += 1
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!mention?.query) return undefined

    const requestId = requestRef.current
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsers(mention.query, { limit: 8 })
        if (requestId !== requestRef.current) return

        const users = (res.data.data || []).filter((user) => user._id !== excludeUserId)
        setMention((current) => current?.query === mention.query
          ? { ...current, users, loading: false, selectedIndex: 0 }
          : null)
      } catch {
        if (requestId === requestRef.current) {
          setMention((current) => current?.query === mention.query
            ? { ...current, users: [], loading: false, selectedIndex: 0 }
            : null)
        }
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [mention?.query, excludeUserId])

  const closeMention = () => {
    requestRef.current += 1
    setMention(null)
  }

  const updateCursor = (event) => {
    cursorRef.current = event.currentTarget.selectionStart ?? String(value).length
  }

  const handleChange = (event) => {
    const nextValue = event.target.value
    cursorRef.current = event.currentTarget.selectionStart ?? nextValue.length
    onChange(nextValue)

    const activeMention = findActiveMention(nextValue, cursorRef.current)
    if (activeMention?.query) {
      setMention({ ...activeMention, users: [], loading: true, selectedIndex: 0 })
    } else {
      closeMention()
    }
  }

  const insertMention = (user) => {
    const handle = getUserHandle(user)
    if (!handle || mention == null) return

    const insertion = `${handle} `
    const cursor = cursorRef.current
    const nextValue = `${value.slice(0, mention.start)}${insertion}${value.slice(cursor)}`
    const nextCursor = mention.start + insertion.length
    onChange(nextValue)
    closeMention()

    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  const handleKeyDown = (event) => {
    if (!mention?.users?.length) {
      if (event.key === 'Escape') closeMention()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setMention((current) => ({
        ...current,
        selectedIndex: (current.selectedIndex + 1) % current.users.length,
      }))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setMention((current) => ({
        ...current,
        selectedIndex: (current.selectedIndex - 1 + current.users.length) % current.users.length,
      }))
      return
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      insertMention(mention.users[mention.selectedIndex] || mention.users[0])
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMention()
    }
  }

  const handleBlur = () => {
    closeTimerRef.current = setTimeout(closeMention, 120)
  }

  const inputClassName = `rounded-sm border border-[#dddddd] bg-[#ffffff] px-4 text-[14px] font-normal text-[#181d26] placeholder:text-[#41454d] outline-none focus:border-[#458fff] focus:ring-2 focus:ring-[#458fff]/20 ${className}`

  return (
    <div ref={wrapperRef} className="relative">
      {multiline ? (
        <textarea
          ref={inputRef}
          rows={4}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={updateCursor}
          onClick={updateCursor}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`min-h-[112px] w-full py-3 leading-[1.5] resize-none ${inputClassName}`}
          {...inputProps}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={updateCursor}
          onClick={updateCursor}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`h-11 w-full ${inputClassName}`}
          {...inputProps}
        />
      )}

      {mention?.query && (
        <div className="absolute left-0 right-0 z-[60] mt-1 overflow-hidden rounded-md border border-[#dddddd] bg-[#ffffff] shadow-lg">
          {mention.loading ? (
            <div className="px-4 py-3 text-[13px] text-[#41454d]">Searching users...</div>
          ) : mention.users?.length ? (
            mention.users.map((user, index) => {
              const handle = getUserHandle(user)
              return (
                <button
                  key={user._id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertMention(user)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#f8fafc] ${
                    index === mention.selectedIndex ? 'bg-[#f2f7ff]' : ''
                  }`}
                >
                  {user.photo ? (
                    <img src={user.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e0e2e6] text-[12px] font-medium text-[#41454d]">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[#181d26]">{user.name}</span>
                    {handle && <span className="block truncate text-[11px] text-[#41454d]">{handle}</span>}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="px-4 py-3 text-[13px] text-[#41454d]">No matching users</div>
          )}
        </div>
      )}
    </div>
  )
}

export { getUserHandle, normalizeHandle }
