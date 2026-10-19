/* Sample advisor scope matches the existing project directory. No live project data is loaded. */
Summa.register('advisor-dashboard', PageLogic => {
  const advisor='อ.นุจรินทร์ ปทุมพงษ์';
  const definitions=[['รอตรวจ','#d19a18','#fff4c2','#5c4300'],['กำลังดำเนินการ','#4c6dd6','#dce6ff','#1b3a9e'],['พร้อมสอบ','#17775b','#ddf1e8','#0f5a3f'],['เสร็จสิ้น','#8895a7','#e6ecf3','#2b374d']];
  const label=term=>{const [year,semester]=term.split('/');return 'ปี '+year+' / ภาคเรียน '+semester;};
  return class extends PageLogic {
    constructor(props){super(props);this.state={term:'2569/1'};}
    renderVals(){
      const own=window.SummaProjects.filter(project=>project.advisor===advisor);
      const terms=[...new Set(own.map(project=>project.term))].sort().reverse();
      const term=terms.includes(this.state.term)?this.state.term:'all';
      const projects=own.filter(project=>term==='all' || project.term===term).map(project=>{
        const colors=definitions.find(([status])=>status===project.status);
        return {...project,bg:colors[2],fg:colors[3]};
      });
      const total=projects.length;
      const statuses=definitions.map(([status,color])=>{
        const count=projects.filter(project=>project.status===status).length,width=total?count/total*100:0;
        return {label:status,color,count,width,percent:Math.round(width),description:status+' '+count+' จาก '+total+' โครงงาน'};
      });
      const hasCurrent=projects.some(project=>project.code==='CS-01');
      const appointments=hasCurrent?[{project:'CS-01',title:'ปรึกษาความก้าวหน้าโครงงาน',date:'29 ตุลาคม 2569',time:'13:30 น.',place:'ห้องพักอาจารย์',status:'รอนักศึกษายืนยัน'}]:[];
      const tasks=hasCurrent?[
        {project:'CS-01',title:'แก้แผนภาพ ER บทที่ 3 ให้ครบทุกตาราง',due:'กำหนดส่ง 23 ต.ค. 2569',status:'รอติดตาม'},
        {project:'CS-01',title:'เพิ่มผลทดสอบการสกัดวันนัดหมาย',due:'ก่อนสอบความก้าวหน้า',status:'ยังไม่ระบุวันส่ง'}
      ]:[];
      return {
        advisor,term,termLabel:term==='all'?'ทุกภาคเรียน':label(term),terms:terms.map(value=>({value,label:label(value)})),
        generatedDate:new Intl.DateTimeFormat('th-TH',{dateStyle:'long',timeZone:'Asia/Bangkok'}).format(new Date()),
        projects,statuses,total,appointments,tasks,noAppointments:!appointments.length,noTasks:!tasks.length,noProjects:!projects.length,
        kpis:[{key:'total',label:'โครงงานที่ดูแล',value:total,note:'ในภาคเรียนที่เลือก'},{key:'review',label:'โครงงานรอตรวจ',value:statuses[0].count,note:'สถานะจากรายการโครงงาน'},{key:'active',label:'กำลังดำเนินงาน',value:statuses[1].count+statuses[2].count,note:'รวมโครงงานที่พร้อมสอบ'},{key:'done',label:'โครงงานเสร็จสิ้น',value:statuses[3].count,note:'ในภาคเรียนที่เลือก'}],
        setTerm:event=>this.setState({term:event.target.value}),
        exportPdf:async()=>{await document.fonts?.ready;window.print();}
      };
    }
  };
});
