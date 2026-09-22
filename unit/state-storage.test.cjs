const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createApp}=require('./harness.cjs');

function readerFor(w){let reader;w.FileReader=class{constructor(){reader=this;}readAsText(file){this.file=file;}};return()=>reader;}
function answerLevel(w,correct=true){const d=w._levelData,q=d.questions[d.current],board=w.document.querySelector('#modal [id^="lv"]'),picked=correct?String(q.answer):String(q.options.find(o=>String(o)!==String(q.answer)));w.checkLevelAnswer(board.id,picked,String(q.answer));return board.id;}

test('normalization restores independent defaults, merges partial backups and deduplicates collections',t=>{
  const {w,json}=createApp(t),input={stars:12,letters:{matched:['A','A','B']},stories:{read:[1,1,2],readDates:['2026-9-20','2026-9-20']},english:{learned:{cat:true}},audio:{muted:false}};
  const result=w.normalizeState(input);
  assert.deepEqual(json(result.letters.matched),['A','B']);assert.deepEqual(json(result.stories.read),[1,2]);assert.deepEqual(json(result.stories.readDates),['2026-9-20']);assert.equal(result.english.learned.cat,true);assert.equal(result.audio.volume,.8);assert.equal(result.audio.muted,false);assert.deepEqual(json(result.levels.sessions),{});assert.deepEqual(json(result.practice.progress),{});
  result.poems.read.push(3);result.english.learned.dog=true;assert.deepEqual(json(w.DEFAULT_STATE.poems.read),[]);assert.equal(input.english.learned.dog,undefined);
});

test('normalization rejects malformed primitives, containers, maps and unsafe map keys',t=>{
  const {w}=createApp(t);
  for(const value of [null,[],42,'backup',{stars:'1'},{stars:-1},{stars:NaN},{stars:Infinity},{nightMode:1},{letters:null},{letters:{matched:{}}},{letters:{matched:[1]}},{poems:{read:['1']}},{poems:{read:[NaN]}},{badges:[]},{badges:{first_star:'yes'}},{badges:{first_star:-1}},{english:{learned:{cat:1}}},{english:{lastStudy:123}},{stories:{currentStory:'1'}},JSON.parse('{"badges":{"__proto__":1}}'),{badges:{constructor:1}},{badges:{prototype:1}}])assert.throws(()=>w.normalizeState(value));
  assert.equal(w.normalizeState({stories:{currentStory:1},english:{lastStudy:'2026-9-22'}}).stories.currentStory,1);
});

test('normalization validates difficulty, progress, and English review references',t=>{
  const {w}=createApp(t),bad=[{currentTab:'missing'},{logic:{level:3}},{logic:{level:.5}},{audio:{volume:1.1}},{logic:{patternLevel:3}},{logic:{sortLevel:2}},{logic:{memoryLevel:3}},{logic:{memoryLevel:.5}},{numbers:{difficulty:2}},{stories:{readingLevel:2}},{practice:{progress:{math_make:11}}},{practice:{progress:{math_make:.5}}},{english:{lessons:{0:5}}},{english:{lessons:{0:.5}}},{stories:{readingSteps:{'1:0':3}}},{stories:{training:{1:3}}},{english:{lessons:{6:1}}},{english:{review:{'length:1':1}}},{english:{review:{'01:1':1}}},{english:{review:{'0:9':1}}},{english:{review:{'0:1':2}}}];
  bad.forEach(value=>assert.throws(()=>w.normalizeState(value)));
  const good=w.normalizeState({logic:{level:2,patternLevel:2,sortLevel:1,memoryLevel:2},numbers:{difficulty:1},stories:{readingLevel:1},practice:{progress:{math_make:10}},english:{lessons:{0:4},review:{'0:0':1,'5:8':1}}});assert.equal(good.practice.progress.math_make,10);
});

test('normalization repairs absent story references and clamps saved page numbers',t=>{
  const {w}=createApp(t);let s=w.normalizeState({stories:{currentStory:999,currentPage:300}}).stories;assert.equal(s.currentStory,null);assert.equal(s.currentPage,0);
  s=w.normalizeState({stories:{currentStory:1,currentPage:100}}).stories;assert.equal(s.currentPage,w.STORIES[0].p.length-1);
  assert.equal(w.normalizeState({stories:{currentStory:1,currentPage:1.9}}).stories.currentPage,1);
});

