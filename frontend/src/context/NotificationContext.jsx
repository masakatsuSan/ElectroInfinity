import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { getSocketUrl } from '../utils/socket'
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../api/notifications'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const socketRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const res = await getUnreadCount()
      setUnreadCount(res.data.data?.count || 0)
    } catch (err) {
      console.error('Failed to fetch unread count:', err.message)
    }
  }, [user])

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!user) return
    try {
      setLoading(true)
      const res = await getNotifications({ page: pageNum, limit: 20 })
      const newNotifications = res.data.data || []
      const count = res.data.unreadCount ?? unreadCount

      if (append) {
        setNotifications((prev) => [...prev, ...newNotifications])
      } else {
        setNotifications(newNotifications)
      }
      setUnreadCount(count)
      setHasMore(pageNum < (res.data.pagination?.totalPages || 1))
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message)
    } finally {
      setLoading(false)
    }
  }, [user, unreadCount])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true)
    }
  }, [loading, hasMore, page, fetchNotifications])

  const markRead = useCallback(async (id) => {
    try {
      const res = await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount(res.data.data?.unreadCount ?? Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Failed to mark notification read:', err.message)
    }
  }, [unreadCount])

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications read:', err.message)
    }
  }, [])

  const removeNotification = useCallback(async (id) => {
    try {
      const res = await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n._id !== id))
      setUnreadCount(res.data.data?.unreadCount ?? unreadCount)
    } catch (err) {
      console.error('Failed to delete notification:', err.message)
    }
  }, [unreadCount])

  // Initialize socket connection for real-time notifications
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const token = localStorage.getItem('ei_token')
    if (!token) return

    const socket = io(getSocketUrl(), { auth: { token } })
    socketRef.current = socket

    socket.on('notification:new', (data) => {
      setUnreadCount(data.unreadCount ?? unreadCount + 1)
      if (data.notification) {
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === data.notification._id)
          if (exists) return prev
          return [data.notification, ...prev]
        })
      }
    })

    socket.on('notification:count', (count) => {
      setUnreadCount(count)
    })

    socket.emit('join-notifications', user._id)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  // Fetch initial data when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications(1, false)
    }
  }, [user, fetchNotifications])

  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    loadMore,
    markRead,
    markAllRead,
    removeNotification,
    fetchUnreadCount,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return ctx
}
