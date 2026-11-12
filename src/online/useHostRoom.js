import Peer from 'peerjs'
import { useEffect, useRef, useState } from 'react'
import { HOST_TOKEN, checkJoin, tokenName } from '../game.js'
import { PING_MS, TIMEOUT_MS, peerId, viewFor } from './protocol.js'

// Máy host mở phòng với peer id cố định theo mã phòng, nhận kết nối từ các máy
// người chơi và gửi lại cho mỗi máy phần ván chơi của nó sau mỗi thay đổi.
// Trả về { status, connected }: connected là tập token đang kết nối (kể cả host).
export function useHostRoom(game, dispatch) {
  const room = game?.online?.room ?? null
  const [status, setStatus] = useState('opening') // 'opening' | 'open' | 'error'
  const [connected, setConnected] = useState(() => new Set([HOST_TOKEN]))
  const gameRef = useRef(game)
  const entriesRef = useRef(new Set()) // { conn, token, lastSeen }

  useEffect(() => {
    gameRef.current = game
  }, [game])

  useEffect(() => {
    if (!room) return undefined
    let peer = null
    let closed = false
    let retryTimer = null
    const entries = entriesRef.current

    const connectedTokens = () =>
      new Set([HOST_TOKEN, ...[...entries].map((e) => e.token).filter(Boolean)])
    const refresh = () => setConnected(connectedTokens())

    const send = (entry, msg) => {
      if (entry.conn.open) entry.conn.send(msg)
    }

    const drop = (entry) => {
      if (!entries.delete(entry)) return
      entry.conn.close()
      refresh()
    }

    const onMessage = (entry, msg) => {
      const current = gameRef.current
      if (!current?.online) return
      switch (msg?.type) {
        case 'hello': {
          // Một máy chỉ giữ một kết nối: kết nối cũ (thường đã chết) bị bỏ.
          for (const other of entries) if (other !== entry && other.token === msg.token) drop(other)
          entry.token = String(msg.token)
          refresh()
          send(entry, { type: 'view', view: viewFor(current, entry.token) })
          break
        }
        case 'join': {
          if (!entry.token) return
          const error = checkJoin(current, String(msg.name ?? ''), entry.token, connectedTokens())
          if (error) send(entry, { type: 'joinError', error })
          else dispatch({ type: 'onlineJoin', name: String(msg.name), token: entry.token })
          break
        }
        case 'seen': {
          const index = current.players?.findIndex((p) => p.name === tokenName(current, entry.token))
          if (index >= 0) dispatch({ type: 'markSeenBy', index })
          break
        }
        case 'guess': {
          const { phase, players, lastOut } = current
          if (phase !== 'mrWhiteGuess' || players[lastOut].name !== tokenName(current, entry.token)) return
          dispatch({ type: 'mrWhiteGuess', guess: String(msg.guess ?? '') })
          break
        }
        default:
      }
    }

    const accept = (conn) => {
      const entry = { conn, token: null, lastSeen: Date.now() }
      entries.add(entry)
      conn.on('data', (msg) => {
        entry.lastSeen = Date.now()
        onMessage(entry, msg)
      })
      conn.on('close', () => drop(entry))
      conn.on('error', () => drop(entry))
    }

    const open = () => {
      if (closed) return
      setStatus('opening')
      peer = new Peer(peerId(room))
      peer.on('open', () => setStatus('open'))
      peer.on('connection', accept)
      peer.on('disconnected', () => {
        if (!closed && !peer.destroyed) peer.reconnect()
      })
      peer.on('error', (err) => {
        // Tải lại trang thì id cũ có thể còn bị giữ vài giây trên máy chủ PeerJS.
        if (['unavailable-id', 'network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
          setStatus(err.type === 'unavailable-id' ? 'opening' : 'error')
          peer.destroy()
          clearTimeout(retryTimer)
          retryTimer = setTimeout(open, 3000)
        }
      })
    }

    // Ping định kỳ để cả hai bên phát hiện kết nối chết (WebRTC trên điện
    // thoại thường không báo 'close' khi khóa màn hình hay đổi mạng).
    const pinger = setInterval(() => {
      const now = Date.now()
      for (const entry of [...entries]) {
        if (now - entry.lastSeen > TIMEOUT_MS) drop(entry)
        else send(entry, { type: 'ping' })
      }
    }, PING_MS)

    open()
    return () => {
      closed = true
      clearTimeout(retryTimer)
      clearInterval(pinger)
      for (const entry of entries) entry.conn.close()
      entries.clear()
      peer?.destroy()
      setConnected(new Set([HOST_TOKEN]))
    }
  }, [room, dispatch])

  // Gửi phần ván chơi mới cho từng máy sau mỗi thay đổi.
  useEffect(() => {
    if (!game?.online) return
    for (const entry of entriesRef.current) {
      if (entry.token && entry.conn.open) entry.conn.send({ type: 'view', view: viewFor(game, entry.token) })
    }
  }, [game, connected])

  return { status, connected }
}
