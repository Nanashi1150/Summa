/* imports page controller. */
Summa.register('imports', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { filter: 'all', fixed: {} };
  }
  renderVals() {
    const health = [
      { name: 'Gmail API', state: 'เชื่อมต่อแล้ว', note: 'ตรวจทุก 15 นาที', dot: '#3DBE8B' },
      { name: 'Ollama', state: 'พร้อมใช้งาน', note: 'โมเดลที่ตั้งไว้ตอบสนองปกติ', dot: '#3DBE8B' },
      { name: 'ฐานข้อมูล PostgreSQL', state: 'ปกติ', note: 'สำรองล่าสุดเมื่อคืน', dot: '#3DBE8B' },
      { name: 'การแจ้งเตือน', state: 'ล้มเหลว 1 รายการ', note: 'ส่งอีเมลไม่สำเร็จ', dot: '#FFE066' }
    ];
    const all = [
      { id: 1, subject: 'ขอนัดปรึกษาบทที่ 2', from: 'นักศึกษา CS-04', time: '11:05', project: 'CS-04', k: 'ok', detail: 'สกัดนัดหมายได้ 1 รายการ' },
      { id: 2, subject: 'ความคืบหน้าสัปดาห์นี้', from: 'นักศึกษา (ไม่ระบุรหัส)', time: '10:40', project: 'จับคู่ไม่ได้', k: 'unmatched', detail: 'ไม่พบรหัสโครงงานในหัวเรื่องหรือเนื้อหา' },
      { id: 3, subject: 'Re: ผลการพบวันนี้', from: 'อาจารย์ที่ปรึกษา', time: '16:42', project: 'CS-01', k: 'ok', detail: 'สรุปแล้ว รออาจารย์อนุมัติ' },
      { id: 4, subject: 'ส่งไฟล์บทที่ 3', from: 'นักศึกษา CS-07', time: 'เมื่อวาน', project: 'CS-07', k: 'error', detail: 'Ollama หมดเวลาระหว่างประมวลผล' },
      { id: 5, subject: 'รายงานความคืบหน้า', from: 'นักศึกษา CS-07', time: 'เมื่อวาน', project: 'CS-07', k: 'ok', detail: 'สกัดความคืบหน้าและงานได้ 2 รายการ' }
    ];
    const styles = {
      ok: ['นำเข้าสำเร็จ', '#DDF1E8', '#0F5A3F'],
      unmatched: ['จับคู่ไม่ได้', '#FFF4C2', '#5C4300'],
      error: ['เกิดข้อผิดพลาด', '#F6DDDD', '#8A1F1F']
    };
    const fixed = this.state.fixed;
    const withState = all.map((r) => {
      const k = fixed[r.id] ? 'ok' : r.k;
      const s = styles[k];
      return {
        ...r, k,
        status: fixed[r.id] ? 'กำลังประมวลผล' : s[0],
        bg: fixed[r.id] ? '#DCE6FF' : s[1],
        fg: fixed[r.id] ? '#1B3A9E' : s[2],
        detail: fixed[r.id] ? 'อยู่ในคิวประมวลผลใหม่' : r.detail,
        canRetry: !fixed[r.id] && r.k !== 'ok',
        isUnmatched: !fixed[r.id] && r.k === 'unmatched',
        retry: () => this.setState({ fixed: { ...this.state.fixed, [r.id]: true } })
      };
    });
    const f = this.state.filter;
    const rows = f === 'all' ? withState : withState.filter((r) => r.k === f);
    const fl = [['all', 'ทั้งหมด'], ['ok', 'สำเร็จ'], ['unmatched', 'จับคู่ไม่ได้'], ['error', 'ผิดพลาด']];
    const filters = fl.map((x) => ({
      label: x[1],
      bg: f === x[0] ? '#101A2E' : '#FFFFFF',
      fg: f === x[0] ? '#FFFFFF' : '#101A2E',
      pick: () => this.setState({ filter: x[0] })
    }));
    return { health, rows, filters };
  }
}

return Component;
});
