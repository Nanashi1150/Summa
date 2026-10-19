# ตั้งค่า Firebase สำหรับ Summa

โค้ดใช้โปรเจกต์ `summa-cd251` ตาม config ที่ให้มา โดยใช้ **Firebase Authentication** ตรวจอีเมลและรหัสผ่าน และใช้ **Cloud Firestore** เก็บข้อมูลบัญชี บทบาท และสถานะการอนุมัติ ไม่เก็บรหัสผ่านใน Firestore หรือ sessionStorage

ตรวจล่าสุดเมื่อ 20 ตุลาคม 2569: Firebase CLI เชื่อมต่อโปรเจกต์จริงแล้ว Firestore `(default)` อยู่ที่ `asia-northeast1` ตรวจชื่อ collection แล้วยังไม่พบ collection ระดับบน ได้ deploy กฎที่ผู้ใช้อนุมัติและส่งสร้างดัชนี 8 รายการแล้ว ไม่ได้สร้างบัญชีหรือเอกสารข้อมูลจริง ส่วนการสร้างผู้ดูแลคนแรกยังต้องดำเนินการตามข้อ 3 ดูสถานะและรายละเอียดใน [คู่มือฐานข้อมูล](DATABASE.md) ข้อมูล config ฝั่งเว็บไม่ใช่สิทธิ์ผู้ดูแลโปรเจกต์

## 1. เปิด Authentication

