const path=require('node:path');
const root=path.resolve(__dirname,'..');
require('esbuild').buildSync({
  absWorkingDir:root,
  entryPoints:[path.join(root,'src','services','index.js')],
  outfile:path.join(root,'public','assets','services','firebase.bundle.js'),
  tsconfigRaw:{compilerOptions:{}},
  bundle:true, minify:true, platform:'browser', target:['es2020'],
  legalComments:'eof'
});
console.log('Built Firebase browser SDK bundle.');
