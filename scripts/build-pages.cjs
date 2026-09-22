// Copy only public runtime assets into an existing release checkout's /play/ directory.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const target=path.resolve(root,process.argv[2]||'tmp/pages-preview/play');
if(!target.startsWith(root+path.sep)||path.basename(target)!=='play')throw Error('Output must be a play directory inside this project');
const files=['index.html','learning.css','life-play.css','play-hub.css','math-play.css','speech-catalog.js','speech-player.js','practice.js','learning.js','logic-play.js','enrichment.js','logic-hub.js','life-play.js','play-hub.js'];
fs.mkdirSync(target,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(target,file));
fs.cpSync(path.join(root,'audio'),path.join(target,'audio'),{recursive:true});
console.log('Static mobile site: '+target);
