# คู่มือการตั้งค่า LINE Mini App

## ขั้นตอนที่ 1: สร้าง LINE Developers Account

1. ไปที่ https://developers.line.biz
2. กด **Log in with LINE account**
3. เข้าสู่ระบบด้วย LINE account ของคุณ

---

## ขั้นตอนที่ 2: สร้าง Provider

1. คลิก **Create a new provider**
2. ตั้งชื่อ Provider (เช่น "ร้านอาหารของฉัน")
3. กด **Create**

---

## ขั้นตอนที่ 3: สร้าง LINE Login Channel

1. ใน Provider ของคุณ คลิก **Create a new channel**
2. เลือก **LINE Login**
3. กรอกข้อมูล:
   - **Channel name**: ชื่อร้านอาหาร
   - **Channel description**: อธิบายแอปของคุณ
   - **App type**: Web app ✅
   - **Email**: อีเมลของคุณ
4. กด **Create**

---

## ขั้นตอนที่ 4: ตั้งค่า LIFF App

1. ใน LINE Login Channel คลิกแท็บ **LIFF**
2. กด **Add**
3. กรอกข้อมูล:
   - **LIFF app name**: ชื่อแอป
   - **Size**: Full
   - **Endpoint URL**: URL ของหน้า index.html ของคุณ
     - ตัวอย่าง: `https://yourusername.github.io/restaurant-app/`
   - **Scope**: profile ✅, openid ✅
   - **Bot link feature**: On (Aggressive) — แนะนำ
4. กด **Add**
5. คัดลอก **LIFF ID** (รูปแบบ `1234567890-xxxxxxxx`)

---

## ขั้นตอนที่ 5: ตั้งค่า Messaging API Channel

1. กลับไปที่ Provider
2. คลิก **Create a new channel**
3. เลือก **Messaging API**
4. กรอกข้อมูล:
   - **Channel name**: ชื่อร้าน (Bot Name)
   - **Channel description**: อธิบาย
   - **Category**: Food & Drink
5. กด **Create**
6. ไปที่แท็บ **Messaging API**
7. สร้าง **Channel access token** (Long-lived)
8. คัดลอก token ที่ได้

---

## ขั้นตอนที่ 6: หา LINE User ID ของคุณ

1. ใน Messaging API Channel ไปที่แท็บ **Messaging API**
2. ใน Webhook URL ให้ใส่ URL ชั่วคราวจาก https://webhook.site
3. ส่งข้อความหา Bot ของคุณใน LINE
4. ดู user ID จาก webhook (ใน events[0].source.userId)

หรือ:
1. ไปที่ https://api.line.me/v2/profile
2. ใส่ Bearer token ในหัว Authorization
3. จะได้ userId

---

## ขั้นตอนที่ 7: อัปเดตโค้ด Frontend

เปิดไฟล์ `frontend/js/app.js` แล้วแก้ไข:

```javascript
const APP_CONFIG = {
  LIFF_ID: '1234567890-xxxxxxxx',    // ← LIFF ID จากขั้นตอนที่ 4
  GAS_BASE_URL: 'https://script.google.com/macros/s/YOUR_ID/exec',  // ← จาก Google Apps Script
  ADMIN_KEY: 'my_secure_key_2024',   // ← กำหนดเองให้ยาวและซับซ้อน
};
```

---

## ขั้นตอนที่ 8: Deploy Frontend

### ตัวเลือก A: GitHub Pages (ฟรี ☺️ แนะนำ)

1. สร้าง GitHub repository ใหม่
2. อัปโหลดโฟลเดอร์ `frontend/` ทั้งหมด
3. ไปที่ Settings → Pages
4. เลือก Source: Deploy from branch → main
5. URL จะเป็น: `https://username.github.io/repo-name/`

### ตัวเลือก B: Netlify (ฟรี drag & drop)

1. ไปที่ https://netlify.com
2. ลาก folder `frontend/` ไปวาง
3. ได้ URL ทันที

### ตัวเลือก C: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# เลือก frontend/ เป็น public directory
firebase deploy
```

---

## ขั้นตอนที่ 9: อัปเดต LIFF Endpoint URL

1. กลับไปที่ LINE Developers Console
2. LIFF → แก้ไข Endpoint URL ให้ตรงกับ URL ที่ deploy แล้ว
3. บันทึก

---

## ขั้นตอนที่ 10: ทดสอบ

1. เปิด LINE บนมือถือ
2. พิมพ์ `line://app/YOUR_LIFF_ID` ใน chat
3. หรือใช้ LINE URL: `https://liff.line.me/YOUR_LIFF_ID`

---

## Checklist

- [ ] สร้าง LINE Login Channel แล้ว
- [ ] ได้ LIFF ID แล้ว
- [ ] สร้าง Messaging API Channel แล้ว
- [ ] ได้ Channel Access Token แล้ว
- [ ] รู้ LINE User ID ของเจ้าของร้านแล้ว
- [ ] Deploy Frontend แล้ว
- [ ] อัปเดต app.js ด้วย LIFF ID ถูกต้องแล้ว
- [ ] ทดสอบเปิดใน LINE แล้ว
