# โครงสร้างข้อมูล Summa (Firestore)

สถานะ ณ 20 ตุลาคม 2569: ตรวจ metadata ของ Firestore จริง `summa-cd251/(default)` แล้ว ยังไม่พบ collection ระดับบน ติดตั้งดัชนี 8 รายการแล้ว (สถานะ CREATING ณ เวลาตรวจ) และ deploy กฎสิทธิ์ใหม่หลังได้รับอนุมัติจากผู้ใช้เรียบร้อย ตรวจเนื้อหากฎที่ใช้งานจริงแล้วตรงกับไฟล์ในโปรเจกต์ สำรองกฎเดิมไว้ใน `.local/database/config-2026-10-19T19-00-14-451Z/snapshot.json` และผลตรวจหลัง deploy อยู่ใน `.local/database/config-2026-10-19T19-02-44-330Z/snapshot.json` ไม่มีการอ่านเนื้อหาเอกสารหรือย้ายข้อมูล หน้าโครงงานและ Dashboard ยังคงใช้ชุดข้อมูลตัวอย่างจนกว่าจะเชื่อมหน้าจอกับ `SummaData`

## หลักการ

- Firebase Authentication เป็นแหล่งข้อมูลบัญชีและรหัสผ่าน ใช้ UID เป็นรหัสอ้างอิงผู้ใช้ทุกแห่ง ไม่ใช้ชื่อหรืออีเมลเป็น foreign key
- คง collection `users` และชื่อฟิลด์เดิมเพื่อไม่ทำให้บัญชีที่มีอยู่ใช้งานไม่ได้
- โครงงานเป็นหน่วยหลัก ผลสรุป งาน และนัดหมายเก็บเป็น subcollection ของโครงงาน ไม่เก็บรายการที่เติบโตต่อเนื่องใน array เดียว
- ใช้ Firestore Timestamp สำหรับเวลาจริง บันทึก `createdAt` และ `updatedAt` ด้วย `serverTimestamp()` แสดงเวลาไทยที่หน้าจอ ส่วน `term` ใช้ปีการศึกษา พ.ศ. เช่น `2569/1`
- สถานะเก็บเป็นรหัสภาษาอังกฤษ แปลภาษาไทยที่หน้าจอ ไม่ใช้ข้อความภาษาไทยเป็นรหัสสถานะ
- เอกสารใช้ auto ID และมีรหัสโครงงานแสดงผลแยกต่างหาก `code` ไม่รับประกัน unique ข้ามภาคเรียน ถ้าต้องบังคับ unique ให้เพิ่มระบบจองรหัสด้วย transaction ใน backend

## ความสัมพันธ์

```text
Authentication UID
└── users/{uid}

projects/{projectId}
├── advisorId → users/{uid} (อาจารย์หลัก 1 คน)
├── studentIds → users/{uid} (สมาชิก 1–10 คน)
├── reviews/{reviewId}
├── tasks/{taskId} → reviewId และ assigneeId
└── appointments/{appointmentId} → studentId

sources/{sourceId}       [สงวนให้ backend]
integrations/{id}        [สงวนให้ backend]
auditLogs/{eventId}      [สงวนให้ backend]
```

กฎของ subcollection ตรวจสมาชิกจากเอกสารโครงงานหลักทุกครั้ง เมื่อถอดสมาชิกออก บัญชีนั้นจะอ่านข้อมูลลูกไม่ได้ ผู้ดูแลจัดสมาชิก อาจารย์แก้ชื่อและสถานะโครงงาน นักศึกษาอ่านโครงงานของตนได้

## 1. users/{uid} — ข้อมูลบัญชีเดิม

| ฟิลด์ | ชนิด | ความหมาย |
| --- | --- | --- |
| uid | string | ตรงกับ document ID และ Authentication UID |
| email, name | string | อีเมลและชื่อแสดงผล |
| fac, br | string | ชื่อคณะและสาขาเดิม |
| sid | string | รหัสนักศึกษา; สตริงว่างสำหรับบทบาทอื่น |
| role | enum | `student`, `advisor`, `admin` |
| status | enum | `pending`, `active`, `suspended` |
| createdAt | Timestamp | เวลาสร้าง |
| updatedAt | Timestamp (optional) | เวลาที่ผู้ดูแลแก้ไข |

