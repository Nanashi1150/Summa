/* Back up deployment configuration only. Does not read or write database documents. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {getGlobalDefaultAccount,setActiveAccount}=require('firebase-tools/lib/auth');
const {requireAuth}=require('firebase-tools/lib/requireAuth');
const rules=require('firebase-tools/lib/gcp/rules');
const {Client}=require('firebase-tools/lib/apiv2');
(async()=>{
  const project='summa-cd251',options={project,nonInteractive:true};
  const account=getGlobalDefaultAccount();if(account)setActiveAccount(options,account);await requireAuth(options);
  const releases=await rules.listAllReleases(project);
  const release=releases.find(item=>item.name===`projects/${project}/releases/cloud.firestore`);
  const files=release?await rules.getRulesetContent(release.rulesetName):[];
  const client=new Client({auth:true,apiVersion:'v1',urlPrefix:'https://firestore.googleapis.com'});
  const indexes=[];let token;
  do{const result=(await client.get(`projects/${project}/databases/(default)/collectionGroups/-/indexes`,{queryParams:{...(token?{pageToken:token}:{})}})).body;indexes.push(...result.indexes || []);token=result.nextPageToken;}while(token);
  const directory=path.resolve(__dirname,'..','.local','database','config-'+new Date().toISOString().replace(/[:.]/g,'-'));
  fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'snapshot.json'),JSON.stringify({project,release,files,indexes},null,2));
  console.log(JSON.stringify({directory,release:release?.rulesetName || null,files:files.map(file=>({name:file.name,sha256:crypto.createHash('sha256').update(file.content).digest('hex')})),indexes:indexes.map(index=>({name:index.name,state:index.state,fields:index.fields}))},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
