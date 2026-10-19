import {doc,collection,getDocs,updateDoc,serverTimestamp} from 'firebase/firestore';
import {auth,db} from './firebase.js';
import {ready,readProfile,validProfile} from './auth.js';
import {coded,timeout} from './helpers.js';

async function requireAdmin() {
  await ready;
  if(!auth.currentUser)throw coded('summa/not-authorized');
  const profile=validProfile(await readProfile(auth.currentUser));
  if(profile.role!=='admin')throw coded('summa/not-authorized');
}
export async function listUsers() {
  await requireAdmin();
  const snapshot=await timeout(getDocs(collection(db,'users')));
  return snapshot.docs.map(item=>({...item.data(),id:item.id}));
}
export async function updateUser(uid,patch) {
  await requireAdmin();
  if(uid===auth.currentUser.uid || Object.keys(patch).some(key=>!['role','status'].includes(key)) ||
    (patch.role && !['student','advisor'].includes(patch.role)) ||
    (patch.status && !['active','pending','suspended'].includes(patch.status)))throw coded('summa/not-authorized');
  await timeout(updateDoc(doc(db,'users',uid),{...patch,updatedAt:serverTimestamp()}));
}
