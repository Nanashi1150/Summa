# เชื่อม Gemma 4 กับ Summa

หน้าตรวจสอบ `review.html` มีช่องวางข้อความอีเมลและปุ่ม “สกัดข้อมูลด้วย Gemma 4” แสดงผลสรุป งาน ผู้รับผิดชอบ กำหนดส่ง และนัดหมาย แต่ละรายการมีข้อความอ้างอิงที่คลิกแล้วไฮไลต์ในต้นฉบับได้ สามารถแก้ข้อความสรุปก่อนตรวจรับ

## ใช้ในเครื่อง

1. เปิด Ollama และลงชื่อเข้าใช้ Ollama Cloud
2. ทดสอบ `ollama run gemma4:31b-cloud`
3. รัน `npm start` แล้วเปิด `http://localhost:4173/review.html?demo=advisor`
4. วางอีเมลและกดสกัดข้อมูล ข้อความจะส่งไป Ollama Cloud เพื่อประมวลผล

Local server ของ Summa รับคำขอเฉพาะ loopback และ origin เดียวกัน แล้วเรียก Ollama ที่ `127.0.0.1:11434` ซึ่งใช้การลงชื่อเข้าใช้ Ollama ที่มีอยู่ โหมดนี้ให้ทดลองจากหน้าบทบาทตัวอย่างได้ ไม่ต้องเก็บ API key บนหน้าเว็บ และไม่เปิดเซิร์ฟเวอร์ให้เครือข่ายภายนอก

## ใช้บนเว็บที่โฮสต์

มี endpoint `api/synthesize.js` สำหรับ Node.js Functions ซึ่งเรียก `https://ollama.com/api/chat` โดยตรง รุ่น Cloud API ใช้ชื่อ `gemma4:31b` ให้ตั้ง `OLLAMA_API_KEY` ที่ environment ของ Backend ก่อน deploy เว็บ โหมดโฮสต์ไม่เรียก localhost ของเครื่องผู้ใช้

Backend ตรวจ Firebase ID token และอ่าน profile ของผู้ใช้ด้วย token เดียวกัน ต้องเป็น advisor/admin และ status active จึงเรียก AI ได้ โหมด demo ไม่ให้สิทธิ์ข้ามการตรวจนี้ หน้าเว็บแนบ token ผ่าน `SummaAuth.getIdToken()` กุญแจ Ollama ไม่ถูกส่งให้เบราว์เซอร์

## การตรวจผลลัพธ์

Cloud ยังไม่รองรับการบังคับ JSON Schema จึงกำหนดรูปแบบใน prompt แล้วตรวจ JSON ซ้ำที่ Backend หากไม่ผ่านจะแสดงข้อผิดพลาด ไม่กรอกข้อมูลที่ตรวจไม่ผ่าน:

- summary เป็นข้อความ และ items ไม่เกิน 20 รายการ
- ประเภทเป็น task/appointment เท่านั้น
- ข้อความ evidence ต้องมีอยู่จริงในต้นฉบับแบบตรงตัว
- owner และ dueText ต้องอ้างอิงคำที่มีใน evidence ไม่แปลงหรือเดาวันเดือนปีที่ไม่ได้ระบุ
- ไม่พบข้อมูลให้ส่ง null และหน้าจอแสดง “ไม่ระบุ”

จำกัดอีเมล 20,000 ตัวอักษร จำกัดขนาด request และเวลาประมวลผล 90 วินาที ไม่มีการบันทึกต้นฉบับ ผลสรุป token หรือข้อความ reasoning ลง log; หน้า review ไม่เก็บข้อมูลลง sessionStorage ผลสรุปและรายการงานยังต้องให้อาจารย์ตรวจความหมาย แม้ข้อความอ้างอิงจะตรงกับต้นฉบับ

การตรวจรับในหน้านี้ยังไม่บันทึกหรือเผยแพร่ไป Firestore และยังไม่ดึง Gmail/OCR โดยอัตโนมัติ การเชื่อมบันทึกต้องจับคู่ project ID จริงและแยกสิทธิ์ต้นฉบับก่อน ไม่ใช้รหัส CS-01 ตัวอย่างเป็นเอกสารจริง

อ้างอิง: [Ollama Chat API](https://docs.ollama.com/api/chat), [ข้อจำกัด Structured Outputs บน Cloud](https://docs.ollama.com/capabilities/structured-outputs)
