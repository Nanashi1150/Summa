/* reports page controller. */
Summa.register('reports', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { tpl: 0, on: { progress: true, meet: true, tasks: true, quote: true }, dl: 'idle' };
    this.timer = null;
  }
  componentWillUnmount() { if (this.timer) clearTimeout(this.timer); }
  renderVals() {
    const S = this.state;
    const tpls = [
      { name: 'ฉบับเต็ม', desc: 'ทุกส่วน เหมาะส่งอาจารย์เก็บเป็นหลักฐาน', on: { progress: true, meet: true, tasks: true, quote: true } },
      { name: 'ฉบับสอบความก้าวหน้า', desc: 'ความคืบหน้า การพบอาจารย์ และงาน', on: { progress: true, meet: true, tasks: true, quote: false } },
      { name: 'ฉบับย่อ', desc: 'ความคืบหน้าตามช่วงอย่างเดียว', on: { progress: true, meet: false, tasks: false, quote: false } }
    ];
    const templates = tpls.map((t, i) => ({
      name: t.name, desc: t.desc, on: S.tpl === i,
      border: S.tpl === i ? '#101A2E' : '#D3DAE3', bg: S.tpl === i ? '#FFF4C2' : '#FFFFFF',
      pick: () => this.setState({ tpl: i, on: { ...t.on }, dl: 'idle' })
    }));
    const labels = { progress: 'ความคืบหน้าตามช่วง', meet: 'การพบอาจารย์ที่ปรึกษา', tasks: 'ข้อเสนอแนะและงาน', quote: 'ข้อความจากอาจารย์' };
    const sections = Object.keys(labels).map((k) => ({
      label: labels[k], on: S.on[k], box: S.on[k] ? '#FFE066' : '#FFFFFF', tick: S.on[k] ? 1 : 0,
      pick: () => this.setState({ on: { ...this.state.on, [k]: !this.state.on[k] }, dl: 'idle' })
    }));
    const stages = [
      { label: 'หัวข้อ', state: 'ผ่านแล้ว', date: '8 ก.ย. 2569', bar: '#101A2E' },
      { label: '20%', state: 'ผ่านแล้ว', date: '2 ต.ค. 2569', bar: '#101A2E' },
      { label: '60%', state: 'กำลังดำเนินการ', date: 'ก่อนสอบความก้าวหน้า', bar: '#FFE066' },
      { label: '100%', state: 'ยังไม่ถึง', date: 'ยังไม่มีกำหนด', bar: '#D3DAE3' }
    ];
    const pos = (d) => Math.round(((d - 1) / 70) * 100);
    const meetsRaw = [[8, 'หัวข้อ\n8 ก.ย.', true], [32, '20%\n2 ต.ค.', true], [42, '12 ต.ค.', true], [59, 'นัดถัดไป\n29 ต.ค.', false]];
    const meets = meetsRaw.map((m) => ({ left: pos(m[0]), label: m[1].replace('\n', ' '), dot: m[2] ? '#101A2E' : '#FFFFFF' }));
    const st = { done: ['เสร็จแล้ว', '#DDF1E8', '#0F5A3F'], doing: ['กำลังทำ', '#FFF4C2', '#5C4300'], todo: ['ยังไม่เริ่ม', '#E6ECF3', '#2B374D'] };
    const tasks = [
      ['หัวข้อ', 'ปรับขอบเขตผู้ใช้ทั้ง 3 กลุ่มให้ชัดเจน', 'done'],
      ['20%', 'ออกแบบโครงสร้างฐานข้อมูล', 'done'],
      ['20%', 'ส่งแบบร่างหน้าจอ', 'done'],
      ['60%', 'แก้แผนภาพ ER บทที่ 3 ให้ครบทุกตาราง', 'doing'],
      ['60%', 'เพิ่มผลทดสอบการสกัดวันนัดหมาย', 'todo']
    ].map((t) => ({ stage: t[0], title: t[1], status: st[t[2]][0], bg: st[t[2]][1], fg: st[t[2]][2] }));
    const dl = S.dl;
    return {
      templates, sections, stages, meets, tasks,
      tplName: tpls[S.tpl].name,
      showProgress: S.on.progress, showMeet: S.on.meet, showTasks: S.on.tasks, showQuote: S.on.quote,
      dlLabel: dl === 'busy' ? 'กำลังสร้าง PDF' : 'ดาวน์โหลด PDF',
      dlNote: dl === 'ready' ? 'สร้างไฟล์ Summa-CS-01-report.pdf แล้ว' : '',
      download: () => window.print()
    };
  }
}

return Component;
});
