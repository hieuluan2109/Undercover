# Đã làm

Mới nhất ở trên. Chi tiết luồng xem [APP_FLOW.md](../APP_FLOW.md).

## Branch `feature/online-peerjs` (thử nghiệm, chưa merge vào `main`)

### 2026-11-12: Người đến muộn chờ ván sau, giữ màn hình sáng (`7f52bdc`)
- Quét QR khi ván đang chơi → vào danh sách chờ; "Chơi lại" thêm họ vào phòng chờ. Quét lúc host đang chọn vai → vào thẳng danh sách.
- Chế độ nhiều máy luôn hiện cả thứ tự nói.
- Máy người chơi nhớ tên đã dùng (`undercover:lastName:v1`).
- Screen Wake Lock cho máy host (đang trong ván) và máy người chơi (`src/online/useWakeLock.js`).

### 2026-11-12: Chơi nhiều máy qua PeerJS (`d646df0`)
- Host mở phòng (mã 5 ký tự + QR, link `?room=MÃ`), người chơi quét → nhập tên (trùng tên thì nhập lại, mất kết nối thì nhận lại tên cũ).
- Mỗi người xem từ trên máy mình; host điều khiển ván; Mr. White đoán trên máy mình.
- Host chỉ gửi cho mỗi máy phần nó được thấy (`viewFor` trong `src/online/protocol.js`).
- Tự kết nối lại khi tải lại trang (cả host lẫn người chơi), ping mỗi 4 giây.
- Đã thử trên trình duyệt với nhiều tab; **chưa thử trên điện thoại thật**.

## Branch `main`

### 2026-11-12: Không lặp cặp từ đã chơi (`40e6c51`)
- Bỏ chế độ "Lần lượt"; mỗi ván bốc ngẫu nhiên 1 cặp chưa chơi, hết kho thì bắt đầu lại.
- Lưu cặp đã chơi theo chữ (`undercover:playedPairs:v1`). Màn chọn vai hiện "Còn N / tổng"; Cài đặt có nút đặt lại.
- Sửa: bốc cặp chuyển ra khỏi reducer (StrictMode gọi reducer 2 lần làm đánh dấu 2 cặp).

### 2026-11-12: Nhóm người chơi (`fe819c3`)
- Lưu, sửa, nhân bản, xóa nhóm (`undercover:groups:v1`). Màn nhập người chơi có "Chọn nhóm" / "Lưu nhóm".
- Chia sẻ sang máy khác bằng chữ, mỗi tên một dòng (chép / gửi qua app khác / dán).

### 2026-11-12: Hoàn tác và kết thúc ván ngay (`02b04ed`)
- Menu ⋮ trong ván: hoàn tác từng bước (chỉ trong lúc chơi, tối đa 30 bước, không lùi qua câu đoán của Mr. White), kết thúc ván ngay ("Ván đã dừng").

### 2026-10-21: Bản đầu
- Chơi một máy chuyền tay: nhập người chơi, chọn số vai, xem từ bí mật, các vòng, Mr. White tự gõ câu đoán (app tự chấm), sắp xếp lại người chơi, kho 186 cặp từ.
