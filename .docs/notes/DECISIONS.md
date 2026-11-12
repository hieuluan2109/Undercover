# Quyết định đã chốt

Mới nhất ở trên. Muốn đổi thì hỏi lại người dùng trước.

## Quy trình
- **Commit bằng tài khoản Luan Nguyen, không có `Co-Authored-By: Claude`** (2026-11-12). Commit có tác giả Claude thì Vercel không tự build.
- Tính năng lớn: tìm hiểu → gửi kế hoạch → người dùng chốt → mới làm. Tính năng thử nghiệm làm trên branch riêng, dùng link preview của Vercel để thử.
- Trao đổi bằng tiếng Việt.
- **Chưa dùng subagent** (2026-11-12). Không làm subagent để code, vì nó phải đọc lại ngữ cảnh từ đầu và tốn token hơn. Kiểm tra chất lượng thì dùng `/code-review` trước khi merge; khi cần mới tạo subagent reviewer (chỉ đọc).

## Chơi nhiều máy (branch `feature/online-peerjs`)
- **Dùng PeerJS (WebRTC), không dùng backend** (2026-11-12). Không cần tài khoản dịch vụ, và từ của từng người được gửi riêng tới đúng máy đó.
  - **Không chuyển sang Next.js / WebSocket trên Vercel**: Next.js không làm kết nối tốt hơn. WebSocket trên Vercel bị cắt sau 5 phút (gói Hobby) và cần Redis để đồng bộ phòng giữa các instance.
- **Thảo luận và bỏ phiếu diễn ra ngoài đời; host loại người bằng tay.** Bỏ phiếu trong app để sau.
- **Host là người tin cậy:** không chặn việc host xem từ của người khác.
- Vẫn giữ chế độ một máy chuyền tay; chế độ nhiều máy là lựa chọn thêm.
- Chế độ nhiều máy luôn hiện cả thứ tự nói.
- Người vào phòng giữa ván thì chờ ván sau, "Chơi lại" sẽ thêm họ vào.
- Host được thêm người bằng tay; người đó dùng chung máy host. Thêm tay mà trùng tên thì báo lỗi, không thay chỗ người đã có.
- Định danh mỗi máy bằng token lưu trong sessionStorage (mỗi tab là một người). Mất token thì nhập đúng tên cũ để vào lại, miễn là máy cũ giữ tên đó đã mất kết nối.

## Tên gọi
- Trên giao diện: Undercover = **Mũ Đen**, Mr. White = **Mũ Trắng** (2026-11-12). Tên game vẫn là "Undercover"; tài liệu luật và tên biến trong code giữ tên gốc.

## Cặp từ
- **Chỉ có chế độ ngẫu nhiên không lặp**, đã bỏ chế độ "Lần lượt" (2026-11-12).
- Cặp đã chơi được nhận diện bằng chữ của 2 từ, không theo vị trí. Một cặp được tính là đã chơi khi bấm "Bắt đầu".
- Không hiện danh sách từ đã chơi / chưa chơi (host cũng là người chơi). Không có nút đổi cặp giữa ván.
- Danh sách cặp đã chơi lưu riêng trên từng máy, bắt đầu đếm từ 0.

## Nhóm người chơi
- Chia sẻ bằng chữ thường, mỗi tên một dòng (sửa tay được trong Zalo). Không làm link chia sẻ.
- "Chơi lại" giữ danh sách của ván trước, không bắt chọn lại nhóm.

## Hoàn tác / kết thúc ván
- Chỉ hoàn tác trong lúc chơi (từ Vòng 1), không hoàn tác lúc chuyền máy xem từ.
- Không lùi qua câu đoán của Mr. White, để Mr. White không đoán lại được.
- Ván đã kết thúc thì không hoàn tác được nữa (từ và vai đã công khai).
- Kết thúc sớm vẫn hiện hai từ và vai của mọi người.
