const assert=require('node:assert/strict');
const policy=require('../src/services/auth-policy.js');
const admin={ready:true,user:{uid:'admin'},profile:{role:'admin',status:'active'}};
for(const [role,page] of [['admin','dashboard'],['advisor','advisor-dashboard'],['student','student']]){
  const session={...admin,viewRole:role};
  assert.equal(policy.destination(session),page+'.html');
  assert.equal(policy.canAccess(page,session),true);
  assert.equal(policy.effectiveRole(session),role);
}
assert.equal(policy.canAccess('users',{...admin,viewRole:'student'}),false);
for(const role of ['student','advisor']){
  const forged={...admin,profile:{role,status:'active'},viewRole:'admin'};
  assert.equal(policy.effectiveRole(forged),role);
  assert.equal(policy.canAccess('users',forged),false);
}
assert.equal(policy.canAccess('review',{...admin,profile:{role:'admin',status:'suspended'},viewRole:'advisor'}),false);
assert.equal(policy.canAccess('users',{ready:true,user:null,viewRole:'admin'}),false);
console.log('Role policy checks passed.');
