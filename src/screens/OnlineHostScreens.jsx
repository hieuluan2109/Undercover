import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { MyWord } from '../components/MyWord.jsx'
import { HOST_TOKEN, MAX_PLAYERS, MIN_PLAYERS, checkJoin, normalizeName, tokenName } from '../game.js'
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
                <i className={room.connected.has(token) ? 'dot on' : 'dot'} /> {n}
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

      <div className="bottom-bar">
        <button className="btn primary big" disabled={!canContinue} onClick={() => dispatch({ type: 'toRoles' })}>
          Tiếp tục
        </button>
      </div>
    </section>
  )
}

// Sau khi chia vai: ai cũng xem từ trên máy mình, host thấy ai đã xem.
export function OnlineSeenScreen({ game, dispatch, room }) {
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
        {game.players.map((p) => (
          <li key={p.name}>
            <span>
              <i className={room.connected.has(game.online.tokens[p.name]) ? 'dot on' : 'dot'} /> {p.name}
            </span>
            <span className="muted small">{p.seen ? '✅ đã xem' : 'chưa xem'}</span>
          </li>
        ))}
      </ul>

      <div className="bottom-bar">
        <button className="btn primary big" onClick={() => dispatch({ type: 'beginRounds' })}>
          {seenCount === game.players.length ? 'Bắt đầu chơi' : 'Bắt đầu luôn'}
        </button>
      </div>
    </section>
  )
}

// Mr. White (không phải host) đoán trên máy của mình. Máy kia hết pin hay mất
// mạng thì host đưa máy mình cho Mr. White đoán.
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
