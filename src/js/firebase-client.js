import {initializeApp} from 'firebase/app';
import {getAuth, setPersistence, browserSessionPersistence, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, sendPasswordResetEmail, signOut} from 'firebase/auth';
import {getFirestore, doc, getDocFromServer, setDoc, updateDoc, serverTimestamp,
  collection, getDocs, onSnapshot} from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyDxLNOj6wz-ZuENmFvmQU1thfg-Y8Bo3GU',
  authDomain: 'summa-cd251.firebaseapp.com', projectId: 'summa-cd251',
  storageBucket: 'summa-cd251.firebasestorage.app', messagingSenderId: '972346592654',
  appId: '1:972346592654:web:17163ebbf8d128f616e8df', measurementId: 'G-7XDT6MQXRS'
};
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
let state = {ready: false, user: null, profile: null, error: null};
let resolveReady;
let profileSubscription;
let generation = 0;
const ready = new Promise(resolve => { resolveReady = resolve; });
const coded = code => Object.assign(new Error(code), {code});
function timeout(promise, ms = 15000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(coded('summa/timeout')), ms);})]).finally(() => clearTimeout(timer));
}
function emit(next) {
  state = {...state, ...next};
  if (state.ready) resolveReady(state);
  window.dispatchEvent(new CustomEvent('summa:auth', {detail: state}));
}
function clearPageState() {
  try {for (const key of Object.keys(sessionStorage)) if (/^summa:v[12]:/.test(key)) sessionStorage.removeItem(key);} catch { /* storage can be unavailable */ }
}
function validProfile(profile) {
  if (!profile || !['student','advisor','admin'].includes(profile.role)) throw coded('summa/profile-missing');
  if (profile.status !== 'active') throw coded(profile.status === 'suspended' ? 'summa/suspended' : 'summa/pending');
  return profile;
}
async function readProfile(user) {
  const snapshot = await timeout(getDocFromServer(doc(db, 'users', user.uid)));
  return snapshot.exists() ? snapshot.data() : null;
}
async function completeLogin(credential) {
  try {
    const profile = validProfile(await readProfile(credential.user));
    emit({ready:true, user:credential.user, profile, error:null});
    return {user: credential.user, profile, ready:true};
  } catch(error) {await signOut(auth); throw error;}
}
async function requireAdmin() {
  await ready;
  if (!auth.currentUser) throw coded('summa/not-authorized');
  const profile = validProfile(await readProfile(auth.currentUser));
  if (profile.role !== 'admin') throw coded('summa/not-authorized');
}
const initialized = timeout(setPersistence(auth, browserSessionPersistence));
window.SummaAuth = Object.freeze({
  ready,
  get state() {return state;},
  async login(email, password) {
    await initialized;
    return completeLogin(await timeout(signInWithEmailAndPassword(auth, email.trim(), password)));
  },
  async googleLogin() {
    await initialized;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({prompt: 'select_account'});
    // Existing, approved Firestore profile is required. OAuth alone never grants a role.
    return completeLogin(await signInWithPopup(auth, provider));
  },
  async resetPassword(email) {
    await initialized;
    try {await timeout(sendPasswordResetEmail(auth, email.trim()));}
    catch(error) {if(error.code !== 'auth/user-not-found') throw error;}
  },
  async register(values) {
    await initialized;
    if (!['student','advisor'].includes(values.role)) throw coded('summa/not-authorized');
    const credential = await timeout(createUserWithEmailAndPassword(auth, values.email.trim(), values.pw1));
    try {
      await timeout(setDoc(doc(db, 'users', credential.user.uid), {
        uid:credential.user.uid, email:credential.user.email,
        name:(values.first.trim()+' '+values.last.trim()).trim(),
        fac:values.faculty, br:values.branch, sid:values.role === 'student' ? values.sid.trim() : '',
        role:values.role, status:'pending', createdAt:serverTimestamp()
      }));
    } catch {throw coded('summa/profile-save');}
    finally {await signOut(auth);}
  },
  async logout() {clearPageState(); await signOut(auth);},
  async listUsers() {
    await requireAdmin();
    const snapshot = await timeout(getDocs(collection(db, 'users')));
    return snapshot.docs.map(item => ({...item.data(), id:item.id}));
  },
  async updateUser(uid, patch) {
    await requireAdmin();
    if (uid === auth.currentUser.uid || Object.keys(patch).some(key => !['role','status'].includes(key)) ||
      (patch.role && !['student','advisor'].includes(patch.role)) ||
      (patch.status && !['active','pending','suspended'].includes(patch.status))) throw coded('summa/not-authorized');
    await timeout(updateDoc(doc(db, 'users', uid), {...patch, updatedAt:serverTimestamp()}));
  }
});
initialized.then(() => {
  onAuthStateChanged(auth, async user => {
    const current = ++generation;
    profileSubscription?.(); profileSubscription = null;
    if (!user) {clearPageState(); emit({ready:true, user:null, profile:null, error:null}); return;}
    // Revoke existing UI access immediately while verifying the new identity against the server.
    emit({ready:false, user, profile:null, error:null});
    try {
      const profile = await readProfile(user);
      if (current !== generation) return;
      emit({ready:true, user, profile, error:null});
      profileSubscription = onSnapshot(doc(db, 'users', user.uid), snapshot => {
        if (current !== generation) return;
        emit({ready:true, user, profile:snapshot.exists() ? snapshot.data() : null, error:null});
      }, error => {if(current === generation) emit({ready:true, user, profile:null, error});});
    } catch(error) {if(current === generation) emit({ready:true, user, profile:null, error});}
  }, error => emit({ready:true, user:null, profile:null, error}));
}).catch(error => emit({ready:true, user:null, profile:null, error}));
