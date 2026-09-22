// Deterministic, offline inventory. Reuse existing recordings; synthesize new text only.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const element={innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true;}},querySelectorAll(){return [];}};
const sandbox={console,Math:Object.create(Math),setTimeout(){return 1;},clearTimeout(){},Date,window:null,navigator:{userAgent:''},document:{addEventListener(){},getElementById(){return element;},querySelector(){return element;},querySelectorAll(){return [];},createElement(){return element;}},localStorage:{setItem(){},getItem(){return null;}},SpeechSynthesisUtterance:function(){}};
sandbox.window=sandbox;vm.createContext(sandbox);
const inline=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('var POEMS='));
vm.runInContext(inline,sandbox);for(const f of ['practice.js','learning.js','logic-play.js','enrichment.js','life-play.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),sandbox);
const catalog={},pending=new Map();
function key(text,mode){return (mode==='en'?'en':'zh')+'|'+text.trim().replace(/\s+/g,' ');}
function add(text,mode='child',reuse){if(!text)return;if(reuse&&!fs.existsSync(path.join(root,reuse)))reuse=null;const k=key(text,mode);if(catalog[k])return;const url=reuse||'audio/prompts/'+crypto.createHash('sha256').update(k).digest('hex').slice(0,20)+'.wav',mp3=url.replace(/\.wav$/,'.mp3');catalog[k]=!reuse&&fs.existsSync(path.join(root,mp3))?mp3:url;if(!reuse)pending.set(k,{text,lang:mode==='en'?'en':'zh',file:url});}
for(const text of sandbox.GROWTH_PROMPTS)add(text);
for(const theme of sandbox.ENGLISH.themes)for(let i=0;i<theme.words.length;i++)add(theme.words[i].w,'en','audio/en_'+theme.id+'_'+i+'.mp3');
for(const l of sandbox.LETTERS_DATA)add(l.upper,'en','audio/letter_'+l.upper+'.mp3');
for(let i=0;i<sandbox.SENTENCES.length;i++)add(sandbox.SENTENCES[i].en,'en','audio/sen_'+i+'.mp3');
// Legacy story/poem files have no text manifest and may refer to older content.
// Regenerate from the exact displayed text rather than trusting numeric filenames.
for(const s of sandbox.STORIES)for(let i=0;i<s.p.length;i++)add(s.p[i],'story');
for(const p of sandbox.POEMS){add(p.t+'，'+p.d+'，'+p.a+'。'+p.l.join('，'),'recite');for(const line of p.l){add(line);add(line.slice(-1));}}
for(const text of ['山','水','花','月','人','天','听一听，这句最后一个字是什么？'])add(text);
for(const pairs of Object.values(sandbox.POEM_PICTURES))for(const row of pairs)for(const i of [0,2,4,6])add(row[i]);
for(const p of sandbox.POEMS)for(const row of sandbox.POEM_PICTURES[p.id])add(p.t+'。'+row[0]);
for(const l of sandbox.LETTERS_DATA)add('大写 '+l.upper+' 的小写是？');
add('数一数有几个？');
for(const [text,file] of Object.entries(sandbox.MATH_DEMO_AUDIO))add(text,'child',file);
sandbox.learningSpeak=(text,en)=>add(text,en?'en':'child');sandbox.learningFeedback=()=>{};sandbox.showModal=()=>{};sandbox.saveState=()=>{};sandbox.awardLogicPlay=()=>{};sandbox.practiceAttach=()=>{};sandbox.practiceRecord=()=>{};sandbox.armNextButton=()=>{};
for(const kind of ['combine','make','compare','pattern'])for(const level of [0,1])for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<10;c++){
  for(let index=0;index<(kind==='make'&&level===0?3:1);index++){
    let i=0;const vals=[(a+.1)/10,(b+.1)/10,(c+.1)/10];sandbox.Math.random=()=>vals[i++%3];const q=sandbox.makeChallengeQuestion(kind,level,index);for(const t of [q.prompt,q.hint,q.explain])add(t);
  }
}
for(const dimension of ['color','shape','size'])for(let level=0;level<3;level++)for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++)for(let d=0;d<4;d++){
  let i=0;const vals=[(a+.1)/4,(b+.1)/4,(c+.1)/4,(d+.1)/4];sandbox.Math.random=()=>vals[i++%4];sandbox.state.logic.level=level;sandbox.startLogicPattern(dimension);sandbox.hintLogicPattern();sandbox.answerLogicPattern(sandbox._logicPattern.answer);
}
for(const d of Object.values(sandbox.LOGIC_SORTS)){add(d.title+'。'+d.hint);add(d.hint);add('排好啦！'+d.result);}
for(const l of sandbox.ENGLISH_LESSONS)add(l.phrase,'en');
for(const phrases of sandbox.ENGLISH_SENTENCE_SETS)for(const phrase of phrases)add(phrase,'en');
for(const theme of sandbox.ENGLISH.themes)for(const word of theme.words)add(sandbox.lessonPhrase(theme.id,word).en,'en');
for(const s of sandbox.STORIES){const g=sandbox.readingGuide(s);add(g.q);add('找对啦！'+g.options[0].cn);for(const e of g.events)add(e.cn);for(const o of g.options)add(o.cn);}
for(const f of ['learning.js','logic-play.js'])for(const m of fs.readFileSync(path.join(root,f),'utf8').matchAll(/learningSpeak\('([^']+)'\)/g))add(m[1]);
add('先发生什么？再发生什么？请按顺序点图片。');add('把故事讲给家长听吧。说一句自己的话就很好。');
for(const text of ['故事一开始发生了什么？','故事最后发生了什么？','哪件事在这个故事里发生过？','故事里有谁？告诉家长一个角色。','你最喜欢故事里的谁？说一句自己的想法。'])add(text);
for(const t of ['太棒了','真聪明','好厉害','做得好','你真棒','继续加油','你有','颗星星','零','一','二','三','四','五','六','七','八','九','十','百','千','万','亿','点'])add(t);
for(const t of ['太棒了！','你真厉害！','答对啦，好聪明！','真棒呀！','干得漂亮！'])add(t);
fs.mkdirSync(path.join(root,'audio','prompts'),{recursive:true});
fs.writeFileSync(path.join(root,'speech-catalog.js'),'// Generated by scripts/build-speech-catalog.cjs. Bundled recordings work without Web Speech.\nvar RECORDED_SPEECH='+JSON.stringify(catalog,null,2)+';\n');
fs.writeFileSync(path.join(root,'audio','prompts','manifest.json'),JSON.stringify([...pending.values()],null,2));
console.log(JSON.stringify({catalog:Object.keys(catalog).length,newRecordings:pending.size}));
