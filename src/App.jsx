import { useEffect, useReducer, useState } from 'react'
import { ConfirmDialog } from './components/Dialog.jsx'
import { DEFAULT_SETTINGS, gameReducer } from './game.js'
import { KEYS, load, remove, save } from './storage.js'
import { HomeScreen, RulesScreen, SettingsScreen } from './screens/MenuScreens.jsx'
import { AllSeenScreen, RevealScreen } from './screens/RevealScreens.jsx'
import { PlayersScreen, RolesScreen } from './screens/SetupScreens.jsx'
import {
  EndScreen,
  MrWhiteGuessScreen,
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
  ended: 'Kết thúc',
}

function GameView({ game, dispatch, settings, onReplay, onNewGame }) {
  switch (game.phase) {
    case 'players':
      return <PlayersScreen names={game.names} dispatch={dispatch} />
    case 'roles':
      return (
        <RolesScreen game={game} dispatch={dispatch} onStart={() => dispatch({ type: 'start', settings })} />
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
    case 'ended':
      return <EndScreen game={game} onReplay={onReplay} onNewGame={onNewGame} />
    default:
      return null
  }
}

export default function App() {
  const [game, dispatch] = useReducer(reducer, null, loadGame)
  const [settings, setSettings] = useState(loadSettings)
  // Tải lại trang giữa ván thì quay về đúng chỗ đang chơi (APP_FLOW 3.7).
  const [screen, setScreen] = useState(() => (game === null ? 'home' : 'game'))
  const [confirmNew, setConfirmNew] = useState(false)

  // Đồng bộ ván chơi với localStorage sau mỗi thay đổi.
  useEffect(() => {
    if (game === null) remove(KEYS.game)
    else save(KEYS.game, game)
  }, [game])

  const changeSettings = (next) => {
    setSettings(next)
    save(KEYS.settings, next)
  }

  const startNewGame = (names = [], counts = null, pairMode = 'random') => {
    dispatch({ type: 'new', names, counts, pairMode })
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
      </header>
      <GameView
        game={game}
        dispatch={dispatch}
        settings={settings}
        onReplay={() => startNewGame(game.names, game.counts, game.pairMode)}
        onNewGame={() => startNewGame()}
      />
    </>
  )
}
