export const coded=code=>Object.assign(new Error(code),{code});

export function timeout(promise,ms=15000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(coded('summa/timeout')),ms);})
  ]).finally(()=>clearTimeout(timer));
}
