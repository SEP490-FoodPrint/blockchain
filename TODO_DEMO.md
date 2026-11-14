# Chạy thử Todo Blockchain

Mở ba terminal tại thư mục dự án tương ứng.

## 1. Blockchain

Lệnh đầu khởi động blockchain local. Giữ terminal này mở.

```powershell
cd C:\MERN\FoodPrint\FoodPrintBlockChain
npm run dev
```

Lệnh thứ hai deploy contract lên blockchain local. Chạy sau khi node đã khởi động. Mỗi lần khởi động lại node, cần deploy lại.

```powershell
cd C:\MERN\FoodPrint\FoodPrintBlockChain
npm run deploy:local
```

## 2. Backend

Khởi động API của FoodPrint. Backend cần PostgreSQL và Redis đang chạy.

```powershell
cd C:\MERN\FoodPrint\FoodPrintBE
$env:NODE_ENV = "development"
npm run dev
```

## 3. Frontend

```powershell
cd C:\MERN\FoodPrint\FoodPrintFE
npm run dev
```

Mở [http://localhost:3001/blockchain-test](http://localhost:3001/blockchain-test). Thêm todo để ghi hash lên contract. Nhập lại nội dung để kiểm tra hash có trùng không.

Todo chỉ được giữ trên trang hiện tại, không lưu vào database.
