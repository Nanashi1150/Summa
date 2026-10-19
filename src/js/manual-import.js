/* manual-import page controller. */
Summa.register('manual-import', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { phase: 'empty', img: '', sample: false, vals: {}, error: '' };
    this.timer = null;
  }
  componentWillUnmount() { if (this.timer) clearTimeout(this.timer); }
  auto() {
    return {
      name: 'กมลชนก รัตนวงศ์', email: 'kamonchanok.r@university.ac.th', sid: '', code: 'CS-04',
      topic: 'ระบบแนะนำเส้นทางจักรยานในเมือง', term: '2569/1', faculty: 'คณะวิทยาศาสตร์', branch: 'วิทยาการคอมพิวเตอร์',
      stage: '20%', kind: 'ขอนัดปรึกษา', date: '13 ต.ค. 2569',
      text: 'หนูทำระบบแนะนำเส้นทางจักรยานในเมือง ตอนนี้ทำถึงบทที่ 2 แล้ว ขอนัดปรึกษาวันพฤหัสบดีที่ 22 ตุลาคม เวลา 10:00 น.'
    };
  }
  extract() {
    if (this.timer) clearTimeout(this.timer);
    this.setState({ phase: 'busy', error: '' });
    this.timer = setTimeout(() => this.setState({ phase: 'done', vals: this.auto() }), 1600);
  }
  renderVals() {
    const S = this.state;
    const A = this.auto();
    const V = S.vals;
    const defs = [
      ['name', 'ชื่อ-นามสกุล', 'text', 1, null], ['email', 'อีเมลผู้ส่ง', 'text', 1, null],
      ['sid', 'รหัสนักศึกษา', 'text', 1, null], ['code', 'รหัสโครงงาน', 'text', 1, null],
      ['topic', 'หัวข้อโครงงาน', 'text', 2, null],
      ['term', 'ภาคเรียน/ปีการศึกษา', 'select', 1, [['2569/1', '2569 ภาคเรียนที่ 1'], ['2568/2', '2568 ภาคเรียนที่ 2']]],
      ['stage', 'ช่วงงาน', 'select', 1, ['หัวข้อ', '20%', '60%', '100%'].map((x) => [x, x])],
      ['faculty', 'คณะ', 'text', 1, null], ['branch', 'สาขา', 'text', 1, null],
      ['kind', 'ประเภทข้อความ', 'select', 1, ['ขอนัดปรึกษา', 'ข้อเสนอแนะ', 'รายงานความคืบหน้า'].map((x) => [x, x])],
      ['date', 'วันที่ของข้อความ', 'text', 1, null],
      ['text', 'ข้อความที่อ่านได้จากภาพ', 'area', 2, null]
    ];
    const fields = defs.map((d) => {
      const k = d[0];
      const v = V[k] === undefined ? '' : V[k];
      const edited = v !== A[k];
      let badge = 'Ollama', bbg = '#DCE6FF', bfg = '#1B3A9E', hint = '';
      if (edited) { badge = 'แก้ไขแล้ว'; bbg = '#FFF4C2'; bfg = '#5C4300'; }
      if (A[k] === '' && v === '') { badge = 'ไม่พบในภาพ'; bbg = '#F6DDDD'; bfg = '#8A1F1F'; hint = 'Ollama หาข้อมูลนี้ในภาพไม่พบ กรอกเองได้'; }
      const need = (k === 'name' || k === 'email') && v === '';
      return {
        id: 'f-' + k, label: d[1], value: v, badge, bbg, bfg, hint, hasHint: hint !== '',
        flex: d[3] === 2 ? '1 1 100%' : '1 1 200px',
        line: need ? '#8A1F1F' : '#8895A8',
        isText: d[2] === 'text', isSelect: d[2] === 'select', isArea: d[2] === 'area',
        options: (d[4] || []).map((o) => ({ v: o[0], t: o[1] })),
        set: (e) => this.setState({ vals: { ...this.state.vals, [k]: e.target.value } })
      };
    });
    const known = { 'CS-01': 'กรวิชญ์ กิจภิญโญ', 'CS-04': 'กมลชนก รัตนวงศ์', 'CS-07': 'ชยพล สุขสวัสดิ์' };
    const code = (V.code || '').trim();
    const matched = known[code];
    const ph = S.phase;
    const banners = {
      empty: ['รอภาพ', '#E6ECF3', '#2B374D'], busy: ['กำลังอ่านภาพ', '#DCE6FF', '#1B3A9E'],
      done: ['Ollama กรอกให้แล้ว ตรวจสอบได้', '#DDF1E8', '#0F5A3F'], saved: ['นำเข้าแล้ว', '#DDF1E8', '#0F5A3F']
    };
    const b = banners[ph];
    const hasImage = S.img !== '' || S.sample;
    return {
      fields, hasImage, noImage: !hasImage,
      isSample: S.sample, hlOpacity: S.phase === 'done' ? 0.75 : 0, isUpload: S.img !== '', imgUrl: S.img, done: ph === 'done',
      isEmpty: ph === 'empty', isBusy: ph === 'busy', showForm: ph === 'done', isSaved: ph === 'saved',
      bannerText: b[0], bannerBg: b[1], bannerFg: b[2],
      matchBg: matched ? '#DDF1E8' : '#FFF4C2',
      matchText: matched ? 'พบโครงงาน ' + code + ' ในระบบ · นักศึกษา ' + matched : 'ยังไม่พบรหัสโครงงานนี้ในระบบ ระบบจะบันทึกเป็นรายการรอจับคู่ให้ผู้ดูแล',
      error: S.error, hasError: S.error !== '',
      useSample: () => { this.setState({ sample: true, img: '' }); this.extract(); },
      onFile: (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        this.setState({ img: URL.createObjectURL(f), sample: false });
        this.extract();
      },
      rerun: () => this.extract(),
      reset: () => { if (this.timer) clearTimeout(this.timer); this.setState({ phase: 'empty', img: '', sample: false, vals: {}, error: '' }); },
      save: () => {
        const v = this.state.vals;
        if (!v.name || !v.email) { this.setState({ error: 'กรอกชื่อ-นามสกุลและอีเมลผู้ส่งก่อนบันทึก' }); return; }
        if (!v.text) { this.setState({ error: 'ต้องมีข้อความที่อ่านได้จากภาพ เพื่อใช้สรุปและตรวจสอบ' }); return; }
        this.setState({ phase: 'saved', error: '' });
      }
    };
  }
}

return Component;
});
