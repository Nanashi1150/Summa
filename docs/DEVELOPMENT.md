# แก้ไขหน้าเว็บ

แต่ละหน้ามี source ที่แก้โดยตรงได้สามไฟล์ เช่น:

| ส่วน | หน้าเข้าสู่ระบบ | หน้าตรวจผลสรุป |
| --- | --- | --- |
| HTML | `src/pages/login.html` | `src/pages/review.html` |
| CSS | `src/styles/login.css` | `src/styles/review.css` |
| JavaScript | `src/js/login.js` | `src/js/review.js` |

แก้ไขแล้วรัน `npm run build` และรีเฟรชหน้าเว็บ หากยังไม่ได้เปิด local server ให้ใช้ `npm start` ซึ่ง build และเปิด server ให้ ไม่ต้องแก้ `design/original.html` หรือเขียนขั้นตอนแปลง HTML ใน build script

## HTML และข้อมูล

ไฟล์ใน `src/pages/` เป็น HTML document เต็มหน้า โครงสร้างเนื้อหาอยู่ใน `<template id="page-template">` ส่วน `src/js/app.js` นำข้อมูลจาก controller มาแสดงใน `<div id="page-root">` หลังตรวจสิทธิ์แล้ว

- `{{title}}` แสดงค่าที่ controller ส่งกลับจาก `renderVals()`
- `<template data-each="items" data-as="item">` แสดงรายการซ้ำ
- `<template data-if="hasError">` แสดงส่วนที่ตรงเงื่อนไข
- `data-on-click="{{save}}"` เชื่อมปุ่มกับฟังก์ชันใน controller

ใช้ DOM API และ template ของ HTML โดยไม่มี runtime จากไฟล์ design เดิม ค่า style ที่เปลี่ยนตามข้อมูลยังอยู่ใน attribute เช่น `style="background:{{item.bg}}"` ส่วนรูปแบบคงที่อยู่ใน CSS ของหน้า

## ส่วนที่ใช้ร่วมกัน

| ไฟล์ | หน้าที่ |
| --- | --- |
| `src/components/navbar.js` | เมนูตามบทบาท บัญชี ออกจากระบบ และเมนูมือถือ |
| `src/components/confirm-dialog.js` | ป๊อปอัปยืนยันก่อนอนุมัติและยืนยันนัดหมาย |
| `src/components/project-tree.html` | โครงสร้างรายการโครงงานแบบกลุ่ม |
| `src/components/project-tree.js` | ค้นหา กรอง เรียง และยุบกลุ่มโครงงาน |
| `src/styles/shared.css` | รูปแบบส่วนกลาง การแสดงผลมือถือ และ print styles |
| `src/styles/fonts.css` | นิยามฟอนต์ที่ทุกหน้าใช้ |

ใส่รายการโครงงานร่วมกันด้วย `<section data-component="project-tree" data-scope="advisor"><!-- component:project-tree --></section>` และโหลดไฟล์ component/CSS ตามตัวอย่างใน `src/pages/projects.html` เครื่องหมาย include นี้ถูกแทนที่ระหว่าง build

## Firebase

`src/services/firebase.js` จัดการ config และ SDK instances, `auth.js` จัดการเข้าสู่ระบบ สมัครสมาชิก และ session, `users.js` ติดต่อข้อมูลผู้ใช้ และ `auth-policy.js` กำหนดสิทธิ์ของหน้าเว็บ

`src/services/index.js` รวมบริการเป็น `window.SummaAuth` สำหรับ controller โดย esbuild สร้างเป็น `public/assets/services/firebase.bundle.js` เมื่อ build การบังคับสิทธิ์ฐานข้อมูลอยู่ที่ `config/firebase/firestore.rules` ซึ่งต้อง publish แยกจากการ deploy เว็บไซต์

## ตรวจสอบก่อนเผยแพร่

```sh
npm run build:vercel
npm test
npm run test:rules
```

Build ตรวจลิงก์และ asset, ชุดทดสอบแรกตรวจ source ที่แยกหน้าและพฤติกรรม UI ส่วนชุดสุดท้ายทดสอบกฎกับ Firestore Emulator โดยไม่แก้ข้อมูลจริง
