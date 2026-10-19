/* users page controller. */
Summa.register('users', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state={tab:'all',users:[],loading:true,error:''};
  }
  async componentDidMount() {
    if(this.props.demo){
      this.setState({loading:false,users:[
        {id:'demo-admin',name:'ผู้ดูแลระบบตัวอย่าง',email:'admin@example.test',role:'admin',status:'active',fac:'ส่วนกลาง',br:'ผู้ดูแลระบบ',self:true},
        {id:'demo-advisor',name:'อาจารย์ตัวอย่าง',email:'advisor@example.test',role:'advisor',status:'active',fac:'คณะวิทยาศาสตร์',br:'วิทยาการคอมพิวเตอร์'},
        {id:'demo-student',name:'นักศึกษาตัวอย่าง',email:'student@example.test',role:'student',status:'pending',fac:'คณะวิทยาศาสตร์',br:'วิทยาการคอมพิวเตอร์'}
      ]});
      return;
    }
    try {
      const users=await SummaAuth.listUsers();
      this.setState({users:users.map(user=>({...user,self:user.id===SummaAuth.state.user.uid || user.role==='admin'})),loading:false});
    } catch(error) {this.setState({error:SummaPolicy.errorMessage(error),loading:false});}
  }
  renderVals() {
    const S = this.state;
    const th = (a, b) => a.localeCompare(b, 'th');
    const upd = async (id, patch) => { try { if(!this.props.demo)await SummaAuth.updateUser(id, patch); this.setState({ users: this.state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)), error: '' }); } catch(error) { this.setState({error: SummaPolicy.errorMessage(error)}); } };
    const stCol = { active: ['#DDF1E8', '#0F5A3F', 'ใช้งานอยู่'], pending: ['#FFF4C2', '#5C4300', 'รอเปิดใช้งาน'], suspended: ['#F6DDDD', '#8A1F1F', 'ถูกระงับ'] };
    const tabDefs = [['all', 'ทั้งหมด'], ['pending', 'รอเปิดใช้งาน'], ['student', 'นักศึกษา'], ['advisor', 'อาจารย์ที่ปรึกษา'], ['admin', 'ผู้ดูแลระบบ']];
    const match = (u, t) => t === 'all' || (t === 'pending' ? u.status === 'pending' : u.role === t);
    const tabs = tabDefs.map((t) => ({
      label: t[1], count: S.users.filter((u) => match(u, t[0])).length, on: S.tab === t[0],
      bg: S.tab === t[0] ? '#101A2E' : '#FFFFFF', fg: S.tab === t[0] ? '#FFFFFF' : '#101A2E',
      pick: () => this.setState({ tab: t[0] })
    }));
    const list = S.users.filter((u) => match(u, S.tab)).sort((a, b) => th(a.fac, b.fac) || th(a.br, b.br) || th(a.name, b.name));
    const rows = [];
    let last = '';
    list.forEach((u) => {
      const g = u.fac + ' › ' + u.br;
      if (g !== last) { rows.push({ isHead: true, isRow: false, label: g }); last = g; }
      const c = stCol[u.status];
      rows.push({
        isHead: false, isRow: true, name: u.name, email: u.email, role: u.role, self: !!u.self,
        sbg: c[0], sfg: c[1], statusLabel: c[2],
        canOk: !u.self && u.status !== 'active', okLabel: u.status === 'pending' ? 'เปิดใช้งาน' : 'เปิดใช้งานอีกครั้ง',
        canStop: !u.self && u.status !== 'suspended', stopLabel: u.status === 'pending' ? 'ปฏิเสธ' : 'ระงับ',
        setRole: (e) => upd(u.id, { role: e.target.value }),
        activate: () => upd(u.id, { status: 'active' }),
        suspend: () => upd(u.id, { status: 'suspended' })
      });
    });
    return {tabs,rows,loading:S.loading,error:S.error,hasError:!!S.error};
  }
}

return Component;
});
