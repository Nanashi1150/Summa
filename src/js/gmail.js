/* gmail page controller. */
Summa.register('gmail', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { on: false, labels: { 'โครงงาน-CS': true, 'ที่ปรึกษา': true, 'นัดหมาย': false, 'ส่งงาน': false }, keywords: 'ขอนัด, ความคืบหน้า, ข้อเสนอแนะ', pattern: 'CS-\\d{2}', interval: '15', senderOnly: true, saved: '' };
  }
  renderVals() {
    const S = this.state;
    const labelNames = Object.keys(S.labels);
    const picked = labelNames.filter((k) => S.labels[k]).length;
    return {
      connected: S.on, notConnected: !S.on,
      scopes: [
        { title: 'อ่านอีเมลตาม Label ที่คุณเลือก', body: 'ใช้สร้างรายการนัดหมายและสรุปข้อเสนอแนะ ไม่แก้ไขหรือลบอีเมล', tag: 'จำเป็น' },
        { title: 'ส่งอีเมลแจ้งเตือนในนามของคุณ', body: 'ใช้แจ้งผลตอบรับนัดหมายและผลสรุปที่อนุมัติแล้วให้นักศึกษา', tag: 'เลือกได้' }
      ],
      labels: labelNames.map((k) => ({
        label: k, on: S.labels[k], bg: S.labels[k] ? '#FFE066' : '#FFFFFF',
        pick: () => this.setState({ labels: { ...this.state.labels, [k]: !this.state.labels[k] }, saved: '' })
      })),
      keywords: S.keywords, pattern: S.pattern, interval: S.interval, senderOnly: S.senderOnly,
      senderBg: S.senderOnly ? '#101A2E' : '#FFFFFF', senderFg: S.senderOnly ? '#FFFFFF' : '#101A2E',
      senderLabel: S.senderOnly ? 'นำเข้าเฉพาะอีเมลจากนักศึกษาในความดูแล: เปิด' : 'นำเข้าเฉพาะอีเมลจากนักศึกษาในความดูแล: ปิด',
      previewCount: picked === 0 ? 0 : 3 * picked,
      saved: S.saved,
      connect: () => this.setState({ on: true }),
      disconnect: () => this.setState({ on: false, saved: '' }),
      setKeywords: (e) => this.setState({ keywords: e.target.value, saved: '' }),
      setPattern: (e) => this.setState({ pattern: e.target.value, saved: '' }),
      setInterval2: (e) => this.setState({ interval: e.target.value, saved: '' }),
      toggleSender: () => this.setState({ senderOnly: !this.state.senderOnly, saved: '' }),
      save: () => this.setState({ saved: 'บันทึกการตั้งค่าแล้ว' })
    };
  }
}

return Component;
});
