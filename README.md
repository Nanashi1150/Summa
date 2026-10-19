# Summa

ระบบสรุปข้อเสนอแนะและนัดหมายอาจารย์ที่ปรึกษาโครงงาน แยกเป็น HTML 16 หน้า พร้อม Navbar ตามบทบาท Firebase Authentication และข้อมูลบัญชีใน Cloud Firestore

## เปิดใช้งานในเครื่อง

ต้องมี Node.js และ npm จากโฟลเดอร์โปรเจกต์ให้รัน:

```sh
npm ci
npm start
```

เปิด http://localhost:4173 โดย `npm start` จะ build ก่อนเปิด local server

## โครงสร้างไฟล์

```text
Summa/
├── src/
│   ├── js/                 # เมนู การแสดงผล การตรวจสิทธิ์ ฟอร์ม และ Firebase SDK entry
│   ├── styles/             # CSS ส่วนกลาง
│   └── templates/          # HTML ต้นฉบับของหน้าล็อกอิน
├── design/
│   └── original.html       # ไฟล์ต้นฉบับแบบรวม เก็บเนื้อหาเดิมครบ
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

`build` สร้าง HTML, CSS, JavaScript และฟอนต์ลง `public/` ส่วน `build:vercel` ตรวจว่ามีครบ 16 หน้าและลิงก์ไฟล์ทั้งหมดถูกต้องด้วย

`npm test` ใช้ jsdom และบริการบัญชีจำลอง ตรวจสิทธิ์ผู้เยี่ยมชม บทบาท บัญชีรออนุมัติ/ถูกระงับ ฟอร์มบัญชี และการยืนยัน/ยกเลิกป๊อปอัป ไม่ใช่การตรวจภาพในเบราว์เซอร์จริง

`test:rules` ใช้ Firestore Emulator กับโปรเจกต์ `demo-summa` ไม่แก้ไขข้อมูล Firebase จริง ต้องมี Java 21 ขึ้นไปและอินเทอร์เน็ตสำหรับดาวน์โหลด emulator ครั้งแรก

## การแก้ไขหน้าเว็บ

แก้ JavaScript ส่วนกลางใน `src/js/`, CSS ใน `src/styles/` และหน้าล็อกอินใน `src/templates/login.html` พฤติกรรมฟอร์มบัญชีอยู่ที่ `src/js/auth-forms.js` และการเชื่อม Firebase อยู่ที่ `src/js/firebase-client.js`

หน้าที่เหลือแยกจาก `design/original.html` ผ่าน `scripts/build.cjs` ให้แก้กระบวนการแปลงในสคริปต์นี้เมื่อต้องการรักษาการปรับแต่งไว้ การแก้ `public/` โดยตรงจะถูกเขียนทับเมื่อ build ใหม่

ฟอนต์ที่แยกจากต้นฉบับมีใบอนุญาตอยู่ใน `public/assets/FONT-LICENSE.txt` หลัง build

## หน้าของระบบ

| หน้าใน public/ | การใช้งาน |
| --- | --- |
| index.html | หน้าแรก |
| login.html, register.html | เข้าสู่ระบบและขอสมัครบัญชี |
| student.html | ความคืบหน้า งาน และนัดหมาย |
| review.html | ตรวจและอนุมัติผลสรุป |
| projects.html, admin-projects.html | รายการโครงงานตามสิทธิ์ |
| manual-import.html, gmail.html | ตัวอย่างนำเข้าภาพและตั้งค่า Gmail |
| users.html | จัดการบัญชีผู้ใช้ใน Firestore |
| imports.html, integrations.html, logs.html | ตัวอย่างงานดูแลระบบ |
| reports.html | รายงานและพิมพ์/บันทึก PDF |
| navbar.html, project-tree.html | ตัวอย่างคอมโพเนนต์ |

## Firebase และ Vercel

- [ตั้งค่า Firebase และสร้างผู้ดูแลคนแรก](docs/FIREBASE-SETUP.md)
- [Deploy บน Vercel](docs/DEPLOYMENT.md)

การล็อกอิน สมัครสมาชิก ตั้งรหัสผ่านใหม่ และจัดการบัญชีผู้ใช้เชื่อม Firebase ในโค้ดแล้ว ต้องเปิดบริการและ publish rules ก่อนใช้จริง ส่วนข้อมูลโครงงาน งาน นัดหมาย Gmail และ Ollama/OCR ยังเป็นตัวอย่าง มีป้ายกำกับในหน้าโครงงาน

ผู้เยี่ยมชมเข้าได้เฉพาะหน้าแรกและฟอร์มบัญชี บัญชีสมัครใหม่รอการอนุมัติ อีเมลผู้ดูแลใน placeholder ไม่ใช่บัญชีที่สร้างไว้ สิทธิ์ผู้ดูแลอ่านจาก Firestore และไม่ให้เลื่อนสิทธิ์ตัวเอง รหัสผ่านไม่ถูกเก็บใน Firestore หรือ state ของหน้าใน sessionStorage
