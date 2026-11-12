import { useRef, useState } from 'react'
import { ConfirmDialog, Dialog } from '../components/Dialog.jsx'
import { NameListEditor } from '../components/NameListEditor.jsx'
import { normalizeName } from '../game.js'
import { MAX_NAME_LENGTH, defaultGroupName, formatNames, moveItem, newGroupId, parseNames } from '../groups.js'

// Chép vào clipboard. navigator.clipboard chỉ có trên HTTPS/localhost, nên khi
// mở qua IP mạng LAN thì chép bằng cách chọn chữ trong ô rồi execCommand.
async function copyText(text, textarea) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    textarea?.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    }
  }
}

// Hiện danh sách tên dạng chữ để chép hoặc gửi qua app khác (Zalo, Messenger...).
function ShareDialog({ group, onClose }) {
  const text = formatNames(group.names)
  const ref = useRef(null)
  const [status, setStatus] = useState(null)
  const canShare = typeof navigator.share === 'function'

  const copy = async () => {
    const ok = await copyText(text, ref.current)
    setStatus(ok ? 'Đã chép. Dán vào Zalo/Messenger để gửi cho máy khác.' : 'Không chép được, hãy tự chọn chữ trong ô rồi chép.')
  }

  const share = async () => {
    try {
      await navigator.share({ title: group.name, text })
    } catch {
      // Người dùng đóng bảng chia sẻ, không cần báo gì.
    }
  }

  return (
    <Dialog onClose={onClose}>
      <h2>Chia sẻ "{group.name}"</h2>
      <p className="muted small">Máy kia mở Nhóm người chơi → "Dán nhóm" rồi dán đoạn này vào.</p>
      <textarea ref={ref} className="names-text" readOnly value={text} rows={Math.min(group.names.length, 8)} />
      {status ? <p className="notice small">{status}</p> : null}
      <div className="menu-list">
        <button className="btn primary" onClick={copy}>
          📋 Chép danh sách
        </button>
        {canShare ? (
          <button className="btn" onClick={share}>
            📤 Gửi qua ứng dụng khác
          </button>
        ) : null}
        <button className="btn ghost" onClick={onClose}>
          Đóng
        </button>
      </div>
    </Dialog>
  )
}

// Dán danh sách tên nhận từ máy khác, xem trước rồi mở màn sửa nhóm để lưu.
function ImportDialog({ onNext, onClose }) {
  const [text, setText] = useState('')
  const { names, duplicates, overflow } = parseNames(text)

  return (
    <Dialog onClose={onClose}>
      <h2>Dán nhóm</h2>
      <p className="muted small">Mỗi tên một dòng (hoặc cách nhau bằng dấu phẩy).</p>
      <textarea
        className="names-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Lan\nMinh\nHùng'}
        rows={8}
        autoFocus
      />
      <p className={names.length > 0 ? 'counter ok' : 'counter'}>Đọc được {names.length} tên</p>
      {duplicates > 0 ? <p className="muted small">Bỏ {duplicates} tên trùng.</p> : null}
      {overflow > 0 ? <p className="error small">Quá 20 người, bỏ {overflow} tên cuối.</p> : null}
      <div className="row">
        <button className="btn" onClick={onClose}>
          Hủy
        </button>
        <button className="btn primary" disabled={names.length === 0} onClick={() => onNext(names)}>
          Tiếp tục
        </button>
      </div>
    </Dialog>
  )
}