การสมัครใหม่ยังเป็น pending ผู้ใช้แก้บทบาทหรืออนุมัติตนเองไม่ได้ ผู้ดูแลทั่วไปไม่แก้บัญชีตนเองหรือบัญชี admin อื่น

## 2. projects/{projectId}

| ฟิลด์ | ชนิด | ข้อกำหนด |
| --- | --- | --- |
| code | string | รหัสแสดงผล 1–50 ตัวอักษร เช่น CS-01 |
| title | string | ชื่อโครงงาน 1–500 ตัวอักษร |
| term | string | `ปี/ภาคเรียน` เช่น `2569/1` รองรับภาค 1 และ 2 |
| faculty, branch | string | คณะและสาขา ไม่เกิน 200 ตัวอักษร |
| advisorId | string UID | บัญชีอาจารย์ที่ active |
| studentIds | array of UID | สมาชิก 1–10 คน ไม่มีค่าซ้ำ |
| status | enum | `pending_review`, `in_progress`, `ready`, `completed`, `archived` |
| createdAt, updatedAt | Timestamp | เวลาจากเซิร์ฟเวอร์ |

`createProject()` ตรวจว่าทุก student UID มีบัญชี student ที่ active ก่อนบันทึก กฎฐานข้อมูลตรวจอาจารย์และขอบเขต array ส่วนการเลือกสมาชิกเป็นอำนาจของผู้ดูแล หากเขียนผ่าน Console/Admin SDK ต้องตรวจบัญชีสมาชิกเองด้วย

ไม่ลบเอกสารโครงงานจากเว็บ ใช้ `archived` เพื่อเก็บประวัติ การเปลี่ยนผู้รับผิดชอบ/สมาชิกทำได้เฉพาะผู้ดูแล

## 3. projects/{projectId}/reviews/{reviewId}

| ฟิลด์ | ชนิด | ข้อกำหนด |
| --- | --- | --- |
| summary | string | ข้อความสรุป 1–20,000 ตัวอักษร |
| status | enum | `pending`, `approved`, `rejected` |
| createdAt, updatedAt | Timestamp | เวลาจากเซิร์ฟเวอร์ |

สร้างใหม่เป็น pending เท่านั้น อาจารย์เจ้าของโครงงานหรือผู้ดูแลตรวจและอนุมัติ นักศึกษาสมาชิกอ่านได้เฉพาะ approved หลังอนุมัติเอกสารถูกล็อกเพื่อรักษาหลักฐาน หากต้องแก้ให้สร้างผลสรุปรุ่นใหม่ ไม่เขียนทับของเดิม

ข้อความอีเมลต้นฉบับไม่อยู่ในเอกสารนี้ เพื่อไม่เผยแพร่ต้นฉบับพร้อมผลสรุปโดยไม่ตั้งใจ

## 4. projects/{projectId}/tasks/{taskId}

| ฟิลด์ | ชนิด | ข้อกำหนด |
| --- | --- | --- |
| title | string | งาน 1–500 ตัวอักษร |
| assigneeId | string UID | สมาชิกโครงงานผู้รับงาน 1 คน |
| reviewId | string document ID | ผลสรุป approved ในโครงงานเดียวกัน |
| status | enum | `todo`, `doing`, `done` |
| dueAt | Timestamp หรือ null | กำหนดส่ง; null เมื่อยังไม่ทราบ |
| createdAt, updatedAt | Timestamp | เวลาจากเซิร์ฟเวอร์ |

อาจารย์เจ้าของโครงงาน/ผู้ดูแลสร้างงานได้ นักศึกษาอ่านเฉพาะงานที่ตนรับผิดชอบ และเปลี่ยนเฉพาะ status ไม่แก้ข้อความ ผู้รับงาน หรือกำหนดส่ง

## 5. projects/{projectId}/appointments/{appointmentId}

| ฟิลด์ | ชนิด | ข้อกำหนด |
| --- | --- | --- |
| title | string | หัวข้อนัด 1–500 ตัวอักษร |
| studentId | string UID | นักศึกษาสมาชิกที่นัดด้วย |
| startsAt, endsAt | Timestamp | เวลาสิ้นสุดต้องหลังเวลาเริ่ม |
| location | string | สถานที่/ลิงก์ประชุม ไม่เกิน 500 ตัวอักษร |
| response | enum | `pending`, `accepted`, `declined` |
| createdAt, updatedAt | Timestamp | เวลาจากเซิร์ฟเวอร์ |

