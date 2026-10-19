import {collection,doc,getDocs,getDoc,addDoc,updateDoc,query,where,orderBy,limit,startAfter,serverTimestamp} from 'firebase/firestore';
import {auth,db} from './firebase.js';
import {ready,readProfile,validProfile} from './auth.js';
import {coded,timeout} from './helpers.js';

// This service always uses real Auth UIDs. Preview identities never enter this module.
async function session(){
  await ready;
  const user=auth.currentUser;
  if(!user)throw coded('summa/not-authorized');
  const profile=validProfile(await readProfile(user));
  if(auth.currentUser?.uid!==user.uid)throw coded('summa/not-authorized');
  return {uid:user.uid,role:profile.role};
}
function identifier(value){
  if(typeof value!=='string' || !value || value.includes('/') || value==='.' || value==='..')throw coded('summa/invalid-data');
  return value;
}
function child(projectId,name){return collection(db,'projects',identifier(projectId),name);}
function pageSize(value=50){if(!Number.isInteger(value) || value<1 || value>100)throw coded('summa/invalid-data');return value;}
function fields(values,allowed){
  if(!values || Object.keys(values).some(key=>!allowed.includes(key)))throw coded('summa/invalid-data');
  return values;
}
async function page(base,constraints,size,after){
  const filters=[...constraints];
  if(after)filters.push(startAfter(after));
  filters.push(limit(pageSize(size)));
  const snapshot=await timeout(getDocs(query(base,...filters)));
  return {items:snapshot.docs.map(item=>({...item.data(),id:item.id})),nextCursor:snapshot.docs.length===pageSize(size)?snapshot.docs.at(-1):null};
}
async function create(base,values){const now=serverTimestamp();const item=await timeout(addDoc(base,{...values,createdAt:now,updatedAt:now}));return item.id;}
async function update(reference,values){await timeout(updateDoc(reference,{...values,updatedAt:serverTimestamp()}));}

export async function listProjects({term,after,pageSize:size=50}={}){
  const actor=await session(),filters=[];
  if(actor.role==='advisor')filters.push(where('advisorId','==',actor.uid));
  else if(actor.role==='student')filters.push(where('studentIds','array-contains',actor.uid));
  if(term)filters.push(where('term','==',term));
  filters.push(orderBy('updatedAt','desc'));
  return page(collection(db,'projects'),filters,size,after);
}
export async function createProject(values){
  const actor=await session();if(actor.role!=='admin')throw coded('summa/not-authorized');
  fields(values,['code','title','term','faculty','branch','advisorId','studentIds','status']);
  if(!Array.isArray(values.studentIds) || !values.studentIds.length || values.studentIds.length>10 || new Set(values.studentIds).size!==values.studentIds.length)throw coded('summa/invalid-data');
  const advisorId=identifier(values.advisorId);
  const advisor=await timeout(getDoc(doc(db,'users',advisorId)));
  if(advisor.data()?.role!=='advisor' || advisor.data()?.status!=='active')throw coded('summa/invalid-data');
  for(const uid of values.studentIds){
    const student=await timeout(getDoc(doc(db,'users',identifier(uid))));
    if(student.data()?.role!=='student' || student.data()?.status!=='active')throw coded('summa/invalid-data');
  }
  return create(collection(db,'projects'),{...values,status:values.status || 'in_progress'});
}
export async function updateProject(id,values){await session();fields(values,['title','status','advisorId','studentIds','term','faculty','branch','code']);return update(doc(db,'projects',identifier(id)),values);}
export async function listReviews(projectId,{after,pageSize:size=50}={}){
  const actor=await session(),filters=[];
  if(actor.role==='student')filters.push(where('status','==','approved'));
  filters.push(orderBy('createdAt','desc'));
  return page(child(projectId,'reviews'),filters,size,after);
}
export async function createReview(projectId,summary){await session();return create(child(projectId,'reviews'),{summary,status:'pending'});}
export async function updateReview(projectId,id,values){await session();fields(values,['summary','status']);return update(doc(child(projectId,'reviews'),identifier(id)),values);}
export async function listTasks(projectId,{after,pageSize:size=50}={}){
  const actor=await session(),filters=[];
  if(actor.role==='student')filters.push(where('assigneeId','==',actor.uid));
  filters.push(orderBy('dueAt','asc'));
  return page(child(projectId,'tasks'),filters,size,after);
}
export async function createTask(projectId,values){await session();fields(values,['title','assigneeId','reviewId','dueAt']);return create(child(projectId,'tasks'),{...values,dueAt:values.dueAt ?? null,status:'todo'});}
export async function updateTaskStatus(projectId,id,status){await session();return update(doc(child(projectId,'tasks'),identifier(id)),{status});}
export async function listAppointments(projectId,{after,pageSize:size=50}={}){
  const actor=await session(),filters=[];
  if(actor.role==='student')filters.push(where('studentId','==',actor.uid));
  filters.push(orderBy('startsAt','asc'));
  return page(child(projectId,'appointments'),filters,size,after);
}
export async function createAppointment(projectId,values){await session();fields(values,['title','studentId','startsAt','endsAt','location']);return create(child(projectId,'appointments'),{...values,response:'pending'});}
export async function respondAppointment(projectId,id,response){await session();return update(doc(child(projectId,'appointments'),identifier(id)),{response});}
