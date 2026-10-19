const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const projectRoot = path.resolve(__dirname, '..');
const root = path.join(projectRoot, 'public');
const original = fs.readFileSync(path.join(projectRoot, 'design', 'original.html'), 'utf8');
function island(html, type) {
  const match = html.match(new RegExp('<script[^>]*type="__bundler/' + type + '"[^>]*>([\\s\\S]*?)</script>'));
  return match ? JSON.parse(match[1]) : null;
}
const manifest = island(original, 'manifest');
const names = ['index','review','student','imports','login','register','projects','gmail','users','admin-projects','integrations','logs','navbar','project-tree','reports','manual-import'];
const oldNames = ['Main','Review','Student','Admin','Login','Register','Directory','Gmail','Users','AdminProjects','Integrations','Logs','Navbar','ProjectTree','Report','ImportManual'];
const titles = ['หน้าแรก','ตรวจและอนุมัติผลสรุป','ติดตามความคืบหน้า','การนำเข้าอีเมล','เข้าสู่ระบบ','สมัครสมาชิก','โครงงานที่ดูแล','เชื่อมต่อ Gmail','ผู้ใช้และสิทธิ์','โครงงานทั้งหมด','การเชื่อมต่อระบบ','บันทึกการใช้งาน','ตัวอย่างแถบนำทาง','รายการโครงงาน','รายงานและ Infographic','นำเข้าจากภาพ'];
const roles = ['public','advisor','student','admin','public','public','advisor','advisor','admin','admin','admin','admin','advisor','advisor','student','advisor'];
fs.mkdirSync(path.join(root, 'assets', 'pages'), {recursive:true});
fs.mkdirSync(path.join(root, 'assets', 'media'), {recursive:true});
for (const name of ['app','auth-policy','auth-forms']) fs.copyFileSync(path.join(projectRoot,'src','js',name+'.js'),path.join(root,'assets',name+'.js'));
fs.copyFileSync(path.join(projectRoot,'src','styles','app.css'),path.join(root,'assets','app.css'));
function links(s) {
  oldNames.forEach((n,i) => s = s.split(n + '.dc.html').join(names[i] + '.html'));
  return s;
}
function decode(entry) {
  const b = Buffer.from(entry.data, 'base64');
  return entry.compressed ? zlib.gunzipSync(b) : b;
}
const pages = Object.values(manifest).map(entry => {
  const packed = decode(entry).toString('utf8');
  let html = island(packed, 'template');
  for (const [uuid, asset] of Object.entries(island(packed, 'manifest') || {})) {
    if (!html.includes(uuid) || /javascript/.test(asset.mime)) continue;
    const bytes = decode(asset);
    const ext = ({'font/woff2':'woff2','image/png':'png','image/jpeg':'jpg','image/svg+xml':'svg','text/css':'css'})[asset.mime] || 'bin';
    const filename = crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16) + '.' + ext;
    fs.writeFileSync(path.join(root, 'assets', 'media', filename), bytes);
    html = html.split(uuid).join('assets/media/' + filename);
  }
  return links(html);
});
function parts(html) {
  const code = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
  let body = html.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1].replace(/<helmet>[\s\S]*?<\/helmet>/g,'');
  body = body.replace(/<sc-raw-select/g,'<select').replace(/<\/sc-raw-select>/g,'</select>');
  body = body.replace(/<sc-for list="{{(.*?)}}" as="(.*?)"[^>]*>/g,'<template data-each="$1" data-as="$2">').replace(/<\/sc-for>/g,'</template>');
  body = body.replace(/<sc-if value="{{(.*?)}}"[^>]*>/g,'<template data-if="$1">').replace(/<\/sc-if>/g,'</template>');
  body = body.replace(/sc-camel-on-(\w+)/g,'data-on-$1').replace(/sc-camel-view-box/g,'viewBox');
  body = body.replace(/\s+hint-[\w-]+="[^"]*"/g,'');
  return {code,styles,body};
}
const partsList = pages.map(parts);
const menu = {
 public: [['หน้าแรก','index'],['วิธีทำงาน','index#how'],['สำหรับใคร','index#roles'],['สมัครสมาชิก','register'],['เข้าสู่ระบบ','login']],
 student: [['ภาพรวม','student'],['รายงาน','reports']],
 advisor: [['รอตรวจสอบ','review'],['โครงงานที่ดูแล','projects'],['นำเข้าจากภาพ','manual-import'],['เชื่อมต่อ Gmail','gmail'],['รายงาน','reports']],
 admin: [['ผู้ใช้และสิทธิ์','users'],['โครงงานทั้งหมด','admin-projects'],['นำเข้าอีเมล','imports'],['การเชื่อมต่อระบบ','integrations'],['บันทึกการใช้งาน','logs']]
};
function href(n) {const [p,h] = n.split('#');return p+'.html'+(h?'#'+h:'');}
function navbar(role,current) {
 if(current==='login') return '';
 const label = {public:'ผู้เยี่ยมชม',student:'นักศึกษา',advisor:'อาจารย์ที่ปรึกษา',admin:'ผู้ดูแลระบบ'}[role];
 return `<a class="skip-link" href="#main-content">ข้ามไปเนื้อหา</a><header class="site-header ${role==='admin'?'is-admin':''}"><div class="nav-inner"><a class="brand" href="index.html" aria-label="Summa หน้าแรก"><span class="brand-mark" aria-hidden="true">≡</span> Summa</a><button class="nav-toggle" type="button" aria-controls="primary-navigation" aria-expanded="false">☰ เมนู</button><nav id="primary-navigation" aria-label="เมนูหลัก">${menu[role].map(([l,n])=>`<a href="${href(n)}" ${n===current?'aria-current="page"':''}>${l}</a>`).join('')}</nav><details class="account-menu"><summary>${label} <span aria-hidden="true">⌄</span></summary><div class="account-panel"><p>สลับมุมมองตัวอย่าง</p><a href="student.html">นักศึกษา</a><a href="review.html">อาจารย์ที่ปรึกษา</a><a href="users.html">ผู้ดูแลระบบ</a><hr><a href="index.html">หน้าแรก</a><a href="login.html">เข้าสู่ระบบ</a></div></details></div></header>`;
}
for(let i=0;i<names.length;i++) {
 let {body,code,styles} = partsList[i];
 if(i===4) body=fs.readFileSync(path.join(projectRoot,'src','templates','login.html'),'utf8');
 if(i===5) body=body.replace('data-on-click="{{submit}}"','data-on-click="{{submit}}" disabled="{{busy}}"').replace('>ส่งคำขอสมัคร</button>','>{{registerLabel}}</button>');
 if(i===8) {
   code=code.replace(/const upd = \(id, patch\) => this\.setState\([^\n]+/,
     "const upd = async (id, patch) => { try { await SummaAuth.updateUser(id, patch); this.setState({ users: this.state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)), error: '' }); } catch(error) { this.setState({error: SummaPolicy.errorMessage(error)}); } };");
   code=code.replace("canOk: u.status !== 'active'", "canOk: !u.self && u.status !== 'active'");
   body='<template data-if="loading"><p class="page-feedback" role="status">กำลังโหลดบัญชีผู้ใช้จาก Firebase…</p></template><template data-if="hasError"><p class="page-feedback form-alert" role="alert">{{error}}</p></template>'+body;
   body=body.replace('<option value="admin">','<option value="admin" disabled>');
 }
 if([1,2].includes(i)) body='<p class="page-feedback demo-notice">โหมดตัวอย่างโครงงาน: การอนุมัติ งาน และนัดหมายในหน้านี้ยังไม่เปลี่ยนข้อมูลโครงงานจริง</p>'+body;
 if(i===1) code=code.replace('นักศึกษาได้รับการแจ้งเตือนทางเว็บไซต์และอีเมลแล้ว','อนุมัติผลสรุปตัวอย่างแล้ว ยังไม่ได้ส่งการแจ้งเตือนจริง');
 body = body.replace(/<dc-import name="Navbar"[^>]*><\/dc-import>/g,'');
 if(i===0) body = body.replace(/<!-- NAV -->[\s\S]*?<!-- HERO -->/,'<!-- HERO -->');
 body = body.replace(/<dc-import name="ProjectTree" scope="(.*?)"[^>]*><\/dc-import>/g,(_,scope)=>`<section data-component="project-tree" data-scope="${scope}">${partsList[13].body}</section>`);
 if(i===12) body='<div class="component-preview"><h1>แถบนำทาง</h1><p>ใช้เมนูด้านบนเพื่อเปลี่ยนหน้า เมนูบัญชีแสดงพื้นที่ทำงานตามสิทธิ์ที่ได้รับ</p></div>';
 // Use the browser print dialog for a real PDF export instead of the original simulated download.
 if(i===14) {
   code=code.replace(/download: \(\) => \{[\s\S]*?\n      \}/,"download: () => window.print()");
   body=body.replace('<!-- controls -->','<!-- controls -->').replace('<div style="flex:0 1 320px;', '<div class="report-controls" style="flex:0 1 320px;').replace('<div style="flex:1 1 560px;', '<div class="report-preview" style="flex:1 1 560px;').replace('<div style="width:794px;', '<div class="report-sheet" style="width:794px;');
 }
 fs.writeFileSync(path.join(root,'assets','pages',names[i]+'.js'),`/* Page behavior extracted from the supplied design. */\nSumma.register('${names[i]}', (DCLogic) => {\n${code}\nreturn Component;\n});\n`);
 const css = styles + ([6,9].includes(i)?'\n'+partsList[13].styles:'');
 fs.writeFileSync(path.join(root,'assets','pages',names[i]+'.css'),css.replaceAll('assets/media/','../media/'));
 const child = [6,9].includes(i)?'<script defer src="assets/pages/project-tree.js"></script>':'';
 const navigation=navbar(roles[i],names[i]).replace(/<div class="account-panel">[\s\S]*?<\/div><\/details>/,'<div class="account-panel"><a href="login.html">เข้าสู่ระบบ</a></div></details>');
 fs.writeFileSync(path.join(root,names[i]+'.html'),`<!DOCTYPE html>\n<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titles[i]} | Summa</title><link rel="stylesheet" href="assets/pages/${names[i]}.css"><link rel="stylesheet" href="assets/app.css"><script defer src="assets/auth-policy.js"></script><script defer src="assets/app.js"></script><script defer src="assets/auth-forms.js"></script><script defer src="assets/firebase.bundle.js"></script>${child}<script defer src="assets/pages/${names[i]}.js"></script></head>\n<body data-page="${names[i]}" data-role="${roles[i]}" data-auth="pending">${navigation}<div id="auth-status" class="page-feedback form-alert" role="alert" hidden></div><main id="main-content" tabindex="-1"><div id="page-root"></div></main><template id="page-template">${body}</template><noscript><p>กรุณาเปิด JavaScript เพื่อใช้งานหน้านี้</p></noscript><footer class="site-footer">Summa · บัญชีผู้ใช้เชื่อมต่อ Firebase · ข้อมูลโครงงานและการเชื่อมต่ออื่นเป็นตัวอย่าง</footer></body></html>\n`);
}
const license = original.match(/<!--([\s\S]*?)-->/);
if(license) fs.writeFileSync(path.join(root,'assets','FONT-LICENSE.txt'),license[1]);
console.log('Built '+names.length+' independent HTML pages.');
