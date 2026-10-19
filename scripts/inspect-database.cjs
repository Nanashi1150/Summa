/* Read-only inspection of the configured production database. Never prints credentials or record values. */
const fs=require('node:fs'),path=require('node:path');
const {getGlobalDefaultAccount,setActiveAccount}=require('firebase-tools/lib/auth');
const {requireAuth}=require('firebase-tools/lib/requireAuth');
const {Client}=require('firebase-tools/lib/apiv2');
async function main(){
  const project=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','.firebaserc'),'utf8')).projects.default;
  if(project!=='summa-cd251')throw new Error('Unexpected project; inspect configuration first.');
  const options={project,nonInteractive:true};
  const account=getGlobalDefaultAccount();if(account)setActiveAccount(options,account);
  await requireAuth(options);
  const client=new Client({auth:true,apiVersion:'v1',urlPrefix:'https://firestore.googleapis.com'});
  const base=`projects/${project}/databases/(default)`;
  const database=(await client.get(base)).body;
  const collectionIds=[];
  let pageToken;
  do{const result=(await client.post(base+'/documents:listCollectionIds',{pageSize:100,...(pageToken?{pageToken}:{})})).body;collectionIds.push(...result.collectionIds || []);pageToken=result.nextPageToken;}while(pageToken);
  const collections=collectionIds.map(collection=>({collection}));
  const report={project,database:{name:database.name,locationId:database.locationId,type:database.type},collections};
  const directory=path.resolve(__dirname,'..','.local','database');fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'inspection.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
