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
        <p className="muted">Mr. White được đoán từ của dân 1 lần bằng cách tự gõ vào máy. Đoán đúng là thắng ngay.</p>
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

// APP_FLOW 7.5: Mr. White tự gõ câu đoán, app tự so với từ của dân. Không ai
// phải phán đúng/sai nên không lộ ai biết từ nào.
export function MrWhiteGuessScreen({ game, dispatch }) {
  const [guess, setGuess] = useState('')
  const [confirming, setConfirming] = useState(false)
  const player = game.players[game.lastOut]
  const canSubmit = guess.trim() !== ''

  const handleSubmit = (e) => {
    e.preventDefault()
    if (canSubmit) setConfirming(true)
  }

  return (
    <section className="screen center">
      <p className="big-icon">🤔</p>
      <h1>{player.name}, hãy đoán từ của dân</h1>
      <p className="muted">Đưa máy cho {player.name}. Những người khác đừng nhìn màn hình.</p>

      <form className="guess-form" onSubmit={handleSubmit}>
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Nhập từ của dân"
          aria-label="Câu đoán của Mr. White"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
        />
        <p className="muted small">Chỉ được đoán 1 lần. Không phân biệt viết hoa, viết thường.</p>
        <div className="bottom-bar">
          <button type="submit" className="btn primary big" disabled={!canSubmit}>
            Gửi câu đoán
          </button>
        </div>
      </form>

      {confirming ? (
        <ConfirmDialog
          title="Gửi câu đoán?"
          message="Chỉ được đoán 1 lần, không sửa lại được."
          confirmLabel="Gửi"
          onCancel={() => setConfirming(false)}
          onConfirm={() => dispatch({ type: 'mrWhiteGuess', guess })}
        />
      ) : null}
    </section>
  )
}

// Đoán sai: chỉ báo sai, không hiện câu đoán hay từ của dân.
export function MrWhiteWrongScreen({ game, dispatch }) {
  const player = game.players[game.lastOut]
  const winner = checkWinner(game.players)

  return (
    <section className="screen center">
      <p className="big-icon">❌</p>
      <h1>Đoán sai!</h1>
      <p className="muted">
        {player.name} bị loại. {winner ? 'Ván đã có kết quả.' : 'Ván chơi tiếp tục.'}
      </p>

      <div className="bottom-bar">
        <button className="btn primary big" onClick={() => dispatch({ type: 'afterMrWhiteWrong' })}>
          {winner ? 'Xem kết quả' : `Sang vòng ${game.round + 1}`}
        </button>
      </div>
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