เปิด [Firebase Console ของ summa-cd251](https://console.firebase.google.com/project/summa-cd251/authentication) แล้วกด **Get started** หากยังไม่เปิดใช้งาน

- ใน Sign-in method เปิด **Email/Password**
- หากต้องการใช้ปุ่ม Google ให้เปิด **Google** และกำหนดอีเมล support
- ใน Settings → Authorized domains มี `localhost` แล้ว ให้เปิดเว็บผ่าน `http://localhost:4173` หากต้องการเปิดผ่าน `127.0.0.1` ให้เพิ่มโดเมนนี้ด้วย
- หากใช้อีเมลในมหาวิทยาลัยจริง สามารถตั้งข้อกำหนดเพิ่มเติมใน Firebase ได้ ตอนนี้สิทธิ์เข้าระบบอ้างอิง Firestore profile ที่อนุมัติแล้ว

## 2. เปิด Cloud Firestore และใช้กฎ

สร้าง Cloud Firestore **Standard edition / Native mode** ที่ Firestore Database ของโปรเจกต์ โดยใช้ production mode จากนั้นนำเนื้อหา [firestore.rules](../config/firebase/firestore.rules) ไปใส่ในแท็บ Rules และกด Publish

หรือใช้ Firebase CLI จากโฟลเดอร์หลักของโปรเจกต์:

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project summa-cd251
```

กฎใน source code รองรับ `users` และ `projects` พร้อม subcollection ผลสรุป งาน และนัดหมายตาม [โครงสร้างฐานข้อมูล](DATABASE.md) แล้ว หน้าโครงงานยังเป็นข้อมูลตัวอย่างจนกว่าจะเชื่อมบริการข้อมูลจริง หากโปรเจกต์มี collection ที่ใช้งานกับแอปอื่นอยู่ ต้องรวมกฎของแอปนั้นอย่างถูกต้องก่อน publish การเปลี่ยน source code ไม่ได้ deploy กฎให้อัตโนมัติ

## 3. สร้างผู้ดูแลคนแรก

อีเมล `Test@gmail.com` ที่หน้าล็อกอินเป็น **placeholder ของบัญชีทดสอบ North2520** ยังต้องสร้างบัญชีและกำหนดสิทธิ์ผ่าน Console ก่อนใช้งาน รหัสผ่านไม่ถูกเก็บในโค้ด

1. ไปที่ Authentication → Users → Add user แล้วสร้างบัญชีทดสอบด้วยอีเมล `Test@gmail.com` และรหัสผ่านที่ผู้ใช้กำหนด หากมีบัญชีนี้อยู่แล้ว ให้ใช้ UID เดิม
2. คัดลอก UID ของบัญชีนี้
3. ที่ Firestore สร้าง document `users/<UID>` โดยใช้ UID เดียวกัน พร้อมข้อมูลต่อไปนี้ผ่าน Console ซึ่งเป็นช่องทางผู้ดูแลที่เชื่อถือได้:

| ฟิลด์ | ชนิด | ตัวอย่าง / ค่า |
| --- | --- | --- |
| uid | string | UID จาก Authentication |
| email | string | `Test@gmail.com` (ให้ตรงกับอีเมลที่ Authentication บันทึกไว้) |
| name | string | `North2520` |
| fac | string | ส่วนกลาง |
| br | string | ผู้ดูแลระบบ |
| sid | string | สตริงว่าง |
| role | string | `admin` |
| status | string | `active` |
| createdAt | timestamp | เวลาปัจจุบัน |

หน้าเว็บไม่ให้สร้างหรือเปลี่ยนบัญชีเป็นผู้ดูแลระบบ รวมถึงไม่ให้ผู้ดูแลแก้ไขบัญชีตนเองหรือผู้ดูแลคนอื่น การจัดการผู้ดูแลทำผ่าน Console เท่านั้น

## 4. ทดลองการใช้งานจริง

เปิด local server แล้วเข้า [หน้าล็อกอิน](http://localhost:4173/login.html) ด้วยอีเมลและรหัสผ่านจริงที่สร้างในข้อ 3 ผู้ดูแลจะเลือกมุมมองผู้ดูแล อาจารย์ที่ปรึกษา หรือนักศึกษาได้ และเปลี่ยนอีกครั้งในเมนูบัญชี ตัวเลือกจำเฉพาะแท็บปัจจุบันและล้างเมื่อออกจากระบบ บทบาทจริงใน Firestore ยังคงเป็น `admin` จึงไม่ใช่การสวมบัญชีผู้ใช้คนอื่น ข้อมูลโครงงานของแต่ละมุมมองยังเป็นตัวอย่าง

`North2520` เป็นชื่อแสดงผล ใช้ `Test@gmail.com` สำหรับ Firebase Email/Password และตั้งรหัสผ่านผ่าน Firebase Console โดยไม่บันทึกลง source code

สมัครบัญชีนักศึกษาหรืออาจารย์ผ่าน `register.html` บัญชีใหม่มีสถานะ `pending` และต้องให้อีกบัญชีที่เป็นผู้ดูแลอนุมัติที่หน้าผู้ใช้ก่อนเข้าใช้งาน เมื่อคลิกเปิดใช้งานต้องยืนยันป๊อปอัปก่อนจึงจะเขียนสถานะ `active` ลง Firestore

กรณีปุ่ม Google: บัญชี Google ที่ไม่มี document `users/<UID>` หรือยังไม่อนุมัติจะเข้าใช้งานไม่ได้ ให้ผู้ดูแลตรวจบัญชีและสร้าง profile ผ่าน Console ก่อน ไม่อนุมัติอัตโนมัติจากชื่ออีเมล

## การทดสอบที่มีให้

```sh
npm test
npm run test:rules
```

`npm test` ทดสอบ DOM ด้วย Firebase service จำลอง: ฟอร์มเข้าสู่ระบบ สมัครสมาชิก สิทธิ์ผู้เยี่ยมชม/บทบาท/บัญชีรออนุมัติ/บัญชีถูกระงับ และยืนยัน/ยกเลิกป๊อปอัป รวมถึงการหมดสิทธิ์ระหว่างเปิดป๊อปอัป

`npm run test:rules` ใช้ Firestore Emulator และโปรเจกต์ `demo-summa` เพื่อทดสอบกฎจริง โดยไม่เขียนข้อมูลโปรเจกต์จริง ต้องมี Java 21 ขึ้นไปและเชื่อมต่ออินเทอร์เน็ตสำหรับดาวน์โหลด emulator ครั้งแรก

สิ่งที่เชื่อมต่อ Firebase จริงในโค้ดคือ login, Google login, password reset, register, ข้อมูลผู้ใช้ และการเปิดใช้งาน/ระงับ/เปลี่ยนบทบาทบัญชีทั่วไป ส่วนผลสรุปโครงงาน นัดหมาย Gmail และ Ollama ยังเป็นข้อมูลหรือพฤติกรรมตัวอย่างตามงานก่อนหน้า มีป้ายกำกับในหน้าโครงงาน และไม่ได้เขียนไปยัง collection โครงงาน

อ้างอิง: [Firebase email/password](https://firebase.google.com/docs/auth/web/password-auth), [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