test('adventure session normalization preserves valid question data without sharing it',t=>{
  const {w,json}=createApp(t);w.startLevel(1);const input=json(w.state.levels.sessions),copy=w.normalizeLevelSessions(input);assert.deepEqual(json(copy),input);copy[1].questions[0].q='changed';assert.notEqual(input[1].questions[0].q,'changed');
  const q=input[1].questions[0];q.emojis=['a','b','c'];assert.deepEqual(json(w.normalizeLevelSessions(input)[1].questions[0].emojis),['a','b','c']);
});

test('adventure session normalization rejects inconsistent saved rounds and invalid questions',t=>{
  const {w,json}=createApp(t);w.startLevel(1);const base=json(w.state.levels.sessions);
  const mutations=[d=>d.n=2,d=>d.questions=[],d=>d.current=-1,d=>d.current=11,d=>d.current=.5,d=>d.correct=-1,d=>d.correct=1,d=>d.correct=.5,d=>d.settled=1,d=>d.settled=true,d=>d.questions[0]=null,d=>d.questions[0].type='unknown',d=>d.questions[0].q=1,d=>d.questions[0].q='x'.repeat(1001),d=>d.questions[0].answer=1,d=>d.questions[0].options=null,d=>d.questions[0].options=['a'],d=>d.questions[0].options=['a','b','c','d','e'],d=>d.questions[0].options=[true,'b'],d=>d.questions[0].options=[Infinity,'b'],d=>d.questions[0].options=['wrong','bad'],d=>d.questions[0].options=[d.questions[0].answer,d.questions[0].answer],d=>d.questions[0].visual=1,d=>d.questions[0].visual='x'.repeat(1001),d=>d.questions[0].emojis='bad',d=>d.questions[0].emojis=[1]];
  mutations.forEach(mutate=>{const input=json(base);mutate(input[1]);assert.throws(()=>w.normalizeLevelSessions(input));});
  for(const input of [{'01':base[1]},{11:base[1]},{1:null},{1:[]}])assert.throws(()=>w.normalizeLevelSessions(input));
  const completed=json(base);completed[1].current=10;completed[1].correct=8;completed[1].settled=true;assert.equal(w.normalizeLevelSessions(completed)[1].settled,true);
});

test('saveState persists data and badges, and storage quota failure leaves memory usable',t=>{
  const {w,document}=createApp(t);w.state.stars=7;w.state.badges={};w.saveState();const stored=JSON.parse(w.localStorage.getItem(w.STORAGE_KEY));assert.equal(stored.stars,7);assert.ok(stored.badges.first_star);
  t.mock.method(Object.getPrototypeOf(w.localStorage),'setItem',()=>{throw Error('quota');});w.state.stars=8;assert.doesNotThrow(()=>w.saveState());assert.equal(w.state.stars,8);assert.match(document.getElementById('toast').textContent,/存储空间不足/);
});

test('loadState tolerates missing, corrupt, inaccessible data and restores valid progress',t=>{
  const {w}=createApp(t);const original=w.state;w.loadState();assert.equal(w.state,original);
  for(const value of ['{broken','null','{"stars":"bad"}']){w.localStorage.setItem(w.STORAGE_KEY,value);w.loadState();assert.equal(w.state,original);}
  w.localStorage.setItem(w.STORAGE_KEY,JSON.stringify({stars:9,firstVisit:true}));w.loadState();assert.equal(w.state.stars,9);assert.equal(w.state.firstVisit,false);
  const valid=w.state;t.mock.method(Object.getPrototypeOf(w.localStorage),'getItem',()=>{throw Error('denied');});assert.doesNotThrow(()=>w.loadState());assert.equal(w.state,valid);
});

