# Summa

ระบบสรุปข้อเสนอแนะและนัดหมายอาจารย์ที่ปรึกษาโครงงาน แยกเป็น HTML 18 หน้า พร้อม Navbar ตามบทบาท Firebase Authentication และข้อมูลบัญชีใน Cloud Firestore

## เปิดใช้งานในเครื่อง

ต้องมี Node.js และ npm จากโฟลเดอร์โปรเจกต์ให้รัน:

```sh
npm ci
npm start
```

เปิด http://localhost:4183 โดย `npm start` จะ build ก่อนเปิด local server

เมนู “เลือกผู้ใช้งาน” บนหน้าแรกเปิดหน้าตัวอย่างได้ 3 บทบาท: นักศึกษา อาจารย์ที่ปรึกษา และผู้ดูแลระบบ ระหว่างเยี่ยมชมสามารถสลับบทบาทหรือกลับหน้าแรกได้ ข้อมูลผู้ใช้ในโหมดนี้เป็นข้อมูลจำลองและการเปลี่ยนแปลงไม่เรียกบริการจัดการบัญชี Firebase การใช้ข้อมูลบัญชีจริงยังต้องเข้าสู่ระบบตามสิทธิ์เดิม

## โครงสร้างไฟล์

```text
Summa/
├── src/
│   ├── pages/              # HTML ต้นฉบับแยกครบ 18 หน้า
│   ├── js/                 # JavaScript รายหน้า และ app.js สำหรับ renderer/สิทธิ์
│   ├── styles/             # CSS รายหน้า, shared.css และ fonts.css
│   ├── components/         # Navbar, ป๊อปอัป และรายการโครงงานที่ใช้ร่วมกัน
│   ├── services/           # Firebase, login/session, ผู้ใช้ และนโยบายสิทธิ์
│   └── media/              # ฟอนต์และใบอนุญาต
├── design/
│   └── original.html       # เก็บต้นฉบับเพื่ออ้างอิง ไม่ใช้ในการ build
├── config/
│   └── firebase/
│       └── firestore.rules # กฎสิทธิ์ Cloud Firestore
├── docs/                   # คู่มือ Firebase และ deployment
├── scripts/                # Build, bundle, ตรวจ output, server และ emulator runner
├── tests/                  # ทดสอบ UI/สิทธิ์ และ Firestore Rules
├── public/                 # ผลลัพธ์ build สำหรับ local server และ Vercel (ไม่ commit)
├── firebase.json            # อ้างอิง rules และตั้งค่า emulator
├── vercel.json              # ตั้งค่า build และ output บน Vercel
└── package.json
```

ไฟล์ตรวจสอบระหว่างพัฒนาเก็บใน `.local/` และไม่ commit รวมถึง cache, dependencies และ emulator ที่ดาวน์โหลดไว้

## Build และทดสอบ

```sh
npm run build
npm run build:vercel
npm test
npm run test:rules
```

`build` สร้าง HTML, CSS, JavaScript และฟอนต์ลง `public/` ส่วน `build:vercel` ตรวจว่ามีครบ 18 หน้าและลิงก์ไฟล์ทั้งหมดถูกต้องด้วย

`npm test` ตรวจว่าแก้ HTML/CSS/JavaScript รายหน้าแล้ว build ได้โดยไม่ต้องมีไฟล์ design เดิม และใช้ jsdom กับบริการบัญชีจำลองตรวจสิทธิ์ผู้เยี่ยมชม บทบาท บัญชีรออนุมัติ/ถูกระงับ ฟอร์มบัญชี และการยืนยัน/ยกเลิกป๊อปอัป ไม่ใช่การตรวจภาพในเบราว์เซอร์จริง

`test:rules` ใช้ Firestore Emulator กับโปรเจกต์ `demo-summa` ไม่แก้ไขข้อมูล Firebase จริง ต้องมี Java 21 ขึ้นไปและอินเทอร์เน็ตสำหรับดาวน์โหลด emulator ครั้งแรก

## การแก้ไขหน้าเว็บ

แต่ละหน้าแก้ได้โดยตรงในไฟล์ชื่อเดียวกัน เช่น หน้าโครงงานใช้งาน `src/pages/projects.html`, `src/styles/projects.css` และ `src/js/projects.js` จากนั้นรัน `npm run build` แล้วรีเฟรช local server

