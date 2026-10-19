const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','public');
let checked=0;
function verify(relative,base) {
  if(!relative || relative.startsWith('#') || relative.includes('{{') || /^(https?:|data:|mailto:)/.test(relative))return;
  const target=path.resolve(base,relative.split('#')[0]);
  assert.ok(target.startsWith(root+path.sep),'Resource must stay in public/');
  assert.ok(fs.existsSync(target),'Missing resource: '+target);checked++;
}
for(const name of fs.readdirSync(root).filter(name=>name.endsWith('.html'))) {
  const html=fs.readFileSync(path.join(root,name),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))verify(match[1],root);
}
for(const name of fs.readdirSync(path.join(root,'assets/styles')).filter(name=>name.endsWith('.css'))) {
  const css=fs.readFileSync(path.join(root,'assets/styles',name),'utf8');
  for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))verify(match[1],path.join(root,'assets/styles'));
}
assert.equal(fs.readdirSync(root).filter(name=>name.endsWith('.html')).length,16);
assert.deepEqual(fs.readdirSync(root).filter(name=>!name.endsWith('.html')),['assets']);
console.log('PASS: 16 public pages and '+checked+' local resource references.');
