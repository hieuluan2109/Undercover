import { useState } from 'react'
import { ConfirmDialog } from '../components/Dialog.jsx'
import { PlayerStatus } from '../components/PlayerStatus.jsx'
import { RecheckWord } from '../components/RecheckWord.jsx'
import { ROLE, ROLE_LABEL, WINNER_LABEL, checkWinner, isAlive, speakingOrder } from '../game.js'

const roundSteps = (
  <ol className="steps">
    <li>Lần lượt mô tả từ của mình bằng một từ hoặc cụm từ ngắn.</li>
    <li>Thảo luận xem ai là kẻ xâm nhập.</li>
    <li>Bỏ phiếu. Hòa phiếu thì oẳn tù tì, người thua bị loại.</li>
  </ol>
)

// APP_FLOW 7.2: vòng N, lượt mô tả.
export function RoundScreen({ game, dispatch }) {
  const { players } = game
  const order = speakingOrder(game)
  const first = players[game.firstSpeaker]

  return (
    <section className="screen">
      <h1>Vòng {game.round}</h1>

      {game.settings.speakingOrder === 'full' ? (
        <div className="card">
          <p className="muted small">Thứ tự nói</p>
          <ol className="order-list">
            {order.map((i) => (
              <li key={players[i].name}>{players[i].name}</li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="card highlight">
          <p className="first-speaker">
            <strong>{first.name}</strong> nói trước
          </p>
          <p className="muted small">Sau đó cả nhóm nói vòng quanh bàn.</p>
        </div>
      )}

      {roundSteps}

      <RecheckWord players={players} />

      <PlayerStatus players={players} />

      <div className="bottom-bar">
        <button className="btn danger big" onClick={() => dispatch({ type: 'toPickOut' })}>
          Chọn người bị loại
        </button>
      </div>
    </section>
  )
}

// APP_FLOW 7.3: host bấm tên người bị loại theo kết quả bỏ phiếu ngoài đời.
export function PickOutScreen({ game, dispatch }) {
  const [pending, setPending] = useState(null)

  return (
    <section className="screen">
      <h1>Ai bị loại?</h1>
      <p className="muted">Bấm tên người nhiều phiếu nhất. Hòa phiếu thì chọn người thua oẳn tù tì.</p>

      <div className="name-grid">
        {game.players.map((p, i) =>
          isAlive(p) ? (
            <button key={p.name} className="btn name-btn" onClick={() => setPending(i)}>
              {p.name}
            </button>
          ) : null,
        )}
      </div>

      <div className="bottom-bar">
        <button className="btn" onClick={() => dispatch({ type: 'cancelPickOut' })}>
          Quay lại
        </button>
      </div>

      {pending !== null ? (
        <ConfirmDialog
          title={`Loại ${game.players[pending].name}?`}
          message="Không thể hoàn tác sau khi xác nhận."
          confirmLabel="Loại"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() => dispatch({ type: 'eliminate', index: pending })}
        />
      ) : null}
    </section>
  )
}

// APP_FLOW 7.4: công khai vai (không hiện từ).
export function RoleRevealScreen({ game, dispatch }) {
  const player = game.players[game.lastOut]
  const isMrWhite = player.role === ROLE.mrWhite
  const winner = isMrWhite ? null : checkWinner(game.players)

  return (
    <section className="screen center">
      <p className="muted">Người bị loại</p>
      <p className="big-name">{player.name}</p>
      <p className="muted">là</p>
      <p className={`role-reveal ${player.role}`}>{ROLE_LABEL[player.role]}</p>
      {isMrWhite ? (
        <p className="muted">Mr. White được đoán từ của dân 1 lần. Đoán đúng là thắng ngay.</p>
      ) : null}
      {winner ? <p className="muted">Ván đã có kết quả.</p> : null}

      <div className="bottom-bar">
        <button className="btn primary big" onClick={() => dispatch({ type: 'afterRoleReveal' })}>
          {isMrWhite ? 'Mr. White đoán từ' : winner ? 'Xem kết quả' : `Sang vòng ${game.round + 1}`}
        </button>
      </div>
    </section>
  )
}

// APP_FLOW 7.5: Mr. White nói to câu đoán, cả nhóm phán đúng/sai.
export function MrWhiteGuessScreen({ game, dispatch }) {
  const [pending, setPending] = useState(null) // null | true | false
  const player = game.players[game.lastOut]

  return (
    <section className="screen center">
      <p className="big-icon">🤔</p>
      <h1>{player.name}, hãy đoán từ của dân</h1>
      <p className="muted">
        Nói to câu đoán. Những ai biết từ của dân cùng quyết định đúng hay sai. Phải đúng từ mới thắng.
      </p>

      <div className="bottom-bar row">
        <button className="btn danger big" onClick={() => setPending(false)}>
          Đoán sai
        </button>
        <button className="btn success big" onClick={() => setPending(true)}>
          Đoán đúng
        </button>
      </div>

      {pending !== null ? (
        <ConfirmDialog
          title={pending ? 'Mr. White đoán đúng?' : 'Mr. White đoán sai?'}
          message={pending ? 'Mr. White sẽ thắng ngay.' : 'Mr. White bị loại, ván chơi tiếp tục.'}
          confirmLabel="Xác nhận"
          danger={!pending}
          onCancel={() => setPending(null)}
          onConfirm={() => dispatch({ type: 'mrWhiteGuess', correct: pending })}
        />
      ) : null}
    </section>
  )
}

// APP_FLOW 7.7: màn hình kết thúc.
export function EndScreen({ game, onReplay, onNewGame }) {
  return (
    <section className="screen">
      <div className={`winner-banner ${game.winner}`}>
        <p className="big-icon">🏆</p>
        <h1>{WINNER_LABEL[game.winner]}</h1>
      </div>

      <div className="words">
        <div>
          <p className="muted small">Từ của Dân</p>
          <p className="word">{game.words.civilian}</p>
        </div>
        <div>
          <p className="muted small">Từ của Undercover</p>
          <p className="word">{game.words.undercover}</p>
        </div>
      </div>

      <h3>Vai của mọi người</h3>
      <ul className="out-list">
        {game.players.map((p) => (
          <li key={p.name}>
            <span className={isAlive(p) ? '' : 'strike'}>{p.name}</span>
            <span className={`role-tag ${p.role}`}>{ROLE_LABEL[p.role]}</span>
            <span className="muted small">
              {isAlive(p) ? 'còn trong ván' : `bị loại vòng ${p.outRound}`}
            </span>
          </li>
        ))}
      </ul>

      <div className="bottom-bar row">
        <button className="btn" onClick={onNewGame}>
          Tạo ván mới
        </button>
        <button className="btn primary big" onClick={onReplay}>
          Chơi lại
        </button>
      </div>
    </section>
  )
}
