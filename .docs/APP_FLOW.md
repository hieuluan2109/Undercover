# Undercover: Luồng ứng dụng

Tài liệu mô tả luồng ứng dụng web Undercover cho nhóm. Luật chơi xem tại [RULES.md](RULES.md).

> - **Phần 1 (mục 1–6):** chuẩn bị ván chơi: nhập người chơi → chia vai → từng người xem từ bí mật.
> - **Phần 2 (mục 7):** diễn biến ván chơi: mô tả → bỏ phiếu → loại người → thắng/thua.
> - **Cài đặt (mục 8).**

---

## 1. Quyết định kỹ thuật

| Mục | Quyết định |
|---|---|
| Nền tảng | Web app, chạy trên Safari / Chrome của điện thoại |
| Công nghệ | React JS |
| Backend | **Không có.** Mọi thứ chạy trên trình duyệt |
| Cách chơi | **Một điện thoại, chuyền tay** (pass-and-play). Cả nhóm ngồi cùng một chỗ |
| Chủ phòng (host) | Là người cầm máy lúc đầu, **cũng là một người chơi** như mọi người |
| Từ khóa | **Danh sách cặp từ tiếng Việt có sẵn** trong app. Host chọn lấy cặp theo kiểu ngẫu nhiên hoặc lần lượt (mục 3.3) |

Vì chỉ dùng một máy nên **không cần phòng, mã phòng hay kết nối mạng** giữa các máy.

---

## 2. Luồng tổng quan

```
[Màn hình chính]
      │  Bấm "Tạo ván mới"
      ▼
[Nhập người chơi]   ← host gõ tên từng người (kể cả chính mình)
      │  Bấm "Tiếp tục" (khi có ≥ 3 người)
      ▼
[Chọn số vai]       ← số Undercover, số Mr. White
      │  Bấm "Bắt đầu"
      ▼
(App chia vai ngẫu nhiên + chọn cặp từ ngẫu nhiên)
      │
      ▼
[Chuyền máy xem từ] ← lặp lại cho từng người
      │  Khi tất cả đã xem
      ▼
[Bắt đầu chơi]      → Phần 2 (mục 7)
```

---

## 3. Chi tiết từng màn hình

### 3.1. Màn hình chính
- Tên trò chơi.
- Nút **"Tạo ván mới"**.
- Nút **"Cài đặt"** (mục 8).
- (Tùy chọn) Link tới luật chơi.

### 3.2. Nhập người chơi
- Ô nhập tên + nút **"Thêm"**.
- Danh sách người chơi đã thêm, mỗi người có nút **xóa**.
- Bộ đếm: "Đã có N người (tối thiểu 3, tối đa 20)".
- Nút **"Tiếp tục"**: chỉ bấm được khi có từ 3 đến 20 người.

**Kiểm tra tên:**
- Không được để trống (bỏ khoảng trắng đầu/cuối).
- **Không được trùng tên** (không phân biệt hoa/thường). Ví dụ "Lan" và "lan" tính là trùng.
- Không thêm được người thứ 21.

### 3.3. Chọn số vai
- Hiển thị tổng số người chơi.
- Chọn **số Undercover** (nút − / +).
- Chọn **số Mr. White** (nút − / +).
- **Số Dân thường** = tổng người − Undercover − Mr. White (tự tính, chỉ hiển thị).
- **Chế độ chọn cặp từ** (host chọn, mặc định là **Ngẫu nhiên**):
  - **Ngẫu nhiên:** mỗi ván bốc ngẫu nhiên 1 cặp trong kho (có thể trùng cặp đã chơi).
  - **Lần lượt:** chơi cặp 1, 2, 3... đến hết kho rồi quay lại cặp 1.
- Nút **"Bắt đầu"**.

