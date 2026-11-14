# FoodPrint — Blockchain Global Context & Implementation Rules

> Dùng chung cho các module Blockchain của FoodPrint. Đây là hướng dẫn để audit và triển khai trên **code hiện có**, không phải tuyên bố rằng những tính năng bên dưới đã được xây dựng hoặc deploy.

## 1. Bối cảnh và giới hạn mục tiêu

FoodPrint là hệ thống quản lý chuỗi cung ứng nguyên liệu, suất ăn học đường, an toàn thực phẩm và truy xuất nguồn gốc. BE, FE và phần Blockchain base đã có; phần việc còn lại là hoàn thiện các tích hợp Blockchain theo Specification của từng module.

**Mục tiêu giai đoạn hiện tại:** triển khai Blockchain ở mức **base cơ bản, chạy được và có output thực tế** để chứng minh luồng ghi/kiểm tra bằng chứng. Không ưu tiên xây dựng kiến trúc enterprise, nhiều lớp trừu tượng hoặc UI phức tạp ngoài phạm vi yêu cầu.

Hướng kiến trúc dự án đã xác định: **hybrid PostgreSQL + bằng chứng hash trên Polygon Amoy Testnet**. PostgreSQL vẫn lưu dữ liệu nghiệp vụ. Blockchain **chỉ ghi nhận giá trị hash (`dataHash`) của dữ liệu nghiệp vụ được lựa chọn**; không lưu payload nghiệp vụ gốc, thông tin cá nhân hoặc metadata nghiệp vụ lên chain. Các thông tin như `txHash`, `blockNumber` và receipt là kết quả giao dịch để BE theo dõi/đối chiếu, không phải dữ liệu nghiệp vụ phải ghi thêm vào Smart Contract.

Các mối liên kết truy xuất nguồn gốc cốt lõi của FoodPrint là **Delivery → IngredientLot → CookingBatch → MealAllocation → Class**. Đây là bối cảnh nghiệp vụ, không đồng nghĩa từng entity bắt buộc có giao dịch Blockchain riêng.

## 2. Nguyên tắc trước khi code

- Đọc và đối chiếu **Specification được chỉ định**, tài liệu Blockchain liên quan, code BE/FE/Blockchain, schema và tests hiện hành.
- Không giả định Smart Contract đã deploy hay ABI/contract address đã sẵn sàng. Kiểm tra trạng thái thật từ repository/cấu hình/testnet.
- Tận dụng contract, libraries, services, API và patterns hiện có. Chỉ tạo thêm abstraction khi cần để hoàn thành yêu cầu và không gây trùng lặp.
- Không tự thay đổi nghiệp vụ FoodPrint, quyền actor, entity, bảng DB hoặc trạng thái nghiệp vụ. Không tạo migration/endpoint/UI mới chỉ vì thuận tiện nếu giải pháp hiện tại đã đáp ứng.
- Nếu tài liệu mới mâu thuẫn với baseline đã xác nhận hoặc code, ghi nhận rõ và xử lý theo `BLOCKCHAIN_ENTRY.md`.
- Phạm vi của module được xác định bởi Specification; **không tự tích hợp Blockchain vào tất cả chức năng**.

## 3. Quy tắc dữ liệu on-chain và off-chain

FoodPrint sử dụng mô hình **hybrid: dữ liệu nghiệp vụ off-chain, hash chứng thực on-chain**. Đây là nguyên tắc bắt buộc đối với mọi module.

- **Off-chain (PostgreSQL):** lưu toàn bộ dữ liệu nghiệp vụ gốc, quan hệ phục vụ truy xuất nguồn gốc, thông tin chi tiết phục vụ vận hành; lưu thông tin tham chiếu/kết quả giao dịch Blockchain nếu cơ chế hiện có yêu cầu.
- **On-chain (Polygon Amoy):** chỉ ghi nhận **giá trị hash** đại diện cho dữ liệu nghiệp vụ được lựa chọn. Không ghi payload nghiệp vụ, nội dung hợp đồng, chi tiết giao hàng/chế biến, thông tin cá nhân hoặc metadata nghiệp vụ lên Smart Contract.
- **Phân biệt:** `dataHash` là hash của dữ liệu được chứng thực; `txHash` là định danh giao dịch; `blockNumber` và `transactionStatus` là thông tin do quá trình thực hiện giao dịch cung cấp. Các thông tin giao dịch này không phải dữ liệu nghiệp vụ cần lưu on-chain.
- **Ranh giới contract:** trước khi triển khai, kiểm tra contract, hàm và event hiện có để bảo đảm cách ghi/đọc hash thực sự khả dụng. Nếu contract dùng tham số định danh hoặc event ngoài hash, phải báo cáo sự khác biệt với nguyên tắc **on-chain chỉ lưu hash**; không tự mở rộng dữ liệu ghi trên chain hoặc âm thầm sửa/deploy contract.
- **Phạm vi từng module:** xác định **dữ liệu nguồn → thời điểm chốt bằng chứng → biểu diễn payload → cách tạo hash → cách đọc hash on-chain và đối chiếu** theo Specification.
- **Hash ổn định:** cùng payload phải tạo cùng hash (thống nhất field, thứ tự, kiểu dữ liệu, encoding và version khi cần). Ưu tiên hash scheme đã có; không tự ý thay đổi thuật toán hoặc cấu trúc của bằng chứng đã ghi.
- **Xác minh:** BE tạo lại hash từ dữ liệu off-chain theo cùng quy tắc và so sánh với hash đã ghi trên Blockchain. So khớp hash chỉ chứng minh dữ liệu hiện tại khớp với bằng chứng đã ghi, **không tự chứng minh dữ liệu ban đầu là đúng sự thật**.
- Với dữ liệu có thể chỉnh sửa, không tự đặt cơ chế ghi đè/lưu phiên bản; đọc Specification trước và báo cáo nếu còn thiếu quyết định nghiệp vụ quan trọng.

