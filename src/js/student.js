/* student page controller. */
Summa.register('student', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 2, appt: 'pending', st: { 1: [2], 2: [0, 0] } };
  }
  renderVals() {
    const S = this.state;
    const defs = [
      { label: 'หัวข้อ', state: 'ผ่านแล้ว', date: 'อนุมัติ 8 ก.ย. 2569', k: 'done' },
      { label: '20%', state: 'ผ่านแล้ว', date: 'พบอาจารย์ 2 ต.ค. 2569', k: 'done' },
      { label: '60%', state: 'กำลังดำเนินการ', date: 'ส่งตรวจก่อนสอบความก้าวหน้า', k: 'now' },
      { label: '100%', state: 'ยังไม่ถึง', date: 'ยังไม่มีกำหนด', k: 'next' }
    ];
    const look = {
      done: { bar: '#101A2E', cbg: '#DDF1E8', cfg: '#0F5A3F' },
      now: { bar: '#FFE066', cbg: '#FFF4C2', cfg: '#5C4300' },
      next: { bar: '#D3DAE3', cbg: '#E6ECF3', cfg: '#2B374D' }
    };
    const stages = defs.map((d, i) => ({
      ...d, ...look[d.k], on: S.sel === i,
      border: S.sel === i ? '#101A2E' : '#D3DAE3',
      pick: () => this.setState({ sel: i })
    }));
    const fb = {
      0: [{ text: 'อนุมัติหัวข้อ ปรับขอบเขตให้ชัดเจนขึ้น', quote: 'หัวข้อนี้ใช้ได้ครับ ขอให้ระบุขอบเขตผู้ใช้ทั้ง 3 กลุ่มให้ชัด', date: '8 ก.ย.' }],
      1: [{ text: 'ออกแบบโครงสร้างฐานข้อมูลก่อนเริ่มพัฒนา', quote: 'ขอให้ออกแบบตารางผู้ใช้ โครงงาน และอีเมลก่อนเริ่มเขียนโค้ด', date: '2 ต.ค.' }],
      2: [{ text: 'แก้แผนภาพ ER บทที่ 3 ให้ครบทุกตาราง และส่งภายใน 23 ต.ค.', quote: 'ขอให้แก้แผนภาพ ER ในบทที่ 3 ให้ครบทุกตาราง ส่งภายในวันศุกร์ที่ 23 ตุลาคม', date: '12 ต.ค.' },
        { text: 'เพิ่มผลทดสอบการสกัดวันนัดหมายจากอีเมลจริง', quote: 'เพิ่มผลทดสอบการสกัดวันนัดหมายจากอีเมลจริง ก่อนสอบความก้าวหน้า', date: '12 ต.ค.' }],
      3: []
    };
    const taskDefs = {
      1: [{ title: 'ออกแบบโครงสร้างฐานข้อมูล', due: 'ส่งแล้ว 2 ต.ค. 2569' }],
      2: [{ title: 'แก้แผนภาพ ER บทที่ 3 ให้ครบทุกตาราง', due: 'กำหนดส่ง 23 ต.ค. 2569' }, { title: 'เพิ่มผลทดสอบการสกัดวันนัดหมาย', due: 'ก่อนสอบความก้าวหน้า' }]
    };
    const mailDefs = {
      0: [{ subject: '[CS-01] เสนอหัวข้อโครงงาน', date: '3 ก.ย.', at: 4, note: 'เผยแพร่ผลสรุปแล้ว' }],
      1: [{ subject: '[CS-01] ขอนัดปรึกษา 20%', date: '30 ก.ย.', at: 4, note: 'อาจารย์ตอบรับนัดหมายแล้ว' }],
      2: [{ subject: '[CS-01] ขอนัดปรึกษา 60%', date: '10 ต.ค.', at: 4, note: 'เผยแพร่ผลสรุปแล้ว เมื่อ 12 ต.ค.' },
        { subject: '[CS-01] ส่งบทที่ 3 ฉบับแก้ไข', date: '14 ต.ค.', at: 2, note: 'Summa นำเข้าแล้ว รออาจารย์ตรวจผลสรุป' }],
      3: []
    };
    const stepNames = ['ส่งแล้ว', 'นำเข้าแล้ว', 'อาจารย์ตรวจ', 'เผยแพร่'];
    const mails = mailDefs[S.sel].map((m) => ({
      subject: m.subject, date: m.date, note: m.note,
      steps: stepNames.map((n, i) => ({
        label: n,
        dot: i < m.at ? '#101A2E' : (i === m.at ? '#FFE066' : '#FFFFFF'),
        lineL: i === 0 ? 'transparent' : (i <= m.at ? '#101A2E' : '#D3DAE3'),
        lineR: i === 3 ? 'transparent' : (i < m.at ? '#101A2E' : '#D3DAE3'),
        weight: i === m.at ? 600 : 400,
        fg: i <= m.at ? '#101A2E' : '#566275'
      }))
    }));
    const labels = ['ยังไม่เริ่ม', 'กำลังทำ', 'เสร็จแล้ว'];
    const bgs = ['#FFFFFF', '#FFE066', '#176B4D'];
    const fgs = ['#101A2E', '#101A2E', '#FFFFFF'];
    const tdefs = taskDefs[S.sel] || [];
    const tasks = tdefs.map((t, i) => {
      const v = (S.st[S.sel] || [])[i] || 0;
      return {
        ...t, top: i === 0 ? 'none' : '1px solid #D3DAE3', deco: v === 2 ? 'line-through' : 'none',
        status: labels[v], bg: bgs[v], fg: fgs[v],
        cycle: () => {
          const st = { ...this.state.st };
          const arr = (st[S.sel] || []).slice();
          arr[i] = ((arr[i] || 0) + 1) % 3;
          st[S.sel] = arr;
          this.setState({ st });
        }
      };
    });
    const a = S.appt;
    return {
      stages, mails, tasks,
      selLabel: defs[S.sel].label,
      feedback: fb[S.sel],
      noFeedback: fb[S.sel].length === 0,
      noMail: mails.length === 0,
      hasTasks: tasks.length > 0,
      hasAppt: S.sel === 2,
      pendingAppt: a === 'pending',
      apptBg: a === 'confirmed' ? '#DDF1E8' : '#FFF4C2',
      apptLabel: a === 'confirmed' ? 'ยืนยันนัดหมายแล้ว' : a === 'declined' ? 'ส่งคำขอเวลาอื่นให้อาจารย์แล้ว' : 'นัดหมายถัดไป รอคุณยืนยัน',
      confirmAppt: () => this.setState({ appt: 'confirmed' }),
      declineAppt: () => this.setState({ appt: 'declined' })
    };
  }
}

return Component;
});
