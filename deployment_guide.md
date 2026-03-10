# คู่มือ Deploy ระบบสั่งอาหาร LINE Mini App

## ภาพรวม

```
ลูกค้าใน LINE
      ↓
LINE Mini App (LIFF)
      ↓
Frontend (GitHub Pages / Netlify)
      ↓
Backend API (Google Apps Script)
      ↓
Database (Google Sheets)
```

---

## ขั้นตอนการ Deploy

### STEP 1: ตั้งค่า Google Sheets Database

#### 1.1 สร้าง Google Sheet ใหม่
1. ไปที่ https://sheets.google.com
2. กด **+ Blank spreadsheet**
3. ตั้งชื่อ: "Restaurant Database"
4. คัดลอก **Spreadsheet ID** จาก URL:
   ```
   https://docs.google.com/spreadsheets/d/[THIS_IS_THE_ID]/edit
   ```

#### 1.2 สร้าง Sheets อัตโนมัติด้วย Apps Script
ทำในขั้นตอน 2 แล้วรัน `setupSheets()`

---

### STEP 2: ตั้งค่า Google Apps Script Backend

#### 2.1 เปิด Apps Script
1. ใน Google Sheet → **Extensions** → **Apps Script**
2. ลบโค้ด `function myFunction()` ที่มีอยู่ออก

#### 2.2 สร้างไฟล์สคริปต์
สร้างไฟล์ใหม่ (กดไอคอน + ข้างๆ Files) ตามนี้:

| ชื่อไฟล์ | เนื้อหา |
|----------|---------|
| `Code.gs` | โค้ดจากไฟล์ `backend/Code.gs` |
| `menuAPI.gs` | โค้ดจากไฟล์ `backend/menuAPI.gs` |
| `orderAPI.gs` | โค้ดจากไฟล์ `backend/orderAPI.gs` |
| `paymentAPI.gs` | โค้ดจากไฟล์ `backend/paymentAPI.gs` |
| `utils.gs` | โค้ดจากไฟล์ `backend/utils.gs` |

#### 2.3 อัปเดต CONFIG ใน Code.gs

```javascript
const CONFIG = {
  SHEET_ID: 'YOUR_SPREADSHEET_ID',          // จาก Step 1
  ADMIN_KEY: 'restaurant_admin_2024_xyz',    // กำหนดเองให้ซับซ้อน
  LINE_CHANNEL_ACCESS_TOKEN: 'xxxx',         // จาก setup_line.md
  LINE_OWNER_USER_ID: 'Uxxxxxxxx',           // LINE UID ของคุณ
  LINE_PAY_CHANNEL_ID: 'xxxx',              // จาก setup_line_pay.md
  LINE_PAY_CHANNEL_SECRET: 'xxxx',           // จาก setup_line_pay.md
  LINE_PAY_ENV: 'sandbox',                   // 'sandbox' ก่อน test แล้วเปลี่ยนเป็น 'production'
  FRONTEND_URL: 'https://your-app.github.io', // URL ของ frontend
};
```

#### 2.4 สร้าง Sheets และ Seed เมนู
1. เลือกฟังก์ชัน `setupSheets` ใน dropdown
2. กด ▶ Run
3. อนุญาต permissions ที่ขอ
4. เลือกฟังก์ชัน `seedSampleMenu`
5. กด ▶ Run (จะเพิ่มเมนูตัวอย่าง 15 รายการ)

#### 2.5 Deploy เป็น Web App
1. คลิก **Deploy** (ปุ่มขวาบน) → **New deployment**
2. ตั้งค่า:
   - **Type**: Web app
   - **Execute as**: Me
   - **Who has access**: Anyone
3. กด **Deploy**
4. อนุญาต permissions
5. คัดลอก **Web app URL** (รูปแบบ: `https://script.google.com/macros/s/xxxx/exec`)

---

### STEP 3: อัปเดต Frontend Config

เปิดไฟล์ `frontend/js/app.js`:

```javascript
const APP_CONFIG = {
  LIFF_ID: '1234567890-xxxxxxxx',      // จาก setup_line.md
  GAS_BASE_URL: 'https://script.google.com/macros/s/XXXX/exec',  // จาก Step 2.5
  ADMIN_KEY: 'restaurant_admin_2024_xyz',  // ต้องตรงกับ Code.gs
  LINE_PAY_ENV: 'sandbox',
};
```

---

### STEP 4: Deploy Frontend

#### วิธีที่ 1: GitHub Pages (แนะนำ)

```bash
# 1. สร้าง repo ใหม่บน GitHub
# 2. Clone และเพิ่มไฟล์
git init
git add frontend/
git commit -m "Initial deploy"
git remote add origin https://github.com/username/restaurant-app.git
git push -u origin main

# 3. เปิด GitHub Pages
# Settings → Pages → Deploy from branch → main → / (root)
# URL: https://username.github.io/restaurant-app/
```

**หมายเหตุ**: ต้องย้ายไฟล์จาก `frontend/` ไปอยู่ใน root หรือตั้งค่า Pages ให้ point ไปที่ `/frontend`

