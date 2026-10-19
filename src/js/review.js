/* review page controller. */
Summa.register('review', (PageLogic) => {

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.state = { hl: 0, status: 'pending', source:null, sourceDirty:false, aiResult:null, busy:false, error:'' };
    this.request=null;
  }
  componentWillUnmount(){this.request?.abort();}
  async synthesize(){
    if(this.state.busy)return;
    const source=this.emailText;
    if(!source.trim()){this.setState({error:'กรุณากรอกข้อความอีเมลก่อน'});return;}
    this.request=new AbortController();
    this.setState({busy:true,error:''});
    const timeout=setTimeout(()=>this.request?.abort(),100000);
    try{
      const token=await window.SummaAuth?.getIdToken?.();
      const response=await fetch('/api/synthesize',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({text:source}),signal:this.request.signal});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error || 'ประมวลผลไม่สำเร็จ');
      this.setState({aiResult:result,sourceDirty:false,status:'pending',hl:0});
    }catch(error){if(!this.destroyed)this.setState({error:error.name==='AbortError'?'การประมวลผลถูกยกเลิกหรือใช้เวลานานเกินไป':error.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ'});}
    finally{clearTimeout(timeout);this.setState({busy:false});this.request=null;}
  }
  renderVals() {
    const hl = this.state.hl;
    const st = this.state.status;
    const raw = [
      { t: 'เรียนนักศึกษาโครงงาน CS-01 ครับ ผลการพบวันนี้ ภาพรวมคืบหน้าดี ขอให้ ', h: -1 },
      { t: 'แก้แผนภาพ ER ในบทที่ 3 ให้ครบทุกตาราง', h: 0 },
      { t: ' และ', h: -1 },
      { t: 'ส่งภายในวันศุกร์ที่ 23 ตุลาคม', h: 0 },
      { t: ' จากนั้น ', h: -1 },
      { t: 'เพิ่มผลทดสอบการสกัดวันนัดหมายจากอีเมลจริง', h: 1 },
      { t: ' ก่อนสอบความก้าวหน้า และ ', h: -1 },
      { t: 'นัดพบอีกครั้งวันพฤหัสบดีที่ 29 ตุลาคม เวลา 13:30 น.', h: 2 },
      { t: ' ที่ห้องพักอาจารย์ครับ', h: -1 }
    ];
    let segments = raw.map((s) => ({
      text: s.t, isHl: s.h >= 0, isPlain: s.h < 0,
      bg: s.h === hl ? '#FFE066' : '#FFF4C2',
      pick: () => this.setState({ hl: s.h })
    }));
    let itemsRaw = [
      { kind: 'งาน', title: 'แก้แผนภาพ ER บทที่ 3 ให้ครบทุกตาราง', owner: 'นักศึกษา', due: 'ส่ง 23 ต.ค. 2569', warn: false },
      { kind: 'งาน', title: 'เพิ่มผลทดสอบการสกัดวันนัดหมาย', owner: 'นักศึกษา', due: 'ก่อนสอบความก้าวหน้า', warn: true },
      { kind: 'นัดหมาย', title: 'พบอาจารย์ที่ปรึกษา ห้องพักอาจารย์', owner: 'ทั้งสองฝ่าย', due: '29 ต.ค. 2569 · 13:30', warn: false }
    ];
    const original=this.state.source ?? raw.map(s=>s.t).join('');
    this.emailText=original;
    const result=this.state.aiResult;
    if(result || this.state.sourceDirty){
      itemsRaw=(result?.items || []).map(item=>({kind:item.kind==='task'?'งาน':'นัดหมาย',title:item.title,owner:item.owner || 'ไม่ระบุ',due:item.dueText || 'ไม่ระบุวันเวลา',warn:!item.dueText,evidence:item.evidence.map(text=>({text}))}));
      const ranges=[];
      for(const [index,item] of (result?.items || []).entries())for(const quote of item.evidence){
        const start=original.indexOf(quote);if(start>=0)ranges.push({start,end:start+quote.length,index});
      }
      const boundaries=[...new Set([0,original.length,...ranges.flatMap(r=>[r.start,r.end])])].sort((a,b)=>a-b);
      segments=boundaries.slice(0,-1).map((start,index)=>{
        const end=boundaries[index+1],range=ranges.find(r=>r.start<=start && r.end>=end && r.index===hl) || ranges.find(r=>r.start<=start && r.end>=end);
        return {text:original.slice(start,end),isHl:!!range,isPlain:!range,bg:range?.index===hl?'#FFE066':'#FFF4C2',pick:()=>this.setState({hl:range?.index ?? 0})};
      });
    }
    const items = itemsRaw.map((it, i) => ({
      ...it,
      bg: i === hl ? '#FFE066' : '#FFFFFF',
      border: i === hl ? '#101A2E' : '#D3DAE3',
      pick: () => this.setState({ hl: i })
    }));
    const queue = [
      { project: 'CS-01', sub: 'ข้อเสนอแนะหลังพบ', time: 'วันนี้ 16:42', sel: true },
      { project: 'CS-04', sub: 'ขอนัดปรึกษาบทที่ 2', time: 'วันนี้ 11:05', sel: false },
      { project: 'CS-07', sub: 'รายงานความคืบหน้า', time: 'เมื่อวาน 20:18', sel: false }
    ].map((q) => ({ ...q, bg: q.sel ? '#FFF4C2' : '#FFFFFF', border: q.sel ? '#101A2E' : '#D3DAE3' }));
    const map = {
      pending: ['รอการตรวจสอบ', '#FFF4C2', '#5C4300', 'ตรวจผลสรุปเทียบกับข้อความต้นฉบับ แล้วอนุมัติเพื่อให้นักศึกษามองเห็น'],
      approved: ['เผยแพร่แล้ว', '#DDF1E8', '#0F5A3F', 'อนุมัติผลสรุปตัวอย่างแล้ว ยังไม่ได้ส่งการแจ้งเตือนจริง'],
      rejected: ['ปฏิเสธผลสรุป', '#F6DDDD', '#8A1F1F', 'ผลสรุปนี้จะไม่ถูกเผยแพร่ เลือกประมวลผลใหม่หากต้องการสรุปอีกครั้ง'],
      reprocessing: ['กำลังประมวลผลใหม่', '#DCE6FF', '#1B3A9E', 'Ollama กำลังสรุปข้อความต้นฉบับอีกครั้ง']
    };
    const m = map[st];
    return {
      segments, items, queue,
      original,summary:result?.summary || (this.state.sourceDirty?'ยังไม่ได้ประมวลผลข้อความนี้':'ความคืบหน้าโดยรวมดี มีงานแก้ไข 2 รายการก่อนสอบความก้าวหน้า และนัดพบครั้งถัดไป 1 ครั้ง'),
      busy:this.state.busy,error:this.state.error,hasError:!!this.state.error,
      aiLabel:result?'Gemma 4 · ผลประมวลผลจริง':'ข้อมูลตัวอย่างก่อนประมวลผล',
      processLabel:this.state.busy?'Gemma 4 กำลังประมวลผล…':'สกัดข้อมูลด้วย Gemma 4',
      noItems:!!result && !result.items.length,hasResult:!!result,
      sourceChanged:e=>this.setState({source:e.target.value,sourceDirty:true,aiResult:null,status:'pending',error:''}),
      synthesize:()=>this.synthesize(),
      editSummary:e=>{if(result)this.setState({aiResult:{...result,summary:e.target.value}});},
      actionDisabled:this.state.busy || this.state.sourceDirty,
      approveLabel:result?'ตรวจรับผลสรุป':'อนุมัติและเผยแพร่',
      statusText:result && st==='approved'?'ตรวจรับแล้ว · ยังไม่เผยแพร่':m[0], statusBg: m[1], statusFg: m[2],
      hint:result?'ผลจาก AI จริง กรุณาตรวจเทียบต้นฉบับ การตรวจรับในหน้านี้ยังไม่บันทึกหรือเผยแพร่ลงฐานข้อมูล':m[3],
      approve: () => this.setState({ status: 'approved' }),
      reject: () => this.setState({ status: 'rejected' }),
      reprocess: () => this.synthesize()
    };
  }
}

return Component;
});
