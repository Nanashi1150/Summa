/* integrations page controller. */
Summa.register('integrations', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = {
      scopes: { 'อ่านอีเมล (gmail.readonly)': true, 'ส่งอีเมลแจ้งเตือน (gmail.send)': true },
      adv: [
        { id: 1, name: 'อ.นุจรินทร์ ปทุมพงษ์', sync: 'ตรวจล่าสุด 2 นาทีที่แล้ว', on: true },
        { id: 2, name: 'อ.ภัทรา วงศ์สกุล', sync: 'ตรวจล่าสุด 14 นาทีที่แล้ว', on: true },
        { id: 3, name: 'อ.ศุภชัย มั่นคง', sync: 'ยังไม่เคยเชื่อมต่อ', on: false }
      ],
      googleMsg: '', ollamaMsg: ''
    };
  }
  renderVals() {
    const S = this.state;
    return {
      scopes: Object.keys(S.scopes).map((k) => ({
        label: k, on: S.scopes[k], bg: S.scopes[k] ? '#FFE066' : '#FFFFFF',
        pick: () => this.setState({ scopes: { ...this.state.scopes, [k]: !this.state.scopes[k] }, googleMsg: '' })
      })),
      advisors: S.adv.map((a, i) => ({
        name: a.name, sync: a.sync, top: i === 0 ? 'none' : '1px solid #D3DAE3',
        status: a.on ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ', bg: a.on ? '#DDF1E8' : '#E6ECF3', fg: a.on ? '#0F5A3F' : '#2B374D',
        canRevoke: a.on,
        revoke: () => this.setState({ adv: this.state.adv.map((x) => (x.id === a.id ? { ...x, on: false, sync: 'เพิกถอนแล้ว ต้องเชื่อมต่อใหม่' } : x)) })
      })),
      googleMsg: S.googleMsg, ollamaMsg: S.ollamaMsg,
      save: () => this.setState({ googleMsg: 'บันทึกการตั้งค่าแล้ว' }),
      testGoogle: () => this.setState({ googleMsg: 'เชื่อมต่อ Google OAuth ได้ตามปกติ' }),
      testOllama: () => this.setState({ ollamaMsg: 'เชื่อมต่อ Ollama ได้ โมเดลพร้อมใช้งาน' })
    };
  }
}

return Component;
});
