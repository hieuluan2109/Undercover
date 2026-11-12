import { useEffect, useReducer, useState } from 'react'
import { ConfirmDialog, Dialog } from './components/Dialog.jsx'
import { DEFAULT_SETTINGS, canEndNow, canUndo, gameReducer, nextUndoLabel, pickPair } from './game.js'
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

function GameView({ game, dispatch, settings, groups, onGroupsChange, onReplay, onNewGame }) {
  switch (game.phase) {
    case 'players':
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
      return <AllSeenScreen dispatch={dispatch} />
    case 'round':
      return <RoundScreen game={game} dispatch={dispatch} />
    case 'pickOut':
      return <PickOutScreen game={game} dispatch={dispatch} />
    case 'roleReveal':
      return <RoleRevealScreen game={game} dispatch={dispatch} />
    case 'mrWhiteGuess':
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
function GameMenu({ game, dispatch, onClose }) {
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
  const [confirmNew, setConfirmNew] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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

  const startNewGame = (names = [], counts = null) => {
    dispatch({ type: 'new', names, counts })
    setConfirmNew(false)
    setScreen('game')
  }

  const requestNewGame = () => {
    if (isInProgress(game)) setConfirmNew(true)
    else startNewGame()
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
          onNewGame={requestNewGame}
          onGroups={() => setScreen('groups')}
          onSettings={() => setScreen('settings')}
          onRules={() => setScreen('rules')}
        />
        {confirmNew ? (
          <ConfirmDialog
            title="Tạo ván mới?"
            message="Ván đang chơi sẽ bị xóa."
            confirmLabel="Tạo ván mới"
            danger
            onCancel={() => setConfirmNew(false)}
            onConfirm={() => startNewGame()}
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
        <span className="muted small">{PHASE_TITLE[game.phase]}</span>
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
        groups={groups}
        onGroupsChange={changeGroups}
        onReplay={() => startNewGame(game.names, game.counts)}
        onNewGame={() => startNewGame()}
      />
      {menuOpen && canEndNow(game) ? (
        <GameMenu game={game} dispatch={dispatch} onClose={() => setMenuOpen(false)} />
      ) : null}
    </>
  )
}