**Điều kiện hợp lệ** (theo [RULES.md](RULES.md)):
- Có **ít nhất 1** Undercover hoặc Mr. White.
- Có **ít nhất 2 Dân thường**. Lý do: kẻ xâm nhập thắng khi chỉ còn 1 Dân thường, nên nếu ván bắt đầu với 1 Dân thường thì ván kết thúc ngay.
- Nếu không hợp lệ: nút "Bắt đầu" bị khóa và hiện lý do.

### 3.4. Khi bấm "Bắt đầu" (app tự xử lý, không có màn hình)
1. **Lấy 1 cặp từ** trong kho theo chế độ host đã chọn (Ngẫu nhiên hoặc Lần lượt).
2. **Chọn ngẫu nhiên từ nào trong cặp là của dân**, từ còn lại là của Undercover. Ví dụ với cặp Phở / Bún bò, ván này dân có thể nhận "Phở", ván khác lại nhận "Bún bò".
3. **Chia vai ngẫu nhiên** cho người chơi theo số lượng đã chọn.
4. Gán từ:
   - Dân thường → từ của dân.
   - Undercover → từ của Undercover.
   - Mr. White → không có từ.

**Ghi nhớ vị trí ở chế độ Lần lượt:** app lưu cặp đã chơi gần nhất trong bộ nhớ trình duyệt. Lưu này tách riêng với ván đang chơi, nên bấm "Chơi lại" hay "Tạo ván mới" vẫn đi tiếp đúng cặp kế theo.

### 3.5. Chuyền máy xem từ (lặp cho từng người)

Mỗi người lần lượt nhận máy và xem từ của mình **một cách bí mật**:

1. **Màn hình chờ:** "Đưa máy cho **[Tên]**". Nút **"Tôi là [Tên], xem từ"**.
   *(Màn hình này không hiện gì bí mật, ai nhìn thấy cũng được.)*
2. **Màn hình bí mật:**
   - Dân thường / Undercover: hiện **từ khóa** của mình. **Không** ghi vai "Dân thường" hay "Undercover", đúng theo luật: người chơi phải tự đoán vai của mình.
   - Mr. White: hiện **"Bạn là Mr. White, bạn không có từ"**.
   - Nút **"Đã nhớ, ẩn đi"**.
3. Sau khi ẩn → chuyển sang màn hình chờ của người tiếp theo.
4. Khi **tất cả** đã xem → màn hình **"Mọi người đã xem từ, bắt đầu chơi"** → sang Phần 2.

**Thứ tự xem từ:** theo thứ tự trong danh sách người chơi.

### 3.6. Nút "Xem lại từ" (dùng trong lúc chơi)

Trong lúc chơi luôn có nút **"Xem lại từ"** để một người xem lại từ của mình:

1. Bấm **"Xem lại từ"**.
2. Chọn **tên mình** trong danh sách người chơi.
3. Hộp xác nhận: **"Có chắc chắn không?"** (để tránh người khác bấm nhầm hoặc xem trộm).
4. Hiện từ của người đó (Mr. White: "Bạn là Mr. White, bạn không có từ").
5. Bấm **"OK"** để đóng và quay lại đúng chỗ đang chơi.

**Chỉ người còn trong ván** mới được xem lại từ: danh sách ở bước 2 chỉ hiện tên những người **chưa bị loại**.

### 3.7. Lưu ván đang chơi

- Toàn bộ trạng thái ván chơi được **lưu trong bộ nhớ trình duyệt** (localStorage) sau mỗi thay đổi.
- Lỡ tay tải lại trang hay đóng tab thì khi mở lại, app **quay về đúng chỗ đang chơi**, giữ nguyên người chơi, vai, từ và tiến trình.
- Ván đã lưu chỉ bị xóa khi bấm **"Chơi lại"** hoặc **"Tạo ván mới"**.

### 3.8. Chơi lại với cùng nhóm

- Sau khi một ván kết thúc, bấm **"Chơi lại"**: app **giữ nguyên danh sách người chơi** và quay về màn hình **Nhập người chơi** (mục 3.2), nơi host có thể thêm/xóa người rồi đi tiếp như bình thường.
- Mỗi ván mới chia lại vai và chọn lại cặp từ ngẫu nhiên.

