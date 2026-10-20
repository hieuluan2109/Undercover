// Nội dung bí mật của một người: chỉ hiện từ, không ghi vai (RULES 1).
export function SecretWord({ player }) {
  if (player.word === null) {
    return (
      <div className="secret">
        <p className="secret-label">{player.name}</p>
        <p className="secret-word">Bạn là Mr. White</p>
        <p className="muted">Bạn không có từ. Hãy nghe mọi người mô tả rồi ứng biến.</p>
      </div>
    )
  }
  return (
    <div className="secret">
      <p className="secret-label">Từ của {player.name} là</p>
      <p className="secret-word">{player.word}</p>
      <p className="muted">Bạn phải tự đoán mình là Dân thường hay Undercover.</p>
    </div>
  )
}
