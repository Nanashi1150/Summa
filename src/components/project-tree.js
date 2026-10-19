/* Shared project directory controller. */
Summa.register('project-tree', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { term: 'all', query: '', sort: 'name', dir: 1, collapsed: {} };
  }
  renderVals() {
    const scope = this.props.scope || 'advisor';
    const me = 'อ.นุจรินทร์ ปทุมพงษ์';
    const S = this.state;
    const D = [
      ['2569/1', 'คณะวิทยาศาสตร์', 'วิทยาการคอมพิวเตอร์', 'กรวิชญ์ กิจภิญโญ', 'ระบบสรุปข้อเสนอแนะและนัดหมายอาจารย์ที่ปรึกษาด้วย AI', 'CS-01', me, 'รอตรวจ'],
      ['2569/1', 'คณะวิทยาศาสตร์', 'วิทยาการคอมพิวเตอร์', 'กมลชนก รัตนวงศ์', 'ระบบแนะนำเส้นทางจักรยานในเมือง', 'CS-04', me, 'กำลังดำเนินการ'],
      ['2569/1', 'คณะวิทยาศาสตร์', 'วิทยาการคอมพิวเตอร์', 'ชยพล สุขสวัสดิ์', 'แอปจัดการค่าใช้จ่ายกลุ่ม', 'CS-07', me, 'รอตรวจ'],
      ['2569/1', 'คณะวิทยาศาสตร์', 'เทคโนโลยีสารสนเทศ', 'ปวีณา แก้วมณี', 'แดชบอร์ดติดตามคุณภาพอากาศ', 'IT-02', 'อ.ภัทรา วงศ์สกุล', 'กำลังดำเนินการ'],
      ['2569/1', 'คณะวิศวกรรมศาสตร์', 'วิศวกรรมคอมพิวเตอร์', 'ณัฐวุฒิ เจริญผล', 'ระบบตรวจจับใบหน้าบนอุปกรณ์ขนาดเล็ก', 'CE-03', 'อ.ศุภชัย มั่นคง', 'พร้อมสอบ'],
      ['2569/1', 'คณะวิศวกรรมศาสตร์', 'วิศวกรรมคอมพิวเตอร์', 'อรุณี พิทักษ์ไทย', 'เครือข่ายเซนเซอร์ฟาร์มอัจฉริยะ', 'CE-05', 'อ.ศุภชัย มั่นคง', 'กำลังดำเนินการ'],
      ['2569/1', 'คณะวิศวกรรมศาสตร์', 'วิศวกรรมซอฟต์แวร์', 'สิริวิมล ตั้งใจดี', 'เครื่องมือทดสอบ API อัตโนมัติ', 'SE-01', 'อ.ภัทรา วงศ์สกุล', 'รอตรวจ'],
      ['2568/2', 'คณะวิทยาศาสตร์', 'วิทยาการคอมพิวเตอร์', 'เกียรติศักดิ์ บุญมา', 'ระบบจัดตารางสอบอัตโนมัติ', 'CS-12', me, 'เสร็จสิ้น'],
      ['2568/2', 'คณะวิทยาศาสตร์', 'วิทยาการคอมพิวเตอร์', 'ธิดารัตน์ ใจเย็น', 'แชตบอตตอบคำถามหลักสูตร', 'CS-15', me, 'เสร็จสิ้น'],
      ['2568/2', 'คณะวิศวกรรมศาสตร์', 'วิศวกรรมซอฟต์แวร์', 'พงศกร ลิขิตกุล', 'ระบบจองห้องประชุมด้วยคิวอาร์', 'SE-08', 'อ.ภัทรา วงศ์สกุล', 'เสร็จสิ้น']
    ].map((a) => ({ term: a[0], fac: a[1], br: a[2], name: a[3], topic: a[4], code: a[5], advisor: a[6], status: a[7] }));
    const termLabel = { '2569/1': 'ปีการศึกษา 2569 ภาคเรียนที่ 1', '2568/2': 'ปีการศึกษา 2568 ภาคเรียนที่ 2' };
    const stCol = { 'รอตรวจ': ['#FFF4C2', '#5C4300'], 'กำลังดำเนินการ': ['#DCE6FF', '#1B3A9E'], 'พร้อมสอบ': ['#DDF1E8', '#0F5A3F'], 'เสร็จสิ้น': ['#E6ECF3', '#2B374D'] };
    const th = (a, b) => a.localeCompare(b, 'th');
    const q = S.query.trim();
    let list = D.filter((r) => (scope === 'admin' || r.advisor === me) && (S.term === 'all' || r.term === S.term)
      && (!q || (r.name + r.topic + r.code).indexOf(q) >= 0));
    const rows = [];
    const toggleOf = (key) => () => this.setState({ collapsed: { ...this.state.collapsed, [key]: !this.state.collapsed[key] } });
    const head = (key, label, count, pad, bg, weight) => ({
      isHead: true, isRow: false, label, count, pad, bg, weight,
      open: !S.collapsed[key], arrow: S.collapsed[key] ? 'M3 1l6 5-6 5z' : 'M1 3l5 6 5-6z', toggle: toggleOf(key)
    });
    const terms = Array.from(new Set(list.map((r) => r.term))).sort().reverse();
    terms.forEach((t) => {
      const inT = list.filter((r) => r.term === t);
      rows.push(head(t, termLabel[t], inT.length, 20, '#E6ECF3', 600));
      if (S.collapsed[t]) return;
      Array.from(new Set(inT.map((r) => r.fac))).sort(th).forEach((f) => {
        const inF = inT.filter((r) => r.fac === f);
        rows.push(head(t + f, f, inF.length, 40, '#F4F6F8', 600));
        if (S.collapsed[t + f]) return;
        Array.from(new Set(inF.map((r) => r.br))).sort(th).forEach((b) => {
          const inB = inF.filter((r) => r.br === b);
          rows.push(head(t + f + b, 'สาขา' + b, inB.length, 60, '#FFFFFF', 500));
          if (S.collapsed[t + f + b]) return;
          const key = S.sort === 'name' ? 'name' : 'topic';
          inB.slice().sort((x, y) => th(x[key], y[key]) * S.dir).forEach((r) => {
            const c = stCol[r.status];
            rows.push({ isHead: false, isRow: true, pad: 80, name: r.name, topic: r.topic, code: r.code, advisor: r.advisor, status: r.status, sbg: c[0], sfg: c[1] });
          });
        });
      });
    });
    const sorts = [['name', 'ชื่อ-นามสกุล'], ['topic', 'หัวข้อ']].map((s) => ({
      label: s[1], on: S.sort === s[0], bg: S.sort === s[0] ? '#101A2E' : '#FFFFFF', fg: S.sort === s[0] ? '#FFFFFF' : '#101A2E',
      pick: () => this.setState({ sort: s[0] })
    }));
    return {
      rows, sorts, total: list.length, empty: list.length === 0,
      showAdvisor: scope === 'admin', term: S.term, query: S.query,
      dirLabel: S.dir === 1 ? 'เรียง ก-ฮ' : 'เรียง ฮ-ก',
      flip: () => this.setState({ dir: -S.dir }),
      setTerm: (e) => this.setState({ term: e.target.value }),
      setQuery: (e) => this.setState({ query: e.target.value })
    };
  }
}

return Component;
});
