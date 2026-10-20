// Luật và trạng thái ván chơi. Chỉ chứa hàm thuần (trừ việc bốc cặp từ),
// để App.jsx chỉ việc gọi reducer.

import { WORD_PAIRS } from './words.js'
import { KEYS, load, save } from './storage.js'

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 20

export const ROLE = {
  civilian: 'civilian',
  undercover: 'undercover',
  mrWhite: 'mrWhite',
}

export const ROLE_LABEL = {
  civilian: 'Dân thường',
  undercover: 'Undercover',
  mrWhite: 'Mr. White',
}

export const WINNER_LABEL = {
  civilian: 'Dân thường thắng!',
  infiltrators: 'Kẻ xâm nhập thắng!',
  mrWhite: 'Mr. White thắng!',
}

export const DEFAULT_SETTINGS = {
  speakingOrder: 'first', // 'first' = chỉ người nói đầu, 'full' = cả thứ tự
  allowMrWhiteFirst: false,
}

// ---------- Người chơi ----------

export function normalizeName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

// Trả về lý do không thêm được, hoặc null nếu hợp lệ.
export function validateNewName(name, names) {
  const clean = normalizeName(name)
  if (!clean) return 'Tên không được để trống.'
  if (names.length >= MAX_PLAYERS) return `Tối đa ${MAX_PLAYERS} người.`
  const lower = clean.toLocaleLowerCase('vi')
  if (names.some((n) => n.toLocaleLowerCase('vi') === lower)) {
    return `"${clean}" đã có trong danh sách.`
  }
  return null
}

// ---------- Số vai ----------

export function suggestCounts(total) {
  return { undercover: 1, mrWhite: total >= 5 ? 1 : 0 }
}

export function civilianCount(total, counts) {
  return total - counts.undercover - counts.mrWhite
}

// Trả về lý do không bắt đầu được, hoặc null nếu hợp lệ.
export function validateCounts(total, counts) {
  if (counts.undercover + counts.mrWhite < 1) {
    return 'Cần ít nhất 1 Undercover hoặc 1 Mr. White.'
  }
  if (civilianCount(total, counts) < 2) {
    return 'Cần ít nhất 2 Dân thường, nếu không ván sẽ kết thúc ngay.'
  }
  return null
}

// ---------- Bắt đầu ván ----------

function randomInt(n) {
  return Math.floor(Math.random() * n)
}

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Ghi nhớ vị trí ở chế độ "Lần lượt" tách khỏi ván chơi (APP_FLOW 3.4).
function pickPair(pairMode) {
  if (pairMode === 'sequential') {
    const last = load(KEYS.lastPair, -1)
    const next = (last + 1) % WORD_PAIRS.length
    save(KEYS.lastPair, next)
    return WORD_PAIRS[next]
  }
  return WORD_PAIRS[randomInt(WORD_PAIRS.length)]
}

function canSpeakFirst(player, settings) {
  return settings.allowMrWhiteFirst || player.role !== ROLE.mrWhite
}

export function createGame({ names, counts, pairMode, settings }) {
  const pair = pickPair(pairMode)
  const civilianFirst = Math.random() < 0.5
  const words = {
    civilian: civilianFirst ? pair[0] : pair[1],
    undercover: civilianFirst ? pair[1] : pair[0],
  }

  const roles = shuffle([
    ...Array(counts.undercover).fill(ROLE.undercover),
    ...Array(counts.mrWhite).fill(ROLE.mrWhite),
    ...Array(civilianCount(names.length, counts)).fill(ROLE.civilian),
  ])

  const players = names.map((name, i) => ({
    name,
    role: roles[i],
    word:
      roles[i] === ROLE.civilian
        ? words.civilian
        : roles[i] === ROLE.undercover
          ? words.undercover
          : null,
    seen: false,
    outRound: null, // vòng bị loại, null = còn trong ván
  }))

  // Thứ tự nói ở chế độ "Cả thứ tự" là ngẫu nhiên; chế độ "Chỉ người nói đầu"
  // đi theo danh sách người chơi. Cả hai đều giữ nguyên qua các vòng, và
  // "người kế tiếp" khi người nói đầu bị loại cũng tính theo thứ tự này.
  const order =
    settings.speakingOrder === 'full'
      ? shuffle(players.map((_, i) => i))
      : players.map((_, i) => i)
  const eligible = order.filter((i) => canSpeakFirst(players[i], settings))
  const firstSpeaker = eligible[randomInt(eligible.length)]

  return {
    phase: 'reveal',
    names,
    counts,
    pairMode,
    settings,
    words,
    players,
    order,
    firstSpeaker,
    revealIndex: 0,
    round: 1,
    lastOut: null,
    winner: null,
  }
}

