import { useState } from 'react'
import { ConfirmDialog } from '../components/Dialog.jsx'
import { MyWord } from '../components/MyWord.jsx'
import { PlayerStatus } from '../components/PlayerStatus.jsx'
import { ROLE, ROLE_LABEL, normalizeName } from '../game.js'
import { MAX_NAME_LENGTH } from '../groups.js'
import { useClientRoom } from '../online/useClientRoom.js'
import { useWakeLock } from '../online/useWakeLock.js'
import { KEYS, load, save } from '../storage.js'
import { EndScreen } from './RoundScreens.jsx'

const STATUS_LABEL = {
  connecting: 'Đang kết nối…',
  open: null,
  lost: 'Mất kết nối, đang thử lại…',
  notFound: 'Chưa thấy phòng. Host cần mở app và giữ màn hình phòng chơi.',
}

function JoinScreen({ view, error, send }) {
  // Điền sẵn tên đã dùng lần trước trên máy này.
  const [name, setName] = useState(() => load(KEYS.lastName, ''))
  const started = view.phase !== 'players' && view.phase !== 'roles'

  const submit = (e) => {
    e.preventDefault()
    if (!normalizeName(name)) return
    save(KEYS.lastName, normalizeName(name))
    send({ type: 'join', name })
  }

  return (
    <section className="screen">
      <h1>Vào phòng {view.room}</h1>
      <p className="muted">
        {started
          ? 'Ván đang diễn ra: nhập tên để vào chờ ván sau. Nếu bạn đang chơi mà lỡ đóng trang, nhập đúng tên cũ để vào lại.'
          : 'Nhập tên của bạn để vào phòng.'}
      </p>
      <form className="add-form" onSubmit={submit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên của bạn"
          maxLength={MAX_NAME_LENGTH}
          enterKeyHint="done"
          autoFocus
        />
        <button className="btn primary" type="submit" disabled={!normalizeName(name)}>
          Vào
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {view.names.length > 0 ? (
        <p className="muted small">Trong phòng: {view.names.join(', ')}</p>
      ) : null}
    </section>
  )
}

function LobbyScreen({ view }) {
  return (
    <section className="screen">
      <h1>Chào {view.myName}!</h1>
      <p className="muted">Đã vào phòng. Chờ host bắt đầu ván…</p>
      <h3>Trong phòng ({view.names.length})</h3>
      <ol className="order-list">
        {view.names.map((n) => (
          <li key={n}>{n === view.myName ? <strong>{n} (bạn)</strong> : n}</li>
        ))}
      </ol>
    </section>
  )
}

function WaitingScreen({ view }) {
  return (
    <section className="screen">
      <h1>Chào {view.myName}!</h1>
      <p className="muted">Ván đang diễn ra. Bạn sẽ được thêm vào ván sau khi host bấm "Chơi lại".</p>
      <h3>Đang chơi ({view.names.length})</h3>
      <p className="muted">{view.names.join(', ')}</p>
    </section>
  )
}

function SeenScreen({ view, send }) {
  return (
    <section className="screen">
      <h1>Xem từ</h1>
      <p className="muted">Che màn hình lại rồi xem từ của bạn.</p>
      <MyWord player={view.me} />
      {view.me.seen ? (
        <p className="muted">Đã xem. Chờ host bắt đầu chơi…</p>
      ) : (
        <div className="bottom-bar">
          <button className="btn primary big" onClick={() => send({ type: 'seen' })}>
            ✅ Tôi đã xem
          </button>
        </div>
      )}
    </section>
  )
}

function RoundView({ view }) {
  return (
    <section className="screen">
      <h1>Vòng {view.round}</h1>
      {view.me && !view.me.alive ? <p className="error">Bạn đã bị loại, hãy xem mọi người chơi tiếp.</p> : null}

      {view.speakingMode === 'full' ? (
        <div className="card">
          <p className="muted small">Thứ tự nói</p>
          <ol className="order-list">
            {view.order.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="card highlight">
          <p className="first-speaker">
            <strong>{view.firstSpeaker}</strong> nói trước
          </p>
          <p className="muted small">Sau đó cả nhóm nói vòng quanh bàn.</p>
        </div>
      )}

      {view.phase === 'pickOut' ? <p className="muted">Host đang chọn người bị loại…</p> : null}
      {view.me?.alive ? <MyWord player={view.me} /> : null}
      <PlayerStatus players={view.players} />
    </section>
  )
}

function RoleRevealView({ view }) {
  const { name, role } = view.lastOut
  return (
    <section className="screen center">
      <p className="muted">Người bị loại</p>
      <p className="big-name">{name === view.myName ? `${name} (bạn)` : name}</p>
      <p className="muted">là</p>
      <p className={`role-reveal ${role}`}>{ROLE_LABEL[role]}</p>
      {role === ROLE.mrWhite ? <p className="muted">Mr. White được đoán từ của dân 1 lần.</p> : null}
    </section>
  )
}

function GuessView({ view, send }) {
  const [guess, setGuess] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [sent, setSent] = useState(false)

  if (!view.canGuess) {
    return (
      <section className="screen center">
        <p className="big-icon">🤔</p>
        <h1>{view.lastOut.name} đang đoán từ</h1>
        <p className="muted">Chờ Mr. White gõ câu đoán…</p>
      </section>
    )
  }

  return (
    <section className="screen center">
      <p className="big-icon">🤔</p>
      <h1>Bạn là Mr. White, hãy đoán từ của dân</h1>
      <form
        className="guess-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (guess.trim()) setConfirming(true)
        }}
      >
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Nhập từ của dân"
          aria-label="Câu đoán của Mr. White"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={sent}
          autoFocus
        />
        <p className="muted small">Chỉ được đoán 1 lần. Không phân biệt viết hoa, viết thường.</p>
        <div className="bottom-bar">
          <button type="submit" className="btn primary big" disabled={!guess.trim() || sent}>
            {sent ? 'Đang gửi…' : 'Gửi câu đoán'}
          </button>
        </div>
      </form>
      {confirming ? (
        <ConfirmDialog
          title="Gửi câu đoán?"
          message="Chỉ được đoán 1 lần, không sửa lại được."
          confirmLabel="Gửi"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            send({ type: 'guess', guess })
            setConfirming(false)
            setSent(true)
          }}
        />
      ) : null}
    </section>
  )
}

