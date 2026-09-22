const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createApp}=require('./harness.cjs');
const KEY='logic_memory_pairs';
function board(document){return document.querySelector('[id^="sm"]:not([id$="_status"])');}
function pairs(document){return [...Map.groupBy([...document.querySelectorAll('[data-shape]')],b=>b.dataset.shape).values()];}
function match(pair){pair.forEach(b=>{b.click();b.click();});}

for(const [level,sizes]of [[0,[3,3,3,1]],[1,[4,4,2]],[2,[5,5]]])test('memory level '+level+' finishes exactly ten successful pairs, with one round reward',t=>{
 const {w,document,advance}=createApp(t);w.state.logic.level=level;w.startShapeMatch();let total=0;
 for(const size of sizes){
  assert.equal(document.querySelectorAll('[data-shape]').length,size*2);const current=board(document);
  for(const pair of pairs(document)){match(pair);total++;assert.equal(w.state.practice.progress[KEY],total);assert.match(document.querySelector('#practiceProgress').textContent,new RegExp('已完成 '+total+' / 10 对'));assert.equal(w.state.stars,total===10?3:0);w.flipCard(pair[0],current.id,size);assert.equal(w.state.practice.progress[KEY],total);}
  assert.equal(current.dataset.solved,'1');advance(2999);assert.equal(board(document),current);advance(1);
 }
 assert.equal(w.state.practice.rounds[KEY],1);assert.equal(w.state.logic.completed.length,1);assert.equal(w.state.logic.stars,3);assert.equal(w.state.stars,3);assert.match(document.querySelector('#modal').textContent,/10 \/ 10 对/);assert.equal(document.querySelectorAll('[data-shape]').length,0);
 w.restartPractice();assert.equal(w.state.practice.progress[KEY],0);assert.equal(w.state.stars,3);assert.equal(document.querySelectorAll('[data-shape]').length,(level+3)*2);
});

test('memory mismatch records nothing, locks temporary flips and preserves successful pair credit',t=>{
 const {w,document,advance}=createApp(t);w.startShapeMatch();const grouped=pairs(document),current=board(document);match(grouped[0]);assert.equal(w.state.practice.progress[KEY],1);
 grouped[1][0].click();grouped[2][0].click();assert.equal(current.dataset.busy,'1');w.flipCard(grouped[1][1],current.id,3);assert.equal(w.state.practice.progress[KEY],1);advance(800);assert.equal(grouped[1][0].textContent,'❓');assert.ok(grouped[0].every(b=>b.disabled));match(grouped[1]);assert.equal(w.state.practice.progress[KEY],2);assert.equal(w.state.stars,0);
});

test('memory pair progress survives pause and reload while legacy board history remains separate',t=>{
 const app=createApp(t),{w,document,json}=app;w.state.practice.progress.logic_memory=7;w.state.practice.rounds.logic_memory=2;w.startShapeMatch();match(pairs(document)[0]);match(pairs(document)[1]);assert.equal(w.state.practice.progress[KEY],2);const old=board(document),stale=pairs(document).at(-1);w.closeModal();stale.forEach(b=>w.flipCard(b,old.id,3));assert.equal(w.state.practice.progress[KEY],2);w.startShapeMatch();assert.equal(w.state.practice.progress[KEY],2);assert.equal(document.querySelectorAll('[data-shape]').length,6);
 const loaded=createApp(t);loaded.w.localStorage.setItem(loaded.w.STORAGE_KEY,JSON.stringify(json(w.state)));loaded.w.loadState();loaded.w.state.audio.muted=true;loaded.w.startShapeMatch();assert.equal(loaded.w.state.practice.progress[KEY],2);assert.equal(loaded.w.state.practice.progress.logic_memory,7);assert.equal(loaded.w.state.practice.rounds.logic_memory,2);assert.match(loaded.w.renderLogicPlay(),/本轮已完成 2 \/ 10 对/);
});

test('memory final reward is settled before closing and pending board transitions cannot reopen the modal',t=>{
 const {w,document,advance}=createApp(t);w.state.practice.progress[KEY]=9;w.state.logic.level=2;w.startShapeMatch();assert.equal(document.querySelectorAll('[data-shape]').length,2);const current=board(document),pair=pairs(document)[0];match(pair);assert.equal(w.state.stars,3);assert.equal(w.state.practice.rounds[KEY],1);w.closeModal();pair.forEach(b=>w.flipCard(b,current.id,1));advance(5000);assert.equal(w.state.stars,3);assert.equal(w.state.practice.rounds[KEY],1);assert.equal(document.querySelector('#modal-overlay').classList.contains('show'),false);w.startShapeMatch();assert.equal(w.state.practice.progress[KEY],0);assert.equal(w.state.stars,3);
});

test('memory waits for its celebration voice before offering the next board',async t=>{
 const {w,document,advance,flush}=createApp(t);w.state.audio.muted=false;w.startShapeMatch();pairs(document).forEach(match);await flush();const current=board(document);assert.equal(w.state.practice.progress[KEY],3);assert.equal(w.audioPlayback.status,'playing');advance(4000);assert.equal(board(document),current);w._audioEl.end();await flush();assert.notEqual(board(document),current);assert.equal(w.state.practice.progress[KEY],3);
});
