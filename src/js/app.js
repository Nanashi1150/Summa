/* Shared navigation and small native-DOM renderer for the extracted page data. */
(() => {
  'use strict';
  const registry = new Map();
  const extensions = new Map();
  const instances = new Set();
  let actionInFlight = false;
  function currentSession() {return window.SummaAuth?.state || {ready:true,user:null,profile:null,error:{code:'summa/unavailable'}};}
  function navigate(url) {window.location.assign(url);}
  function notify(message) {
    const notice=document.getElementById('auth-status');
    if(notice){notice.textContent=message;notice.hidden=false;}
  }
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
  async function invoke(callback,binding,event,subject) {
    if(event.type==='submit')event.preventDefault();
    const page=document.body.dataset.page;
    if(!SummaPolicy.canAccess(page,currentSession())){notify('กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์ก่อนดำเนินการ');return;}
    if(actionInFlight)return;
    const confirmation=confirmations[binding.trim().split('.').at(-1)];
    const target=event.currentTarget;
    if(confirmation) {
      actionInFlight=true;
      try {
        if(!await confirmAction(subject?{...confirmation,message:confirmation.message+'\nบัญชี: '+subject}:confirmation))return;
        // Session or approval may change while the confirmation is open.
        if(!SummaPolicy.canAccess(page,currentSession())){notify('สิทธิ์การใช้งานเปลี่ยนไป กรุณาเข้าสู่ระบบใหม่');return;}
        await callback(event);
      } catch(error){notify(SummaPolicy.errorMessage(error));}
      finally {actionInFlight=false;}
      return;
    }
    try {
      const result=callback(event);
      if(result?.then){actionInFlight=true;target?.setAttribute('aria-busy','true');await result;}
    }catch(error){notify(SummaPolicy.errorMessage(error));}
    finally {actionInFlight=false;target?.removeAttribute('aria-busy');}
  }
  class PageLogic {
    constructor(props = {}) { this.props = props; this.state = {}; }
    setState(patch) {
      Object.assign(this.state, patch);
      this.update?.();
      if (this.storageKey) {
        try { sessionStorage.setItem(this.storageKey, JSON.stringify(this.state)); } catch { /* storage may be disabled */ }
      }
    }
  }
  const get = (scope, expression) => expression.trim().split('.').reduce((v,k) => v?.[k], scope);
  const value = (text, scope) => text.replace(/{{(.*?)}}/g, (_, key) => String(get(scope,key) ?? ''));
  function mount(host, template, name, props = {}) {
    const Component = registry.get(name);
    if (!Component) throw new Error('Missing page component: '+name);
    const instance = new Component(props);
    instances.add(instance);
    if (!['login','register','manual-import','index','users'].includes(name) && currentSession().user) {
      instance.storageKey = 'summa:v2:'+currentSession().user.uid+':'+name+':'+(props.scope || 'page');
      try { const saved = JSON.parse(sessionStorage.getItem(instance.storageKey)); if(saved) Object.assign(instance.state,saved); } catch { /* keep defaults */ }
    }
    let children = [];
    function renderNode(source, scope) {
      if (source.nodeType === Node.TEXT_NODE) return document.createTextNode(value(source.textContent,scope));
      if (source.nodeType !== Node.ELEMENT_NODE) return source.cloneNode(true);
      // Imported components own their bindings and state, independent of the page.
      if (source.matches('[data-component]')) return source.cloneNode(true);
      if (source.matches('template[data-each]')) {
        const fragment = document.createDocumentFragment();
        for(const item of get(scope,source.dataset.each) || []) {
          const nested = {...scope,[source.dataset.as]:item};
          for(const node of source.content.childNodes) fragment.append(renderNode(node,nested));
        }
        return fragment;
      }
      if (source.matches('template[data-if]')) {
        const fragment = document.createDocumentFragment();
        if(get(scope,source.dataset.if)) for(const node of source.content.childNodes) fragment.append(renderNode(node,scope));
        return fragment;
      }
      const node = source.cloneNode(false);
      for(const attr of [...source.attributes]) {
        if(attr.name.startsWith('data-on-')) {
          node.removeAttribute(attr.name);
          const binding=attr.value.replace(/[{}]/g,'');
          const callback = get(scope,binding);
          const eventName = attr.name.slice(8);
          // Text fields update before blur so a following button click is not lost.
          const nativeEvent = eventName === 'change' && source.matches('textarea,input:not([type=file]):not([type=checkbox]):not([type=radio])') ? 'input' : eventName;
          const subject=binding.endsWith('.activate')?get(scope,binding.trim().split('.').slice(0,-1).concat('name').join('.')):null;
          if(typeof callback === 'function') node.addEventListener(nativeEvent,event=>invoke(callback,binding,event,subject));
        } else {
          const resolved = value(attr.value,scope);
          if(['disabled','checked','selected','required','multiple'].includes(attr.name) && /{{/.test(attr.value)) {
            if(get(scope,attr.value.replace(/[{}]/g,''))) node.setAttribute(attr.name,''); else node.removeAttribute(attr.name);
          } else node.setAttribute(attr.name,resolved);
        }
      }
      for(const child of source.childNodes) node.append(renderNode(child,scope));
      if (source.hasAttribute('value') && 'value' in node && node.type !== 'file') node.value = value(source.getAttribute('value'),scope);
      if(node.matches('textarea')) node.value = value(source.textContent,scope);
      return node;
    }
    instance.update = () => {
      const focused = host.contains(document.activeElement) ? document.activeElement : null;
      const controlIndex = focused ? [...host.querySelectorAll('input,select,textarea,button,a')].indexOf(focused) : -1;
      const selection = focused && /^(text|search|password|email)$/.test(focused.type) ? [focused.selectionStart,focused.selectionEnd] : null;
      children.forEach(child=>child.destroy()); children=[];
      const scope = {...instance.props,...instance.renderVals()};
      const fragment = document.createDocumentFragment();
      for(const child of template.content.childNodes) fragment.append(renderNode(child,scope));
      host.replaceChildren(fragment);
      for(const childHost of host.querySelectorAll('[data-component]')) {
        const nested = document.createElement('template'); nested.innerHTML = childHost.innerHTML;
        children.push(mount(childHost,nested,childHost.dataset.component,{scope:childHost.dataset.scope}));
      }
      if(controlIndex>=0) {
        const control=host.querySelectorAll('input,select,textarea,button,a')[controlIndex];
        control?.focus({preventScroll:true});
        if(selection && control?.setSelectionRange) try{control.setSelectionRange(...selection);}catch{}
      }
    };
    instance.update();
    Promise.resolve(instance.componentDidMount?.()).catch(error=>notify(SummaPolicy.errorMessage(error)));
    return {destroy(){children.forEach(child=>child.destroy());instance.componentWillUnmount?.();instances.delete(instance);}};
  }
  window.Summa = {
    register(name,factory){const Component=factory(PageLogic);registry.set(name,extensions.has(name)?extensions.get(name)(Component):Component);},
    extend(name,extension){extensions.set(name,extension);if(registry.has(name))registry.set(name,extension(registry.get(name)));},
    navigate,confirm:confirmAction
  };
  document.addEventListener('DOMContentLoaded', () => {
    const page=document.body.dataset.page;
    const root=document.getElementById('page-root');
    const template=document.getElementById('page-template');
    let mounted=null;
    let mountedIdentity=null;
    const menus={
      student:[['ภาพรวม','student'],['รายงาน','reports']],
      advisor:[['รอตรวจสอบ','review'],['โครงงานที่ดูแล','projects'],['นำเข้าจากภาพ','manual-import'],['เชื่อมต่อ Gmail','gmail'],['รายงาน','reports']],
      admin:[['ผู้ใช้และสิทธิ์','users'],['โครงงานทั้งหมด','admin-projects'],['นำเข้าอีเมล','imports'],['การเชื่อมต่อระบบ','integrations'],['บันทึกการใช้งาน','logs']]
    };
    function updateNavigation(session) {
      const summary=document.querySelector('.account-menu summary');
      const panel=document.querySelector('.account-panel');
      if(!summary || !panel)return;
      const active=session.user && session.profile?.status==='active';
      summary.textContent=active?(session.profile.name || session.user.email):'ผู้เยี่ยมชม';
      panel.replaceChildren();
      function link(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;panel.append(a);}
      if(active) {
        link('พื้นที่ทำงานของฉัน',SummaPolicy.destination(session));
        const logout=document.createElement('button');logout.type='button';logout.textContent='ออกจากระบบ';
        logout.addEventListener('click',async()=>{logout.disabled=true;try{await SummaAuth.logout();navigate('login.html');}catch(error){notify(SummaPolicy.errorMessage(error));logout.disabled=false;}});
        panel.append(logout);
        if(!SummaPolicy.publicPages.includes(page)) {
          const nav=document.getElementById('primary-navigation');nav.replaceChildren();
          for(const [label,name] of menus[session.profile.role] || []){
            const a=document.createElement('a');a.textContent=label;a.href=name+'.html';if(name===page)a.setAttribute('aria-current','page');nav.append(a);
          }
        }
      } else link('เข้าสู่ระบบ','login.html');
    }
    function refreshAccess() {
      const session=currentSession();
      updateNavigation(session);
      const publicPage=SummaPolicy.publicPages.includes(page);
      const allowed=SummaPolicy.canAccess(page,session);
      document.body.dataset.auth=allowed?'allowed':(session.ready?'denied':'pending');
      const identity=publicPage?'public':session.user?.uid+':'+session.profile?.role;
      if(allowed) {
        if(!mounted || identity!==mountedIdentity){mounted?.destroy();mounted=mount(root,template,page);mountedIdentity=identity;}
        return;
      }
      mounted?.destroy();mounted=null;mountedIdentity=null;root.replaceChildren();
      const guard=document.createElement('section');guard.className='access-guard';
      const heading=document.createElement('h1');heading.textContent=session.ready?'กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์':'กำลังตรวจสอบสิทธิ์…';
      const text=document.createElement('p');text.textContent=session.error?SummaPolicy.errorMessage(session.error):!session.ready?'รอการยืนยันบัญชีกับ Firebase':session.profile?.status==='pending'?'บัญชีของคุณกำลังรอการอนุมัติ':session.profile?.status==='suspended'?'บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ':'หน้านี้เปิดให้เฉพาะผู้ใช้ที่ได้รับอนุญาต ผู้เยี่ยมชมไม่สามารถดำเนินการกับระบบได้';
      guard.append(heading,text);
      if(session.ready || !window.SummaAuth){const a=document.createElement('a');a.href=session.profile?.status==='active'?SummaPolicy.destination(session):'login.html';a.textContent=session.profile?.status==='active'?'กลับพื้นที่ทำงานของฉัน':'เข้าสู่ระบบ';guard.append(a);}
      root.append(guard);
    }
    refreshAccess();
    window.addEventListener('summa:auth',refreshAccess);
    window.SummaAuth?.ready.then(refreshAccess);
    const toggle=document.querySelector('.nav-toggle');
    const nav=document.getElementById('primary-navigation');
    const close=()=>{toggle?.setAttribute('aria-expanded','false');nav?.classList.remove('is-open');};
    toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){close();document.querySelectorAll('.account-menu[open]').forEach(el=>el.open=false);}});
    document.addEventListener('click',event=>{if(!event.target.closest('.site-header')){close();document.querySelectorAll('.account-menu[open]').forEach(el=>el.open=false);}});
    nav?.addEventListener('click',event=>{if(event.target.closest('a'))close();});
    document.getElementById('page-root').addEventListener('keydown',event=>{
      if(page==='login' && event.key==='Enter' && event.target.matches('input')) {event.preventDefault();document.querySelector('[data-login-submit]')?.click();}
    });
  });
  window.addEventListener('pagehide',()=>instances.forEach(instance=>instance.componentWillUnmount?.()));
})();
