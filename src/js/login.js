/* Login page: form state and authentication actions. */
Summa.register('login', PageLogic => class LoginPage extends PageLogic {
  constructor(props) {
    super(props);
    this.state={email:'',password:'',error:'',notice:'',busy:false,guestBusy:false};
  }
  async perform(action) {
    if(this.state.busy)return;
    this.setState({busy:true,error:'',notice:''});
    try {
      if(!window.SummaAuth)throw {code:'summa/unavailable'};
      await action();
    } catch(error) {this.setState({error:SummaPolicy.errorMessage(error)});}
    finally {this.setState({busy:false});}
  }
  renderVals() {
    const state=this.state;
    return {
      ...state,hasError:!!state.error,hasNotice:!!state.notice,
      loginLabel:state.busy&&!state.guestBusy?'กำลังเข้าสู่ระบบ…':'เข้าสู่ระบบ',
      guestLabel:state.guestBusy?'กำลังเปิดโหมดผู้เยี่ยมชม…':'เข้าใช้งานในโหมดผู้เยี่ยมชม',
      setEmail:event=>this.setState({email:event.target.value}),
      setPassword:event=>this.setState({password:event.target.value}),
      submit:()=>{
        const {email,password}=this.state;
        if(!email.trim() || !password){this.setState({error:'กรอกอีเมลและรหัสผ่านให้ครบ'});return;}
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){this.setState({error:'รูปแบบอีเมลไม่ถูกต้อง'});return;}
        return this.perform(async()=>{
          const session=await SummaAuth.login(email,password);
          this.state.password='';
          Summa.navigate(SummaPolicy.destination(session));
        });
      },
      googleLogin:()=>this.perform(async()=>{
        const session=await SummaAuth.googleLogin();
        Summa.navigate(SummaPolicy.destination(session));
      }),
      enterGuest:async()=>{
        if(this.state.busy)return;
        this.setState({busy:true,guestBusy:true,error:'',notice:''});
        try {
          // Clear an existing account session; guest mode never creates an anonymous account.
          if(window.SummaAuth)await SummaAuth.logout();
          this.state.password='';
          Summa.navigate('index.html');
        } catch(error) {this.setState({error:SummaPolicy.errorMessage(error)});}
        finally {this.setState({busy:false,guestBusy:false});}
      },
      resetPassword:()=>{
        const email=this.state.email.trim();
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){this.setState({error:'กรอกอีเมลในช่องด้านบนก่อนขอตั้งรหัสผ่านใหม่'});return;}
        return this.perform(async()=>{
          await SummaAuth.resetPassword(email);
          this.setState({notice:'หากอีเมลนี้มีบัญชี ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ กรุณาตรวจสอบกล่องจดหมาย'});
        });
      }
    };
  }
});
