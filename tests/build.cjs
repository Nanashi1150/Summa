const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {buildSite}=require('../scripts/build.cjs');
const root=path.resolve(__dirname,'..');
const workspace=path.join(root,'.local','build-test-'+process.pid);
const source=path.join(workspace,'src'),output=path.join(workspace,'public');
fs.mkdirSync(workspace,{recursive:true});
fs.cpSync(path.join(root,'src'),source,{recursive:true});

// No design/original.html or generated assets are present in this fixture.
fs.appendFileSync(path.join(source,'pages','login.html'),'\n<!-- independent-page-test -->\n');
fs.appendFileSync(path.join(source,'js','login.js'),'\n/* independent-controller-test */\n');
fs.appendFileSync(path.join(source,'styles','login.css'),'\n/* independent-stylesheet-test */\n');
assert.equal(buildSite({sourceRoot:source,outputRoot:output}).length,18);
assert.match(fs.readFileSync(path.join(output,'login.html'),'utf8'),/independent-page-test/);
assert.match(fs.readFileSync(path.join(output,'assets/js/login.js'),'utf8'),/independent-controller-test/);
assert.match(fs.readFileSync(path.join(output,'assets/styles/login.css'),'utf8'),/independent-stylesheet-test/);
for(const name of ['projects','admin-projects','project-tree']) {
  const html=fs.readFileSync(path.join(output,name+'.html'),'utf8');
  assert.ok(!html.includes('<!-- component:project-tree -->'));
  assert.ok(html.includes('pt-term'),name+' includes shared project tree');
}
assert.ok(!fs.existsSync(path.join(output,'assets/services/firebase.js')),'Unbundled SDK entry is not served');
assert.ok(!fs.existsSync(path.join(output,'assets/components/project-tree.html')),'Shared fragments are compiled into pages');
assert.ok(!fs.existsSync(path.join(output,'design')),'Archived designs are not served');
console.log('PASS: editable HTML/CSS/controllers build without the archived design; shared includes and service output are correct.');