---

## 4. Dữ liệu cần lưu (trong trình duyệt)

| Dữ liệu | Ví dụ |
|---|---|
| Danh sách người chơi | `["Lan", "Minh", "Hùng", ...]` |
| Số lượng vai | `undercover: 1, mrWhite: 1` |
| Cặp từ của ván | `civilian: "Cà phê", undercover: "Trà sữa"` |
| Vai + từ của từng người | `Lan → Dân thường, "Cà phê"` |
| Ai đã xem từ | `Lan: đã xem, Minh: chưa` |

---

## 5. Danh sách cặp từ (bản đầu: 10 cặp)

Yêu cầu: **10 cặp**, là những thứ **phổ biến, quen thuộc với người Việt**, hai từ trong cặp gần giống nhau.

> **Đã duyệt** (20/10/2026). Có thể bổ sung thêm cặp sau.

| # | Từ A | Từ B |
|---|---|---|
| 1 | Phở | Bún bò |
| 2 | Cà phê | Trà sữa |
| 3 | Bánh mì | Bánh bao |
| 4 | Xe máy | Xe đạp |
| 5 | Tết | Trung thu |
| 6 | Facebook | Zalo |
| 7 | Áo dài | Áo bà ba |
| 8 | Bóng đá | Bóng chuyền |
| 9 | Hà Nội | Sài Gòn |
| 10 | Nước mắm | Xì dầu |

## 6. Câu hỏi còn mở

Phần 1 không còn câu hỏi nào.

---

## 7. Phần 2: Diễn biến ván chơi

Việc **mô tả, thảo luận, bỏ phiếu và oẳn tù tì** đều diễn ra **ngoài đời**. App chỉ dùng để chỉ ai nói trước, ghi lại người bị loại, công khai vai và kiểm tra thắng/thua.

### 7.1. Luồng một vòng

```
[Vòng N: Lượt mô tả]      ← app chỉ người nói đầu (hoặc cả thứ tự, tùy cài đặt)
      │  Cả nhóm mô tả + thảo luận + bỏ phiếu ngoài đời
      │  Bấm "Chọn người bị loại"
      ▼
[Chọn người bị loại]      ← host bấm tên người bị loại
      │  Xác nhận
      ▼
[Công khai vai]           ← "Minh là Undercover"
      │
      ├─ Nếu là Mr. White → [Mr. White đoán từ]  ← tự gõ, app tự chấm
      │                         ├─ Đúng → Mr. White thắng → [Kết thúc]
      │                         └─ Sai  → [Đoán sai!] → kiểm tra thắng/thua
      ▼
(Kiểm tra thắng/thua)
      ├─ Có phe thắng → [Kết thúc]
      └─ Chưa         → Vòng N+1
```

### 7.2. Màn hình "Vòng N: Lượt mô tả"
- Tiêu đề: **"Vòng N"**.
- Hiển thị thứ tự nói theo cài đặt (mục 8):
  - **Chỉ người nói đầu** (mặc định): "**[Tên]** nói trước". Sau đó cả nhóm nói vòng quanh bàn.
  - **Cả thứ tự:** danh sách thứ tự nói của tất cả người còn trong ván.
- Người nói đầu được chọn **ngẫu nhiên ở vòng 1**. **Không phải Mr. White**, trừ khi cài đặt cho phép Mr. White đi đầu.
- **Các vòng sau giữ nguyên** người nói đầu của vòng 1 (và giữ nguyên thứ tự, nếu dùng chế độ "Cả thứ tự", chỉ bỏ đi người đã bị loại).
- **Nếu người nói đầu bị loại:** người **kế tiếp** còn trong ván sẽ nói đầu, rồi giữ nguyên người đó cho các vòng sau.
  - "Kế tiếp" tính theo thứ tự nói (chế độ "Cả thứ tự") hoặc theo danh sách người chơi (chế độ "Chỉ người nói đầu"). Hết danh sách thì quay lại từ đầu.
  - Nếu cài đặt **không** cho Mr. White đi đầu thì bỏ qua Mr. White, lấy người kế tiếp sau đó.
