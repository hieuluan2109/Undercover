# Undercover

Web app chơi Undercover cho nhóm, chạy trên trình duyệt điện thoại. React 19 + Vite, không có backend, lưu mọi thứ trong localStorage. Deploy trên Vercel (push `main` = deploy production, branch khác = link preview).

## Đọc trước khi làm
- Luật chơi: [.docs/RULES.md](.docs/RULES.md). Luồng màn hình: [.docs/APP_FLOW.md](.docs/APP_FLOW.md).
- Đã làm gì: [.docs/notes/CHANGELOG.md](.docs/notes/CHANGELOG.md).
- Việc đang chờ, vấn đề đã biết: [.docs/notes/BACKLOG.md](.docs/notes/BACKLOG.md).
- Quyết định đã chốt (đừng bàn lại): [.docs/notes/DECISIONS.md](.docs/notes/DECISIONS.md).

## Lệnh
- `npm run dev`: chạy dev (có `--host` để mở từ điện thoại cùng mạng).
- `npm run lint`: oxlint. `npm run build`: build production.
- Chưa có test tự động; kiểm tra logic bằng script node gọi thẳng `src/game.js`, và thử giao diện trên trình duyệt ở khổ điện thoại.

## Cấu trúc
- `src/game.js`: luật + reducer (hàm thuần). Hoàn tác, kết thúc ván, phòng online đều nằm ở đây.
- `src/storage.js`: khóa localStorage (có version `:v1`).
- `src/groups.js`: nhóm người chơi đã lưu.
- `src/words.js`: kho cặp từ, thêm cặp mới vào cuối.
- `src/screens/`, `src/components/`: giao diện.
- `src/online/` (chỉ trên branch `feature/online-peerjs`): chơi nhiều máy qua PeerJS.

## Quy ước
- Trao đổi với người dùng bằng **tiếng Việt**. Chữ trên giao diện và comment trong code cũng bằng tiếng Việt; commit message bằng tiếng Anh.
- **Commit bằng git user của máy (Luan Nguyen), không thêm dòng `Co-Authored-By: Claude`**. Commit có tác giả Claude thì Vercel không tự build.
- Tính năng lớn: lên kế hoạch, chờ người dùng chốt rồi mới làm. Thử nghiệm thì làm trên branch riêng.
- Làm xong một việc: cập nhật `APP_FLOW.md` nếu đổi luồng, và ghi vào `.docs/notes/` (xem hướng dẫn trong [.docs/notes/README.md](.docs/notes/README.md)).
