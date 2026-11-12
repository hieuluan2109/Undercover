import { useState } from 'react'
import { SecretWord } from './SecretWord.jsx'

// Chơi nhiều máy: mỗi người tự bấm xem từ trên máy mình, mặc định ẩn để người
// ngồi cạnh không nhìn thấy.
export function MyWord({ player, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen)

  return (
    <div className="card my-word">
      {open ? <SecretWord player={player} /> : <p className="muted">Từ của bạn đang được ẩn.</p>}
      <button className="btn" onClick={() => setOpen(!open)}>
        {open ? '🙈 Ẩn từ' : '👁 Xem từ của tôi'}
      </button>
    </div>
  )
}