test('backup import ignores no file and restores navigation, settings and file-input reuse',t=>{
  const {w,document}=createApp(t),getReader=readerFor(w);w.importData({target:{files:[],value:''}});assert.equal(getReader(),undefined);
  w.state.stars=17;w._englishMode='theme';w._englishCurrentTheme='animals';const file={name:'backup.json'},input={files:[file],value:'backup.json'};w.importData({target:input});assert.equal(getReader().file,file);
  getReader().onload({target:{result:JSON.stringify({stars:9,currentTab:'stories',nightMode:true,audio:{volume:.25,muted:false}})}});
  assert.equal(w.state.stars,9);assert.equal(w.state.firstVisit,false);assert.equal(w._englishMode,'themes');assert.equal(w._englishCurrentTheme,null);assert.equal(input.value,'');assert.equal(document.getElementById('starCount').textContent,'9');assert.match(document.querySelector('#sidebar .active').textContent,/故事屋/);assert.equal(document.getElementById('volRange').value,'25');assert.ok(document.body.classList.contains('night'));assert.equal(JSON.parse(w.localStorage.getItem(w.STORAGE_KEY)).stars,9);
});

test('bad imports and failed reads preserve existing data and clear the input',t=>{
  const {w,document}=createApp(t),getReader=readerFor(w);w.state.stars=17;w.saveState();const original=w.state,stored=w.localStorage.getItem(w.STORAGE_KEY);
  for(const value of ['bad','null','{}','{"stars":"1"}','{"stars":1,"letters":null}']){const input={files:[{}],value:'selected'};w.importData({target:input});getReader().onload({target:{result:value}});assert.equal(w.state,original);assert.equal(w.localStorage.getItem(w.STORAGE_KEY),stored);assert.equal(input.value,'');assert.match(document.getElementById('toast').textContent,/原有数据未更改/);}
  const input={files:[{}],value:'selected'};w.importData({target:input});getReader().onerror();assert.equal(input.value,'');assert.match(document.getElementById('toast').textContent,/文件读取失败/);assert.equal(w.state,original);
});

test('import storage failure does not replace the current state',t=>{
  const {w,document}=createApp(t),getReader=readerFor(w);w.state.stars=17;const original=w.state;t.mock.method(Object.getPrototypeOf(w.localStorage),'setItem',()=>{throw Error('quota');});const input={files:[{}],value:'selected'};w.importData({target:input});getReader().onload({target:{result:'{"stars":3}'}});assert.equal(w.state,original);assert.equal(w.state.stars,17);assert.equal(input.value,'');assert.match(document.getElementById('toast').textContent,/原有数据未更改/);
});

test('export serializes progress, downloads a dated JSON and releases its object URL',t=>{
  const {w,document}=createApp(t);w.state.stars=23;let blob,anchor,revoked;w.Blob=function(parts,options){this.parts=parts;this.type=options.type;};w.URL.createObjectURL=value=>(blob=value,'blob:export-test');w.URL.revokeObjectURL=url=>revoked=url;t.mock.method(w.HTMLAnchorElement.prototype,'click',function(){anchor=this;});w.exportData();assert.equal(JSON.parse(blob.parts[0]).stars,23);assert.equal(blob.type,'application/json');assert.equal(anchor.download,'baole_learning_'+w.todayStr()+'.json');assert.equal(anchor.href,'blob:export-test');assert.equal(revoked,'blob:export-test');assert.match(document.getElementById('toast').textContent,/已导出/);
});

test('clear confirmation can cancel and confirmed clearing preserves only current navigation',t=>{
  const {w,document,json,advance}=createApp(t);w.state.stars=23;w.state.practice.progress.math_make=8;w.state.currentTab='english';w._englishMode='theme';w._englishCurrentTheme='animals';w.clearData();assert.match(document.getElementById('modal').textContent,/确认清空所有数据/);[...document.querySelectorAll('#modal button')].find(b=>b.textContent==='取消').click();assert.equal(w.state.stars,23);
  let fired=false;w.modalTimeout(()=>fired=true,100);w.doClearData();advance(100);assert.equal(fired,false);assert.equal(w.state.stars,0);assert.equal(w.state.currentTab,'english');assert.equal(w.state.firstVisit,false);assert.equal(w._englishMode,'themes');assert.equal(w._englishCurrentTheme,null);assert.deepEqual(json(w.state.practice.progress),{});assert.deepEqual(json(w.state.levels.sessions),{});assert.deepEqual(json(w.state.audio),{volume:.8,muted:false});assert.equal(JSON.parse(w.localStorage.getItem(w.STORAGE_KEY)).currentTab,'english');
});

