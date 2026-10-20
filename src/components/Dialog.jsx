// Hộp thoại phủ toàn màn hình, dùng cho xác nhận và hiện từ bí mật.
export function Dialog({ children, onClose }) {
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <Dialog onClose={onCancel}>
      <h2>{title}</h2>
      {message ? <p className="muted">{message}</p> : null}
      <div className="row">
        <button className="btn" onClick={onCancel}>
          Hủy
        </button>
        <button className={danger ? 'btn danger' : 'btn primary'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
