const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const targetURL=process.env.TEST_URL||'http://127.0.0.1:5173/';
let browser;
before(async()=>{browser=await pw.chromium.launch({headless:true,args:['--mute-audio'],channel:process.env.BROWSER_CHANNEL||'msedge'});});
after(async()=>browser?.close());
async function setup(t,legacy){
  const context=await browser.newContext(),p=await context.newPage(),errors=[];
  p.on('pageerror',error=>errors.push(error.message));
  if(legacy)await context.addInitScript(value=>{if(!sessionStorage.getItem('legacy-seeded')){localStorage.setItem('wb_baole_pro_v1',value);sessionStorage.setItem('legacy-seeded','1');}},legacy);
  await p.goto(targetURL);await p.waitForFunction(()=>typeof startGrowthPlay==='function'&&document.querySelector('#sidebar button'));
  await p.evaluate(()=>{closeModal();state.firstVisit=false;state.audio.muted=true;BADGES_DEF.forEach(b=>state.badges[b.id]=1);saveState();});
  t.after(async()=>{await context.close();assert.deepEqual(errors,[],'Unexpected browser errors');});return p;
}

test('real recorded feedback longer than three seconds finishes before automatic advance, with no extra delay',{timeout:45000},async t=>{
  const p=await setup(t);
  await p.evaluate(()=>{state.audio.muted=false;state.audio.volume=.6;synth=null;state.practice.progress['growth-emotions']=6;startGrowthPlay('emotions');window.feedbackTiming={endedAt:0,nextAt:0,generation:0};watchPlayback(playback=>{if(playback.reason==='ended'&&playback.generation===feedbackTiming.generation)feedbackTiming.endedAt=performance.now();if(_practiceCurrent?.growth?.index===7&&!feedbackTiming.nextAt)feedbackTiming.nextAt=performance.now();});const q=_practiceCurrent.growth;answerGrowth(q.options.indexOf(q.activity.options[0]));feedbackTiming.generation=_audioGeneration;});
  await p.waitForFunction(()=>audioPlayback.status==='playing'&&_audioEl&&!_audioEl.paused&&_audioEl.duration>3,{},{timeout:12000});
  const duration=await p.evaluate(()=>_audioEl.duration);assert.ok(duration>3,'Use a genuinely long recorded explanation');
  await p.waitForFunction(()=>_audioEl.currentTime>=3,{},{timeout:6000});assert.equal(await p.evaluate(()=>_practiceCurrent.growth.index),6,'The old three-second timer must not skip the explanation');
  await p.waitForFunction(()=>_practiceCurrent.growth.index===7,{},{timeout:20000});
  const timing=await p.evaluate(()=>feedbackTiming);assert.ok(timing.endedAt>0,'A real media ended event must have occurred');assert.ok(timing.nextAt>=timing.endedAt);assert.ok(timing.nextAt-timing.endedAt<1000,'Advancement should follow ended immediately, not three seconds later');
});

test('English resumes its current three words, changes all three for a fresh round, and reviews the saved old deck',async t=>{
  const p=await setup(t);const original=await p.evaluate(()=>{startEnglishLesson(0);const data={code:_lesson.deckCode,words:_lesson.data.words.map(w=>w.w)};advanceLesson();answerLesson(_lesson.question.answer);closeModal();return data;});
  assert.equal(original.words.length,3);assert.equal(new Set(original.words).size,3);await p.reload();
  const resumed=await p.evaluate(()=>{closeModal();startEnglishLesson(0);return {index:_lesson.index,code:_lesson.deckCode,words:_lesson.data.words.map(w=>w.w)};});assert.equal(resumed.index,1);assert.equal(resumed.code,original.code);assert.deepEqual(resumed.words,original.words);
  const fresh=await p.evaluate(()=>{while(_lesson.step!==3){answerLesson(_lesson.question.answer);advanceLesson();}finishLesson();startEnglishLesson(0);return {code:_lesson.deckCode,words:_lesson.data.words.map(w=>w.w),progress:state.practice.progress.english_lesson_0};});assert.equal(fresh.progress,0);assert.notEqual(fresh.code,original.code);assert.ok(fresh.words.every(word=>!original.words.includes(word)));
  // A persisted review entry keeps the deck it was created against, even after a new round exists.
  const review=await p.evaluate(oldCode=>{closeModal();state.english.review['0:0:'+oldCode]=1;saveState();startEnglishReview();const words=_lesson.data.words.map(w=>w.w),code=_lesson.deckCode;answerLesson(_lesson.question.answer);finishEnglishReview();return {words,code,currentDeck:state.english.lessonDecks[0],progress:state.practice.progress.english_lesson_0,review:state.english.review};},original.code);assert.deepEqual(review.words,original.words);assert.equal(review.code,original.code);assert.equal(review.currentDeck,fresh.code);assert.equal(review.progress,0);assert.deepEqual(review.review,{});
});

