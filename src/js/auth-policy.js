/* Shared access decisions. Firestore rules enforce the corresponding server-side policy. */
(function(root) {
  'use strict';
  const publicPages = ['index', 'login', 'register'];
  const access = {
    student: ['student'], reports: ['student', 'advisor'],
    review: ['advisor'], projects: ['advisor'], gmail: ['advisor'], 'manual-import': ['advisor'],
    users: ['admin'], 'admin-projects': ['admin'], imports: ['admin'], integrations: ['admin'], logs: ['admin'],
    navbar: ['advisor', 'admin'], 'project-tree': ['advisor', 'admin']
  };
  const home = {student: 'student.html', advisor: 'review.html', admin: 'users.html'};
  function canAccess(page, state) {
    return publicPages.includes(page) || Boolean(state?.ready && state.user && state.profile?.status === 'active' && access[page]?.includes(state.profile.role));
  }
  function destination(state) { return state?.profile?.status === 'active' ? home[state.profile.role] || 'login.html' : 'login.html'; }
  function errorMessage(error) {
    const messages = {
      'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/user-not-found': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/wrong-password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'auth/email-already-in-use': 'อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบหรือตั้งรหัสผ่านใหม่',
      'auth/weak-password': 'รหัสผ่านไม่ผ่านข้อกำหนดของระบบ กรุณาใช้รหัสผ่านที่รัดกุมขึ้น',
      'auth/password-does-not-meet-requirements': 'รหัสผ่านไม่ผ่านข้อกำหนดที่ตั้งไว้ใน Firebase',
      'auth/too-many-requests': 'ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่',
      'auth/network-request-failed': 'เชื่อมต่อ Firebase ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
      'auth/operation-not-allowed': 'ยังไม่ได้เปิดผู้ให้บริการเข้าสู่ระบบนี้ใน Firebase',
      'auth/configuration-not-found': 'โปรเจกต์ Firebase ยังไม่ได้ตั้งค่า Authentication กรุณาเปิดใช้งานใน Firebase Console',
      'auth/invalid-api-key': 'การตั้งค่า Firebase API key ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ',
      'auth/unauthorized-domain': 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication',
      'auth/popup-closed-by-user': 'ยกเลิกการเข้าสู่ระบบด้วย Google แล้ว',
      'auth/popup-blocked': 'เบราว์เซอร์บล็อกหน้าต่าง Google กรุณาอนุญาตป๊อปอัป',
      'permission-denied': 'ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาตรวจสอบ Firestore Rules หรือแจ้งผู้ดูแลระบบ',
      'unavailable': 'เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาลองใหม่',
      'summa/pending': 'บัญชียังรอการอนุมัติจากผู้ดูแลระบบ',
      'summa/suspended': 'บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแลระบบ',
      'summa/profile-missing': 'ยังไม่มีข้อมูลสิทธิ์ของบัญชีนี้ในระบบ กรุณาติดต่อผู้ดูแลระบบ',
      'summa/profile-save': 'สร้างบัญชีแล้ว แต่บันทึกข้อมูลผู้ใช้ไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบก่อนเข้าสู่ระบบ',
      'summa/not-authorized': 'กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์',
      'summa/timeout': 'การเชื่อมต่อ Firebase ใช้เวลานานเกินไป กรุณาลองใหม่',
      'summa/unavailable': 'โหลดระบบเข้าสู่ระบบไม่ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วรีเฟรชหน้า'
    };
    return messages[error?.code] || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ';
  }
  const policy = Object.freeze({publicPages, access, canAccess, destination, errorMessage});
  root.SummaPolicy = policy;
  if (typeof module !== 'undefined') module.exports = policy;
})(typeof window !== 'undefined' ? window : globalThis);
