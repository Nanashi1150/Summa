# ตั้งค่า Firebase สำหรับ Summa

โค้ดใช้โปรเจกต์ `summa-cd251` ตาม config ที่ให้มา โดยใช้ **Firebase Authentication** ตรวจอีเมลและรหัสผ่าน และใช้ **Cloud Firestore** เก็บข้อมูลบัญชี บทบาท และสถานะการอนุมัติ ไม่เก็บรหัสผ่านใน Firestore หรือ sessionStorage

ตรวจล่าสุดเมื่อ 19 ตุลาคม 2569: public Authentication configuration ตอบสำเร็จแล้ว และมี `localhost` ใน authorized domains แต่ Firestore API ตอบว่ายังไม่เปิดใช้งาน ขั้นตอนที่เหลือคือสร้างฐานข้อมูล publish กฎ และสร้างผู้ดูแลคนแรก Firebase CLI ยังไม่มีบัญชีที่ล็อกอินอยู่ จึงยังไม่ได้ deploy กฎหรือสร้างบัญชีจริง ข้อมูล config ฝั่งเว็บไม่ใช่สิทธิ์ผู้ดูแลโปรเจกต์

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

กฎนี้ใช้ collection `users` และปฏิเสธการเข้าถึง collection อื่นทั้งหมด ข้อมูลโครงงานยังเป็นตัวอย่างในเครื่อง หากโปรเจกต์มี collection ที่ใช้งานกับแอปอื่นอยู่ ต้องรวมกฎของแอปนั้นอย่างถูกต้องก่อน publish

## 3. สร้างผู้ดูแลคนแรก

อีเมล `admin@summa.ac.th` ที่หน้าล็อกอินเป็น **placeholder เท่านั้น** ไม่ได้สร้างบัญชีหรือกำหนดรหัสผ่านไว้

1. ไปที่ Authentication → Users → Add user แล้วสร้างบัญชีด้วย **อีเมลผู้ดูแลจริง** และรหัสผ่านที่กำหนดเอง
2. คัดลอก UID ของบัญชีนี้
3. ที่ Firestore สร้าง document `users/<UID>` โดยใช้ UID เดียวกัน พร้อมข้อมูลต่อไปนี้ผ่าน Console ซึ่งเป็นช่องทางผู้ดูแลที่เชื่อถือได้:

| ฟิลด์ | ชนิด | ตัวอย่าง / ค่า |
| --- | --- | --- |
| uid | string | UID จาก Authentication |
| email | string | อีเมลผู้ดูแลจริงเดียวกับ Authentication |
| name | string | ชื่อผู้ดูแลระบบ |
| fac | string | ส่วนกลาง |
| br | string | ผู้ดูแลระบบ |
| sid | string | สตริงว่าง |
| role | string | `admin` |
| status | string | `active` |
| createdAt | timestamp | เวลาปัจจุบัน |

หน้าเว็บไม่ให้สร้างหรือเปลี่ยนบัญชีเป็นผู้ดูแลระบบ รวมถึงไม่ให้ผู้ดูแลแก้ไขบัญชีตนเองหรือผู้ดูแลคนอื่น การจัดการผู้ดูแลทำผ่าน Console เท่านั้น

## 4. ทดลองการใช้งานจริง

เปิด local server แล้วเข้า [หน้าล็อกอิน](http://localhost:4173/login.html) ด้วยอีเมลและรหัสผ่านจริงที่สร้างในข้อ 3 ระบบควรพาไป `users.html` และโหลดบัญชีจาก Firestore

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
