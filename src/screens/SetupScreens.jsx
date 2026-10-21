import { useState } from 'react'
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  civilianCount,
  normalizeName,
  validateCounts,
  validateNewName,
} from '../game.js'

// APP_FLOW 3.2: nhập người chơi.
export function PlayersScreen({ names, dispatch }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)

  const count = names.length
  const full = count >= MAX_PLAYERS
  const canContinue = count >= MIN_PLAYERS && count <= MAX_PLAYERS

  const add = (e) => {
    e.preventDefault()
    const problem = validateNewName(input, names)
    if (problem) {
      setError(problem)
      return
    }
    dispatch({ type: 'addName', name: input })
    setInput('')
    setError(null)
  }

  return (
    <section className="screen">
      <h1>Người chơi</h1>
      <p className="muted">Nhập tên từng người, kể cả bạn. Thứ tự này cũng là thứ tự chuyền máy xem từ.</p>

      <form className="add-form" onSubmit={add}>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError(null)
          }}
          placeholder={full ? 'Đã đủ 20 người' : 'Tên người chơi'}
          disabled={full}
          autoFocus
          enterKeyHint="done"
          maxLength={24}
        />
        <button className="btn primary" type="submit" disabled={full || !normalizeName(input)}>
          Thêm
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}

      <p className={canContinue ? 'counter ok' : 'counter'}>
        Đã có {count} người (tối thiểu {MIN_PLAYERS}, tối đa {MAX_PLAYERS})
      </p>

      <ol className="player-list">
        {names.map((name, i) => (
          <li key={name}>
            <span>{name}</span>
            <div className="player-actions">
              <button
                className="icon-btn"
                aria-label={`Chuyển ${name} lên trên`}
                disabled={i === 0}
                onClick={() => dispatch({ type: 'moveName', index: i, delta: -1 })}
              >
                ↑
              </button>
              <button
                className="icon-btn"
                aria-label={`Chuyển ${name} xuống dưới`}
                disabled={i === count - 1}
                onClick={() => dispatch({ type: 'moveName', index: i, delta: 1 })}
              >
                ↓
              </button>
              <button
                className="icon-btn"
                aria-label={`Xóa ${name}`}
                onClick={() => dispatch({ type: 'removeName', index: i })}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="bottom-bar">
        <button
          className="btn primary big"
          disabled={!canContinue}
          onClick={() => dispatch({ type: 'toRoles' })}
        >
          Tiếp tục
        </button>
      </div>
    </section>
  )
}

function Stepper({ label, hint, value, onChange, canIncrease }) {
  return (
    <div className="stepper">
      <div>
        <div className="stepper-label">{label}</div>
        <div className="muted small">{hint}</div>
      </div>
      <div className="stepper-controls">
        <button
          className="icon-btn big"
          aria-label={`Bớt ${label}`}
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <span className="stepper-value">{value}</span>
        <button
          className="icon-btn big"
          aria-label={`Thêm ${label}`}
          disabled={!canIncrease}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

// APP_FLOW 3.3: chọn số vai và chế độ chọn cặp từ.
export function RolesScreen({ game, dispatch, onStart }) {
  const total = game.names.length
  const { counts } = game
  const civilians = civilianCount(total, counts)
  const problem = validateCounts(total, counts)

  const setCount = (role) => (value) => dispatch({ type: 'setCount', role, value })

  return (
    <section className="screen">
      <h1>Chọn số vai</h1>
      <p className="muted">{total} người chơi</p>

      <Stepper
        label="Undercover"
        hint="Nhận từ hơi khác"
        value={counts.undercover}
        onChange={setCount('undercover')}
        canIncrease={civilians > 0}
      />
      <Stepper
        label="Mr. White"
        hint="Không có từ"
        value={counts.mrWhite}
        onChange={setCount('mrWhite')}
        canIncrease={civilians > 0}
      />
      <div className="stepper">
        <div>
          <div className="stepper-label">Dân thường</div>
          <div className="muted small">Tự tính</div>
        </div>
        <span className="stepper-value">{civilians}</span>
      </div>

      {problem ? <p className="error">{problem}</p> : null}

      <h3>Chọn cặp từ</h3>
      <div className="segmented">
        <button
          className={game.pairMode === 'random' ? 'active' : ''}
          onClick={() => dispatch({ type: 'setPairMode', mode: 'random' })}
        >
          Ngẫu nhiên
        </button>
        <button
          className={game.pairMode === 'sequential' ? 'active' : ''}
          onClick={() => dispatch({ type: 'setPairMode', mode: 'sequential' })}
        >
          Lần lượt
        </button>
      </div>
      <p className="muted small">
        {game.pairMode === 'random'
          ? 'Mỗi ván bốc ngẫu nhiên 1 cặp (có thể trùng cặp đã chơi).'
          : 'Chơi lần lượt từng cặp, hết kho thì quay lại cặp đầu.'}
      </p>

      <div className="bottom-bar row">
        <button className="btn" onClick={() => dispatch({ type: 'backToPlayers' })}>
          Quay lại
        </button>
        <button className="btn primary big" disabled={problem !== null} onClick={onStart}>
          Bắt đầu
        </button>
      </div>
    </section>
  )
}
