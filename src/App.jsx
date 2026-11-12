import { useEffect, useReducer, useState } from 'react'
import { ConfirmDialog, Dialog } from './components/Dialog.jsx'
import { DEFAULT_SETTINGS, HOST_TOKEN, canEndNow, canUndo, gameReducer, nextUndoLabel, pickPair } from './game.js'
import { newRoomCode } from './online/protocol.js'
import { useHostRoom } from './online/useHostRoom.js'
import { OnlineLobbyScreen, OnlineSeenScreen, OnlineWaitGuessScreen, RoomQr } from './screens/OnlineHostScreens.jsx'
import { KEYS, load, remove, save } from './storage.js'
import { loadGroups, saveGroups } from './groups.js'
import { GroupsScreen } from './screens/GroupScreens.jsx'
import { HomeScreen, RulesScreen, SettingsScreen } from './screens/MenuScreens.jsx'
import { AllSeenScreen, RevealScreen } from './screens/RevealScreens.jsx'
import { PlayersScreen, RolesScreen } from './screens/SetupScreens.jsx'
import {
  EndScreen,
  MrWhiteGuessScreen,
  MrWhiteWrongScreen,
  PickOutScreen,
  RoleRevealScreen,
  RoundScreen,
} from './screens/RoundScreens.jsx'

function reducer(game, action) {
  if (game === null && action.type !== 'new') return game
  return gameReducer(game, action)
}

const loadGame = () => load(KEYS.game, null)
const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) })

// Một ván "đang dở" là ván đã có gì đó để mất nếu bị xóa.
function isInProgress(game) {
  if (game === null || game.phase === 'ended') return false
  return !(game.phase === 'players' && game.names.length === 0)
}

const PHASE_TITLE = {
  players: 'Chuẩn bị',
  roles: 'Chuẩn bị',
  reveal: 'Xem từ',
  allSeen: 'Xem từ',
  round: 'Đang chơi',
  pickOut: 'Đang chơi',
  roleReveal: 'Đang chơi',
  mrWhiteGuess: 'Đang chơi',
  mrWhiteWrong: 'Đang chơi',
  ended: 'Kết thúc',
}

// Chơi nhiều máy: Mr. White đoán trên máy mình, trừ khi host chọn cho đoán trên máy host.
function OnlineGuessGate({ game, dispatch, room }) {
  const [here, setHere] = useState(false)
  const isHost = game.online.tokens[game.players[game.lastOut].name] === HOST_TOKEN
  if (isHost || here) return <MrWhiteGuessScreen game={game} dispatch={dispatch} />
  return <OnlineWaitGuessScreen game={game} room={room} onGuessHere={() => setHere(true)} />
}

function GameView({ game, dispatch, settings, room, groups, onGroupsChange, onReplay, onNewGame }) {
  switch (game.phase) {
    case 'players':
      if (game.online) return <OnlineLobbyScreen game={game} dispatch={dispatch} room={room} />
      return (
        <PlayersScreen names={game.names} dispatch={dispatch} groups={groups} onGroupsChange={onGroupsChange} />
      )
    case 'roles':
      return (
        <RolesScreen game={game} dispatch={dispatch} onStart={() => dispatch({ type: 'start', settings, pair: pickPair() })} />
      )
    case 'reveal': {
      const player = game.players[game.revealIndex]
      return (
        <RevealScreen
          key={player.name}
          player={player}
          index={game.revealIndex}
          total={game.players.length}
          dispatch={dispatch}
        />
      )
    }
    case 'allSeen':
      if (game.online) return <OnlineSeenScreen game={game} dispatch={dispatch} room={room} />
      return <AllSeenScreen dispatch={dispatch} />
    case 'round':
      return <RoundScreen game={game} dispatch={dispatch} />
    case 'pickOut':
      return <PickOutScreen game={game} dispatch={dispatch} />
    case 'roleReveal':
      return <RoleRevealScreen game={game} dispatch={dispatch} />
    case 'mrWhiteGuess':
      if (game.online) return <OnlineGuessGate game={game} dispatch={dispatch} room={room} />
      return <MrWhiteGuessScreen game={game} dispatch={dispatch} />
    case 'mrWhiteWrong':
      return <MrWhiteWrongScreen game={game} dispatch={dispatch} />
    case 'ended':
      return <EndScreen game={game} onReplay={onReplay} onNewGame={onNewGame} />
    default:
      return null
  }
}

