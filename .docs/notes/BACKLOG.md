# Việc đang chờ

Mới nhất ở trên. Làm xong thì xóa ở đây và ghi vào [CHANGELOG.md](CHANGELOG.md).

## Đang chờ người dùng
- **Chơi thử chế độ nhiều máy với team** trên link preview của branch `feature/online-peerjs`, rồi quyết định merge vào `main`.
- Kiểm tra trên điện thoại thật: giữ màn hình sáng (Safari iOS 16.4+, Chrome Android), nút "Gửi qua ứng dụng khác" và "Chép danh sách" ở màn chia sẻ nhóm.

## Việc tiếp theo (đã bàn, chưa làm)
- **Kết nối (người dùng sẽ tự xử lý sau):** thêm TURN server dự phòng cho PeerJS. Đề xuất Cloudflare Realtime TURN (miễn phí 1.000 GB/tháng), cần một API nhỏ trên Vercel để cấp mật khẩu TURN tạm thời. Người dùng tự tạo tài khoản và key.
- **Bỏ phiếu trong app (để sau):** host bấm "Bắt đầu bình chọn" → mỗi người còn trong ván chọn một tên → kết quả hiện khi đủ phiếu → hòa thì oẳn tù tì ngoài đời → host xác nhận loại. Vẫn giữ cách loại thủ công.

## Vấn đề đã biết
- **Link preview của Vercel bắt đăng nhập** (Deployment Protection → Vercel Authentication), nên điện thoại quét QR bị chuyển về vercel.com. Cách xử lý: người dùng tắt Vercel Authentication trong Settings → Deployment Protection. Không phải lỗi code.
- Chế độ nhiều máy: máy dùng 4G và máy dùng WiFi đôi khi không kết nối được với nhau. Hiện chưa có TURN.
- WiFi quán, công ty hoặc mạng khách thường bật client isolation, nên các máy cùng WiFi vẫn không nối thẳng được. Cách tạm thời: host bật hotspot cho mọi người kết nối vào.
- Phụ thuộc máy chủ PeerJS miễn phí (0.peerjs.com) cho bước tìm thấy nhau. Máy chủ này trục trặc thì không mở được phòng.
- Host giữ toàn bộ ván nên xem được từ của mọi người. Đã chốt chấp nhận việc này, xem [DECISIONS.md](DECISIONS.md).

## Ý tưởng để sau
- Rung khi có sự kiện quan trọng (bị loại, đến lượt Mr. White đoán): người dùng nói hiện chưa cần.
- Chuyển quyền host, mời người ra khỏi phòng khi ván đang chơi.