#### วิธีที่ 2: Netlify

1. ไปที่ https://netlify.com
2. ลากโฟลเดอร์ `frontend/` ไปวางในหน้า Deploy
3. ได้ URL ทันที เช่น `https://random-name.netlify.app`

---

### STEP 5: ตั้งค่า LINE Mini App

ดูรายละเอียดใน [setup_line.md](./setup_line.md)

สรุปสั้นๆ:
1. สร้าง LIFF App ใน LINE Developers Console
2. Endpoint URL = URL ของ `index.html` ที่ deploy แล้ว
3. คัดลอก LIFF ID ไปใส่ใน `app.js`

---

### STEP 6: ทดสอบระบบ

#### 6.1 ทดสอบ Backend API
เปิด browser แล้วไปที่:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=getMenu
```
ควรได้ JSON response พร้อมรายการเมนู

#### 6.2 ทดสอบ Frontend
เปิดในเบราว์เซอร์:
```
https://your-app.github.io/index.html
```

#### 6.3 ทดสอบผ่าน LINE
```
https://liff.line.me/YOUR_LIFF_ID
```

#### 6.4 ทดสอบ Admin Panel
เปิด: `https://your-app.github.io/admin.html`
กรอก Admin Key ที่กำหนดไว้

#### 6.5 ทดสอบจอครัว
เปิด: `https://your-app.github.io/kitchen.html`

---

## โครงสร้างไฟล์ทั้งหมด

```
restaurant-app/
├── frontend/
│   ├── index.html          ← หน้าหลัก
│   ├── menu.html           ← หน้าเมนู
│   ├── cart.html           ← ตะกร้าสินค้า
│   ├── checkout.html       ← สรุปออเดอร์ + ชำระเงิน
│   ├── order-status.html   ← ติดตามออเดอร์
│   ├── admin.html          ← ระบบหลังร้าน
│   ├── kitchen.html        ← จอครัว
│   ├── css/
│   │   └── style.css       ← stylesheet หลัก
│   └── js/
│       ├── app.js          ← LIFF init + utilities
│       ├── api.js          ← API client
│       ├── cart.js         ← cart management
│       └── menu.js         ← menu page logic
├── backend/
│   ├── Code.gs             ← Router + Config
│   ├── menuAPI.gs          ← Menu CRUD
│   ├── orderAPI.gs         ← Order management
│   ├── paymentAPI.gs       ← LINE Pay integration
│   └── utils.gs            ← Helpers + LINE Messaging
└── docs/
    ├── setup_line.md       ← ตั้งค่า LINE Mini App
    ├── setup_line_pay.md   ← ตั้งค่า LINE Pay
    └── deployment_guide.md ← คู่มือนี้
```

---

## การเพิ่มรูปเมนู

1. เปิด Google Drive
2. สร้างโฟลเดอร์ชื่อ "MenuImages"
3. อัปโหลดรูปอาหาร (ขนาดแนะนำ 800×800px, ไม่เกิน 200KB)
4. คลิกขวาที่รูป → **Share** → เปลี่ยนเป็น "Anyone with the link can view"
5. คัดลอก File ID จาก URL:
   ```
   https://drive.google.com/file/d/[FILE_ID]/view
   ```
6. ใส่ URL ในคอลัมน์ `image_url` ของ Sheet Menu:
   ```
   https://drive.google.com/uc?id=FILE_ID
   ```

---

## การ Re-deploy Backend หลังแก้ไขโค้ด

ทุกครั้งที่แก้ไข Apps Script:
1. คลิก **Deploy** → **Manage deployments**
2. แก้ไข deployment ที่มีอยู่
3. เปลี่ยน Version เป็น "New version"
4. กด **Deploy**

> URL จะยังคงเดิม แต่โค้ดจะอัปเดต

---

## ปัญหาที่พบบ่อย

### CORS Error
ตรวจสอบว่า Google Apps Script ตั้งค่า "Anyone" แล้ว

### LIFF ไม่เปิด
- ตรวจสอบ LIFF ID ถูกต้อง
- Endpoint URL ต้องเป็น HTTPS
- ตรวจสอบ Scope ว่าเลือก profile แล้ว

### เมนูไม่โหลด
ทดสอบ URL ของ Apps Script โดยตรงใน browser

### LINE Pay ไม่ทำงาน
- ตรวจสอบ Channel ID และ Secret
- ตรวจสอบ Environment (sandbox vs production)
- ดู Logs ใน Google Sheets (sheet "Logs")

---

## ค่าใช้จ่าย

| บริการ | ราคา |
|--------|------|
| Google Sheets | ฟรี |
| Google Apps Script | ฟรี (6 min/execution, 90 min/day) |
| GitHub Pages | ฟรี |
| LINE LIFF | ฟรี |
| LINE Messaging API | ฟรี (500 push/เดือน) |
| LINE Pay | ค่า transaction fee ตามที่ LINE กำหนด |

**ระบบนี้ใช้ได้ฟรีสำหรับร้านขนาดเล็ก 20-30 ออเดอร์/วัน** ✅
