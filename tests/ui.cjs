const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const policy=require('../src/services/auth-policy.js');
const root=path.resolve(__dirname,'..','public');
const names=['index','review','student','imports','login','register','projects','gmail','users','admin-projects','integrations','logs','navbar','project-tree','reports','manual-import'];
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function open(name,options={}) {
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
 const dom=new JSDOM(fs.readFileSync(path.join(root,name+'.html'),'utf8'),{url:'http://summa.test/'+name+'.html',runScripts:'outside-only',virtualConsole:vc});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const role=options.role===undefined?policy.access[name]?.[0]:options.role;
 let state=role?{ready:true,user:{uid:'uid-'+role,email:role+'@example.test'},profile:{role,status:options.status || 'active',name:'Test '+role}}:{ready:true,user:null,profile:null};
 const calls=[];
 const mockUsers=[{id:'uid-admin',name:'Admin',email:'admin@example.test',role:'admin',status:'active',fac:'ส่วนกลาง',br:'ผู้ดูแลระบบ'},
   {id:'uid-pending',name:'Pending student',email:'student@example.test',role:'student',status:'pending',fac:'คณะวิทยาศาสตร์',br:'วิทยาการคอมพิวเตอร์'}];
 let resolveUsers;
 const usersResult=options.deferUsers?new Promise(resolve=>{resolveUsers=resolve;}):Promise.resolve(mockUsers);
 // This fake service exists only in tests; production always loads the Firebase SDK bundle.
 dom.window.SummaAuth={get state(){return state;},ready:Promise.resolve(),
   login:async(email,password)=>{calls.push({action:'login',email,password});if(options.loginError)throw {code:options.loginError};state={ready:true,user:{uid:'real-user'},profile:{role:options.loginRole || 'admin',status:'active'}};return state;},
   selectRole:async role=>{calls.push({action:'selectRole',role});if(state.profile?.role!=='admin' || state.profile.status!=='active')throw {code:'summa/not-authorized'};if(options.selectRoleError)throw {code:options.selectRoleError};state={...state,viewRole:role};dom.window.dispatchEvent(new dom.window.Event('summa:auth'));return state;},
   googleLogin:async()=>({ready:true,user:{uid:'google-user'},profile:{role:'advisor',status:'active'}}),
   resetPassword:async email=>calls.push({action:'reset',email}),
   register:async values=>{calls.push({action:'register',values});if(options.registerError)throw {code:options.registerError};},
   listUsers:()=>usersResult,updateUser:async(id,patch)=>{calls.push({action:'updateUser',id,patch});},
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
 dom=await open('login');assert.equal(dom.window.document.querySelectorAll('nav,.site-header').length,0);assert.equal(dom.window.document.querySelector('#email').placeholder,'Test@gmail.com');button(dom,'เข้าสู่ระบบ');await tick();assert.match(text(dom),/กรอกอีเมลและรหัสผ่านให้ครบ/);assert.equal(dom.calls.length,0);field(dom,'#email','actual-admin@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();assert.equal(dom.calls[0].email,'actual-admin@example.test');assert.deepEqual(dom.destinations,[]);assert.ok(dom.window.document.querySelector('.role-choice'));assert.equal(dom.window.document.querySelector('#pw'),null);dom.window.document.querySelector('.role-choice .login-submit').click();await tick();assert.deepEqual(dom.destinations,['users.html']);assert.equal(dom.window.sessionStorage.length,0);dom.window.close();
 for(const [role,label,destination] of [['advisor','อาจารย์ที่ปรึกษา','review.html'],['student','นักศึกษา','student.html']]){
   dom=await open('login');field(dom,'#email','admin@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();button(dom,label);await tick();assert.deepEqual(dom.destinations,[destination]);assert.equal(dom.window.SummaAuth.state.profile.role,'admin');assert.equal(dom.window.SummaAuth.state.viewRole,role);dom.window.close();
 }
 dom=await open('login',{loginRole:'student'});field(dom,'#email','student@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();assert.deepEqual(dom.destinations,['student.html']);assert.equal(dom.window.document.querySelector('.role-choice'),null);dom.window.close();
 dom=await open('login',{selectRoleError:'summa/not-authorized'});field(dom,'#email','admin@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();button(dom,'นักศึกษา');await tick();assert.deepEqual(dom.destinations,[]);assert.ok(dom.window.document.querySelector('[role="alert"]'));dom.window.close();
 dom=await open('users');const roleButtons=dom.window.document.querySelectorAll('.account-panel button[aria-pressed]');assert.equal(roleButtons.length,3);roleButtons[1].click();await tick();assert.deepEqual(dom.destinations,['review.html']);assert.equal(dom.window.SummaAuth.state.profile.role,'admin');dom.window.close();
 dom=await open('student');assert.equal(dom.window.document.querySelectorAll('.account-panel button[aria-pressed]').length,0);dom.window.close();
 dom=await open('login',{loginError:'summa/pending'});field(dom,'#email','pending@example.test');field(dom,'#pw','test-password');button(dom,'เข้าสู่ระบบ');await tick();assert.match(text(dom),/รอการอนุมัติ/);assert.deepEqual(dom.destinations,[]);dom.window.close();
 dom=await open('login',{role:'admin'});button(dom,'เข้าใช้งานในโหมดผู้เยี่ยมชม');await tick();assert.equal(dom.window.SummaAuth.state.user,null);assert.deepEqual(dom.destinations,['index.html']);assert.deepEqual(JSON.parse(JSON.stringify(dom.calls)),[{action:'logout'}]);dom.window.close();
 dom=await open('login');delete dom.window.SummaAuth;button(dom,'เข้าใช้งานในโหมดผู้เยี่ยมชม');await tick();assert.deepEqual(dom.destinations,['index.html']);assert.equal(dom.calls.length,0);dom.window.close();
 dom=await open('login',{role:'admin',logoutError:'auth/network-request-failed'});button(dom,'เข้าใช้งานในโหมดผู้เยี่ยมชม');await tick();assert.deepEqual(dom.destinations,[]);assert.match(text(dom),/เชื่อมต่อ Firebase ไม่ได้/);dom.window.close();
 dom=await open('login');field(dom,'#email','reset@example.test');button(dom,'ลืมรหัสผ่าน');await tick();assert.equal(dom.calls[0].action,'reset');assert.match(text(dom),/หากอีเมลนี้มีบัญชี/);dom.window.close();
 dom=await open('register');for(const [id,value] of Object.entries({fn:'Test',ln:'User',fac:'คณะวิทยาศาสตร์',br:'วิทยาการคอมพิวเตอร์',sid:'1234',em:'student@example.test',p1:'test-password',p2:'test-password'}))field(dom,'#'+id,value);button(dom,'ส่งคำขอสมัคร');await tick();assert.equal(dom.calls[0].action,'register');assert.equal(dom.window.document.querySelector('#p1'),null);assert.equal(dom.window.sessionStorage.length,0);dom.window.close();
 dom=await open('reports');let printed=false;dom.window.print=()=>{printed=true;};button(dom,'ดาวน์โหลด PDF');assert.ok(printed);dom.window.close();
 dom=await open('index');const toggle=dom.window.document.querySelector('.nav-toggle');toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'true');dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(toggle.getAttribute('aria-expanded'),'false');dom.window.close();
 console.log('PASS: 16 pages; guest/role/pending/suspended guards; auth forms; no password storage; user adapter; confirmation accept/cancel/session expiry; navigation and PDF.');
})().catch(error=>{console.error(error);process.exitCode=1;});