## 3.1. Quy chuẩn bảng version Blockchain

Khi một module cần lưu nhiều phiên bản bằng chứng Blockchain, áp dụng **một bảng version riêng cho nghiệp vụ/module đó**. Không mặc định gom tất cả module vào một bảng BlockchainEvidence tổng hợp và cũng không mặc định tạo thêm bảng ChangeHistory riêng. Bảng version phải có đủ ba nhóm trường dưới đây:

### Nhóm A — Shared Blockchain Fields (bắt buộc)

Đây là nhóm trường dùng chung và phải được chuẩn hóa giữa các bảng version của các module:

- `id`: định danh bản ghi version.
- `version`: số phiên bản bằng chứng của bản ghi nghiệp vụ.
- `data_hash`: hash của canonical payload được chứng thực.
- `tx_hash`: transaction hash tương ứng, nếu transaction đã được gửi và có hash.
- `block_number`: block chứa transaction, khi receipt cung cấp.
- `transaction_status`: trạng thái xử lý transaction theo lifecycle thực tế.
- `created_at`: thời điểm tạo bản ghi version.
- `created_by`: người tạo/thực hiện thao tác, nếu xác định được theo context và cơ chế hiện có.

### Nhóm B — Version Management Fields (bắt buộc)

Đây là nhóm trường dùng chung để quản lý quan hệ phiên bản và dữ liệu đã được hash:

- `previous_version_id`: tham chiếu version trước đó; version đầu tiên không có version trước nên giá trị có thể `NULL`.
- `snapshot`: canonical payload hoặc snapshot tối thiểu đủ để tái tạo `data_hash` của version đó; lưu off-chain, không ghi lên Blockchain.
- `change_reason`: lý do tạo version/cập nhật, có thể `NULL` nếu module không yêu cầu hoặc không có thông tin.
- `recorded_at`: thời điểm bằng chứng được ghi nhận/xác nhận on-chain; có thể `NULL` trước khi có kết quả phù hợp.

### Nhóm C — Business-specific Fields (bắt buộc)

Mỗi bảng version phải có các field nghiệp vụ cần thiết để liên kết tới bản ghi gốc và xác định dữ liệu được chứng thực. Ví dụ: `delivery_id`, `cooking_batch_id` hoặc `meal_allocation_id`. Tên field, khóa ngoại, kiểu dữ liệu và các field nghiệp vụ bổ sung phải theo schema và Specification của module; không sao chép máy móc các ví dụ này.

### Quy tắc áp dụng

