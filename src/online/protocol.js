// Chơi nhiều máy qua PeerJS (WebRTC). Máy host giữ toàn bộ ván chơi như chế độ
// một máy, và chỉ gửi cho mỗi máy phần nó được thấy (viewFor), nên từ của
// người khác không bao giờ đi qua mạng tới máy mình.
//
// Tin nhắn máy người chơi → host:
//   { type: 'hello', token }   vừa kết nối, token định danh máy (sessionStorage)
//   { type: 'join', name }     xin vào phòng / đổi tên / nhận lại tên cũ
//   { type: 'seen' }           đã xem từ
//   { type: 'guess', guess }   câu đoán của Mr. White
//   { type: 'ping' }
// Tin nhắn host → máy người chơi:
//   { type: 'view', view }     trạng thái mới
//   { type: 'joinError', error }
//   { type: 'ping' }

import { isAlive, speakingOrder, tokenName, waitingNames } from '../game.js'

export const PING_MS = 4000
export const TIMEOUT_MS = 15000

// Bỏ các ký tự dễ nhầm (0/O, 1/I) để đọc mã phòng cho nhau dễ hơn.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function newRoomCode() {
  let code = ''
  for (let i = 0; i < 5; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return code
}

export function normalizeRoomCode(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export const peerId = (room) => `undercover-v1-${room}`

export function joinUrl(room) {
  return `${location.origin}${location.pathname}?room=${room}`
}

// Phần ván chơi mà máy có token này được thấy.
export function viewFor(game, token) {
  if (!game?.online) return { phase: 'closed' }
  const myName = tokenName(game, token)
  const base = { room: game.online.room, phase: game.phase, names: game.names, myName }
  if (!myName) return { ...base, joined: false }
  // Vào phòng giữa ván: chờ ván sau, chưa được thấy gì của ván đang chơi.
  if (!game.names.includes(myName)) return { ...base, joined: true, waiting: true }
  if (!game.players) return { ...base, joined: true }

  const ended = game.phase === 'ended'
  const me = game.players.find((p) => p.name === myName)
  const lastOut = game.lastOut === null ? null : game.players[game.lastOut]

  return {
    ...base,
    joined: true,
    round: game.round,
    speakingMode: game.settings.speakingOrder,
    order: speakingOrder(game).map((i) => game.players[i].name),
    firstSpeaker: game.players[game.firstSpeaker].name,
    // Vai chỉ công khai khi đã bị loại, hoặc khi ván đã kết thúc.
    players: game.players.map((p) => ({
      name: p.name,
      outRound: p.outRound,
      seen: p.seen,
      role: ended || !isAlive(p) ? p.role : null,
    })),
    me: me ? { name: me.name, word: me.word, alive: isAlive(me), seen: me.seen } : null,
    lastOut: lastOut ? { name: lastOut.name, role: lastOut.role } : null,
    canGuess: game.phase === 'mrWhiteGuess' && lastOut?.name === myName,
    waitingNames: waitingNames(game),
    winner: ended ? game.winner : null,
    words: ended ? game.words : null,
  }
}
