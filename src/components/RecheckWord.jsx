import { useState } from 'react'
import { Dialog } from './Dialog.jsx'
import { SecretWord } from './SecretWord.jsx'
import { isAlive } from '../game.js'

// Nút "Xem lại từ" (APP_FLOW 3.6): chọn tên → xác nhận → xem → OK.
// Chỉ người còn trong ván mới được xem lại.
export function RecheckWord({ players }) {
  const [step, setStep] = useState(null) // null | 'pick' | 'confirm' | 'show'
  const [index, setIndex] = useState(null)

  const close = () => {
    setStep(null)
    setIndex(null)
  }

  const pick = (i) => {
    setIndex(i)
    setStep('confirm')
  }

  return (
    <>
      <button className="btn" onClick={() => setStep('pick')}>
        👁 Xem lại từ
      </button>

      {step === 'pick' ? (
        <Dialog onClose={close}>
          <h2>Bạn là ai?</h2>
          <div className="name-grid">
            {players.map((p, i) =>
              isAlive(p) ? (
                <button key={p.name} className="btn" onClick={() => pick(i)}>
                  {p.name}
                </button>
              ) : null,
            )}
          </div>
          <button className="btn ghost" onClick={close}>
            Hủy
          </button>
        </Dialog>
      ) : null}

      {step === 'confirm' ? (
        <Dialog onClose={close}>
          <h2>Có chắc chắn không?</h2>
          <p className="muted">
            Chỉ <strong>{players[index].name}</strong> được nhìn màn hình. Những người khác quay đi.
          </p>
          <div className="row">
            <button className="btn" onClick={close}>
              Hủy
            </button>
            <button className="btn primary" onClick={() => setStep('show')}>
              Tôi là {players[index].name}
            </button>
          </div>
        </Dialog>
      ) : null}

      {step === 'show' ? (
        <Dialog onClose={close}>
          <SecretWord player={players[index]} />
          <button className="btn primary" onClick={close}>
            OK
          </button>
        </Dialog>
      ) : null}
    </>
  )
}
