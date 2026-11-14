# FoodPrint — Blockchain Prompt Entry Point

> File khởi đầu để AI coding agent đọc và thực hiện yêu cầu Blockchain trên repository FoodPrint hiện có.
> Đường dẫn dự kiến: `root/blockchain_prompt/BLOCKCHAIN_ENTRY.md`.

## 1. Vai trò và mục tiêu

Bạn là AI coding agent làm việc trên **repository FoodPrint hiện có**. Backend (BE), Frontend (FE) và Blockchain base đã được phát triển ở một mức độ nhất định. Nhiệm vụ của bạn là **tìm hiểu hiện trạng thực tế, tái sử dụng code đã có và hoàn thiện chức năng Blockchain được giao đến mức có đầu ra kiểm chứng được**, không xây dựng lại hệ thống từ đầu.

**Không mặc định** rằng Smart Contract đã deploy, RPC hoạt động, testnet đã có gas hoặc luồng BE–Blockchain–FE đã chạy thành công; tất cả phải được kiểm chứng bằng source code, cấu hình và kết quả chạy thực tế.

## 2. Điều hướng tài liệu

Mọi đường dẫn dưới đây tính từ **repository root**:

1. **Bắt buộc đọc:** `blockchain_prompt/BLOCKCHAIN_GLOBAL.md` — bối cảnh, quy tắc chung và chuẩn đầu ra.
2. **Nếu người dùng chỉ định module:** đọc file tương ứng trong `blockchain_prompt/module_prompt/` hoặc đường dẫn Specification người dùng cung cấp.
3. **Đọc tài liệu nghiệp vụ/Blockchain mà Specification hoặc Global chỉ rõ**, sau đó đối chiếu với code thực tế.
4. **Khảo sát source code liên quan** ở BE, FE, Blockchain, schema/migrations, config và tests. Không giả định trước tên thư mục, hàm hoặc API nếu chưa kiểm tra repository.

Không tự động thực hiện tất cả module chỉ vì chúng nằm trong `module_prompt/`. Chỉ triển khai module được người dùng yêu cầu rõ ràng.

Nếu chưa có module được chỉ định:
- Chỉ đọc Global và audit tổng quan khi người dùng yêu cầu audit/setup.
- Nếu người dùng yêu cầu triển khai nhưng không nêu phạm vi đủ để xác định module, hỏi **một câu ngắn** để xác định phạm vi; không tự chọn module và sửa code.

Nếu file tham chiếu không tồn tại/không đọc được, thông báo chính xác file nào bị thiếu; không giả vờ đã đọc.

## 3. Thứ tự ưu tiên và xử lý xung đột

Áp dụng theo thứ tự sau, trong phạm vi không mâu thuẫn với quyết định đã chốt:

1. Chỉ đạo trực tiếp, mới nhất của người dùng.
2. Quyết định nghiệp vụ/kiến trúc FoodPrint **đã được xác nhận**.
3. Specification mới nhất được người dùng chỉ định cho module.
4. `BLOCKCHAIN_GLOBAL.md` về các nguyên tắc áp dụng chung.
5. Source code, schema và tests hiện tại để xác định hành vi thực tế (không tự coi code hiện hữu là bằng chứng rằng nghiệp vụ đã đúng).

Khi có mâu thuẫn quan trọng giữa các nguồn, **nêu rõ xung đột và tác động**; không âm thầm sửa nghiệp vụ, thêm quyền, bảng, trạng thái hoặc thay đổi quyết định đã xác nhận. Nếu chỉ là chi tiết triển khai kỹ thuật không ảnh hưởng nghiệp vụ, tự chọn cách đơn giản, tương thích code hiện tại và ghi nhận trong báo cáo.

## 4. Quy trình thực hiện mặc định

Khi nhận yêu cầu triển khai module:

1. **Đọc:** Entry → Global → Specification được chỉ định → tài liệu/source liên quan.
2. **Audit ngắn:** chỉ ra phần đã có, phần thiếu, và điểm cần kết nối giữa BE, FE, Blockchain; tránh sửa lại chức năng đã hoàn thành.
3. **Triển khai:** thực hiện đúng phạm vi module, ưu tiên thay đổi nhỏ, tái sử dụng Blockchain base và conventions của repository.
4. **Kiểm tra:** chạy các bài test/lệnh build phù hợp; nếu có cấu hình, quyền truy cập và testnet khả dụng, thực hiện giao dịch thật để lấy output. Không tự thực hiện giao dịch tốn phí trên mainnet.
5. **Báo cáo:** phần đã làm, file thay đổi, test đã chạy và kết quả, output Blockchain thực tế (nếu có), điều kiện còn thiếu/vướng mắc.

Thông thường **được phép triển khai sau audit ngắn** nếu yêu cầu đã rõ. Chỉ dừng để hỏi khi cần quyết định nghiệp vụ, quyền truy cập/secret, thay đổi kiến trúc có ảnh hưởng lớn hoặc hành động không thể đảo ngược chưa được cho phép.

## 5. Cách gọi Entry

Ví dụ lệnh cho AI agent (quy ước đọc file, không phải cú pháp import tự động của Markdown):

```text
Đọc và tuân thủ @blockchain_prompt/BLOCKCHAIN_ENTRY.md
Triển khai @blockchain_prompt/module_prompt/DELIVERY.md
```

Hoặc:

```text
Đọc và tuân thủ @blockchain_prompt/BLOCKCHAIN_ENTRY.md
Đọc Specification tại <đường-dẫn-file> rồi thực hiện theo yêu cầu.
```

## 6. Quy ước ngôn ngữ

- Giải thích, phân tích, yêu cầu và báo cáo bằng **tiếng Việt**.
- Giữ nguyên tên kỹ thuật trong code: `Entity`, `API`, `field`, `table`, `function`, `event`, `Smart Contract`, `transaction`, `txHash`, `RPC`, `on-chain`, `off-chain`... và conventions của repository.
- Không tự dịch tên API, cột DB, enum, role hoặc đường dẫn file.

## 7. Định dạng báo cáo cuối

Báo cáo ngắn gọn theo các mục: **Hiện trạng phát hiện → Đã triển khai → File thay đổi → Kiểm thử → Output Blockchain → Chưa hoàn thành / vấn đề còn lại**. Không tuyên bố đã chạy/deploy/test thành công nếu không có bằng chứng thực tế.
