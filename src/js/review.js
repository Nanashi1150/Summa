/* review page controller. */
Summa.register('review', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { hl: 0, status: 'pending' };
  }
  renderVals() {
    const hl = this.state.hl;
    const st = this.state.status;
    const raw = [
      { t: 'เรียนนักศึกษาโครงงาน CS-01 ครับ ผลการพบวันนี้ ภาพรวมคืบหน้าดี ขอให้ ', h: -1 },
      { t: 'แก้แผนภาพ ER ในบทที่ 3 ให้ครบทุกตาราง', h: 0 },
      { t: ' และ', h: -1 },
      { t: 'ส่งภายในวันศุกร์ที่ 23 ตุลาคม', h: 0 },
      { t: ' จากนั้น ', h: -1 },
      { t: 'เพิ่มผลทดสอบการสกัดวันนัดหมายจากอีเมลจริง', h: 1 },
      { t: ' ก่อนสอบความก้าวหน้า และ ', h: -1 },
      { t: 'นัดพบอีกครั้งวันพฤหัสบดีที่ 29 ตุลาคม เวลา 13:30 น.', h: 2 },
      { t: ' ที่ห้องพักอาจารย์ครับ', h: -1 }
    ];
    const segments = raw.map((s) => ({
      text: s.t, isHl: s.h >= 0, isPlain: s.h < 0,
      bg: s.h === hl ? '#FFE066' : '#FFF4C2',
      pick: () => this.setState({ hl: s.h })
    }));
    const itemsRaw = [
      { kind: 'งาน', title: 'แก้แผนภาพ ER บทที่ 3 ให้ครบทุกตาราง', owner: 'นักศึกษา', due: 'ส่ง 23 ต.ค. 2569', warn: false },
      { kind: 'งาน', title: 'เพิ่มผลทดสอบการสกัดวันนัดหมาย', owner: 'นักศึกษา', due: 'ก่อนสอบความก้าวหน้า', warn: true },
      { kind: 'นัดหมาย', title: 'พบอาจารย์ที่ปรึกษา ห้องพักอาจารย์', owner: 'ทั้งสองฝ่าย', due: '29 ต.ค. 2569 · 13:30', warn: false }
    ];
    const items = itemsRaw.map((it, i) => ({
      ...it,
      bg: i === hl ? '#FFE066' : '#FFFFFF',
      border: i === hl ? '#101A2E' : '#D3DAE3',
      pick: () => this.setState({ hl: i })
    }));
    const queue = [
      { project: 'CS-01', sub: 'ข้อเสนอแนะหลังพบ', time: 'วันนี้ 16:42', sel: true },
      { project: 'CS-04', sub: 'ขอนัดปรึกษาบทที่ 2', time: 'วันนี้ 11:05', sel: false },
      { project: 'CS-07', sub: 'รายงานความคืบหน้า', time: 'เมื่อวาน 20:18', sel: false }
    ].map((q) => ({ ...q, bg: q.sel ? '#FFF4C2' : '#FFFFFF', border: q.sel ? '#101A2E' : '#D3DAE3' }));
    const map = {
      pending: ['รอการตรวจสอบ', '#FFF4C2', '#5C4300', 'ตรวจผลสรุปเทียบกับข้อความต้นฉบับ แล้วอนุมัติเพื่อให้นักศึกษามองเห็น'],
      approved: ['เผยแพร่แล้ว', '#DDF1E8', '#0F5A3F', 'อนุมัติผลสรุปตัวอย่างแล้ว ยังไม่ได้ส่งการแจ้งเตือนจริง'],
      rejected: ['ปฏิเสธผลสรุป', '#F6DDDD', '#8A1F1F', 'ผลสรุปนี้จะไม่ถูกเผยแพร่ เลือกประมวลผลใหม่หากต้องการสรุปอีกครั้ง'],
      reprocessing: ['กำลังประมวลผลใหม่', '#DCE6FF', '#1B3A9E', 'Ollama กำลังสรุปข้อความต้นฉบับอีกครั้ง']
    };
    const m = map[st];
    return {
      segments, items, queue,
      statusText: m[0], statusBg: m[1], statusFg: m[2], hint: m[3],
      approve: () => this.setState({ status: 'approved' }),
      reject: () => this.setState({ status: 'rejected' }),
      reprocess: () => this.setState({ status: 'reprocessing' })
    };
  }
}

return Component;
});