อาจารย์/ผู้ดูแลสร้างและเลื่อนนัด โดยต้องตั้ง response กลับเป็น pending นักศึกษาคนนั้นตอบรับหรือปฏิเสธเท่านั้น เปลี่ยนเวลานัดเองไม่ได้ โมเดลนี้เป็นนัดรายคน หากต้องนัดทั้งกลุ่มควรแยก responses/{uid} ก่อนขยาย flow

## ข้อมูลที่สงวนให้ backend

ยังไม่เปิด browser access ให้ `sources`, `integrations`, `auditLogs` และ collection อื่นที่ไม่ได้กำหนดไว้

- sources: เก็บ projectId, provider, providerMessageId, storagePath, importedAt และสถานะการประมวลผลในอนาคต ไฟล์ภาพ/PDF/อีเมลขนาดใหญ่ควรอยู่ใน Storage ไม่ใส่ base64 ใน Firestore
- integrations: เก็บสถานะการเชื่อมต่อและ ownerId เท่าที่จำเป็น โทเคน Gmail, refresh token และกุญแจ API ต้องเก็บในระบบ secret ฝั่ง backend ไม่ส่งเข้าเว็บ
- auditLogs: เขียนโดย backend ที่เชื่อถือได้เท่านั้น เพื่อไม่ให้ผู้ใช้ปลอมประวัติการกระทำ

โครงสร้างเหล่านี้เป็นแผนสำหรับขั้นตอนเชื่อม Gmail/OCR/backend ยังไม่มีระบบนำเข้าหรือบันทึก audit อัตโนมัติในงานนี้

## บริการข้อมูลที่เตรียมไว้

`src/services/projects.js` export ผ่าน `window.SummaData` แยกจาก `SummaAuth`:

- listProjects / createProject / updateProject
- listReviews / createReview / updateReview
- listTasks / createTask / updateTaskStatus
- listAppointments / createAppointment / respondAppointment

ฟังก์ชัน list คืน `{items, nextCursor}` ค่าเริ่มต้น 50 รายการ สูงสุด 100 และรับ `{after: nextCursor}` สำหรับหน้าถัดไป ห้ามใช้ผลลัพธ์เพียงหน้าแรกเป็นยอดรวม Dashboard ต้องอ่านครบหรือเพิ่ม aggregation ฝั่งบริการก่อนเชื่อมข้อมูลจริง

Query ใช้ UID จาก Firebase Auth จริงและกรองตามบทบาทจริง ไม่ใช้ viewRole หรือ demo identity กฎ Firestore ไม่ทำหน้าที่กรองผลลัพธ์ให้เอง จึงต้องใส่ `advisorId`, `studentIds array-contains`, `status`, `assigneeId` หรือ `studentId` ตามสิทธิ์ใน query ด้วย [เอกสาร Firebase](https://firebase.google.com/docs/firestore/security/rules-query)

ดัชนีอยู่ใน `config/firebase/firestore.indexes.json` ครอบคลุม query ที่บริการนี้ใช้ ไม่เปิด collection group query ข้ามโครงงาน

## การนำไปใช้กับฐานข้อมูลจริง

1. สำรองข้อมูลเดิมและตรวจ collection ที่แอปอื่นอาจใช้อยู่
2. คง users document และ UID เดิม ไม่สร้างบัญชีหรือรหัสผ่านจากชุดข้อมูลตัวอย่าง
3. ผู้ดูแลจับคู่รหัสนักศึกษา/อีเมลกับ UID จริงก่อนสร้าง project; ชื่อแสดงผลอย่างเดียวไม่พอสำหรับ migration
4. รัน `npm run test:rules` กับโปรเจกต์ `demo-summa` และ `npm run build:vercel`
5. ตรวจผลต่างของ rules และ indexes แล้ว deploy ด้วย `firebase deploy --only firestore:rules,firestore:indexes --project summa-cd251` เมื่อพร้อมใช้งานจริง
6. เชื่อมหน้าจอทีละ flow และทดสอบด้วยบัญชีจริงต่างบทบาทก่อนนำข้อมูลไปใช้ใน Dashboard

ไม่มีการนำชุดข้อมูลตัวอย่างขึ้น production อัตโนมัติ และไม่มีการล้าง/ย้าย/เปลี่ยนข้อมูล Firebase จริงในขั้นตอนเตรียมโครงสร้างนี้
