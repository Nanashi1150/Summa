import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,browserSessionPersistence} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {timeout} from './helpers.js';

// Browser configuration identifies the project. Access is enforced by Authentication and Firestore Rules.
export const firebaseConfig={
  apiKey:'AIzaSyDxLNOj6wz-ZuENmFvmQU1thfg-Y8Bo3GU',
  authDomain:'summa-cd251.firebaseapp.com',
  projectId:'summa-cd251',
  storageBucket:'summa-cd251.firebasestorage.app',
  messagingSenderId:'972346592654',
  appId:'1:972346592654:web:17163ebbf8d128f616e8df',
  measurementId:'G-7XDT6MQXRS'
};
export const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);
export const initialized=timeout(setPersistence(auth,browserSessionPersistence));
