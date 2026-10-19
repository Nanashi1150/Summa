/* Shared confirmation dialog and action descriptions. */
(() => {
  function confirmAction({title,message,label='ยืนยัน'}) {
    return new Promise(resolve=>{
      const previous=document.activeElement;
      const dialog=document.createElement('dialog');dialog.className='confirmation-dialog';
      dialog.setAttribute('aria-labelledby','confirmation-title');dialog.setAttribute('aria-describedby','confirmation-description');
      const heading=document.createElement('h2');heading.id='confirmation-title';heading.textContent=title;
      const description=document.createElement('p');description.id='confirmation-description';description.textContent=message;
      const actions=document.createElement('div');actions.className='confirmation-actions';
      const cancel=document.createElement('button');cancel.type='button';cancel.textContent='ยกเลิก';cancel.dataset.confirm='cancel';
      const accept=document.createElement('button');accept.type='button';accept.textContent=label;accept.className='confirm-primary';accept.dataset.confirm='accept';
      actions.append(cancel,accept);dialog.append(heading,description,actions);document.body.append(dialog);
      let settled=false;
      function finish(result){if(settled)return;settled=true;if(dialog.open && dialog.close)dialog.close();dialog.remove();previous?.focus({preventScroll:true});resolve(result);}
      cancel.addEventListener('click',()=>finish(false));accept.addEventListener('click',()=>finish(true));
      dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
      dialog.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();finish(false);}
        if(event.key==='Tab'){event.preventDefault();(document.activeElement===cancel?accept:cancel).focus();}
      });
      if(dialog.showModal)dialog.showModal();else {dialog.setAttribute('open','');dialog.setAttribute('aria-modal','true');}
      cancel.focus();
    });
  }
  const confirmations={
    approve:{title:'ยืนยันการอนุมัติผลสรุป',message:'ต้องการอนุมัติผลสรุปที่เลือกหรือไม่? กรุณาตรวจสอบข้อความและกำหนดส่งให้ถูกต้องก่อนยืนยัน',label:'ยืนยันการอนุมัติ'},
    activate:{title:'ยืนยันการอนุมัติบัญชี',message:'ต้องการเปิดใช้งานบัญชีนี้หรือไม่? ผู้ใช้จะเข้าถึงระบบได้ตามบทบาทที่กำหนด',label:'อนุมัติบัญชี'},
    confirmAppt:{title:'ยืนยันการนัดหมาย',message:'ต้องการยืนยันนัดหมายวันที่ 29 ต.ค. 2569 เวลา 13:30 น. ที่ห้องพักอาจารย์หรือไม่?',label:'ยืนยันนัดหมาย'}
  };
  window.SummaConfirmDialog={confirm:confirmAction,actions:confirmations};
})();
