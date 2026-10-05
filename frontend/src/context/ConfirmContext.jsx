import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ConfirmModal from '../components/ConfirmModal'

const ConfirmContext = createContext(null)

let reqId = 0

export function ConfirmProvider({ children }) {
  const [stack, setStack] = useState([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      const req = { id: ++reqId, config, resolve }
      setStack((prev) => [...prev, req])
    })
  }, [])

  const handleResolve = useCallback((result) => {
    setStack((prev) => {
      if (prev.length === 0) return prev
      const [current, ...rest] = prev
      current.resolve(result)
      return rest
    })
  }, [])

  const current = stack[0]

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {mounted &&
        createPortal(
          <ConfirmModal
            config={current?.config ?? null}
            open={!!current}
            onResolve={handleResolve}
          />,
          document.body
        )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
