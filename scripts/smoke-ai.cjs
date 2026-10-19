/* Explicit live smoke test using synthetic text only; never loads user emails. */
const assert=require('node:assert/strict');
const http=require('node:http');
const text='ตัวอย่างอีเมลทดสอบ: ขอให้แก้แผนภาพ ER ให้ครบทุกตาราง และส่งภายในวันที่ 23 ตุลาคม นัดพบวันที่ 29 ตุลาคม เวลา 13:30 น. ที่ห้องพักอาจารย์';
const req=http.request('http://127.0.0.1:4173/api/synthesize',{method:'POST',headers:{Host:'localhost:4173',Origin:'http://localhost:4173','Content-Type':'application/json'}},res=>{
  let raw='';res.on('data',chunk=>raw+=chunk);res.on('end',()=>{
    try{
      const result=JSON.parse(raw);assert.equal(res.statusCode,200,result.error);
      assert.ok(result.items.some(item=>item.kind==='task'));
      assert.ok(result.items.some(item=>item.kind==='appointment'));
      for(const item of result.items)for(const quote of item.evidence)assert.ok(text.includes(quote));
      console.log(JSON.stringify({status:res.statusCode,model:result.model,summary:result.summary,items:result.items},null,2));
    }catch(error){console.error(error.message);process.exitCode=1;}
  });
});
req.on('error',error=>{console.error(error.message);process.exitCode=1;});req.setTimeout(100000,()=>req.destroy(new Error('Smoke test timeout')));req.end(JSON.stringify({text}));
