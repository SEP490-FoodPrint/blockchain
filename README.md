# FoodPrintBlockChain

Project Hardhat 3 cho FoodPrint, dùng Solidity, TypeScript và Ethers.js v6. Contract mẫu lưu một hash `bytes32` cho mỗi mã bản ghi `bytes32`. Sau khi giao dịch được xác nhận, hash của bản ghi được cố định.

| Thư mục | Nội dung |
| --- | --- |
| `contracts/` | Smart contract Solidity |
| `test/` | Unit test TypeScript với Node.js test runner và Ethers.js |
| `scripts/` | Script deploy và xuất cấu hình cho backend |
| `deployments/<network>/` | JSON chứa ABI, địa chỉ và chain ID, được tạo khi deploy |

Khi thêm contract, đặt file Solidity trong `contracts/` và thêm test tương ứng. Mỗi contract có thể dùng một script deploy và một file JSON riêng theo cấu trúc trên.

## Cài đặt và kiểm thử

Dùng Node.js 22.13+ (nhánh 22) hoặc Node.js 24 LTS. Lần build đầu tiên cần kết nối mạng để Hardhat tải trình biên dịch Solidity.

```bash
npm ci
npm run build
npm run typecheck
npm test
```

Unit test chạy trên mạng Hardhat trong tiến trình, gồm ghi và đọc thành công, cấp và thu hồi quyền ghi, từ chối ghi trái phép, từ chối ghi đè, đầu vào rỗng và bản ghi chưa tồn tại.

## Deploy Local

Mở hai terminal tại thư mục project.

```bash
# Terminal 1
npm run node

# Terminal 2
npm run deploy:local
```

RPC local là `http://127.0.0.1:8545` (chain ID `31337`). Script dùng tài khoản đầu tiên của Hardhat node làm deployer và xuất `deployments/localhost/FoodPrintHashRegistry.json`. Khi khởi động lại node, deploy lại rồi cập nhật JSON mà backend sử dụng.

## Deploy Sepolia

Sao chép `.env.example` thành `.env`. Điền `SEPOLIA_RPC_URL` từ nhà cung cấp RPC và `SEPOLIA_PRIVATE_KEY` theo dạng `0x` + 64 ký tự hex. Ví deployer cần Sepolia ETH để trả gas.

```bash
npm run deploy:sepolia
```

Kết quả nằm ở `deployments/sepolia/FoodPrintHashRegistry.json` (chain ID `11155111`). Mỗi lần chạy script tạo một contract mới với trạng thái riêng và cập nhật JSON cho lần deploy đó. Cấp lại quyền writer nếu backend chuyển sang địa chỉ mới.

## Quyền trên contract

- Deployer là owner cố định và có quyền ghi mặc định.
- Owner gọi `setWriter(address, true)` để cấp quyền ghi cho ví backend và `setWriter(address, false)` để thu hồi. Chờ giao dịch cấp quyền được xác nhận trước khi backend ghi.
- Writer gọi `confirmHash(recordId, dataHash)` để xác nhận bản ghi. Mỗi ID chỉ ghi được một lần. Giao dịch thành công phát event `HashConfirmed`.
- Bất kỳ ai có thể gọi `getHash(recordId)`. Contract trả lỗi `RecordNotFound` khi ID chưa được xác nhận. Hash và ID trên blockchain có thể được đọc công khai.

## Tích hợp Backend Node.js

Trong backend, chạy `npm install ethers@6` và sao chép file JSON từ đúng mạng sang đường dẫn mà service đọc. Ví dụ CommonJS dưới đây đặt JSON cạnh file service. Cấu hình `BLOCKCHAIN_RPC_URL` và `BLOCKCHAIN_WRITER_PRIVATE_KEY` qua môi trường backend. Trên local có thể dùng key của tài khoản test mà Hardhat node in ra. Trên Sepolia, cấp quyền cho ví backend riêng bằng tài khoản owner.

```js
const { Contract, JsonRpcProvider, Wallet, id, keccak256 } = require("ethers");
const deployment = require("./FoodPrintHashRegistry.json");

async function confirmAndRead(batchId, canonicalDataBytes) {
  const provider = new JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const { chainId } = await provider.getNetwork();
  if (chainId !== BigInt(deployment.chainId)) {
    throw new Error("RPC chain ID does not match the deployment");
  }
  if (await provider.getCode(deployment.address) === "0x") {
    throw new Error("Contract is missing at the deployment address");
  }

  const reader = new Contract(deployment.address, deployment.abi, provider);
  const signer = new Wallet(process.env.BLOCKCHAIN_WRITER_PRIVATE_KEY, provider);
  const writer = reader.connect(signer);
  const recordId = id(`foodprint:batch:${batchId}`);
  const dataHash = keccak256(canonicalDataBytes);

  const tx = await writer.confirmHash(recordId, dataHash);
  await tx.wait();

  return { txHash: tx.hash, matches: (await reader.getHash(recordId)) === dataHash };
}

module.exports = { confirmAndRead };
```

`canonicalDataBytes` là `Buffer` hoặc `Uint8Array` chứa dữ liệu gốc đã được serialize theo một quy ước cố định. Khi cần xác minh lại, backend dùng đúng quy ước đó để tính hash và so sánh với `getHash`. Luồng chỉ đọc dùng trực tiếp contract kết nối với provider. Nếu một giao dịch ghi bị timeout, kiểm tra trạng thái bản ghi trước khi gửi lại.