// ---------- Trong ván ----------

export function isAlive(player) {
  return player.outRound === null
}

// Thứ tự nói của vòng hiện tại: bắt đầu từ người nói đầu, bỏ người đã bị loại.
export function speakingOrder(game) {
  const start = game.order.indexOf(game.firstSpeaker)
  const rotated = [...game.order.slice(start), ...game.order.slice(0, start)]
  return rotated.filter((i) => isAlive(game.players[i]))
}

// Người nói đầu bị loại → người kế tiếp còn trong ván (APP_FLOW 7.2).
function nextFirstSpeaker(players, order, settings, from) {
  const start = order.indexOf(from)
  for (let step = 1; step <= order.length; step++) {
    const i = order[(start + step) % order.length]
    if (isAlive(players[i]) && canSpeakFirst(players[i], settings)) return i
  }
  return from
}

// Kiểm tra theo đúng thứ tự ở APP_FLOW 7.6 (trường hợp Mr. White đoán đúng
// được xử lý riêng ở mrWhiteGuess).
export function checkWinner(players) {
  let civilians = 0
  let infiltrators = 0
  for (const p of players) {
    if (!isAlive(p)) continue
    if (p.role === ROLE.civilian) civilians++
    else infiltrators++
  }
  if (infiltrators === 0) return 'civilian'
  if (civilians <= 1) return 'infiltrators'
  return null
}

function finishElimination(game) {
  const winner = checkWinner(game.players)
  if (winner) return { ...game, phase: 'ended', winner }
  return { ...game, phase: 'round', round: game.round + 1 }
}

// ---------- Reducer ----------

// counts = null nghĩa là chưa chọn, sẽ gợi ý theo số người khi sang màn chọn vai.
// "Chơi lại" giữ số vai và chế độ cặp từ của ván trước.
export function emptyGame(names = [], counts = null, pairMode = 'random') {
  return { phase: 'players', names, counts, pairMode }
}

export function gameReducer(game, action) {
  switch (action.type) {
    case 'new':
      return emptyGame(action.names, action.counts, action.pairMode)

    case 'addName': {
      if (validateNewName(action.name, game.names)) return game
      return { ...game, names: [...game.names, normalizeName(action.name)] }
    }

    case 'removeName':
      return { ...game, names: game.names.filter((_, i) => i !== action.index) }

    case 'toRoles': {
      // Chưa chọn, hoặc số người đổi làm số vai cũ không còn hợp lệ → gợi ý lại.
      const total = game.names.length
      const counts =
        game.counts === null || validateCounts(total, game.counts) ? suggestCounts(total) : game.counts
      return { ...game, phase: 'roles', counts }
    }

    case 'backToPlayers':
      return { ...game, phase: 'players' }

    case 'setCount': {
      const counts = { ...game.counts, [action.role]: Math.max(0, action.value) }
      if (civilianCount(game.names.length, counts) < 0) return game
      return { ...game, counts }
    }

    case 'setPairMode':
      return { ...game, pairMode: action.mode }

    case 'start':
      return createGame({ ...game, settings: action.settings })

    case 'markSeen': {
      const players = game.players.map((p, i) =>
        i === game.revealIndex ? { ...p, seen: true } : p,
      )
      const revealIndex = game.revealIndex + 1
      const phase = revealIndex >= players.length ? 'allSeen' : 'reveal'
      return { ...game, players, revealIndex, phase }
    }

    case 'beginRounds':
      return { ...game, phase: 'round' }

    case 'toPickOut':
      return { ...game, phase: 'pickOut' }

    case 'cancelPickOut':
      return { ...game, phase: 'round' }

    case 'eliminate': {
      if (game.phase !== 'pickOut' || !isAlive(game.players[action.index])) return game
      const players = game.players.map((p, i) =>
        i === action.index ? { ...p, outRound: game.round } : p,
      )
      const firstSpeaker =
        action.index === game.firstSpeaker
          ? nextFirstSpeaker(players, game.order, game.settings, action.index)
          : game.firstSpeaker
      return { ...game, players, firstSpeaker, lastOut: action.index, phase: 'roleReveal' }
    }

    case 'afterRoleReveal': {
      if (game.players[game.lastOut].role === ROLE.mrWhite) {
        return { ...game, phase: 'mrWhiteGuess' }
      }
      return finishElimination(game)
    }

    case 'mrWhiteGuess':
      if (action.correct) return { ...game, phase: 'ended', winner: 'mrWhite' }
      return finishElimination(game)

    default:
      return game
  }
}