function GameView({ view, send }) {
  if (view.waiting) return <WaitingScreen view={view} />
  switch (view.phase) {
    case 'players':
    case 'roles':
      return <LobbyScreen view={view} />
    case 'allSeen':
      return <SeenScreen view={view} send={send} />
    case 'round':
    case 'pickOut':
      return <RoundView view={view} />
    case 'roleReveal':
      return <RoleRevealView view={view} />
    case 'mrWhiteGuess':
      return <GuessView view={view} send={send} />
    case 'mrWhiteWrong':
      return (
        <section className="screen center">
          <p className="big-icon">❌</p>
          <h1>Đoán sai!</h1>
          <p className="muted">{view.lastOut.name} bị loại.</p>
        </section>
      )
    case 'ended':
      return (
        <>
          <EndScreen game={view} />
          <p className="muted center-text">Chờ host mở ván tiếp theo…</p>
        </>
      )
    default:
      return null
  }
}

// App trên máy người chơi, mở bằng link ?room=MÃ từ mã QR của host.
export function ClientApp({ room }) {
  const { view, status, joinError, send } = useClientRoom(room)
  useWakeLock(true)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const notice = STATUS_LABEL[status]

  let content
  if (view === null) {
    content = (
      <section className="screen center">
        <p className="big-icon">📡</p>
        <h1>Phòng {room}</h1>
        <p className="muted">{notice ?? 'Đang tải…'}</p>
      </section>
    )
  } else if (view.phase === 'closed') {
    content = (
      <section className="screen center">
        <p className="big-icon">🚪</p>
        <h1>Phòng đã đóng</h1>
        <p className="muted">Host đã thoát chế độ chơi nhiều máy.</p>
      </section>
    )
  } else if (!view.joined) {
    content = <JoinScreen view={view} error={joinError} send={send} />
  } else {
    content = <GameView view={view} send={send} />
  }

  return (
    <>
      <header className="topbar">
        <button className="link-btn" onClick={() => setConfirmLeave(true)}>
          ← Rời phòng
        </button>
        <span className="muted small">Phòng {room}</span>
        <span className="topbar-spacer" />
      </header>
      {notice && view !== null ? <p className="conn-banner">{notice}</p> : null}
      {content}
      {confirmLeave ? (
        <ConfirmDialog
          title="Rời phòng?"
          message="Muốn vào lại thì quét mã QR và nhập đúng tên cũ."
          confirmLabel="Rời phòng"
          danger
          onCancel={() => setConfirmLeave(false)}
          onConfirm={() => {
            try {
              sessionStorage.removeItem(`undercover:token:${room}`)
            } catch {
              // ignore
            }
            location.href = location.pathname
          }}
        />
      ) : null}
    </>
  )
}