หน้าต่าง ๆ ไม่ได้สร้างจากไฟล์ design แบบรวมอีกแล้ว `scripts/build.cjs` คัดลอก source และนำ HTML ของ component ที่ใช้ร่วมกันมาใส่ตามเครื่องหมาย `<!-- component:project-tree -->` การแก้ `public/` โดยตรงยังถูกเขียนทับเมื่อ build ใหม่

Navbar อยู่ที่ `src/components/navbar.js`, ป๊อปอัปที่ `src/components/confirm-dialog.js` และรายการโครงงานใช้ `src/components/project-tree.html` กับ `src/components/project-tree.js` ส่วน `src/js/app.js` รองรับตัวแปร `{{name}}`, `<template data-each>` และ `<template data-if>` ด้วย DOM API โดยไม่ใช้ไลบรารีของไฟล์ design เดิม

Firebase config อยู่ที่ `src/services/firebase.js`, การเข้าสู่ระบบและ session ที่ `src/services/auth.js`, บริการผู้ใช้ที่ `src/services/users.js` และนโยบายสิทธิ์ที่ `src/services/auth-policy.js` ตัว SDK bundle สร้างจาก `src/services/index.js`

CSS ส่วนคงที่แยกไว้ในไฟล์รายหน้า ส่วนค่า style ที่เปลี่ยนตามสถานะ เช่น สีรายการที่เลือก ยังผูกกับข้อมูลใน HTML ฟอนต์และใบอนุญาตอยู่ใน `src/media/` และถูกคัดลอกไปที่ `public/assets/media/`

## หน้าของระบบ

| หน้าใน public/ | การใช้งาน |
| --- | --- |
| index.html | หน้าแรก |
| login.html, register.html | เข้าสู่ระบบและขอสมัครบัญชี |
| student.html | ความคืบหน้า งาน และนัดหมาย |
| review.html | ตรวจและอนุมัติผลสรุป |
| projects.html, admin-projects.html | รายการโครงงานตามสิทธิ์ |
| manual-import.html, gmail.html | ตัวอย่างนำเข้าภาพและตั้งค่า Gmail |
| dashboard.html | Dashboard ผู้ดูแล / PDF A4 |
| advisor-dashboard.html | Dashboard อาจารย์ สถานะโครงงาน งานติดตาม และนัดหมาย / PDF A4 |
| users.html | จัดการบัญชีผู้ใช้ใน Firestore |
| imports.html, integrations.html, logs.html | ตัวอย่างงานดูแลระบบ |
| reports.html | รายงานและพิมพ์/บันทึก PDF |
| navbar.html, project-tree.html | ตัวอย่างคอมโพเนนต์ |

## Firebase และ Vercel

- [ตั้งค่า Firebase และสร้างผู้ดูแลคนแรก](docs/FIREBASE-SETUP.md)
- [โครงสร้างฐานข้อมูล ความสัมพันธ์ สิทธิ์ และการนำไปใช้](docs/DATABASE.md)
- [เชื่อม Gemma 4 กับหน้าตรวจสอบอีเมล](docs/OLLAMA.md)
- [Deploy บน Vercel](docs/DEPLOYMENT.md)
- [วิธีแก้ไข HTML/CSS/JavaScript รายหน้า](docs/DEVELOPMENT.md)

การล็อกอิน สมัครสมาชิก ตั้งรหัสผ่านใหม่ และจัดการบัญชีผู้ใช้เชื่อม Firebase แล้ว หน้าตรวจสอบเชื่อม Gemma 4 สำหรับสกัดข้อความอีเมลจริงผ่าน Backend แล้ว ส่วนข้อมูลโครงงาน การเผยแพร่ผลสรุป งาน นัดหมาย การดึง Gmail และ OCR ยังเป็นตัวอย่างหรือยังไม่ได้เชื่อมจริง ดูวิธีตั้งค่าในคู่มือ Ollama

ผู้เยี่ยมชมเข้าได้เฉพาะหน้าแรกและฟอร์มบัญชี บัญชีสมัครใหม่รอการอนุมัติ อีเมลผู้ดูแลใน placeholder ไม่ใช่บัญชีที่สร้างไว้ สิทธิ์ผู้ดูแลอ่านจาก Firestore และไม่ให้เลื่อนสิทธิ์ตัวเอง รหัสผ่านไม่ถูกเก็บใน Firestore หรือ state ของหน้าใน sessionStorage
