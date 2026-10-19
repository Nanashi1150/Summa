import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,
  signInWithPopup,GoogleAuthProvider,sendPasswordResetEmail,signOut} from 'firebase/auth';
import {doc,getDocFromServer,setDoc,serverTimestamp,onSnapshot} from 'firebase/firestore';
import {auth,db,initialized} from './firebase.js';
import {coded,timeout} from './helpers.js';

let state={ready:false,user:null,profile:null,viewRole:null,error:null};
let resolveReady;
let profileSubscription;
let generation=0;
export const ready=new Promise(resolve=>{resolveReady=resolve;});
export const getSession=()=>state;

function emit(next) {
  state={...state,...next};
  if(state.ready)resolveReady(state);
  window.dispatchEvent(new CustomEvent('summa:auth',{detail:state}));
}
function clearPageState() {
  try{for(const key of Object.keys(sessionStorage))if(/^summa:(v[12]:|view-role:)/.test(key))sessionStorage.removeItem(key);}catch{/* Storage can be disabled. */}
}
function storedRole(user,profile) {
  if(profile?.role!=='admin' || profile.status!=='active')return null;
  try{const role=sessionStorage.getItem('summa:view-role:'+user.uid);return ['admin','advisor','student'].includes(role)?role:'admin';}catch{return 'admin';}
}
export async function selectRole(role) {
  const user=auth.currentUser;
  if(!user || !['admin','advisor','student'].includes(role))throw coded('summa/not-authorized');
  const profile=validProfile(await readProfile(user));
  if(auth.currentUser?.uid!==user.uid || profile.role!=='admin')throw coded('summa/not-authorized');
  try{sessionStorage.setItem('summa:view-role:'+user.uid,role);}catch{/* Keep the choice for this page when storage is unavailable. */}
  emit({ready:true,user,profile,viewRole:role,error:null});
  return state;
}
export function validProfile(profile) {
  if(!profile || !['student','advisor','admin'].includes(profile.role))throw coded('summa/profile-missing');
  if(profile.status!=='active')throw coded(profile.status==='suspended'?'summa/suspended':'summa/pending');
  return profile;
}
export async function readProfile(user) {
  const snapshot=await timeout(getDocFromServer(doc(db,'users',user.uid)));
  return snapshot.exists()?snapshot.data():null;
}
async function completeLogin(credential) {
  try{
    const profile=validProfile(await readProfile(credential.user));
    const viewRole=profile.role==='admin'?'admin':null;
    try{sessionStorage.removeItem('summa:view-role:'+credential.user.uid);}catch{/* Storage can be disabled. */}
    emit({ready:true,user:credential.user,profile,viewRole,error:null});
    return {ready:true,user:credential.user,profile,viewRole};
  }catch(error){await signOut(auth);throw error;}
}
export async function login(email,password) {
  await initialized;
  return completeLogin(await timeout(signInWithEmailAndPassword(auth,email.trim(),password)));
}
export async function googleLogin() {
  await initialized;
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  return completeLogin(await signInWithPopup(auth,provider));
}
export async function resetPassword(email) {
  await initialized;
  try{await timeout(sendPasswordResetEmail(auth,email.trim()));}
  catch(error){if(error.code!=='auth/user-not-found')throw error;}
}
export async function register(values) {
  await initialized;
  if(!['student','advisor'].includes(values.role))throw coded('summa/not-authorized');
  const credential=await timeout(createUserWithEmailAndPassword(auth,values.email.trim(),values.pw1));
  try{
    await timeout(setDoc(doc(db,'users',credential.user.uid),{
      uid:credential.user.uid,email:credential.user.email,
      name:(values.first.trim()+' '+values.last.trim()).trim(),
      fac:values.faculty,br:values.branch,sid:values.role==='student'?values.sid.trim():'',
      role:values.role,status:'pending',createdAt:serverTimestamp()
    }));
  }catch{throw coded('summa/profile-save');}
  finally{await signOut(auth);}
}
export async function logout(){clearPageState();await signOut(auth);}

initialized.then(()=>{
  onAuthStateChanged(auth,async user=>{
    const current=++generation;
    profileSubscription?.();profileSubscription=null;
    if(!user){clearPageState();emit({ready:true,user:null,profile:null,viewRole:null,error:null});return;}
    emit({ready:false,user,profile:null,viewRole:null,error:null});
    try{
      const profile=await readProfile(user);
      if(current!==generation)return;
      emit({ready:true,user,profile,viewRole:storedRole(user,profile),error:null});
      profileSubscription=onSnapshot(doc(db,'users',user.uid),snapshot=>{
        if(current===generation){
          const nextProfile=snapshot.exists()?snapshot.data():null;
          emit({ready:true,user,profile:nextProfile,viewRole:storedRole(user,nextProfile),error:null});
        }
      },error=>{if(current===generation)emit({ready:true,user,profile:null,error});});
    }catch(error){if(current===generation)emit({ready:true,user,profile:null,error});}
  },error=>emit({ready:true,user:null,profile:null,error}));
}).catch(error=>emit({ready:true,user:null,profile:null,error}));
