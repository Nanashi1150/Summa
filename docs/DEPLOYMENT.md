# Deploy บน Vercel

Repository: https://github.com/Nanashi1150/Summa

1. เลือก Add New → Project ใน Vercel แล้ว Import repository นี้
2. เลือก branch `main` และใช้ root directory ของ repository
3. เลือก Framework Preset **Other**
4. ใช้ค่าจาก `vercel.json`: Install Command `npm ci`, Build Command `npm run build:vercel`, Output Directory `public`
5. กด Deploy แล้วตรวจหน้าแรก หน้าล็อกอิน และลิงก์แต่ละหน้า

Vercel สร้าง `public/` ระหว่าง build จึงไม่ต้อง commit output นี้ใน Git เผยแพร่เฉพาะเว็บไซต์ 16 หน้าและ runtime assets โดยไม่เปิดเอกสาร ไฟล์ต้นฉบับ และกฎฐานข้อมูลผ่าน static hosting

หลังได้โดเมน เช่น `summa-example.vercel.app` ให้เพิ่มชื่อโดเมนจริงนี้ที่ Firebase Console → Authentication → Settings → Authorized domains โดยไม่ใส่ `https://`, พอร์ต หรือ path โดเมน preview ที่เปลี่ยนไปต้องอนุญาตแยกเช่นกัน

ใช้ Firebase Authentication และ Firestore โปรเจกต์เดิมได้ การ deploy บน Vercel ไม่ได้ publish Firestore Rules หรือสร้างผู้ดูแลให้อัตโนมัติ ดู [คู่มือ Firebase](FIREBASE-SETUP.md)

หากใช้ Vercel CLI ให้ล็อกอินและตรวจ team/project ที่เลือกก่อน จากนั้นใช้ `npx vercel` เพื่อสร้าง preview และตรวจการทำงานก่อนเผยแพร่ production

อ้างอิง: [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build)
