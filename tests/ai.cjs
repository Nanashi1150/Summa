const assert=require('node:assert/strict'),http=require('node:http');
const {validateResult,synthesize,createHandler,authorize}=require('../server/synthesize.cjs');
const source='ขอให้แก้แผนภาพ ER และส่งภายใน 23 ตุลาคม';
const valid={summary:'แก้ไขแผนภาพ ER',items:[{kind:'task',title:'แก้แผนภาพ ER',owner:null,dueText:'23 ตุลาคม',evidence:['แก้แผนภาพ ER','ส่งภายใน 23 ตุลาคม']}]};
(async()=>{
  assert.deepEqual(validateResult(JSON.stringify(valid),source),valid);
  assert.throws(()=>validateResult(JSON.stringify({...valid,items:[{...valid.items[0],evidence:['ข้อความที่ไม่มีจริง']}]}),source),/ต้นฉบับ/);
  assert.throws(()=>validateResult(JSON.stringify({...valid,items:[{...valid.items[0],dueText:'2026-10-23'}]}),source),/หลักฐาน/);
  assert.throws(()=>validateResult('not JSON',source),/รูปแบบ/);
  const mock=async(url,options)=>{
    assert.equal(url,'http://127.0.0.1:11434/api/chat');
    const payload=JSON.parse(options.body);assert.equal(payload.model,'gemma4:31b-cloud');assert.equal(payload.stream,false);assert.ok(payload.messages[0].content.includes('untrusted DATA'));
    return {ok:true,json:async()=>({message:{content:JSON.stringify(valid)}})};
  };
  const result=await synthesize(source,{fetchImpl:mock});assert.equal(result.items[0].dueText,'23 ตุลาคม');
  await assert.rejects(synthesize('',{fetchImpl:mock}),/กรอกข้อความ/);
  await assert.rejects(synthesize(source,{cloud:true,apiKey:''}),/API_KEY/);
  await assert.rejects(authorize({headers:{}}),error=>error.status===401);
  const authMock=role=>async url=>url.includes('accounts:lookup')?{ok:true,json:async()=>({users:[{localId:'test-uid'}]})}:{ok:true,json:async()=>({fields:{role:{stringValue:role},status:{stringValue:'active'}}})};
  await authorize({headers:{authorization:'Bearer test-token'}},authMock('advisor'));
  await assert.rejects(authorize({headers:{authorization:'Bearer test-token'}},authMock('student')),error=>error.status===403);
  const handler=createHandler({local:true,fetchImpl:mock}),server=http.createServer(handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  const request=(url,options)=>new Promise((resolve,reject)=>{
    const req=http.request(url,{method:options.method,headers:options.headers},res=>{let raw='';res.on('data',chunk=>raw+=chunk);res.on('end',()=>resolve({status:res.statusCode,json:async()=>JSON.parse(raw)}));});
    req.on('error',reject);req.end(options.body);
  });
  try{
    const headers={host:'localhost:4173',origin:'http://localhost:4173','content-type':'application/json'};
    let response=await request(url,{method:'POST',headers,body:JSON.stringify({text:source})});assert.equal(response.status,200);assert.equal((await response.json()).items.length,1);
    response=await request(url,{method:'POST',headers:{...headers,origin:'https://other.example'},body:JSON.stringify({text:source})});assert.equal(response.status,403);
    response=await request(url,{method:'GET',headers});assert.equal(response.status,405);
    response=await request(url,{method:'POST',headers,body:'invalid'});assert.equal(response.status,400);
    response=await request(url,{method:'POST',headers,body:JSON.stringify({text:'x'.repeat(20001)})});assert.equal(response.status,400);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  console.log('PASS: Ollama request, evidence validation, missing dates, role authorization, same-origin API, input limits and error responses.');
})().catch(error=>{console.error(error);process.exitCode=1;});
