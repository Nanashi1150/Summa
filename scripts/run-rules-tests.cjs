const {spawnSync}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const net=require('node:net');
const root=path.resolve(__dirname,'..');
(async()=>{
  const server=net.createServer();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  const config=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8'));
  config.firestore.rules=path.join(root,'config','firebase','firestore.rules');
  config.firestore.indexes=path.join(root,'config','firebase','firestore.indexes.json');
  config.emulators.firestore.port=port;
  const directory=path.join(root,'.local','test-config');
  fs.mkdirSync(directory,{recursive:true});
  const configPath=path.join(directory,'firebase-'+process.pid+'.json');
  fs.writeFileSync(configPath,JSON.stringify(config));
  const result=spawnSync(process.execPath,[
    require.resolve('firebase-tools/lib/bin/firebase.js'),
    'emulators:exec','--config',configPath,'--only','firestore','--project','demo-summa','node tests/firestore-rules.cjs'
  ],{cwd:root,stdio:'inherit',env:{...process.env,DEBUG:'',NO_UPDATE_NOTIFIER:'1',FIREBASE_EMULATORS_PATH:path.join(root,'.firebase-emulators')}});
  const log=path.join(root,'firestore-debug.log');
  if(fs.existsSync(log)) {const logs=path.join(root,'.local','logs');fs.mkdirSync(logs,{recursive:true});fs.renameSync(log,path.join(logs,'firestore-'+process.pid+'.log'));}
  if(result.error)console.error(result.error.message);
  process.exitCode=result.status ?? 1;
})().catch(error=>{console.error(error);process.exitCode=1;});
