import { useState } from 'react'
import { Dialog } from '../components/Dialog.jsx'
import { NameListEditor } from '../components/NameListEditor.jsx'
import { MAX_PLAYERS, MIN_PLAYERS, civilianCount, normalizeName, validateCounts } from '../game.js'
import { MAX_NAME_LENGTH, defaultGroupName, newGroupId } from '../groups.js'

function PickGroupDialog({ groups, onPick, onClose }) {
  return (
    <Dialog onClose={onClose}>
      <h2>Chọn nhóm</h2>
      <p className="muted small">Danh sách hiện tại sẽ được thay bằng người trong nhóm.</p>
      <div className="menu-list">
        {groups.map((g) => (
          <button key={g.id} className="btn group-btn" onClick={() => onPick(g)}>
            <strong>{g.name}</strong>
            <span className="muted small">{g.names.length} người</span>
          </button>
        ))}
        <button className="btn ghost" onClick={onClose}>
          Hủy
        </button>
      </div>
    </Dialog>
  )
}

function SaveGroupDialog({ names, groups, onSave, onClose }) {
  const [name, setName] = useState(() => defaultGroupName(groups))
  const clean = normalizeName(name)

  return (
    <Dialog onClose={onClose}>
      <h2>Lưu thành nhóm</h2>
      <p className="muted small">Lưu {names.length} người hiện tại để lần sau chọn lại nhanh.</p>
      <form
        className="add-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (clean) onSave({ id: newGroupId(), name: clean, names })
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Tên nhóm"
          maxLength={MAX_NAME_LENGTH}
        />
        <button className="btn primary" type="submit" disabled={!clean}>
          Lưu
        </button>
      </form>
      {groups.length > 0 ? (
        <>
          <h3>Hoặc ghi đè nhóm cũ</h3>
          <div className="menu-list">
            {groups.map((g) => (
              <button key={g.id} className="btn group-btn" onClick={() => onSave({ ...g, names })}>
                <strong>{g.name}</strong>
                <span className="muted small">{g.names.length} người</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="menu-list">
        <button className="btn ghost" onClick={onClose}>
          Hủy
        </button>
      </div>
    </Dialog>
  )
}

// APP_FLOW 3.2: nhập người chơi.
export function PlayersScreen({ names, dispatch, groups, onGroupsChange }) {
  const [dialog, setDialog] = useState(null) // 'pick' | 'save' | null
  const [notice, setNotice] = useState(null)
  const canContinue = names.length >= MIN_PLAYERS && names.length <= MAX_PLAYERS

  const saveGroup = (group) => {
    const exists = groups.some((g) => g.id === group.id)
    onGroupsChange(exists ? groups.map((g) => (g.id === group.id ? group : g)) : [group, ...groups])
    setDialog(null)
    setNotice(`Đã lưu nhóm "${group.name}".`)
  }

  return (
    <section className="screen">
      <h1>Người chơi</h1>
      <p className="muted">Nhập tên từng người, kể cả bạn. Thứ tự này cũng là thứ tự chuyền máy xem từ.</p>

      <div className="row group-actions">
        <button className="btn" disabled={groups.length === 0} onClick={() => setDialog('pick')}>
          👥 Chọn nhóm
        </button>
        <button className="btn" disabled={names.length === 0} onClick={() => setDialog('save')}>
          💾 Lưu nhóm
        </button>
      </div>
      {notice ? <p className="notice small">{notice}</p> : null}

      <NameListEditor
        names={names}
        onAdd={(name) => {
          dispatch({ type: 'addName', name })
          setNotice(null)
        }}
        onRemove={(index) => dispatch({ type: 'removeName', index })}
        onMove={(index, delta) => dispatch({ type: 'moveName', index, delta })}
      />

      <div className="bottom-bar">
        <button
          className="btn primary big"
          disabled={!canContinue}
          onClick={() => dispatch({ type: 'toRoles' })}
        >
          Tiếp tục
        </button>
      </div>

      {dialog === 'pick' ? (
        <PickGroupDialog
          groups={groups}
          onClose={() => setDialog(null)}
          onPick={(g) => {
            dispatch({ type: 'setNames', names: g.names })
            setDialog(null)
            setNotice(`Đã chọn nhóm "${g.name}".`)
          }}
        />
      ) : null}
      {dialog === 'save' ? (
        <SaveGroupDialog names={names} groups={groups} onSave={saveGroup} onClose={() => setDialog(null)} />
      ) : null}
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
