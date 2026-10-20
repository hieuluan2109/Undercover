import { ROLE_LABEL, isAlive } from '../game.js'

// Danh sách người còn trong ván và người đã bị loại (kèm vai đã công khai).
export function PlayerStatus({ players }) {
  const alive = players.filter(isAlive)
  const out = players.filter((p) => !isAlive(p)).sort((a, b) => a.outRound - b.outRound)

  return (
    <div className="status">
      <h3>Còn trong ván ({alive.length})</h3>
      <div className="chips">
        {alive.map((p) => (
          <span key={p.name} className="chip">
            {p.name}
          </span>
        ))}
      </div>
      {out.length > 0 ? (
        <>
          <h3>Đã bị loại ({out.length})</h3>
          <ul className="out-list">
            {out.map((p) => (
              <li key={p.name}>
                <span className="strike">{p.name}</span>
                <span className={`role-tag ${p.role}`}>{ROLE_LABEL[p.role]}</span>
                <span className="muted small">vòng {p.outRound}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
