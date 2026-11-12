import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { ConfirmDialog, Dialog } from '../components/Dialog.jsx'
import { MyWord } from '../components/MyWord.jsx'
import { SecretWord } from '../components/SecretWord.jsx'
import {
  HOST_TOKEN,
  MAX_PLAYERS,
  MIN_PLAYERS,
  checkJoin,
  isManualToken,
  newManualToken,
  normalizeName,
  tokenName,
  validateNewName,
} from '../game.js'
import { MAX_NAME_LENGTH } from '../groups.js'
import { joinUrl } from '../online/protocol.js'

const STATUS_LABEL = {
  opening: 'Đang mở phòng…',
  open: 'Phòng đang mở',
  error: 'Mất kết nối máy chủ, đang thử lại…',
}

// Mã QR + mã phòng để các máy khác quét vào.
export function RoomQr({ room }) {
  const url = joinUrl(room)
  const [src, setSrc] = useState(null)

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 480 }).then(setSrc, () => setSrc(null))
  }, [url])

  return (
    <div className="room-qr">
      {src ? <img src={src} alt={`Mã QR vào phòng ${room}`} /> : null}
      <p className="room-code">{room}</p>
      <p className="muted small">Quét mã bằng camera, hoặc mở {url}</p>
    </div>
  )
}

// Chấm xanh = máy đang kết nối, 📵 = người host thêm bằng tay (dùng máy host).
function DeviceDot({ token, room }) {
  if (isManualToken(token)) return <span title="Dùng máy host">📵</span>
  return <i className={room.connected.has(token) ? 'dot on' : 'dot'} />
}

// Host thêm người không có máy (hoặc máy không kết nối được).
function AddManualForm({ game, dispatch, room }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  const add = (e) => {
    e.preventDefault()
    const token = newManualToken()
    // Thêm tay thì không "nhận lại" tên của ai: trùng tên là báo lỗi luôn.
    const problem =
      validateNewName(name, Object.keys(game.online.tokens)) ?? checkJoin(game, name, token, room.connected)
    if (problem) {
      setError(problem)
      return
    }
    dispatch({ type: 'onlineJoin', name, token })
    setName('')
  }

  return (
    <>
      <h3>Thêm người không có máy</h3>
      <form className="add-form" onSubmit={add}>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          placeholder="Tên người chơi"
          maxLength={MAX_NAME_LENGTH}
          enterKeyHint="done"
        />
        <button className="btn" type="submit" disabled={!normalizeName(name)}>
          Thêm
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <p className="muted small">
        Người này xem từ trên máy host. Nếu máy của họ vào được sau, nhập đúng tên này là nhận lại chỗ.
      </p>
    </>
  )
}

