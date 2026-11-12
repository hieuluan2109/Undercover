import Peer from 'peerjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PING_MS, TIMEOUT_MS, peerId } from './protocol.js'

// Token định danh máy trong phòng. Lưu ở sessionStorage nên tải lại trang vẫn
// giữ, còn mỗi tab là một người (tiện thử nhiều người trên một máy). Mất token
// (đóng tab) thì nhập lại đúng tên cũ để vào lại.
function roomToken(room) {
  const key = `undercover:token:${room}`
  try {
    let token = sessionStorage.getItem(key)
    if (!token) {
      token = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem(key, token)
    }
    return token
  } catch {
    return Math.random().toString(36).slice(2)
  }
}

// Máy người chơi kết nối tới host, tự kết nối lại khi rớt mạng.
// status: 'connecting' | 'open' | 'lost' | 'notFound'
export function useClientRoom(room) {
  const [view, setView] = useState(null)
  const [status, setStatus] = useState('connecting')
  const [joinError, setJoinError] = useState(null)
  const connRef = useRef(null)

  useEffect(() => {
    const token = roomToken(room)
    let closed = false
    let conn = null
    let retryTimer = null
    let lastMessage = Date.now()

    const retry = (nextStatus = 'lost', delay = 2000) => {
      if (closed) return
      connRef.current = null
      setStatus(nextStatus)
      clearTimeout(retryTimer)
      retryTimer = setTimeout(connect, delay)
    }

    function connect() {
      if (closed || peer.destroyed) return
      if (peer.disconnected) {
        peer.reconnect()
        retry('lost', 3000)
        return
      }
      conn?.close()
      const current = peer.connect(peerId(room), { reliable: true })
      conn = current
      current.on('open', () => {
        if (current !== conn) return
        connRef.current = current
        lastMessage = Date.now()
        setStatus('open')
        current.send({ type: 'hello', token })
      })
      current.on('data', (msg) => {
        if (current !== conn) return
        lastMessage = Date.now()
        if (msg?.type === 'view') {
          setView(msg.view)
          if (msg.view.joined) setJoinError(null)
        } else if (msg?.type === 'joinError') {
          setJoinError(msg.error)
        }
      })
      current.on('close', () => {
        if (current === conn) retry()
      })
    }

    const peer = new Peer()
    peer.on('open', connect)
    peer.on('disconnected', () => {
      if (!closed && !peer.destroyed) peer.reconnect()
    })
    peer.on('error', (err) => {
      // Host chưa mở phòng (hoặc đang tải lại trang): thử lại sau.
      if (err.type === 'peer-unavailable') retry('notFound', 3000)
      else if (!peer.open) retry('lost', 3000)
    })

    const pinger = setInterval(() => {
      const current = connRef.current
      if (!current) return
      if (Date.now() - lastMessage > TIMEOUT_MS) {
        conn = null
        current.close()
        retry()
      } else {
        current.send({ type: 'ping' })
      }
    }, PING_MS)

    return () => {
      closed = true
      clearTimeout(retryTimer)
      clearInterval(pinger)
      conn?.close()
      peer.destroy()
    }
  }, [room])

  const send = useCallback((msg) => {
    connRef.current?.send(msg)
  }, [])

  return { view, status, joinError, send }
}