- Nút **"Xem lại từ"** (mục 3.6).
- Danh sách người **còn trong ván** và người **đã bị loại** (kèm vai đã công khai).
- Nút **"Chọn người bị loại"**.

### 7.3. Chọn người bị loại
- Danh sách người còn trong ván. Host bấm tên người bị loại (theo kết quả bỏ phiếu ngoài đời).
- Hộp xác nhận: **"Loại [Tên]?"** để tránh bấm nhầm. **Không có nút hoàn tác**: đã xác nhận là loại.
- **Hòa phiếu:** app không xử lý riêng. Nhóm tự oẳn tù tì ngoài đời rồi host chọn người thua như bình thường.

### 7.4. Công khai vai
- Hiện cho cả nhóm: **"[Tên] là Dân thường / Undercover / Mr. White"**.
- Chỉ công khai **vai**, không hiện từ của người đó.
- Nếu là Mr. White → sang mục 7.5. Nếu không → kiểm tra thắng/thua (mục 7.6).

### 7.5. Mr. White đoán từ
1. Màn hình: **"[Tên], hãy đoán từ của dân"**. Host đưa máy cho Mr. White, những người khác không nhìn màn hình.
2. Mr. White **tự gõ** câu đoán vào ô nhập rồi bấm **"Gửi câu đoán"** (có hộp xác nhận vì chỉ được đoán 1 lần).
3. **App tự so** câu đoán với từ của dân: bỏ khoảng trắng thừa, **không phân biệt viết hoa/viết thường** (chuẩn hóa Unicode để chữ có dấu từ các bộ gõ khác nhau vẫn khớp). Dấu vẫn phải đúng: "ca phe" khác "cà phê".
   - Không ai phải phán đúng/sai, nên không lộ ai biết từ nào (tránh lộ vai Undercover).
4. **Đúng** → Mr. White thắng ngay → màn hình kết thúc.
5. **Sai** → màn hình **"Đoán sai!"**. Chỉ báo sai, **không hiện** câu đoán và từ của dân. Mr. White bị loại như bình thường → kiểm tra thắng/thua (mục 7.6).

### 7.6. Kiểm tra thắng/thua (sau mỗi lần loại người)

Kiểm tra **theo đúng thứ tự** sau:

1. Mr. White vừa đoán đúng → **Mr. White thắng**.
2. Không còn Undercover và Mr. White nào → **Dân thường thắng**.
3. Chỉ còn **1 Dân thường** (hoặc ít hơn) → **Kẻ xâm nhập thắng** (Undercover và/hoặc Mr. White còn trong ván).
4. Không thuộc trường hợp nào ở trên → sang **vòng tiếp theo**.

### 7.7. Màn hình kết thúc
- **Phe thắng**: "Dân thường thắng!" / "Kẻ xâm nhập thắng!" / "Mr. White thắng!".
- **Hai từ của ván:** từ của dân và từ của Undercover.
- **Vai của tất cả người chơi**, kể cả người còn trong ván.
- Nút **"Chơi lại"** (mục 3.8) và **"Tạo ván mới"**.

---

## 8. Cài đặt

Mở từ màn hình chính. Cài đặt được **lưu trong bộ nhớ trình duyệt** và giữ nguyên qua các ván.

| Cài đặt | Lựa chọn | Mặc định |
|---|---|---|
| Thứ tự nói | **Chỉ người nói đầu** / **Cả thứ tự** | Chỉ người nói đầu |
| Cho phép Mr. White đi đầu | Bật / Tắt | Tắt |

---

## 9. Câu hỏi còn mở

Phần 1 và Phần 2 đều không còn câu hỏi nào.
