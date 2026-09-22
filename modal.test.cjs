const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
let browser;before(async()=>browser=await pw.chromium.launch({headless:true,args:["--mute-audio"],channel:'msedge'}));after(async()=>browser?.close());
test('lesson cards and actions fit short phones and desktop without modal scrolling',async t=>{
 const c=await browser.newContext(),p=await c.newPage();t.after(()=>c.close());const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5173/');await p.waitForTimeout(650);await p.evaluate(()=>{closeModal();state.audio.muted=true;BADGES_DEF.forEach(b=>state.badges[b.id]=1);});
 const failures=[];
 for(const [width,height] of [[375,667],[390,844],[1280,800]]){
  await p.setViewportSize({width,height});
  const measures=await p.evaluate(()=>{const out=[];const screens=[['规律提示',()=>{state.logic.level=2;startLogicPattern('shape');hintLogicPattern();}],['三图排序',()=>{state.logic.level=1;startLogicSort('height');_logicSort.values.forEach(pickLogicSort);checkLogicSort();}],['配对',()=>{state.logic.level=2;startShapeMatch();}],['数学',()=>{state.numbers.difficulty=1;startChallenge('make');hintChallenge();}],['英语跟读',()=>{startEnglishLesson(2);_lesson.index=9;_lesson.step=3;renderLesson();}],['单词跟读',()=>startReadAlong('animals')],['闪卡',()=>startFlashcard('animals')],['短句跟读',()=>startSentenceRead(3)],['三步故事排序',()=>{state.stories.readingLevel=1;state.stories.readingSteps={};state.practice.progress.story_1_1=0;showStoryQuiz(1);for(let i=0;i<4;i++){answerReading(_reading.question.answer);advanceReading();}}],['故事复述',()=>{_reading.index=9;_reading.step=2;renderReading();}],...POEMS.map(poem=>[poem.t,()=>showPoem(poem.id)])];for(const [name,open] of screens){open();const el=document.getElementById('modal');out.push({name,scroll:el.scrollHeight,visible:el.clientHeight,width:el.scrollWidth,visibleWidth:el.clientWidth});}return out;});
  failures.push(...measures.filter(m=>m.scroll>m.visible+2||m.width>m.visibleWidth+2).map(m=>({width,height,...m})));
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
});
test('all story activity stages fit a short phone including answer feedback',async t=>{
 const c=await browser.newContext(),p=await c.newPage();t.after(()=>c.close());await p.setViewportSize({width:375,height:667});await p.goto('http://127.0.0.1:5173/');await p.waitForTimeout(650);
 const bad=await p.evaluate(()=>{closeModal();state.audio.muted=true;BADGES_DEF.forEach(b=>state.badges[b.id]=1);const bad=[];function check(s,i,stage){const m=document.getElementById('modal');if(m.scrollHeight>m.clientHeight+2||m.scrollWidth>m.clientWidth+2)bad.push({story:s.id,index:i,stage,height:m.scrollHeight});}for(const level of [0,1]){state.stories.readingLevel=level;for(const s of STORIES){showStoryQuiz(s.id);for(let i=0;i<10;i++){check(s,i,'question');if(i<4){answerReading(_reading.question.answer);check(s,i,'answered');advanceReading();}else if(i<7){_reading.events.forEach((_,i)=>pickStoryEvent(i));checkStoryOrder();check(s,i,'answered');advanceReading();}else finishReading();}}}return bad;});assert.deepEqual(bad,[]);
});