function GroupEditor({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial.name)
  const [names, setNames] = useState(initial.names)
  const clean = normalizeName(name)

  return (
    <section className="screen">
      <h1>{initial.isNew ? 'Nhóm mới' : 'Sửa nhóm'}</h1>

      <label className="field">
        <span className="muted small">Tên nhóm</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_NAME_LENGTH} />
      </label>

      <NameListEditor
        names={names}
        onAdd={(n) => setNames([...names, n])}
        onRemove={(index) => setNames(names.filter((_, i) => i !== index))}
        onMove={(index, delta) => setNames(moveItem(names, index, delta))}
      />

      <div className="bottom-bar row">
        <button className="btn" onClick={onCancel}>
          Hủy
        </button>
        <button
          className="btn primary big"
          disabled={!clean || names.length === 0}
          onClick={() => onSave({ id: initial.id, name: clean, names })}
        >
          Lưu nhóm
        </button>
      </div>
    </section>
  )
}

// Màn quản lý nhóm người chơi: tạo, sửa, nhân bản, xóa, chia sẻ, dán từ máy khác.
export function GroupsScreen({ groups, onChange, onBack }) {
  const [editing, setEditing] = useState(null) // { id, name, names, isNew }
  const [dialog, setDialog] = useState(null) // { type: 'share' | 'delete' | 'import', group? }

  const close = () => setDialog(null)

  const save = (group) => {
    const exists = groups.some((g) => g.id === group.id)
    onChange(exists ? groups.map((g) => (g.id === group.id ? group : g)) : [group, ...groups])
    setEditing(null)
  }

  const startNew = (names = []) => {
    setEditing({ id: newGroupId(), name: defaultGroupName(groups), names, isNew: true })
    close()
  }

  const duplicate = (group) => {
    const copy = { id: newGroupId(), name: `${group.name} (bản sao)`.slice(0, MAX_NAME_LENGTH), names: group.names }
    const at = groups.findIndex((g) => g.id === group.id)
    onChange([...groups.slice(0, at + 1), copy, ...groups.slice(at + 1)])
  }

  if (editing) {
    return <GroupEditor key={editing.id} initial={editing} onSave={save} onCancel={() => setEditing(null)} />
  }

  return (
    <section className="screen">
      <h1>Nhóm người chơi</h1>
      <p className="muted">Lưu sẵn các nhóm hay chơi cùng, lúc tạo ván chỉ cần bấm "Chọn nhóm".</p>

      {groups.length === 0 ? <p className="muted small">Chưa có nhóm nào.</p> : null}

      {groups.map((g) => (
        <div key={g.id} className="card group-card">
          <p>
            <strong>{g.name}</strong> <span className="muted small">· {g.names.length} người</span>
          </p>
          <p className="muted small group-names">{g.names.join(', ')}</p>
          <div className="group-card-actions">
            <button className="btn" onClick={() => setEditing(g)}>
              Sửa
            </button>
            <button className="btn" onClick={() => duplicate(g)}>
              Nhân bản
            </button>
            <button className="btn" onClick={() => setDialog({ type: 'share', group: g })}>
              Chia sẻ
            </button>
            <button className="btn" onClick={() => setDialog({ type: 'delete', group: g })}>
              Xóa
            </button>
          </div>
        </div>
      ))}

      <div className="bottom-bar">
        <div className="row">
          <button className="btn" onClick={() => startNew()}>
            + Tạo nhóm
          </button>
          <button className="btn" onClick={() => setDialog({ type: 'import' })}>
            📋 Dán nhóm
          </button>
        </div>
        <button className="btn primary big" onClick={onBack}>
          Xong
        </button>
      </div>

      {dialog?.type === 'share' ? <ShareDialog group={dialog.group} onClose={close} /> : null}
      {dialog?.type === 'import' ? <ImportDialog onNext={startNew} onClose={close} /> : null}
      {dialog?.type === 'delete' ? (
        <ConfirmDialog
          title={`Xóa nhóm "${dialog.group.name}"?`}
          message="Chỉ xóa nhóm đã lưu, không ảnh hưởng ván đang chơi."
          confirmLabel="Xóa"
          danger
          onCancel={close}
          onConfirm={() => {
            onChange(groups.filter((g) => g.id !== dialog.group.id))
            close()
          }}
        />
      ) : null}
    </section>
  )
}