test('audio settings clamp input, synchronize media controls and support missing controls',t=>{
  const {w,document}=createApp(t);w.state.audio.muted=false;w._audioEl=new w.Audio();
  for(const [input,expected] of [[-10,0],[0,0],[25,.25],[100,1],[150,1],['not a number',.8]]){w.setVolume(input);assert.equal(w.state.audio.volume,expected);assert.equal(w._audioEl.volume,expected);assert.equal(document.getElementById('volRange').value,String(expected*100));}
  w.toggleMute();assert.equal(w.state.audio.muted,true);assert.equal(w._audioEl.muted,true);assert.equal(w._audioEl.paused,true);assert.equal(document.getElementById('muteBtn').textContent,'🔇');w.toggleMute();assert.equal(w.state.audio.muted,false);assert.equal(document.getElementById('muteBtn').textContent,'🔊');
  document.getElementById('muteBtn').remove();document.getElementById('volRange').remove();w._audioEl=null;assert.doesNotThrow(()=>w.syncAudioUI());
});

test('difficulty setters accept valid values, persist settings and ignore invalid selections',t=>{
  const {w,json}=createApp(t);w.setLogicLevel(2);w.setMathDifficulty(1);w.setReadingLevel(1);w.setLogicActivityLevel('pattern',1);w.setLogicActivityLevel('sort',1);w.setLogicActivityLevel('memory',2);const before=json(w.state);
  w.setLogicLevel(9);w.setMathDifficulty(9);w.setReadingLevel(9);w.setLogicActivityLevel('unknown',1);w.setLogicActivityLevel('sort',2);w.setLogicActivityLevel('pattern',.5);w.setLogicActivityLevel('memory',-1);assert.deepEqual(json(w.state),before);assert.equal(JSON.parse(w.localStorage.getItem(w.STORAGE_KEY)).logic.memoryLevel,2);
  w.toggleNightMode();assert.equal(w.state.nightMode,true);assert.ok(w.document.body.classList.contains('night'));w.toggleNightMode();assert.equal(w.state.nightMode,false);
});

test('navigation and initialization keep backup controls unique and show welcome only on first use',t=>{
  const {w,document,advance}=createApp(t,{init:false});w.state.firstVisit=true;w.init();assert.equal(w.state.firstVisit,false);assert.equal(document.querySelectorAll('#backupBar').length,1);advance(499);assert.equal(document.getElementById('modal-overlay').classList.contains('show'),false);advance(1);assert.match(document.getElementById('modal').textContent,/欢迎来到/);w.closeModal();w.init();advance(600);assert.equal(document.getElementById('modal-overlay').classList.contains('show'),false);
  for(const tab of w.TABS){w.switchTab(tab.id);assert.equal(w.state.currentTab,tab.id);assert.equal(document.querySelectorAll('#backupBar').length,1);assert.equal(document.querySelectorAll('#sidebar .active').length,1);}
  document.getElementById('backupBar').remove();w.addBackupBar();w.addBackupBar();assert.equal(document.querySelectorAll('#backupBar').length,1);document.getElementById('main').remove();assert.doesNotThrow(()=>w.addBackupBar());
});

test('story date utilities handle empty history, consecutive dates and gaps',t=>{
  const {w}=createApp(t);w.state.stories.readDates=[];assert.equal(w.getStoryStreak(),0);w.state.stories.readDates=['2026-9-20','2026-9-21','2026-9-22'];assert.equal(w.getStoryStreak(),3);w.state.stories.readDates=['2026-9-18','2026-9-21','2026-9-22'];assert.equal(w.getStoryStreak(),2);w.state.stories.readDates=undefined;assert.equal(w.getStoryStreak(),0);assert.match(w.todayStr(),/^\d{4}-\d{1,2}-\d{1,2}$/);assert.equal(w.formatDate('2026-09-22'),'9月22日');
});

test('level entry validates IDs, resumes existing runs and only restarts explicitly',t=>{
  const {w,json}=createApp(t);for(const n of [-1,0,11,1.5,'1'])w.startLevel(n);assert.deepEqual(json(w.state.levels.sessions),{});w.startLevel(1);const d=w._levelData;d.current=3;d.correct=2;w.closeModal();w.startLevel(1);assert.equal(w._levelData,d);assert.match(w.document.getElementById('modal').textContent,/4\/10题/);w.startLevel(1,true);assert.notEqual(w._levelData,d);assert.equal(w._levelData.current,0);assert.equal(w.state.levels.currentLevel,1);
});

