const fs=require('node:fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,getDoc,getDocs,collection,setDoc,updateDoc,serverTimestamp,Timestamp}=require('firebase/firestore');
(async()=>{
 const [host,port]=(process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:18080').split(':');
 const env=await initializeTestEnvironment({projectId:'demo-summa',firestore:{host,port:Number(port),rules:fs.readFileSync('config/firebase/firestore.rules','utf8')}});
 try {
   const profile=(uid,role='student',status='active')=>({uid,email:uid+'@example.test',name:'Test '+uid,fac:'Science',br:'CS',sid:'123',role,status,createdAt:Timestamp.fromMillis(1000)});
   await env.withSecurityRulesDisabled(async context=>{for(const [uid,role,status] of [['admin','admin','active'],['student','student','active'],['advisor','advisor','active'],['pending','student','pending'],['suspended','admin','suspended'],['other-admin','admin','active']])await setDoc(doc(context.firestore(),'users',uid),profile(uid,role,status));});
   const guest=env.unauthenticatedContext().firestore();
   const client=uid=>env.authenticatedContext(uid,{email:uid+'@example.test'}).firestore();
   const admin=client('admin'),student=client('student'),pending=client('pending'),suspended=client('suspended'),newcomer=client('new');
   await assertFails(getDoc(doc(guest,'users','student')));await assertFails(getDocs(collection(guest,'users')));await assertFails(setDoc(doc(guest,'users','guest'),profile('guest')));
   await assertSucceeds(getDoc(doc(student,'users','student')));await assertFails(getDoc(doc(student,'users','advisor')));await assertFails(getDocs(collection(student,'users')));
   await assertFails(updateDoc(doc(student,'users','student'),{role:'admin',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(pending,'users','pending'),{status:'active',updatedAt:serverTimestamp()}));
   await assertFails(setDoc(doc(newcomer,'users','new'),{...profile('new','admin','pending'),createdAt:serverTimestamp()}));await assertFails(setDoc(doc(newcomer,'users','new'),{...profile('new','student','active'),createdAt:serverTimestamp()}));
   await assertFails(setDoc(doc(newcomer,'users','new'),{...profile('new','student','pending'),email:'spoof@example.test',createdAt:serverTimestamp()}));
   await assertSucceeds(setDoc(doc(newcomer,'users','new'),{...profile('new','advisor','pending'),createdAt:serverTimestamp()}));await assertFails(updateDoc(doc(newcomer,'users','new'),{status:'active',updatedAt:serverTimestamp()}));
   await assertSucceeds(getDocs(collection(admin,'users')));await assertFails(getDocs(collection(suspended,'users')));await assertFails(updateDoc(doc(suspended,'users','pending'),{status:'active',updatedAt:serverTimestamp()}));
   await assertSucceeds(updateDoc(doc(admin,'users','pending'),{status:'active',updatedAt:serverTimestamp()}));assert.equal((await getDoc(doc(admin,'users','pending'))).data().status,'active');
   await assertFails(updateDoc(doc(admin,'users','admin'),{status:'suspended',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(admin,'users','other-admin'),{status:'suspended',updatedAt:serverTimestamp()}));
   await assertFails(updateDoc(doc(admin,'users','student'),{role:'admin',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(admin,'users','student'),{email:'other@example.test',updatedAt:serverTimestamp()}));
   await require('./project-rules.cjs')(env,client);
   await assertSucceeds(updateDoc(doc(admin,'users','student'),{role:'advisor',updatedAt:serverTimestamp()}));await assertFails(setDoc(doc(guest,'reviews','one'),{status:'approved'}));await assertFails(setDoc(doc(student,'reviews','one'),{status:'approved'}));
   console.log('PASS: Firestore rules deny guest access, privilege escalation, self-approval, suspended admins and protected-account edits; allow pending registration and authorized activation.');
 } finally {await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
