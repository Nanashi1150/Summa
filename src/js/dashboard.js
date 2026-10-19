/* Administrator metrics are calculated from the shared project directory fixture. */
Summa.register('dashboard', (PageLogic) => {
  const statusDefinitions = [
    ['รอตรวจ','#d19a18'], ['กำลังดำเนินการ','#4c6dd6'],
    ['พร้อมสอบ','#17775b'], ['เสร็จสิ้น','#8895a7']
  ];
  const termLabel = term => {const [year,semester]=term.split('/');return 'ปี '+year+' / ภาคเรียน '+semester;};
  return class extends PageLogic {
    constructor(props){super(props);this.state={term:'all'};}
    renderVals(){
      const projects=window.SummaProjects;
      const terms=[...new Set(projects.map(p=>p.term))].sort().reverse();
      const term=terms.includes(this.state.term)?this.state.term:'all';
      const selected=projects.filter(p=>term==='all' || p.term===term);
      const count=status=>selected.filter(p=>p.status===status).length;
      const total=selected.length,review=count('รอตรวจ'),doing=count('กำลังดำเนินการ'),ready=count('พร้อมสอบ'),done=count('เสร็จสิ้น');
      let cumulative=0;
      const statuses=statusDefinitions.map(([label,color])=>{
        const value=count(label),percent=total?value/total*100:0,offset=-cumulative;
        cumulative+=percent;
        return {label,color,count:value,percent:Math.round(percent),dash:percent+' '+(100-percent),offset};
      });
      const facultyNames=[...new Set(selected.map(p=>p.fac))].sort((a,b)=>a.localeCompare(b,'th'));
      const maxFaculty=Math.max(1,...facultyNames.map(f=>selected.filter(p=>p.fac===f).length));
      const faculties=facultyNames.map(label=>{
        const list=selected.filter(p=>p.fac===label),n=status=>list.filter(p=>p.status===status).length;
        return {label,total:list.length,width:list.length/maxFaculty*100,advisors:new Set(list.map(p=>p.advisor)).size,review:n('รอตรวจ'),doing:n('กำลังดำเนินการ'),ready:n('พร้อมสอบ'),done:n('เสร็จสิ้น'),description:label+' '+list.length+' โครงงาน'};
      });
      const maxTerm=Math.max(1,...terms.map(t=>projects.filter(p=>p.term===t).length));
      const termComparison=terms.map(t=>{const list=projects.filter(p=>p.term===t),completed=list.filter(p=>p.status==='เสร็จสิ้น').length;return {label:termLabel(t),total:list.length,done:completed,totalWidth:list.length/maxTerm*100,doneWidth:completed/maxTerm*100};});
      return {
        term,termLabel:term==='all'?'ทุกภาคเรียน':termLabel(term),terms:terms.map(value=>({value,label:termLabel(value)})),
        generatedDate:new Intl.DateTimeFormat('th-TH',{dateStyle:'long',timeZone:'Asia/Bangkok'}).format(new Date()),
        total,review,doing,ready,done,statuses,faculties,termComparison,
        statusDescription:statuses.map(s=>s.label+' '+s.count+' โครงงาน').join(', '),
        kpis:[{key:'total',label:'โครงงานทั้งหมด',value:total,note:'ในภาคเรียนที่เลือก'},{key:'review',label:'รออาจารย์ตรวจ',value:review,note:'โครงงานที่ต้องติดตาม'},{key:'active',label:'อยู่ระหว่างดำเนินงาน',value:doing+ready,note:'กำลังดำเนินการและพร้อมสอบ'},{key:'done',label:'โครงงานเสร็จสิ้น',value:done,note:(total?Math.round(done/total*100):0)+'% ของโครงงานทั้งหมด'}],
        setTerm:event=>this.setState({term:event.target.value}),
        exportPdf:async()=>{await document.fonts?.ready;window.print();}
      };
    }
  };
});
