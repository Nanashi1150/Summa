import {ready,getSession,login,googleLogin,resetPassword,register,logout,selectRole} from './auth.js';
import {listUsers,updateUser} from './users.js';

// Small interface used by the page controllers and replaced only by the test harness.
window.SummaAuth=Object.freeze({
  ready,get state(){return getSession();},
  login,googleLogin,resetPassword,register,logout,selectRole,listUsers,updateUser
});