test('legacy storage migrates once and later v2 changes stay isolated from v1',async t=>{
  const legacy=JSON.stringify({stars:17,currentTab:'letters',audio:{volume:.8,muted:true},english:{learned:{cat:true}}}),p=await setup(t,legacy);
  let saved=await p.evaluate(()=>({key:STORAGE_KEY,stars:state.stars,v1:localStorage.getItem(LEGACY_STORAGE_KEY),v2:JSON.parse(localStorage.getItem(STORAGE_KEY)),decks:state.english.lessonDecks}));assert.equal(saved.key,'wb_baole_pro_v2');assert.equal(saved.stars,17);assert.equal(saved.v1,legacy);assert.equal(saved.v2.stars,17);assert.deepEqual(saved.decks,{});
  await p.evaluate(()=>{state.stars=23;saveState();const old=JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));old.stars=99;localStorage.setItem(LEGACY_STORAGE_KEY,JSON.stringify(old));});await p.reload();assert.equal(await p.evaluate(()=>state.stars),23);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY)).stars),99);
  await p.evaluate(()=>doClearData());await p.reload();assert.equal(await p.evaluate(()=>state.stars),0);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY)).stars),99);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(STORAGE_KEY)).stars),0);
});

for(const kind of ['life','emotions'])test('growth '+kind+' supports wrong answers, paused progress and exactly ten credited activities',async t=>{
  const p=await setup(t);await p.clock.install();await p.evaluate(kind=>{switchTab('growth');startGrowthPlay(kind);},kind);const prompts=[];
  const wrong=await p.evaluate(()=>{const q=_practiceCurrent.growth;document.querySelector('[data-growth-listen="0"]').click();answerGrowth(q.options.findIndex(o=>o!==q.activity.options[0]));return {key:'growth-'+q.kind,prompt:q.activity.prompt};});await p.clock.fastForward(3500);assert.equal(await p.evaluate(()=>_practiceCurrent.growth.index),0);assert.equal(await p.evaluate(key=>state.practice.progress[key]||0,wrong.key),0);assert.equal(await p.locator('[data-auto-next]').count(),0);
  for(let n=0;n<10;n++){
    prompts.push(await p.evaluate(()=>_practiceCurrent.growth.activity.prompt));
    await p.evaluate(()=>{const q=_practiceCurrent.growth,index=q.options.indexOf(q.activity.options[0]);answerGrowth(index);answerGrowth(index);});assert.equal(await p.evaluate(key=>state.practice.progress[key],wrong.key),n+1);
    if(n===2){await p.evaluate(()=>closeModal());await p.reload();await p.evaluate(kind=>{closeModal();state.audio.muted=true;startGrowthPlay(kind);},kind);assert.equal(await p.evaluate(()=>_practiceCurrent.growth.index),3);}else{await p.clock.fastForward(2999);assert.equal(await p.evaluate(()=>_practiceCurrent.growth.index),n);await p.clock.fastForward(1);}
  }
  assert.equal(new Set(prompts).size,10);assert.equal(await p.locator('#growthPlay').count(),0);assert.equal(await p.evaluate(key=>state.practice.progress[key],wrong.key),10);assert.equal(await p.evaluate(key=>state.practice.rounds[key],wrong.key),1);assert.equal(await p.evaluate(()=>state.stars),3);await p.evaluate(kind=>startGrowthPlay(kind),kind);assert.equal(await p.evaluate(()=>_practiceCurrent.growth.index),0);assert.equal(await p.evaluate(()=>state.stars),3);
});
