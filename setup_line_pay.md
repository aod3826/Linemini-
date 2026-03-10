# คู่มือตั้งค่า LINE Pay

## ขั้นตอนที่ 1: สมัคร LINE Pay Merchant

1. ไปที่ https://pay.line.me/portal/th/register
2. กด **สมัครใช้งาน LINE Pay**
3. กรอกข้อมูลร้านค้า:
   - ชื่อร้าน
   - ประเภทธุรกิจ
   - เลขที่บัญชีธนาคาร
   - เอกสารยืนยันตัวตน
4. รอการอนุมัติ (ปกติ 3-7 วันทำการ)

> **หมายเหตุ**: ระหว่างรอการอนุมัติ ใช้ Sandbox ทดสอบได้ก่อน

---

## ขั้นตอนที่ 2: ขอ Sandbox Access

1. ไปที่ https://developers.line.biz
2. เข้าสู่ระบบและไปที่ LINE Pay Sandbox
3. กรอกฟอร์ม: https://pay.line.me/developers/techsupport/sandbox/testflow
4. ระบุ:
   - Email
   - Business name
   - Country: Thailand
5. จะได้รับ Sandbox credentials ทางอีเมล:
   - **Sandbox Channel ID**
   - **Sandbox Channel Secret Key**

---

## ขั้นตอนที่ 3: อัปเดต Backend Config

เปิดไฟล์ `backend/Code.gs` แล้วแก้ไข:

```javascript
const CONFIG = {
  // ... ค่าอื่นๆ ...
  LINE_PAY_CHANNEL_ID: 'YOUR_LINE_PAY_CHANNEL_ID',
  LINE_PAY_CHANNEL_SECRET: 'YOUR_LINE_PAY_CHANNEL_SECRET',
  LINE_PAY_ENV: 'sandbox',  // เปลี่ยนเป็น 'production' เมื่อพร้อม
  FRONTEND_URL: 'https://your-app-url.com',  // URL ของ frontend
};
```

---

## ขั้นตอนที่ 4: URL ที่ต้องตั้งค่า

### Confirm URL
ลูกค้าจะถูก redirect มาที่ URL นี้หลังจ่ายเงินสำเร็จ:
```
https://your-app-url.com/order-status.html?orderId={ORDER_ID}&transactionId={TRANSACTION_ID}
```

### Cancel URL
ลูกค้าจะถูก redirect มาหากยกเลิกการชำระ:
```
https://your-app-url.com/cart.html
```

---

## ขั้นตอนที่ 5: ทดสอบด้วย Sandbox

### บัตรทดสอบ Sandbox
- **Card number**: ใช้ TEST ACCOUNT ที่ LINE ให้มา
- ในหน้าชำระเงิน Sandbox จะมีตัวเลือกให้กด "Pay" โดยตรง

### ขั้นตอนทดสอบ:
1. เพิ่มสินค้าใส่ตะกร้า
2. กด Checkout
3. ระบบจะสร้าง order และ redirect ไป LINE Pay Sandbox
4. กด Confirm/Pay ในหน้า Sandbox
5. ระบบ redirect กลับมาที่ `order-status.html`
6. ตรวจสอบใน Google Sheets ว่าสถานะเปลี่ยนเป็น "paid"

---

## ขั้นตอนที่ 6: เปลี่ยนเป็น Production

1. ได้รับการอนุมัติจาก LINE Pay
2. รับ Production credentials:
   - **Channel ID**
   - **Channel Secret Key**
3. แก้ไข `Code.gs`:

```javascript
LINE_PAY_CHANNEL_ID: 'PROD_CHANNEL_ID',
LINE_PAY_CHANNEL_SECRET: 'PROD_CHANNEL_SECRET',
LINE_PAY_ENV: 'production',
```

4. Deploy Google Apps Script ใหม่

---

## API Endpoints ที่ระบบใช้

| Action | URL |
|--------|-----|
| Request Payment | `POST /v3/payments/request` |
| Confirm Payment | `POST /v3/payments/{transactionId}/confirm` |

### Sandbox Base URL
```
https://sandbox-api-pay.line.me
```

### Production Base URL
```
https://api-pay.line.me
```

---

## การสร้าง HMAC Signature

LINE Pay ต้องการ signature ทุก request:

```
Signature = Base64(HMAC-SHA256(
  ChannelSecret + URI + RequestBody + Nonce
))
```

ระบบจัดการให้อัตโนมัติใน `paymentAPI.gs` แล้ว

---

## ปัญหาที่พบบ่อย

### 1. Payment URL ไม่ทำงาน
- ตรวจสอบ Channel ID และ Secret ถูกต้อง
- ตรวจสอบว่าใช้ Environment ถูก (sandbox vs production)

### 2. Confirm URL ไม่ถูก redirect
- ตรวจสอบ `FRONTEND_URL` ใน Config
- URL ต้องเป็น HTTPS

### 3. Signature ไม่ถูกต้อง
- ตรวจสอบว่า Channel Secret ถูกต้อง
- ตรวจสอบ Request Body เป็น JSON string ที่ถูกต้อง

### 4. Amount ไม่ตรง
- LINE Pay ต้องการ integer (ไม่มีทศนิยม)
- ใช้ `Math.round(amount)` ก่อนส่ง

---

## Checklist

- [ ] สมัคร LINE Pay Merchant แล้ว (หรือขอ Sandbox แล้ว)
- [ ] ได้รับ Channel ID และ Channel Secret แล้ว
- [ ] อัปเดต Config.gs แล้ว
- [ ] ตั้งค่า FRONTEND_URL ถูกต้องแล้ว
- [ ] ทดสอบ Sandbox สำเร็จแล้ว
- [ ] (Production) อัปเดตเป็น Production credentials แล้ว
