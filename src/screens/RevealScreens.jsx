import { useState } from 'react'
import { SecretWord } from '../components/SecretWord.jsx'

// APP_FLOW 3.5: chuyền máy xem từ. App.jsx đặt key theo người chơi nên
// trạng thái "đang mở" luôn bắt đầu bằng false cho người mới.
export function RevealScreen({ player, index, total, dispatch }) {
  const [open, setOpen] = useState(false)

  if (open) {
    return (
      <section className="screen center secret-screen">
        <SecretWord player={player} />
        <div className="bottom-bar">
          <button className="btn primary big" onClick={() => dispatch({ type: 'markSeen' })}>
            Đã nhớ, ẩn đi
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="screen center">
      <p className="muted">
        Người {index + 1} / {total}
      </p>
      <p className="pass-hint">Đưa máy cho</p>
      <p className="big-name">{player.name}</p>
      <p className="muted">Những người khác đừng nhìn màn hình nhé.</p>
      <div className="bottom-bar">
        <button className="btn primary big" onClick={() => setOpen(true)}>
          Tôi là {player.name}, xem từ
        </button>
      </div>
    </section>
  )
}

export function AllSeenScreen({ dispatch }) {
  return (
    <section className="screen center">
      <p className="big-icon">✅</p>
      <h1>Mọi người đã xem từ</h1>
      <p className="muted">Đặt máy ra giữa bàn để cả nhóm cùng thấy.</p>
      <div className="bottom-bar">
        <button className="btn primary big" onClick={() => dispatch({ type: 'beginRounds' })}>
          Bắt đầu chơi
        </button>
      </div>
    </section>
  )
}