for(const correct of [0,5,6,8,10])test('adventure '+correct+'/10 result settles once and displays the correct outcome',t=>{
  const {w,document,json}=createApp(t),pending=[];w.offerAutoNext=fn=>pending.push(fn);w.startLevel(1);for(let i=0;i<10;i++){const id=answerLevel(w,i<correct),after=w._levelData.current;w.checkLevelAnswer(id,'duplicate','duplicate');assert.equal(w._levelData.current,after);pending.shift()();}
  assert.equal(w._levelData.current,10);assert.equal(w._levelData.correct,correct);assert.equal(w._levelData.settled,true);assert.equal(w.state.stars,correct>=6?correct*3:0);assert.deepEqual(json(w.state.levels.completed),correct>=6?[1]:[]);assert.match(document.getElementById('modal').textContent,new RegExp(correct+'/10'));
  if(correct>=6)assert.match(document.getElementById('modal').textContent,correct===10?/🥇/:correct>=8?/🥈/:/🥉/);else assert.match(document.getElementById('modal').textContent,/答对6题才能通关/);
  const stars=w.state.stars;w.settleLevelRun(w._levelData);w.startLevel(1);assert.equal(w.state.stars,stars);const data=JSON.parse(w.localStorage.getItem(w.STORAGE_KEY));assert.equal(data.levels.sessions[1].settled,true);
});

test('level guards reject stale sessions, absent boards, locked questions and stale advance callbacks',t=>{
  const {w,document}=createApp(t),pending=[];w.offerAutoNext=fn=>pending.push(fn);w._levelData=null;assert.doesNotThrow(()=>w._showLevelQuestionBase());assert.doesNotThrow(()=>w.showLevelResult(null));assert.doesNotThrow(()=>w.checkLevelAnswer('missing','a','a'));
  w.startLevel(1);const d=w._levelData,board=document.querySelector('#modal [id^="lv"]');w.settleLevelRun(d);assert.equal(d.settled,false);w.showLevelResult(d);assert.equal(w._levelData.current,0);w.checkLevelAnswer('missing','a','a');assert.equal(d.current,0);board.dataset.question='9';w.checkLevelAnswer(board.id,'a','a');assert.equal(d.current,0);board.dataset.question='0';w.lockAnswer(board.id);w.checkLevelAnswer(board.id,'a','a');assert.equal(d.current,0);w.unlockAnswer(board.id);answerLevel(w);assert.equal(d.current,1);
  w.startLevel(1,true);const next=w._levelData;pending.shift()();assert.equal(w._levelData,next);assert.equal(next.current,0);w._levelData=d;assert.doesNotThrow(()=>w._showLevelQuestionBase());assert.doesNotThrow(()=>w.showLevelResult(d));w.checkLevelAnswer(board.id,'a','a');assert.equal(d.current,1);
});

test('level data is saved before advancing, reloads the same questions and escapes imported text',t=>{
  const {w,document,json}=createApp(t);w.offerAutoNext=()=>{};w.startLevel(1);const original=json(w._levelData.questions);answerLevel(w);w.closeModal();w.loadState();w.startLevel(1);assert.equal(w._levelData.current,1);assert.deepEqual(json(w._levelData.questions),original);
  const evil='\"\'><img src=x onerror=alert(1)>';w._levelData.questions[1]={type:'letter',q:evil,visual:evil,answer:evil,options:[evil,'safe']};w.showLevelQuestion();assert.equal(document.querySelector('#modal img'),null);assert.ok(document.getElementById('modal').textContent.includes(evil));document.querySelector('#modal .option-btn').click();assert.equal(w._levelData.correct,2);
});

test('level map displays continuation, available and completed states including total mastery',t=>{
  const {w}=createApp(t);w.startLevel(1);w._levelData.current=2;assert.match(w.renderLevels(),/继续 2\/10/);assert.match(w.renderLevels(),/locked/);w.state.levels.completed=w.Array.from({length:10},(_,i)=>i+1);w._levelData.current=10;w._levelData.settled=true;const html=w.renderLevels();assert.match(html,/小学霸/);assert.match(html,/100%/);assert.match(html,/completed/);
});
