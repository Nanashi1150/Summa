const fs=require('node:fs');
const path=require('node:path');
const projectRoot=path.resolve(__dirname,'..');

function buildSite({sourceRoot=path.join(projectRoot,'src'),outputRoot=path.join(projectRoot,'public')}={}) {
  const source=path.resolve(sourceRoot),output=path.resolve(outputRoot);
  const relative=path.relative(projectRoot,output);
  if(!relative || relative.startsWith('..') || path.isAbsolute(relative))throw new Error('Build output must be inside the project.');
  function copyDirectory(directory,target,extension) {
    fs.mkdirSync(target,{recursive:true});
    for(const item of fs.readdirSync(directory,{withFileTypes:true})) {
      if(item.isSymbolicLink())throw new Error('Source assets must not be symlinks.');
      const input=path.join(directory,item.name),destination=path.join(target,item.name);
      if(item.isDirectory())copyDirectory(input,destination,extension);
      else if(!extension || item.name.endsWith(extension))fs.copyFileSync(input,destination);
    }
  }
  function includeComponents(html,stack=[]) {
    return html.replace(/<!--\s*component:([a-z0-9-]+)\s*-->/g,(_,name)=>{
      if(stack.includes(name))throw new Error('Circular component include: '+name);
      return includeComponents(fs.readFileSync(path.join(source,'components',name+'.html'),'utf8'),[...stack,name]);
    });
  }
  const pages=fs.readdirSync(path.join(source,'pages')).filter(name=>name.endsWith('.html')).sort();
  if(!pages.includes('index.html'))throw new Error('Missing src/pages/index.html');
  fs.mkdirSync(output,{recursive:true});
  for(const name of pages) {
    const html=fs.readFileSync(path.join(source,'pages',name),'utf8');
    fs.writeFileSync(path.join(output,name),includeComponents(html));
  }
  for(const [directory,target,extension] of [
    ['js','js','.js'],['components','components','.js'],['styles','styles','.css'],['media','media',null]
  ])copyDirectory(path.join(source,directory),path.join(output,'assets',target),extension);
  fs.mkdirSync(path.join(output,'assets','services'),{recursive:true});
  fs.copyFileSync(path.join(source,'services','auth-policy.js'),path.join(output,'assets','services','auth-policy.js'));
  return pages;
}
if(require.main===module)console.log('Built '+buildSite().length+' editable source pages.');
module.exports={buildSite};