// Menu ⋮ trong ván: hoàn tác 1 bước hoặc dừng ván ngay.
function GameMenu({ game, dispatch, onShowQr, onClose }) {
  const [confirm, setConfirm] = useState(null) // 'undo' | 'end' | null
  const undoLabel = nextUndoLabel(game)

  const run = (action) => {
    dispatch(action)
    onClose()
  }

  if (confirm === 'undo') {
    return (
      <ConfirmDialog
        title="Hoàn tác?"
        message={`Quay lại trước bước: ${undoLabel}.`}
        confirmLabel="Hoàn tác"
        onCancel={() => setConfirm(null)}
        onConfirm={() => run({ type: 'undo' })}
      />
    )
  }
  if (confirm === 'end') {
    return (
      <ConfirmDialog
        title="Kết thúc ván ngay?"
        message="Ván sẽ dừng và công khai từ cùng vai của mọi người. Không thể chơi tiếp ván này."
        confirmLabel="Kết thúc"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => run({ type: 'endNow' })}
      />
    )
  }

  return (
    <Dialog onClose={onClose}>
      <h2>Tùy chọn ván</h2>
      <div className="menu-list">
        <button className="btn" disabled={!canUndo(game)} onClick={() => setConfirm('undo')}>
          ↶ Hoàn tác{undoLabel ? `: ${undoLabel}` : ''}
        </button>
        {!canUndo(game) ? (
          <p className="muted small">Chỉ hoàn tác được trong lúc chơi, và không lùi qua câu đoán của Mr. White.</p>
        ) : null}
        {game.online ? (
          <button className="btn" onClick={onShowQr}>
            📱 Hiện mã QR phòng
          </button>
        ) : null}
        <button className="btn danger" onClick={() => setConfirm('end')}>
          ⏹ Kết thúc ván ngay
        </button>
        <button className="btn ghost" onClick={onClose}>
          Đóng
        </button>
      </div>
    </Dialog>
  )
}

export default function App() {
  const [game, dispatch] = useReducer(reducer, null, loadGame)
  const [settings, setSettings] = useState(loadSettings)
  const [groups, setGroups] = useState(loadGroups)
  // Tải lại trang giữa ván thì quay về đúng chỗ đang chơi (APP_FLOW 3.7).
  const [screen, setScreen] = useState(() => (game === null ? 'home' : 'game'))
  const [confirmNew, setConfirmNew] = useState(null) // null | 'local' | 'online'
  const [menuOpen, setMenuOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const room = useHostRoom(game, dispatch)

  // Đồng bộ ván chơi với localStorage sau mỗi thay đổi.
  useEffect(() => {
    if (game === null) remove(KEYS.game)
    else save(KEYS.game, game)
  }, [game])

  const changeSettings = (next) => {
    setSettings(next)
    save(KEYS.settings, next)
  }

  const changeGroups = (next) => {
    setGroups(next)
    saveGroups(next)
  }

  const startNewGame = (names = [], counts = null, online = null) => {
    dispatch({ type: 'new', names, counts, online })
    setConfirmNew(null)
    setScreen('game')
  }

  // Chơi nhiều máy: mở phòng mới với mã ngẫu nhiên, danh sách trống.
  const startKind = (kind) => {
    if (kind === 'online') startNewGame([], null, { room: newRoomCode(), tokens: {} })
    else startNewGame()
  }

  const requestNewGame = (kind) => {
    if (isInProgress(game)) setConfirmNew(kind)
    else startKind(kind)
  }

  if (screen === 'settings') {
    return <SettingsScreen settings={settings} onChange={changeSettings} onBack={() => setScreen('home')} />
  }
  if (screen === 'groups') {
    return <GroupsScreen groups={groups} onChange={changeGroups} onBack={() => setScreen('home')} />
  }
  if (screen === 'rules') {
    return <RulesScreen onBack={() => setScreen('home')} />
  }
  if (screen === 'home' || game === null) {
    return (
      <>
        <HomeScreen
          hasGame={isInProgress(game)}
          onContinue={() => setScreen('game')}
          onNewGame={() => requestNewGame('local')}
          onOnline={() => requestNewGame('online')}
          onGroups={() => setScreen('groups')}
          onSettings={() => setScreen('settings')}
          onRules={() => setScreen('rules')}
        />
        {confirmNew ? (
          <ConfirmDialog
            title={confirmNew === 'online' ? 'Mở phòng chơi nhiều máy?' : 'Tạo ván mới?'}
            message="Ván đang chơi sẽ bị xóa."
            confirmLabel={confirmNew === 'online' ? 'Mở phòng' : 'Tạo ván mới'}
            danger
            onCancel={() => setConfirmNew(null)}
            onConfirm={() => startKind(confirmNew)}
          />
        ) : null}
      </>
    )
  }

  return (
    <>
      <header className="topbar">
        <button className="link-btn" onClick={() => setScreen('home')}>
          ← Menu
        </button>
        <span className="muted small">
          {PHASE_TITLE[game.phase]}
          {game.online ? ` · Phòng ${game.online.room}` : ''}
        </span>
        {canEndNow(game) ? (
          <button className="icon-btn" aria-label="Tùy chọn ván" onClick={() => setMenuOpen(true)}>
            ⋮
          </button>
        ) : (
          <span className="topbar-spacer" />
        )}
      </header>
      <GameView
        game={game}
        dispatch={dispatch}
        settings={settings}
        room={room}
        groups={groups}
        onGroupsChange={changeGroups}
        onReplay={() => startNewGame(game.names, game.counts, game.online ?? null)}
        onNewGame={() => startNewGame()}
      />
      {menuOpen && canEndNow(game) ? (
        <GameMenu
          game={game}
          dispatch={dispatch}
          onShowQr={() => {
            setMenuOpen(false)
            setQrOpen(true)
          }}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
      {qrOpen && game.online ? (
        <Dialog onClose={() => setQrOpen(false)}>
          <h2>Mã QR phòng</h2>
          <p className="muted small">Ai lỡ đóng trang thì quét lại và nhập đúng tên cũ.</p>
          <RoomQr room={game.online.room} />
          <button className="btn primary" onClick={() => setQrOpen(false)}>
            Đóng
          </button>
        </Dialog>
      ) : null}
    </>
  )
}
