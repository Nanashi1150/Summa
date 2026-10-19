import {ready,getSession,login,googleLogin,resetPassword,register,logout,selectRole} from './auth.js';
import {listUsers,updateUser} from './users.js';
import * as projects from './projects.js';
import {auth} from './firebase.js';

// Small interface used by the page controllers and replaced only by the test harness.
window.SummaAuth=Object.freeze({
  ready,get state(){return getSession();},
  login,googleLogin,resetPassword,register,logout,selectRole,listUsers,updateUser,
  getIdToken:()=>auth.currentUser?.getIdToken() || Promise.resolve(null)
});
window.SummaData=Object.freeze(projects);
