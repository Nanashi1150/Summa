/* Real authentication behavior, kept outside the generated page logic. */
(() => {
  const login = Base => class extends Base {
    constructor(props) {super(props);Object.assign(this.state,{busy:false,notice:''});}
    async perform(action) {
      if(this.state.busy) return;
      this.setState({busy:true,error:'',notice:''});
      try {
        if(!window.SummaAuth) throw {code:'summa/unavailable'};
        await action();
      } catch(error) {this.setState({error:SummaPolicy.errorMessage(error)});}
      finally {this.setState({busy:false});}
    }
    renderVals() {
      return {...super.renderVals(),busy:this.state.busy,loginLabel:this.state.busy?'กำลังเข้าสู่ระบบ…':'เข้าสู่ระบบ',notice:this.state.notice,hasNotice:!!this.state.notice,
        submit:()=>{
          const {email,password}=this.state;
          if(!email.trim() || !password) {this.setState({error:'กรอกอีเมลและรหัสผ่านให้ครบ'});return;}
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {this.setState({error:'รูปแบบอีเมลไม่ถูกต้อง'});return;}
          return this.perform(async()=>{const session=await SummaAuth.login(email,password);this.state.password='';Summa.navigate(SummaPolicy.destination(session));});
        },
        googleLogin:()=>this.perform(async()=>{const session=await SummaAuth.googleLogin();Summa.navigate(SummaPolicy.destination(session));}),
        resetPassword:()=>{
          const email=this.state.email.trim();
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {this.setState({error:'กรอกอีเมลในช่องด้านบนก่อนขอตั้งรหัสผ่านใหม่'});return;}
          return this.perform(async()=>{await SummaAuth.resetPassword(email);this.setState({notice:'หากอีเมลนี้มีบัญชี ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ กรุณาตรวจสอบกล่องจดหมาย'});});
        }
      };
    }
  };
  const register = Base => class extends Base {
    constructor(props) {super(props);this.state.busy=false;}
    renderVals() {
      const values=super.renderVals();
      return {...values,busy:this.state.busy,registerLabel:this.state.busy?'กำลังส่งคำขอ…':'ส่งคำขอสมัคร',submit:async()=>{
        if(this.state.busy)return;
        // Reuse the original field validation, but only show success after Firebase completes.
        values.submit();
        if(!this.state.done)return;
        this.setState({done:false,busy:true,error:''});
        try {
          if(!window.SummaAuth)throw {code:'summa/unavailable'};
          await SummaAuth.register({...this.state});
          this.setState({done:true,pw1:'',pw2:''});
        } catch(error) {this.setState({error:SummaPolicy.errorMessage(error)});}
        finally {this.setState({busy:false});}
      }};
    }
  };
  const users = Base => class extends Base {
    constructor(props) {super(props);this.state.users=[];this.state.error='';this.state.loading=true;}
    async componentDidMount() {
      try {const list=await SummaAuth.listUsers();this.setState({users:list.map(user=>({...user,self:user.id===SummaAuth.state.user.uid || user.role==='admin'})),loading:false});}
      catch(error){this.setState({error:SummaPolicy.errorMessage(error),loading:false});}
    }
    renderVals() {
      const values=super.renderVals();
      return {...values,loading:this.state.loading,hasError:!!this.state.error,error:this.state.error};
    }
  };
  Summa.extend('login',login);
  Summa.extend('register',register);
  Summa.extend('users',users);
})();
