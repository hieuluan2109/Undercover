import { useState } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS, normalizeName, validateNewName } from '../game.js'
import { MAX_NAME_LENGTH } from '../groups.js'

// Ô thêm tên + danh sách tên có nút lên/xuống/xóa. Dùng chung cho màn nhập
// người chơi và màn sửa nhóm.
export function NameListEditor({ names, onAdd, onRemove, onMove }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)

  const count = names.length
  const full = count >= MAX_PLAYERS
  const enough = count >= MIN_PLAYERS

  const add = (e) => {
    e.preventDefault()
    const problem = validateNewName(input, names)
    if (problem) {
      setError(problem)
      return
    }
    onAdd(normalizeName(input))
    setInput('')
    setError(null)
  }

  return (
    <>
      <form className="add-form" onSubmit={add}>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError(null)
          }}
          placeholder={full ? `Đã đủ ${MAX_PLAYERS} người` : 'Tên người chơi'}
          disabled={full}
          autoFocus
          enterKeyHint="done"
          maxLength={MAX_NAME_LENGTH}
        />
        <button className="btn primary" type="submit" disabled={full || !normalizeName(input)}>
          Thêm
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}

      <p className={enough ? 'counter ok' : 'counter'}>
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
                onClick={() => onMove(i, -1)}
              >
                ↑
              </button>
              <button
                className="icon-btn"
                aria-label={`Chuyển ${name} xuống dưới`}
                disabled={i === count - 1}
                onClick={() => onMove(i, 1)}
              >
                ↓
              </button>
              <button className="icon-btn" aria-label={`Xóa ${name}`} onClick={() => onRemove(i)}>
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}
