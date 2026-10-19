const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const policy=require('../src/services/auth-policy.js');
const root=path.resolve(__dirname,'..','public');
const names=['index','advisor-dashboard','dashboard','review','student','imports','login','register','projects','gmail','users','admin-projects','integrations','logs','navbar','project-tree','reports','manual-import'];
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function open(name,options={}) {
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
 const dom=new JSDOM(fs.readFileSync(path.join(root,name+'.html'),'utf8'),{url:'http://summa.test/'+name+'.html'+(options.query || ''),runScripts:'outside-only',virtualConsole:vc});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const role=options.role===undefined?policy.access[name]?.[0]:options.role;
 let state=role?{ready:true,user:{uid:'uid-'+role,email:role+'@example.test'},profile:{role,status:options.status || 'active',name:'Test '+role}}:{ready:true,user:null,profile:null};
 const calls=[];
 const mockUsers=[{id:'uid-admin',name:'Admin',email:'admin@example.test',role:'admin',status:'active',fac:'ส่วนกลาง',br:'ผู้ดูแลระบบ'},
   {id:'uid-pending',name:'Pending student',email:'student@example.test',role:'student',status:'pending',fac:'คณะวิทยาศาสตร์',br:'วิทยาการคอมพิวเตอร์'}];
 let resolveUsers;
 const usersResult=options.deferUsers?new Promise(resolve=>{resolveUsers=resolve;}):Promise.resolve(mockUsers);
 // Mock the Firebase interface so tests can detect unintended service calls.
 dom.window.SummaAuth={get state(){return state;},ready:Promise.resolve(),
   login:async(email,password)=>{calls.push({action:'login',email,password});if(options.loginError)throw {code:options.loginError};state={ready:true,user:{uid:'real-user'},profile:{role:options.loginRole || 'admin',status:'active'}};return state;},
   selectRole:async role=>{calls.push({action:'selectRole',role});if(state.profile?.role!=='admin' || state.profile.status!=='active')throw {code:'summa/not-authorized'};if(options.selectRoleError)throw {code:options.selectRoleError};state={...state,viewRole:role};dom.window.dispatchEvent(new dom.window.Event('summa:auth'));return state;},
   googleLogin:async()=>({ready:true,user:{uid:'google-user'},profile:{role:'advisor',status:'active'}}),
   resetPassword:async email=>calls.push({action:'reset',email}),
   register:async values=>{calls.push({action:'register',values});if(options.registerError)throw {code:options.registerError};},
   listUsers:()=>{if(options.trackUsers)calls.push({action:'listUsers'});return usersResult;},updateUser:async(id,patch)=>{calls.push({action:'updateUser',id,patch});},
   logout:async()=>{calls.push({action:'logout'});if(options.logoutError)throw {code:options.logoutError};state={ready:true,user:null,profile:null};dom.window.dispatchEvent(new dom.window.Event('summa:auth'));}
 };
 for(const script of dom.window.document.querySelectorAll('script[src]')) {
   if(script.getAttribute('src')==='assets/services/firebase.bundle.js')continue;
   dom.window.eval(fs.readFileSync(path.join(root,script.getAttribute('src')),'utf8'));
 }
 const destinations=[];dom.window.Summa.navigate=url=>destinations.push(url);
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));await tick();
 dom.calls=calls;dom.destinations=destinations;dom.errors=errors;
 dom.completeUsers=()=>resolveUsers?.(mockUsers);
 dom.setSession=next=>{state=next;dom.window.dispatchEvent(new dom.window.Event('summa:auth'));};
 assert.deepEqual(errors.map(error=>error.message),[],name+' runtime errors');return dom;
}
const text=dom=>dom.window.document.getElementById('page-root').textContent;
function button(dom,label){const all=[...dom.window.document.querySelectorAll('#page-root button')];const target=all.find(el=>el.textContent.trim()===label)||all.find(el=>el.textContent.includes(label));assert.ok(target,'button '+label);target.click();return target;}
function field(dom,selector,value){const input=dom.window.document.querySelector(selector);assert.ok(input,selector);input.focus();input.value=value;input.dispatchEvent(new dom.window.Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));}
function confirm(dom,accept){const target=dom.window.document.querySelector(`[data-confirm="${accept?'accept':'cancel'}"]`);assert.ok(target,'confirmation exists');target.click();}
(async()=>{
 for(const name of names){
   const dom=await open(name),d=dom.window.document;
   assert.ok(text(dom).trim(),name+' renders content');assert.ok(!d.getElementById('page-root').innerHTML.includes('{{'),name+' resolves bindings');
   assert.equal(d.querySelectorAll('dc-import,x-dc,sc-for,sc-if,sc-raw-select').length,0);
   for(const a of d.querySelectorAll('a[href]')){const u=new URL(a.href);if(u.hostname!=='summa.test')continue;assert.ok(fs.existsSync(path.join(root,u.pathname)),name+' link '+a.href);if(u.hash && u.pathname===dom.window.location.pathname)assert.ok(d.getElementById(u.hash.slice(1)));}
   if(!['login','navbar','project-tree'].includes(name))assert.equal(d.querySelectorAll('#primary-navigation [aria-current="page"]').length,1,name+' active navigation');dom.window.close();
 }
 for(const name of names.filter(name=>!policy.publicPages.includes(name))){const dom=await open(name,{role:null});assert.ok(dom.window.document.querySelector('.access-guard'));assert.equal(dom.window.document.querySelectorAll('#page-root button,#page-root input').length,0);assert.equal(dom.calls.length,0);dom.window.close();}
 for(const status of ['pending','suspended']){const dom=await open('users',{role:'admin',status});assert.ok(dom.window.document.querySelector('.access-guard'));assert.equal(dom.calls.length,0);dom.window.close();}
 let dom=await open('review',{role:'student'});assert.ok(dom.window.document.querySelector('.access-guard'));dom.window.close();
 dom=await open('users',{deferUsers:true});dom.setSession({ready:true,user:null,profile:null});dom.completeUsers();await tick();assert.ok(dom.window.document.querySelector('.access-guard'));assert.ok(!text(dom).includes('Pending student'));dom.window.close();
 dom=await open('review');button(dom,'อนุมัติและเผยแพร่');assert.ok(dom.window.document.querySelector('dialog'));assert.ok(!text(dom).includes('เผยแพร่แล้ว'));confirm(dom,false);await tick();assert.ok(!text(dom).includes('เผยแพร่แล้ว'));button(dom,'อนุมัติและเผยแพร่');confirm(dom,true);await tick();assert.match(text(dom),/เผยแพร่แล้ว/);dom.window.close();
 dom=await open('review');button(dom,'อนุมัติและเผยแพร่');dom.setSession({ready:true,user:null,profile:null});confirm(dom,true);await tick();assert.ok(dom.window.document.querySelector('.access-guard'));assert.equal(dom.window.sessionStorage.length,0);dom.window.close();
 dom=await open('student');button(dom,'ยืนยันนัดหมาย');confirm(dom,false);await tick();assert.ok(!text(dom).includes('ยืนยันนัดหมายแล้ว'));button(dom,'ยืนยันนัดหมาย');confirm(dom,true);await tick();assert.match(text(dom),/ยืนยันนัดหมายแล้ว/);dom.window.close();
 dom=await open('users');assert.match(text(dom),/Pending student/);button(dom,'เปิดใช้งาน');assert.match(dom.window.document.querySelector('dialog').textContent,/Pending student/);confirm(dom,false);await tick();assert.equal(dom.calls.length,0);button(dom,'เปิดใช้งาน');confirm(dom,true);await tick();assert.deepEqual(JSON.parse(JSON.stringify(dom.calls)),[{action:'updateUser',id:'uid-pending',patch:{status:'active'}}]);dom.window.close();
 dom=await open('projects');field(dom,'#pt-q','CS-04');assert.match(text(dom),/พบ 1 โครงงาน/);field(dom,'#pt-q','zzzzz');assert.match(text(dom),/ไม่พบโครงงานตามเงื่อนไข/);dom.window.close();
 dom=await open('login');assert.equal(dom.window.document.querySelectorAll('nav,.site-header').length,0);assert.equal(dom.window.document.querySelector('#email').placeholder,'Test@gmail.com');button(dom,'เข้าสู่ระบบ');await tick();assert.match(text(dom),/กรอกอีเมลและรหัสผ่านให้ครบ/);assert.equal(dom.calls.length,0);field(dom,'#email','actual-admin@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();assert.equal(dom.calls[0].email,'actual-admin@example.test');assert.deepEqual(dom.destinations,[]);assert.ok(dom.window.document.querySelector('.role-choice'));assert.equal(dom.window.document.querySelector('#pw'),null);dom.window.document.querySelector('.role-choice .login-submit').click();await tick();assert.deepEqual(dom.destinations,['dashboard.html']);assert.equal(dom.window.sessionStorage.length,0);dom.window.close();
 for(const [role,label,destination] of [['advisor','อาจารย์ที่ปรึกษา','advisor-dashboard.html'],['student','นักศึกษา','student.html']]){
   dom=await open('login');field(dom,'#email','admin@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();button(dom,label);await tick();assert.deepEqual(dom.destinations,[destination]);assert.equal(dom.window.SummaAuth.state.profile.role,'admin');assert.equal(dom.window.SummaAuth.state.viewRole,role);dom.window.close();
 }
 dom=await open('login',{loginRole:'student'});field(dom,'#email','student@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();assert.deepEqual(dom.destinations,['student.html']);assert.equal(dom.window.document.querySelector('.role-choice'),null);dom.window.close();
 dom=await open('login',{selectRoleError:'summa/not-authorized'});field(dom,'#email','admin@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();button(dom,'นักศึกษา');await tick();assert.deepEqual(dom.destinations,[]);assert.ok(dom.window.document.querySelector('[role="alert"]'));dom.window.close();
 dom=await open('users');const roleButtons=dom.window.document.querySelectorAll('.account-panel button[aria-pressed]');assert.equal(roleButtons.length,3);roleButtons[1].click();await tick();assert.deepEqual(dom.destinations,['advisor-dashboard.html']);assert.equal(dom.window.SummaAuth.state.profile.role,'admin');dom.window.close();
 dom=await open('student');assert.equal(dom.window.document.querySelectorAll('.account-panel button[aria-pressed]').length,0);dom.window.close();
 dom=await open('login',{loginError:'summa/pending'});field(dom,'#email','pending@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();assert.match(text(dom),/รอการอนุมัติ/);assert.deepEqual(dom.destinations,[]);dom.window.close();
 dom=await open('login',{role:'admin'});button(dom,'เข้าใช้งานในโหมดผู้เยี่ยมชม');await tick();assert.equal(dom.window.SummaAuth.state.user,null);assert.deepEqual(dom.destinations,['index.html']);assert.deepEqual(JSON.parse(JSON.stringify(dom.calls)),[{action:'logout'}]);dom.window.close();
 dom=await open('login');delete dom.window.SummaAuth;button(dom,'เข้าใช้งานในโหมดผู้เยี่ยมชม');await tick();assert.deepEqual(dom.destinations,['index.html']);assert.equal(dom.calls.length,0);dom.window.close();
 dom=await open('login',{role:'admin',logoutError:'auth/network-request-failed'});button(dom,'เข้าใช้งานในโหมดผู้เยี่ยมชม');await tick();assert.deepEqual(dom.destinations,[]);assert.match(text(dom),/เชื่อมต่อ Firebase ไม่ได้/);dom.window.close();
 dom=await open('login');field(dom,'#email','reset@example.test');button(dom,'ลืมรหัสผ่าน');await tick();assert.equal(dom.calls[0].action,'reset');assert.match(text(dom),/หากอีเมลนี้มีบัญชี/);dom.window.close();
 dom=await open('register');for(const [id,value] of Object.entries({fn:'Test',ln:'User',fac:'คณะวิทยาศาสตร์',br:'วิทยาการคอมพิวเตอร์',sid:'1234',em:'student@example.test',p1:'test-password',p2:'test-password'}))field(dom,'#'+id,value);button(dom,'ส่งคำขอสมัคร');await tick();assert.equal(dom.calls[0].action,'register');assert.equal(dom.window.document.querySelector('#p1'),null);assert.equal(dom.window.sessionStorage.length,0);dom.window.close();
 dom=await open('reports');let printed=false;dom.window.print=()=>{printed=true;};button(dom,'ดาวน์โหลด PDF');assert.ok(printed);dom.window.close();
 dom=await open('index');const toggle=dom.window.document.querySelector('.nav-toggle');toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'true');dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(toggle.getAttribute('aria-expanded'),'false');dom.window.close();
 dom=await open('index',{role:null});
 const previewLinks=[...dom.window.document.querySelectorAll('.account-panel a')];
 assert.deepEqual(previewLinks.map(a=>a.textContent),['นักศึกษา','อาจารย์ที่ปรึกษา','ผู้ดูแลระบบ']);
 for(const link of previewLinks){
   const url=new URL(link.href),page=url.pathname.slice(1).replace('.html','');
   const preview=await open(page,{role:null,query:url.search,trackUsers:true});
   assert.equal(preview.window.document.body.dataset.auth,'allowed');assert.ok(!preview.window.document.querySelector('.access-guard'));
   assert.ok(preview.window.document.querySelector('.preview-banner'));assert.equal(preview.window.SummaAuth.state.user,null);
   for(const a of preview.window.document.querySelectorAll('#primary-navigation a'))assert.equal(new URL(a.href).searchParams.get('demo'),url.searchParams.get('demo'));
   assert.deepEqual(preview.calls,[]);assert.equal(preview.window.sessionStorage.length,0);preview.window.close();
 }
 dom.window.close();
 dom=await open('users',{role:'admin',query:'?demo=admin',trackUsers:true});
 assert.match(text(dom),/นักศึกษาตัวอย่าง/);assert.ok(!text(dom).includes('Pending student'));
 button(dom,'เปิดใช้งาน');confirm(dom,true);await tick();assert.deepEqual(dom.calls,[]);
 assert.equal(dom.window.SummaAuth.state.user.uid,'uid-admin');assert.equal(dom.window.sessionStorage.length,0);dom.window.close();
 for(const query of ['?demo=invalid','?demo=student','?demo=advisor']){
   dom=await open('users',{role:null,query,trackUsers:true});assert.ok(dom.window.document.querySelector('.access-guard'));assert.deepEqual(dom.calls,[]);dom.window.close();
 }
 dom=await open('dashboard',{role:null,query:'?demo=admin',trackUsers:true});
 const metric=key=>dom.window.document.querySelector('[data-metric="'+key+'"]').textContent;
 assert.equal(metric('total'),'10');assert.equal(metric('review'),'3');assert.equal(metric('active'),'4');assert.equal(metric('done'),'3');
 assert.equal(dom.window.document.querySelectorAll('.dashboard-donut circle').length,5);
 assert.equal(dom.window.document.querySelectorAll('.dashboard-summary tbody tr').length,2);
 assert.equal(dom.window.document.querySelectorAll('.term-row').length,2);
 field(dom,'#dashboard-term','2569/1');assert.equal(metric('total'),'7');assert.equal(metric('done'),'0');
 field(dom,'#dashboard-term','2568/2');assert.equal(metric('total'),'3');assert.equal(metric('review'),'0');assert.equal(metric('done'),'3');
 assert.equal(dom.window.document.querySelector('.dashboard-summary a').search,'?demo=admin');
 let dashboardPrinted=false;dom.window.print=()=>{dashboardPrinted=true;};button(dom,'ส่งออก PDF');await tick();assert.ok(dashboardPrinted);assert.deepEqual(dom.calls,[]);dom.window.close();
 for(const role of ['student','advisor']){dom=await open('dashboard',{role});assert.ok(dom.window.document.querySelector('.access-guard'));dom.window.close();}
 dom=await open('advisor-dashboard',{role:null,query:'?demo=advisor',trackUsers:true});
 const advisorMetric=key=>dom.window.document.querySelector('[data-metric="'+key+'"]').textContent;
 assert.equal(advisorMetric('total'),'3');assert.equal(advisorMetric('review'),'2');assert.equal(advisorMetric('active'),'1');assert.equal(advisorMetric('done'),'0');
 assert.match(text(dom),/CS-01/);assert.match(text(dom),/CS-04/);assert.ok(!text(dom).includes('CE-03'));assert.ok(!text(dom).includes('IT-02'));
 assert.equal(dom.window.document.querySelectorAll('.advisor-projects tbody tr').length,3);
 assert.equal(dom.window.document.querySelectorAll('.advisor-appointment').length,1);
 assert.equal(dom.window.document.querySelectorAll('.advisor-tasks li').length,2);
 for(const link of dom.window.document.querySelectorAll('.advisor-shortcuts a'))assert.equal(new URL(link.href).searchParams.get('demo'),'advisor');
 field(dom,'#advisor-term','2568/2');assert.equal(advisorMetric('total'),'2');assert.equal(advisorMetric('done'),'2');
 assert.equal(dom.window.document.querySelectorAll('.advisor-appointment,.advisor-tasks li').length,0);assert.match(text(dom),/ไม่มีนัดหมายตัวอย่าง/);
 field(dom,'#advisor-term','all');assert.equal(advisorMetric('total'),'5');assert.equal(advisorMetric('done'),'2');
 let advisorPrinted=false;dom.window.print=()=>{advisorPrinted=true;};button(dom,'ส่งออก PDF');await tick();assert.ok(advisorPrinted);assert.deepEqual(dom.calls,[]);dom.window.close();
 for(const role of ['student','admin']){dom=await open('advisor-dashboard',{role});assert.ok(dom.window.document.querySelector('.access-guard'));dom.window.close();}
 dom=await open('review',{role:null,query:'?demo=advisor'});
 let aiPayload;
 dom.window.fetch=async(url,options)=>{assert.equal(url,'/api/synthesize');aiPayload=JSON.parse(options.body);return {ok:true,json:async()=>({summary:'สรุปจากโมเดลจริง',model:'gemma4:31b-cloud',items:[{kind:'task',title:'แก้บทที่ 3',owner:null,dueText:null,evidence:['แก้บทที่ 3']}]})};};
 field(dom,'#email-source','ขอให้แก้บทที่ 3');button(dom,'สกัดข้อมูลด้วย Gemma 4');await tick();
 assert.equal(aiPayload.text,'ขอให้แก้บทที่ 3');assert.match(text(dom),/สรุปจากโมเดลจริง/);assert.match(text(dom),/อ้างอิง: “แก้บทที่ 3”/);assert.match(text(dom),/ไม่ระบุวันเวลา/);
 assert.equal(dom.window.document.querySelectorAll('.review-style-20 button').length,1);assert.equal(dom.window.sessionStorage.length,0);
 field(dom,'#summary-edit','ข้อความสรุปที่แก้ไข');assert.match(text(dom),/ข้อความสรุปที่แก้ไข/);
 field(dom,'#email-source','อีเมลฉบับใหม่');assert.ok(!text(dom).includes('สรุปจากโมเดลจริง'));assert.ok(dom.window.document.querySelector('.review-style-36').disabled);
 dom.window.fetch=async()=>({ok:false,json:async()=>({error:'Ollama ไม่พร้อม'})});button(dom,'สกัดข้อมูลด้วย Gemma 4');await tick();assert.match(text(dom),/Ollama ไม่พร้อม/);assert.equal(dom.window.document.querySelector('#email-source').disabled,false);dom.window.close();
 console.log('PASS: 18 pages; role guards; auth forms; account management; dashboards; Ollama UI results, editable summary, evidence highlights, stale-result clearing and errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});
