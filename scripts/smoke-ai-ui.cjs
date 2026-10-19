/* Live DOM -> Summa HTTP API -> Ollama -> rendered results, using synthetic email only. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
(async()=>{
  const root=path.resolve(__dirname,'..','public'),errors=[],vc=new VirtualConsole();
  vc.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'review.html'),'utf8'),{url:'http://localhost:4173/review.html?demo=advisor',runScripts:'outside-only',virtualConsole:vc});
  try{
    await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
    dom.window.SummaAuth={state:{ready:true,user:null,profile:null},ready:Promise.resolve(),getIdToken:async()=>null};
    dom.window.fetch=(url,options)=>new Promise((resolve,reject)=>{
      const req=http.request('http://127.0.0.1:4173'+url,{method:options.method,headers:{...options.headers,Host:'localhost:4173',Origin:'http://localhost:4173'}},res=>{
        let raw='';res.setEncoding('utf8');res.on('data',chunk=>raw+=chunk);res.on('end',()=>resolve({ok:res.statusCode===200,json:async()=>JSON.parse(raw)}));
      });req.on('error',reject);req.end(options.body);
    });
    for(const script of dom.window.document.querySelectorAll('script[src]'))if(!script.src.endsWith('firebase.bundle.js'))dom.window.eval(fs.readFileSync(path.join(root,script.getAttribute('src')),'utf8'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));await new Promise(resolve=>setImmediate(resolve));
    const input=dom.window.document.getElementById('email-source');
    input.value='ตัวอย่างอีเมลทดสอบ: ขอให้แก้แผนภาพ ER ให้ครบทุกตาราง ส่งภายในวันที่ 23 ตุลาคม และนัดพบวันที่ 29 ตุลาคม เวลา 13:30 น.';
    input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
    [...dom.window.document.querySelectorAll('button')].find(button=>button.textContent==='สกัดข้อมูลด้วย Gemma 4').click();
    await new Promise((resolve,reject)=>{
      const started=Date.now(),timer=setInterval(()=>{
        const error=dom.window.document.querySelector('.review-ai-error');
        if(error){clearInterval(timer);reject(new Error(error.textContent));}
        else if(dom.window.document.querySelector('#summary-edit')){clearInterval(timer);resolve();}
        else if(Date.now()-started>95000){clearInterval(timer);reject(new Error('Live UI timeout'));}
      },50);
    });
    assert.deepEqual(errors,[]);
    assert.ok(dom.window.document.querySelectorAll('.review-style-27').length>=2);
    assert.ok(dom.window.document.querySelectorAll('.review-evidence').length>=2);
    assert.ok(dom.window.document.querySelectorAll('.review-style-20 button').length>=2);
    assert.equal(dom.window.sessionStorage.length,0);
    console.log('PASS: live review input -> Summa API -> gemma4:31b-cloud -> summary, tasks, appointment and source highlights; no session storage.');
  }finally{dom.window.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