- A và B là format chuẩn dùng chung giữa các bảng version; C thay đổi theo nghiệp vụ. Cả ba nhóm đều phải được xem xét và hiện diện trong thiết kế bảng version của module.
- “Bắt buộc có field” không đồng nghĩa mọi field phải `NOT NULL` ngay khi tạo row. Các giá trị chỉ phát sinh sau khi gửi transaction/nhận receipt, hoặc chỉ có ở version sau, được phép nullable phù hợp với lifecycle.
- Mỗi bản ghi nghiệp vụ có chuỗi `version` riêng. Version mới chỉ được tạo khi nội dung/canonical payload được chứng thực thay đổi theo nghiệp vụ; retry gửi transaction cho cùng một version không tự làm tăng version.
- Không được ghi đè hoặc xóa bằng chứng/version lịch sử đã tạo. Cách lưu và liên kết các lần retry phải bảo toàn khả năng nhận diện transaction của cùng version; không được nhầm retry với một version dữ liệu mới.
- `snapshot` phải tương ứng chính xác với payload dùng để tạo `data_hash`, đủ để tái tạo và kiểm chứng hash lịch sử. Chỉ lưu hash và transaction reference mà không còn payload tương ứng thì không đủ để tái tạo nội dung đã được chứng thực.
- Chỉ `data_hash` được ghi on-chain theo nguyên tắc tại mục 3. `snapshot`, version, liên kết version, lý do thay đổi và các thông tin quản lý khác lưu off-chain.
- Các tên field trên là tên logic chuẩn để thống nhất prompt; khi triển khai phải audit naming convention, kiểu dữ liệu, schema, quan hệ và cơ chế hiện có. Không tự tạo migration nếu module chưa được yêu cầu hoặc schema hiện tại đã có cấu trúc tương đương.
- Module Specification phải xác định rõ nghiệp vụ nào cần version, dữ liệu nào nằm trong snapshot/payload, cách tạo version, điều kiện tạo lại bằng chứng và cách xác định version hiện hành. Global không tự quyết định các chi tiết nghiệp vụ này.

## 4. Luồng tích hợp tối thiểu

Luồng tham chiếu, được điều chỉnh theo code và Specification thực tế:

```text
Business operation (BE / PostgreSQL)
    → lấy dữ liệu đã đủ điều kiện theo module
    → tạo canonical payload và dataHash
    → gửi duy nhất dataHash cần chứng thực qua blockchain integration hiện có
    → nhận txHash và đợi transaction receipt nếu có thể
    → kiểm tra trạng thái giao dịch thật
    → lưu/thể hiện thông tin tham chiếu giao dịch off-chain theo cơ chế hiện có
    → đọc hoặc đối chiếu on-chain khi cần xác minh
    → trả kết quả cho BE/FE hoặc test script
```

**Không đưa payload nghiệp vụ hoặc metadata nghiệp vụ bổ sung vào lời gọi ghi on-chain.** Nếu ABI/contract hiện có yêu cầu dữ liệu ngoài hash, báo cáo để xác nhận hướng xử lý. **Không mặc định** rằng việc gửi transaction thành công đồng nghĩa transaction đã được xác nhận. Phân biệt rõ đã gửi giao dịch, receipt thành công và xác minh bằng chứng thành công.

## 5. Smart Contract và môi trường mạng

- Mạng thử nghiệm mục tiêu: **Polygon Amoy Testnet**. Không mặc định dùng Ethereum Sepolia hay mainnet nếu chưa được người dùng chấp thuận.
- Audit contract source, ABI, địa chỉ deploy, chain ID, RPC provider, signer/wallet và cơ chế gọi contract **đã có** trước khi thay đổi.
- Không khẳng định contract đã deploy nếu chưa kiểm tra giao dịch deploy/contract address trên chain.
- Không hard-code private key, seed phrase, RPC credential; không in secrets ra logs/báo cáo/commit. Dùng cơ chế môi trường hiện có và cung cấp tên biến cần cấu hình (không cung cấp giá trị bí mật).
- Không tự deploy mainnet hoặc gửi giao dịch có phí thật. Nếu cần testnet gas/Test POL, báo cáo phụ thuộc thực tế và hướng dẫn cấu hình ngắn gọn.
- Nếu contract hiện tại chưa đáp ứng module, chỉ đề xuất thay đổi tối thiểu và nêu tác động đến ABI, BE, FE, test; không âm thầm deploy contract thay thế khi chưa được phép.

## 6. BE, FE và xử lý lỗi

- **BE:** ưu tiên tích hợp qua service/API đang phục vụ nghiệp vụ; không nhân đôi logic hiện có. Validation/authorization phải kế thừa cơ chế hiện có.
- **FE:** chỉ thêm phần hiển thị/kích hoạt cần thiết khi module yêu cầu; không thiết kế lại màn hình nghiệp vụ. Ưu tiên output ở API, log có cấu trúc hoặc test script nếu đó là đủ cho giai đoạn base.
- **Lỗi thường gặp:** RPC lỗi/mất kết nối, thiếu gas, sai chain, contract revert, transaction pending/failed, BE thành công nhưng ghi on-chain chưa thành công.
- Không coi lỗi Blockchain là lý do tự động xóa/rollback dữ liệu nghiệp vụ đã commit. Cách xử lý phải tương thích nghiệp vụ và cơ chế persistence hiện có.
- Tránh ghi trùng khi retry (idempotency nếu workflow có nguy cơ lặp). Không thêm trạng thái DB/queue phức tạp nếu chưa cần thiết; nếu thiếu cơ chế bảo đảm tối thiểu, nêu rõ hạn chế.
- Không trả về trạng thái `verified` khi chưa đối chiếu bằng chứng thực tế.

