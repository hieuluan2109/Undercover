// Màn hình chính, Cài đặt (APP_FLOW 8) và tóm tắt luật chơi.

export function HomeScreen({ hasGame, onContinue, onNewGame, onSettings, onRules }) {
  return (
    <section className="screen center">
      <p className="big-icon">🕵️</p>
      <h1 className="title">Undercover</h1>
      <p className="muted">Một điện thoại, chuyền tay nhau chơi.</p>

      <div className="stack">
        {hasGame ? (
          <button className="btn primary big" onClick={onContinue}>
            Tiếp tục ván đang chơi
          </button>
        ) : null}
        <button className={hasGame ? 'btn big' : 'btn primary big'} onClick={onNewGame}>
          Tạo ván mới
        </button>
        <button className="btn" onClick={onSettings}>
          ⚙️ Cài đặt
        </button>
        <button className="btn ghost" onClick={onRules}>
          📖 Luật chơi
        </button>
      </div>
    </section>
  )
}

export function SettingsScreen({ settings, onChange, onBack }) {
  return (
    <section className="screen">
      <h1>Cài đặt</h1>

      <h3>Thứ tự nói</h3>
      <div className="segmented">
        <button
          className={settings.speakingOrder === 'first' ? 'active' : ''}
          onClick={() => onChange({ ...settings, speakingOrder: 'first' })}
        >
          Chỉ người nói đầu
        </button>
        <button
          className={settings.speakingOrder === 'full' ? 'active' : ''}
          onClick={() => onChange({ ...settings, speakingOrder: 'full' })}
        >
          Cả thứ tự
        </button>
      </div>
      <p className="muted small">
        {settings.speakingOrder === 'first'
          ? 'App chỉ báo ai nói trước, sau đó cả nhóm nói vòng quanh bàn.'
          : 'App hiện thứ tự nói của tất cả mọi người.'}
      </p>

      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.allowMrWhiteFirst}
          onChange={(e) => onChange({ ...settings, allowMrWhiteFirst: e.target.checked })}
        />
        <span>
          Cho phép Mr. White nói đầu
          <span className="muted small block">Mặc định tắt, để Mr. White nghe được ít nhất một gợi ý.</span>
        </span>
      </label>

      <p className="muted small">Cài đặt áp dụng từ ván tiếp theo.</p>

      <div className="bottom-bar">
        <button className="btn primary big" onClick={onBack}>
          Xong
        </button>
      </div>
    </section>
  )
}

const rulesContent = (
  <div className="rules">
    <h3>Các vai</h3>
    <ul>
      <li>
        <strong>Dân thường:</strong> đông nhất, cùng nhận một từ. Mục tiêu: loại hết kẻ xâm nhập.
      </li>
      <li>
        <strong>Undercover:</strong> nhận một từ hơi khác. Phải tự đoán ra mình là Undercover và ẩn mình.
      </li>
      <li>
        <strong>Mr. White:</strong> không có từ. Sống sót đến cuối, hoặc đoán đúng từ của dân khi bị loại.
      </li>
    </ul>
    <p className="muted small">Lúc đầu không ai biết vai của mình, chỉ thấy từ.</p>

    <h3>Mỗi vòng</h3>
    <ol>
      <li>Mô tả: lần lượt nói một từ hoặc cụm từ ngắn về từ của mình.</li>
      <li>Thảo luận: tìm ra ai là kẻ xâm nhập.</li>
      <li>Bỏ phiếu: người nhiều phiếu nhất bị loại, vai được công khai. Hòa phiếu thì oẳn tù tì.</li>
    </ol>
    <p className="muted small">Người đã bị loại không được bỏ phiếu nữa.</p>

    <h3>Thắng thua</h3>
    <ul>
      <li>
        <strong>Dân thường</strong> thắng khi loại hết Undercover và Mr. White.
      </li>
      <li>
        <strong>Kẻ xâm nhập</strong> thắng khi chỉ còn 1 Dân thường.
      </li>
      <li>
        <strong>Mr. White</strong> bị loại được đoán từ của dân 1 lần, đúng là thắng ngay. Cả nhóm phán đúng sai.
      </li>
    </ul>
  </div>
)

export function RulesScreen({ onBack }) {
  return (
    <section className="screen">
      <h1>Luật chơi</h1>
      {rulesContent}
      <div className="bottom-bar">
        <button className="btn primary big" onClick={onBack}>
          Đã hiểu
        </button>
      </div>
    </section>
  )
}
