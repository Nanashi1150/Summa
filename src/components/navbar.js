/* Navigation shared by every page except login. User-provided names use textContent. */
(() => {
  const menus={
    public:[['หน้าแรก','index'],['วิธีทำงาน','index#how'],['สำหรับใคร','index#roles'],['สมัครสมาชิก','register'],['เข้าสู่ระบบ','login']],
    student:[['ภาพรวม','student'],['รายงาน','reports']],
    advisor:[['Dashboard','advisor-dashboard'],['รอตรวจสอบ','review'],['โครงงานที่ดูแล','projects'],['นำเข้าจากภาพ','manual-import'],['เชื่อมต่อ Gmail','gmail'],['รายงาน','reports']],
    admin:[['Dashboard','dashboard'],['ผู้ใช้และสิทธิ์','users'],['โครงงานทั้งหมด','admin-projects'],['นำเข้าอีเมล','imports'],['การเชื่อมต่อระบบ','integrations'],['บันทึกการใช้งาน','logs']]
  };
  function href(name){const [page,hash]=name.split('#');return page+'.html'+(hash?'#'+hash:'');}
  function create({page,notify,navigate}) {
    const host=document.getElementById('navbar-root');
    if(!host)return {update(){}};
    host.innerHTML='<a class="skip-link" href="#main-content">ข้ามไปเนื้อหา</a><header class="site-header"><div class="nav-inner"><a class="brand" href="index.html" aria-label="Summa หน้าแรก"><span class="brand-mark" aria-hidden="true">≡</span> Summa</a><button class="nav-toggle" type="button" aria-controls="primary-navigation" aria-expanded="false">☰ เมนู</button><nav id="primary-navigation" aria-label="เมนูหลัก"></nav><details class="account-menu"><summary>ผู้เยี่ยมชม</summary><div class="account-panel"></div></details></div></header>';
    const header=host.querySelector('header'),nav=host.querySelector('nav');
    const toggle=host.querySelector('.nav-toggle'),account=host.querySelector('.account-menu');
    function close(){toggle.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}
    toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
    nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){close();account.open=false;}});
    document.addEventListener('click',event=>{if(!host.contains(event.target)){close();account.open=false;}});
    return {update(session){
      const active=session.user && session.profile?.status==='active';
      const role=SummaPolicy.publicPages.includes(page)?'public':(SummaPolicy.effectiveRole(session) || document.body.dataset.role);
      header.classList.toggle('is-admin',role==='admin');
      nav.replaceChildren();
      for(const [label,name] of menus[role] || menus.public){const link=document.createElement('a');link.textContent=label;link.href=Summa.previewUrl(href(name));if(name===page)link.setAttribute('aria-current','page');nav.append(link);}
      account.querySelector('summary').textContent=active?(session.profile.name || session.user.email):'ผู้เยี่ยมชม';
      const panel=account.querySelector('.account-panel');panel.replaceChildren();
      if(page==='index' || Summa.demoRole){
        account.querySelector('summary').textContent=Summa.demoRole?session.profile.name:'เลือกผู้ใช้งาน';
        const label=document.createElement('p');label.textContent='เยี่ยมชมตามบทบาท';panel.append(label);
        for(const [value,title,destination] of [['student','นักศึกษา','student'],['advisor','อาจารย์ที่ปรึกษา','advisor-dashboard'],['admin','ผู้ดูแลระบบ','dashboard']]){
          const link=document.createElement('a');link.textContent=title;link.href=destination+'.html?demo='+value;
          if(Summa.demoRole===value)link.setAttribute('aria-current','true');panel.append(link);
        }
        if(Summa.demoRole){const exit=document.createElement('a');exit.textContent='กลับหน้าแรก';exit.href='index.html';panel.append(exit);}
        return;
      }
      const link=document.createElement('a');link.textContent=active?'พื้นที่ทำงานของฉัน':'เข้าสู่ระบบ';link.href=active?SummaPolicy.destination(session):'login.html';panel.append(link);
      if(active){
        if(session.profile.role==='admin'){
          const label=document.createElement('p');label.textContent='มุมมองของผู้ดูแล';panel.append(label);
          for(const [value,title] of [['admin','ผู้ดูแลระบบ'],['advisor','อาจารย์ที่ปรึกษา'],['student','นักศึกษา']]){
            const button=document.createElement('button');button.type='button';button.textContent=title;
            button.setAttribute('aria-pressed',String(SummaPolicy.effectiveRole(session)===value));
            button.addEventListener('click',async()=>{
              const buttons=[...panel.querySelectorAll('button')];buttons.forEach(item=>item.disabled=true);
              try{const next=await SummaAuth.selectRole(value);navigate(SummaPolicy.destination(next));}
              catch(error){notify(SummaPolicy.errorMessage(error));buttons.forEach(item=>item.disabled=false);}
            });
            panel.append(button);
          }
        }
        const logout=document.createElement('button');logout.type='button';logout.textContent='ออกจากระบบ';
        logout.addEventListener('click',async()=>{logout.disabled=true;try{await SummaAuth.logout();navigate('login.html');}catch(error){notify(SummaPolicy.errorMessage(error));logout.disabled=false;}});
        panel.append(logout);
      }
    }};
  }
  window.SummaNavbar={create};
})();