## 7. Output tối thiểu và cách chứng minh

Với **module có yêu cầu ghi hash on-chain**, cố gắng tạo output có thể xác minh được từ một giao dịch **thật trên Polygon Amoy**. Bảng dưới đây mô tả **output nhận được/hiển thị ở BE, API, test hoặc báo cáo**, không phải danh sách field cần lưu trong Smart Contract:

| Output | Ý nghĩa | Ghi chú |
| --- | --- | --- |
| `dataHash` | Hash của payload nghiệp vụ; giá trị duy nhất được ghi on-chain | Phải tái tạo được bằng cùng thuật toán |
| `txHash` | Hash của giao dịch đã gửi | Chỉ xuất hiện khi thực sự có transaction |
| `blockNumber` | Số block chứa giao dịch | Lấy từ receipt sau khi được đưa vào block |
| `transactionStatus` | Trạng thái gửi/xác nhận/thất bại | Dùng giá trị tương thích code; không đánh đồng pending với success |
| `explorerUrl` | Link tới giao dịch trên Amoy explorer | Chỉ tạo từ `txHash` và mạng đúng |
| `verificationResult` | Kết quả so khớp bằng chứng | Chỉ báo thành công khi thực sự kiểm tra |

Ngoại trừ `dataHash` được ghi on-chain, các giá trị `txHash`, `blockNumber`, `transactionStatus`, `explorerUrl`, `verificationResult` là **kết quả hoặc thông tin phục vụ đối chiếu off-chain**, không phải các field nghiệp vụ cần bổ sung vào Smart Contract. Các tên field là **gợi ý về nội dung output**, không bắt buộc thêm đúng những cột DB/API này nếu hệ thống hiện có dùng tên khác.

Đối với module **chỉ tra cứu hoặc xác minh**, output ưu tiên là kết quả kiểm tra và bằng chứng được truy xuất; không bắt buộc tạo transaction mới.

Nếu chưa thể tạo giao dịch thật do thiếu RPC, contract deployment, Test POL, private key được cấp hợp lệ hoặc môi trường chạy, phải:
1. Nói rõ đã kiểm thử được tới bước nào;
2. Phân biệt kết quả unit test/mock với kết quả on-chain thật;
3. Liệt kê điều kiện còn thiếu và cách kiểm tra tiếp.

Tuyệt đối không dùng `txHash`, receipt hoặc explorer link giả để tuyên bố module đã hoạt động on-chain.

## 8. Kiểm thử và tiêu chí hoàn thành

Các kiểm tra cơ bản khi có liên quan:

- Code build/typecheck/lint/test phù hợp với repository.
- Hash ổn định với cùng payload; thay đổi dữ liệu có ảnh hưởng đến payload thì kết quả đối chiếu phải phản ánh thay đổi đó.
- Contract call đúng chain/network và đúng ABI hiện có.
- Giao dịch testnet thành công hoặc báo cáo chính xác yếu tố ngăn cản.
- API/FE hoặc script có thể hiển thị output kiểm chứng được theo phạm vi module.
- Lỗi giao dịch và thao tác retry không làm sai dữ liệu nghiệp vụ, không tạo claim thành công giả.
- Các chức năng BE/FE hiện hữu không bị ảnh hưởng ngoài phạm vi module.

**Definition of Done mức base:** luồng module theo Specification có thể chạy và tạo được output có nguồn gốc rõ ràng; test phù hợp đã được thực thi; các giới hạn/chưa kiểm chứng được công khai trong báo cáo. Không bắt buộc hoàn thiện toàn bộ UI, monitoring, queue hoặc automation enterprise.

## 9. Cách báo cáo sau mỗi module

Báo cáo bằng tiếng Việt, ngắn gọn và có kiểm chứng:

1. **Hiện trạng:** những thành phần liên quan đã tồn tại và điểm còn thiếu.
2. **Đã thực hiện:** thay đổi gì, tại sao cần thay đổi.
3. **File thay đổi:** đường dẫn cụ thể.
4. **Kiểm thử:** lệnh chạy và kết quả pass/fail/blocked; không gộp mock test với testnet thật.
5. **Output Blockchain:** các giá trị có thật (`dataHash`, `txHash`, receipt, explorer, verification), nếu có.
6. **Chưa hoàn thành:** trở ngại, config/secret thiếu, quyết định cần người dùng xác nhận.

## 10. Quy ước ngôn ngữ và cập nhật tài liệu

Viết giải thích và báo cáo bằng **tiếng Việt**; giữ nguyên tên kỹ thuật và định danh tiếng Anh như trong source. Chỉ cập nhật file prompt/specification khi người dùng yêu cầu hoặc khi thay đổi được xác nhận; không tự viết lại yêu cầu nghiệp vụ để khớp code.
