const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createApp}=require('./harness.cjs');

test('adventure reads each visible question once on entry, advance, resume and restart',t=>{
 const {w,document}=createApp(t),spoken=[],pending=[];
 w.learningSpeak=text=>spoken.push(text);w.offerAutoNext=fn=>pending.push(fn);
 w.startLevel(1);assert.deepEqual(spoken,[w._levelData.questions[0].q]);
 document.querySelector('[onclick="speakLevelQuestion()"] ').click();assert.equal(spoken.length,2);
 for(let i=0;i<10;i++){
  const board=document.querySelector('#modal [id^="lv"]'),q=w._levelData.questions[i];
  w.checkLevelAnswer(board.id,q.answer,q.answer);const before=spoken.length;
  w.speakLevelQuestion();assert.equal(spoken.length,before,'do not read the next question behind the answered card');
  pending.shift()();assert.equal(spoken.length,before+(i<9?1:0));
  if(i<9)assert.equal(spoken.at(-1),w._levelData.questions[i+1].q);
 }
 w.startLevel(1,true);assert.equal(spoken.at(-1),w._levelData.questions[0].q);
 const count=spoken.length;w.closeModal();w.speakLevelQuestion();assert.equal(spoken.length,count);
 w.startLevel(1);assert.equal(spoken.length,count+1);assert.equal(spoken.at(-1),w._levelData.questions[0].q);
 w._levelData={...w._levelData};w.showLevelQuestion();w.speakLevelQuestion();assert.equal(spoken.length,count+1);
});

test('adventure auto narration uses bundled recordings and is cancelled on close',async t=>{
 const {w,flush}=createApp(t);w.state.audio.muted=false;w.startLevel(1);await flush();
 assert.equal(w.audioPlayback.status,'playing');assert.equal(w.audioPlayback.text,w._levelData.questions[0].q);
 assert.match(w.audioPlayback.url,/\.mp3$/);const audio=w._audioEl;w.closeModal();assert.equal(audio.paused,true);
 assert.equal(w.audioPlayback.status,'idle');
});
