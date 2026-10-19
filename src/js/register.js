/* register page controller. */
Summa.register('register', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { role: 'student', first: '', last: '', faculty: '', branch: '', sid: '', email: '', pw1: '', pw2: '', error: '', done: false, busy: false };
  }
  renderVals() {
    const s = this.state;
    const tree = {
      'คณะวิทยาศาสตร์': ['วิทยาการคอมพิวเตอร์', 'เทคโนโลยีสารสนเทศ'],
      'คณะวิศวกรรมศาสตร์': ['วิศวกรรมคอมพิวเตอร์', 'วิศวกรรมซอฟต์แวร์'],
      'คณะบริหารธุรกิจ': ['ระบบสารสนเทศเพื่อการจัดการ']
    };
    const set = (k) => (e) => this.setState({ [k]: e.target.value });
    const roles = [['student', 'นักศึกษา'], ['advisor', 'อาจารย์ที่ปรึกษา']].map((r) => ({
      label: r[1], on: s.role === r[0],
      bg: s.role === r[0] ? '#101A2E' : '#FFFFFF', fg: s.role === r[0] ? '#FFFFFF' : '#101A2E',
      pick: () => this.setState({ role: r[0] })
    }));
    return {
      busy: s.busy, registerLabel: s.busy ? 'กำลังส่งคำขอ…' : 'ส่งคำขอสมัคร',
      roles, faculties: Object.keys(tree),
      branches: s.faculty ? tree[s.faculty] : [],
      branchHint: s.faculty ? 'เลือกสาขา' : 'เลือกคณะก่อน',
      isStudent: s.role === 'student',
      first: s.first, last: s.last, faculty: s.faculty, branch: s.branch, sid: s.sid, email: s.email, pw1: s.pw1, pw2: s.pw2,
      error: s.error, hasError: s.error !== '', done: s.done, notDone: !s.done,
      name: (s.first + ' ' + s.last).trim(),
      setFirst: set('first'), setLast: set('last'), setSid: set('sid'), setEmail: set('email'), setPw1: set('pw1'), setPw2: set('pw2'),
      setFaculty: (e) => this.setState({ faculty: e.target.value, branch: '' }),
      setBranch: set('branch'),
      submit: async () => {
        if (s.busy) return;
        if (!s.first || !s.last || !s.faculty || !s.branch || !s.email || !s.pw1) { this.setState({ error: 'กรอกชื่อ นามสกุล คณะ สาขา อีเมล และรหัสผ่านให้ครบ' }); return; }
        if (s.role === 'student' && !s.sid) { this.setState({ error: 'กรอกรหัสนักศึกษา' }); return; }
        if (s.email.indexOf('@') < 1) { this.setState({ error: 'อีเมลไม่ถูกต้อง ตรวจสอบรูปแบบ name@university.ac.th' }); return; }
        if (s.pw1.length < 8) { this.setState({ error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' }); return; }
        if (s.pw1 !== s.pw2) { this.setState({ error: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' }); return; }
        this.setState({error:'',busy:true});
        try {
          if(!window.SummaAuth)throw {code:'summa/unavailable'};
          await SummaAuth.register({...s});
          this.setState({done:true,pw1:'',pw2:''});
        } catch(error) {this.setState({error:SummaPolicy.errorMessage(error)});}
        finally {this.setState({busy:false});}
      }
    };
  }
}

return Component;
});