// Phòng chờ: host nhập tên mình, các máy khác quét QR vào.
export function OnlineLobbyScreen({ game, dispatch, room }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const hostName = tokenName(game, HOST_TOKEN)
  const count = game.names.length
  const canContinue = hostName !== null && count >= MIN_PLAYERS && count <= MAX_PLAYERS

  const join = (e) => {
    e.preventDefault()
    const problem = checkJoin(game, name, HOST_TOKEN, room.connected)
    if (problem) {
      setError(problem)
      return
    }
    dispatch({ type: 'onlineJoin', name, token: HOST_TOKEN })
    setName('')
  }

  return (
    <section className="screen">
      <h1>Phòng chơi</h1>
      <p className={room.status === 'open' ? 'counter ok' : 'counter'}>{STATUS_LABEL[room.status]}</p>

      <RoomQr room={game.online.room} />

      {hostName === null ? (
        <>
          <h3>Tên của bạn</h3>
          <form className="add-form" onSubmit={join}>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="Host cũng là người chơi"
              maxLength={MAX_NAME_LENGTH}
              enterKeyHint="done"
            />
            <button className="btn primary" type="submit" disabled={!normalizeName(name)}>
              Vào
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </>
      ) : null}

      <p className={count >= MIN_PLAYERS ? 'counter ok' : 'counter'}>
        Đã có {count} người (tối thiểu {MIN_PLAYERS}, tối đa {MAX_PLAYERS})
      </p>
      <ol className="player-list">
        {game.names.map((n) => {
          const token = game.online.tokens[n]
          const isHost = token === HOST_TOKEN
          return (
            <li key={n}>
              <span>
                <DeviceDot token={token} room={room} /> {n}
                {isHost ? ' (bạn)' : ''}
              </span>
              {isHost ? null : (
                <div className="player-actions">
                  <button
                    className="icon-btn"
                    aria-label={`Mời ${n} ra khỏi phòng`}
                    onClick={() => dispatch({ type: 'onlineRemove', name: n })}
                  >
                    ✕
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <p className="muted small">Thứ tự trong danh sách là thứ tự vào phòng.</p>

      {hostName !== null ? <AddManualForm game={game} dispatch={dispatch} room={room} /> : null}

      <div className="bottom-bar">
        <button className="btn primary big" disabled={!canContinue} onClick={() => dispatch({ type: 'toRoles' })}>
          Tiếp tục
        </button>
      </div>
    </section>
  )
}

// Người dùng chung máy host xem từ: xác nhận đưa máy → hiện từ → ẩn đi.
function ManualReveal({ player, onSeen, onClose }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <ConfirmDialog
        title={`Đưa máy cho ${player.name}`}
        message={`Chỉ ${player.name} được nhìn màn hình. Những người khác quay đi.`}
        confirmLabel={`Tôi là ${player.name}`}
        onCancel={onClose}
        onConfirm={() => setOpen(true)}
      />
    )
  }
  return (
    <Dialog onClose={onSeen}>
      <SecretWord player={player} />
      <button className="btn primary" onClick={onSeen}>
        Đã nhớ, ẩn đi
      </button>
    </Dialog>
  )
}

// Sau khi chia vai: ai cũng xem từ trên máy mình, host thấy ai đã xem.
export function OnlineSeenScreen({ game, dispatch, room }) {
  const [revealing, setRevealing] = useState(null) // chỉ số người dùng chung máy host
  const hostName = tokenName(game, HOST_TOKEN)
  const hostIndex = game.players.findIndex((p) => p.name === hostName)
  const me = game.players[hostIndex]
  const seenCount = game.players.filter((p) => p.seen).length

  return (
    <section className="screen">
      <h1>Xem từ</h1>
      <p className="muted">Mỗi người xem từ trên máy của mình rồi bấm "Đã xem".</p>

      {me ? (
        <>
          <MyWord player={me} />
          {!me.seen ? (
            <button className="btn" onClick={() => dispatch({ type: 'markSeenBy', index: hostIndex })}>
              ✅ Tôi đã xem
            </button>
          ) : null}
        </>
      ) : null}

      <h3>
        Đã xem {seenCount} / {game.players.length}
      </h3>
      <ul className="out-list">
        {game.players.map((p, i) => {
          const token = game.online.tokens[p.name]
          return (
            <li key={p.name}>
              <span>
                <DeviceDot token={token} room={room} /> {p.name}
              </span>
              {isManualToken(token) ? (
                <button className="btn small-btn" onClick={() => setRevealing(i)}>
                  {p.seen ? 'Xem lại từ' : 'Xem từ'}
                </button>
              ) : (
                <span className="muted small">{p.seen ? '✅ đã xem' : 'chưa xem'}</span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="bottom-bar">
        <button className="btn primary big" onClick={() => dispatch({ type: 'beginRounds' })}>
          {seenCount === game.players.length ? 'Bắt đầu chơi' : 'Bắt đầu luôn'}
        </button>
      </div>

      {revealing !== null ? (
        <ManualReveal
          player={game.players[revealing]}
          onClose={() => setRevealing(null)}
          onSeen={() => {
            dispatch({ type: 'markSeenBy', index: revealing })
            setRevealing(null)
          }}
        />
      ) : null}
    </section>
  )
}

// Mũ Trắng (không phải host) đoán trên máy của mình. Máy kia hết pin hay mất
// mạng thì host đưa máy mình cho Mũ Trắng đoán.
export function OnlineWaitGuessScreen({ game, room, onGuessHere }) {
  const player = game.players[game.lastOut]
  const online = room.connected.has(game.online.tokens[player.name])

  return (
    <section className="screen center">
      <p className="big-icon">🤔</p>
      <h1>{player.name} đang đoán từ</h1>
      <p className="muted">
        {online ? `${player.name} gõ câu đoán trên máy của mình.` : `Máy của ${player.name} đang mất kết nối.`}
      </p>
      <div className="bottom-bar">
        <button className="btn" onClick={onGuessHere}>
          Cho {player.name} đoán trên máy này
        </button>
      </div>
    </section>
  )
}
