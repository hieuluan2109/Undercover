// Luật và trạng thái ván chơi. Reducer là hàm thuần; việc bốc cặp từ (có ghi
// localStorage) được gọi riêng lúc bấm "Bắt đầu" rồi truyền vào action.

import { WORD_PAIRS } from './words.js'
import { KEYS, load, remove, save } from './storage.js'

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
  stopped: 'Ván đã dừng',
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

// ---------- Cặp từ đã chơi ----------

// Nhận diện cặp bằng chữ chứ không bằng vị trí, để thêm cặp mới hay sửa cặp
// cũ trong words.js thì cặp đó tự tính là chưa chơi.
const pairKey = (pair) => pair.join('|')

function unplayedPairs() {
  const played = new Set(load(KEYS.playedPairs, []))
  return WORD_PAIRS.filter((pair) => !played.has(pairKey(pair)))
}

export function pairStats() {
  return { remaining: unplayedPairs().length, total: WORD_PAIRS.length }
}

export function resetPlayedPairs() {
  remove(KEYS.playedPairs)
}

// Bốc ngẫu nhiên trong các cặp chưa chơi, hết kho thì bắt đầu lại (APP_FLOW 3.4).
// Lưu tách khỏi ván chơi nên "Chơi lại" hay "Tạo ván mới" cũng không lặp cặp.
export function pickPair() {
  let pool = unplayedPairs()
  let played = load(KEYS.playedPairs, [])
  if (pool.length === 0) {
    pool = WORD_PAIRS
    played = []
  }
  const pair = pool[randomInt(pool.length)]
  save(KEYS.playedPairs, [...played, pairKey(pair)])
  return pair
}

function canSpeakFirst(player, settings) {
  return settings.allowMrWhiteFirst || player.role !== ROLE.mrWhite
}

export function createGame({ names, counts, settings, pair }) {
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

// So câu đoán của Mr. White với từ của dân: bỏ khoảng trắng thừa, không phân
// biệt hoa thường. NFC để chữ có dấu gõ từ các bộ gõ khác nhau vẫn khớp.
function normalizeGuess(text) {
  return normalizeName(text.normalize('NFC')).toLocaleLowerCase('vi')
}

export function isCorrectGuess(guess, word) {
  return normalizeGuess(guess) === normalizeGuess(word)
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
// "Chơi lại" giữ số vai của ván trước.
export function emptyGame(names = [], counts = null) {
  return { phase: 'players', names, counts }
}

function applyAction(game, action) {
  switch (action.type) {
    case 'new':
      return emptyGame(action.names, action.counts)

    case 'addName': {
      if (validateNewName(action.name, game.names)) return game
      return { ...game, names: [...game.names, normalizeName(action.name)] }
    }

    // Nạp cả danh sách từ một nhóm đã lưu.
    case 'setNames':
      if (game.phase !== 'players') return game
      return { ...game, names: action.names.slice(0, MAX_PLAYERS) }

    case 'removeName':
      return { ...game, names: game.names.filter((_, i) => i !== action.index) }

    case 'moveName': {
      // Đổi chỗ với người ngay trên (delta = -1) hoặc ngay dưới (delta = 1).
      const from = action.index
      const to = from + action.delta
      if (to < 0 || to >= game.names.length) return game
      const names = [...game.names]
      ;[names[from], names[to]] = [names[to], names[from]]
      return { ...game, names }
    }

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

    case 'start':
      return createGame({ ...game, settings: action.settings, pair: action.pair })

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

    // APP_FLOW 7.5: app tự so, chỉ báo đúng/sai, không lộ từ hay câu đoán.
    case 'mrWhiteGuess': {
      if (game.phase !== 'mrWhiteGuess' || !normalizeName(action.guess)) return game
      if (isCorrectGuess(action.guess, game.words.civilian)) {
        return { ...game, phase: 'ended', winner: 'mrWhite' }
      }
      return { ...game, phase: 'mrWhiteWrong' }
    }

    case 'afterMrWhiteWrong':
      return finishElimination(game)

    // Dừng ván giữa chừng: sang màn kết thúc, không có phe thắng.
    case 'endNow':
      if (!PLAY_PHASES.includes(game.phase)) return game
      return { ...game, phase: 'ended', winner: 'stopped' }

    default:
      return game
  }
}

// ---------- Hoàn tác ----------

// Các màn có ván đang diễn ra (đã chia vai, chưa kết thúc).
const PLAY_PHASES = ['reveal', 'allSeen', 'round', 'pickOut', 'roleReveal', 'mrWhiteGuess', 'mrWhiteWrong']
// Chỉ hoàn tác được trong lúc chơi, không áp dụng lúc xem từ.
const UNDO_PHASES = ['round', 'pickOut', 'roleReveal', 'mrWhiteGuess', 'mrWhiteWrong']
const MAX_HISTORY = 30

// Nhãn mô tả thao tác sẽ được hoàn tác, null nếu thao tác đó không ghi lịch sử.
function undoLabel(game, action, next) {
  switch (action.type) {
    case 'eliminate':
      return `loại ${game.players[action.index].name}`
    case 'afterRoleReveal':
    case 'afterMrWhiteWrong':
      return next.phase === 'mrWhiteGuess' ? 'chuyển sang Mr. White đoán từ' : `sang vòng ${next.round}`
    default:
      return null
  }
}

export function canUndo(game) {
  return game !== null && UNDO_PHASES.includes(game.phase) && (game.history ?? []).length > 0
}

export function canEndNow(game) {
  return game !== null && PLAY_PHASES.includes(game.phase)
}

// Nhãn của bước sẽ bị hoàn tác tiếp theo, ví dụ "loại Minh".
export function nextUndoLabel(game) {
  return canUndo(game) ? game.history.at(-1).label : null
}

export function gameReducer(game, action) {
  if (action.type === 'undo') {
    if (!canUndo(game)) return game
    const history = game.history.slice(0, -1)
    return { ...game.history.at(-1).game, history }
  }

  const next = applyAction(game, action)
  if (next === game) return game

  // Đã kết thúc thì từ và vai đã lộ hết, không quay lại được nữa. Câu đoán của
  // Mr. White cũng là mốc không lùi qua được, để không đoán lại nhiều lần.
  if (next.phase === 'ended' || action.type === 'mrWhiteGuess') {
    const { history: _, ...rest } = next
    return rest
  }

  const label = undoLabel(game, action, next)
  if (!label) return next
  const { history = [], ...snapshot } = game
  // Hoàn tác việc loại người thì quay về màn Vòng N, không phải màn chọn tên.
  if (action.type === 'eliminate') snapshot.phase = 'round'
  return { ...next, history: [...history, { label, game: snapshot }].slice(-MAX_HISTORY) }
}

