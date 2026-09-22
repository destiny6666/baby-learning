const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {createCoverageMap}=require('istanbul-lib-coverage');
const {createApp}=require('./harness.cjs');
const snapshots=[];
function app(t,options){const env=createApp(t,options);snapshots.push(env.w.__coverage__);return env;}
function nextButton(w,action){w.showModal('<div id="learningNext"><button class="btn">下一题</button></div>');const button=w.document.querySelector('#learningNext button');button.onclick=action;return button;}
function enable(w){w.state.audio.muted=false;w.state.audio.volume=.6;}
after(()=>{const map=createCoverageMap({});snapshots.forEach(c=>map.merge(c));for(const name of ['speech-player.js','practice.js']){const file=map.files().find(f=>f.endsWith(name)),coverage=map.fileCoverageFor(file),summary=coverage.toSummary();console.log(name+': '+summary.lines.pct+'% lines; uncovered '+Object.entries(coverage.getLineCoverage()).filter(([,n])=>n===0).map(([line])=>line).join(','));assert.ok(summary.lines.pct>=95,name+' should have at least 95% meaningful line coverage');}});

test('speech keys and Chinese number composition select direct, stitched or unavailable recordings',t=>{
  const {w,json}=app(t);assert.equal(w.speechKey('  Hello   dog!  ','en'),'en|Hello dog!');assert.equal(w.speechKey('  你好  '),'zh|你好');
  for(const [n,text] of [[0,'零'],[9,'九'],[10,'十'],[11,'十一'],[20,'二十'],[105,'一百零五'],[1001,'一千零一'],[10001,'一万零一'],[100000001,'一亿零一']])assert.equal(w.chineseNumber(n,true),text);assert.equal(w.chineseNumber(10,false),'一十');
  w.RECORDED_SPEECH={'en|hello':'hello.mp3','zh|你有':'start.mp3','zh|十':'ten.mp3','zh|一':'one.mp3','zh|颗星星':'end.mp3'};
  assert.deepEqual(json(w.recordedSpeechClips('hello','en')),['hello.mp3']);assert.deepEqual(json(w.recordedSpeechClips('你有11颗星星','child')),['start.mp3','ten.mp3','one.mp3','end.mp3']);assert.equal(w.recordedSpeechClips('你有12颗星星','child'),null);assert.equal(w.recordedSpeechClips('你有11颗星星','en'),null);assert.equal(w.recordedSpeechClips('你有9007199254740992颗星星','child'),null);w.RECORDED_SPEECH=undefined;assert.equal(w.recordedSpeechClips('unknown','child'),null);
});

test('playback status notifies subscribers and controls transient loading/error indicators',t=>{
  const {w,document,advance}=app(t),events=[];const unsubscribe=w.watchPlayback(value=>events.push(value.status));w.setPlaybackStatus('loading','ignored','clip.mp3');assert.equal(document.getElementById('audioStatus').hidden,false);assert.match(document.getElementById('audioStatus').textContent,/准备声音/);w.setPlaybackStatus('playing','spoken');assert.equal(document.getElementById('audioStatus').hidden,true);w.setPlaybackStatus('error','failure');advance(2499);assert.equal(document.getElementById('audioStatus').hidden,false);advance(1);assert.equal(document.getElementById('audioStatus').hidden,true);unsubscribe();w.setPlaybackStatus('idle');assert.deepEqual(events,['loading','playing','error']);document.getElementById('audioStatus').remove();assert.doesNotThrow(()=>w.setPlaybackStatus('muted'));
});

test('empty speech and muted playback do not create media, while volume zero explains silence',t=>{
  const {w,document}=app(t);w.speak('');assert.equal(w._audioEl,null);assert.equal(w.playRecordedClips(['clip.mp3'],'hello','en',{}),false);assert.equal(w._audioEl,null);assert.equal(w.audioPlayback.status,'muted');w.RECORDED_SPEECH={};w.speak('uncatalogued');assert.equal(w.audioPlayback.status,'muted');w.state.audio.muted=false;w.state.audio.volume=0;assert.equal(w.audioEnabled(),false);assert.match(document.getElementById('audioStatus').textContent,/静音/);
});

test('recorded speech follows all clips and emits start/end once for the entire utterance',async t=>{
  const {w,flush}=app(t);enable(w);const events=[];w.playRecordedClips(['one.mp3','two.mp3'],'two clips','en',{onstart:()=>events.push('start'),onend:()=>events.push('end')});const audio=w._audioEl;assert.equal(audio.src,'one.mp3');assert.equal(audio.volume,.6);assert.equal(audio.preload,'auto');await flush();audio.onplaying();assert.deepEqual(events,['start']);audio.end();assert.equal(audio.src,'two.mp3');assert.deepEqual(events,['start']);await flush();audio.end();assert.deepEqual(events,['start','end']);assert.equal(w.audioPlayback.reason,'ended');assert.equal(w.audioPlayback.status,'idle');
});

test('catalog lookup takes precedence over obsolete audio URLs and uncatalogued URLs still work',async t=>{
  const {w,flush}=app(t);enable(w);w.RECORDED_SPEECH={'zh|corrected poem':'correct.mp3'};w.playAudio('old.mp3','corrected poem');await flush();assert.equal(w._audioEl.src,'correct.mp3');w.playAudio('ordinary.mp3');await flush();assert.equal(w._audioEl.src,'ordinary.mp3');w.RECORDED_SPEECH={'en|hello':'hello.mp3'};w.speak('hello','en');await flush();assert.equal(w._audioEl.src,'hello.mp3');
});

test('native speech selects voice and parameters, reports lifecycle once, and ignores settled callbacks',t=>{
  const {w,advance}=app(t);enable(w);w.RECORDED_SPEECH={};const calls=[];w.speak('native only','en',{rate:.5,pitch:.7,onstart:()=>calls.push('start'),onend:()=>calls.push('end'),onerror:()=>calls.push('error')});const u=w.synth.utterance;assert.equal(u.lang,'en-US');assert.equal(u.voice.lang,'en-US');assert.equal(u.rate,.5);assert.equal(u.pitch,.7);assert.equal(u.volume,.6);advance(6000);assert.equal(w.audioPlayback.status,'playing');u.onend();u.onend();u.onerror({error:'late'});u.onstart();assert.deepEqual(calls,['start','end']);assert.equal(w.audioPlayback.reason,'ended');
});

test('voice selection handles unavailable synthesis, ranking, defaults and voice-loading failures',t=>{
  const {w}=app(t);w.voiceCache={'zh-CN':[{name:'basic',lang:'zh-CN'},{name:'Google Xiaoxiao natural',lang:'zh-CN'},{name:'yaoyao',lang:'zh-CN'}],'en-US':[{name:'English',lang:'en-US'}]};assert.equal(w.pickVoice('zh-CN').name,'Google Xiaoxiao natural');assert.equal(w.pickVoice('fr-FR'),null);assert.equal(w.pickVoice(),null);w.synth.getVoices=()=>{throw Error('voices unavailable');};assert.doesNotThrow(()=>w.loadVoices());w.synth=null;assert.equal(w.pickVoice('en'),null);assert.doesNotThrow(()=>w.loadVoices());
});

test('native unavailable and constructor errors report useful errors without throwing',t=>{
  const {w}=app(t);enable(w);const errors=[];const speech=w.synth;w.synth=null;w.speakNative('hello','en',{onerror:e=>errors.push(e.error)},w._audioGeneration);assert.deepEqual(errors,['synthesis-unavailable']);w.synth=speech;const Utterance=w.SpeechSynthesisUtterance;w.SpeechSynthesisUtterance=undefined;w.speakNative('hello','en',{onerror:e=>errors.push(e.error)},w._audioGeneration);assert.equal(errors.length,2);w.SpeechSynthesisUtterance=function(){throw Error('constructor failed');};w.speakNative('hello','en',{onerror:e=>errors.push(e.message)},w._audioGeneration);assert.equal(errors[2],'constructor failed');w.SpeechSynthesisUtterance=Utterance;w.synth.speak=()=>{throw Error('speak failed');};w.speakNative('hello','unknown-mode',{onerror:e=>errors.push(e.message)},w._audioGeneration);assert.equal(errors[3],'speak failed');
});

test('native start watchdog fails once, cancels host queues and tolerates host cancellation errors',t=>{
  const {w,advance}=app(t);enable(w);const errors=[];w.synth.speak=u=>w.pendingNative=u;w.synth.cancel=()=>{throw Error('cancel unavailable');};w.speakNative('silent host','unknown-mode',{onerror:e=>errors.push(e.error)},w._audioGeneration);advance(4999);assert.equal(errors.length,0);advance(1);assert.deepEqual(errors,['synthesis-timeout']);w.pendingNative.onend();w.pendingNative.onerror({error:'late'});assert.equal(errors.length,1);assert.equal(w.audioPlayback.status,'error');
});

test('native onerror and obsolete native callbacks cannot finish a replacement playback',async t=>{
  const {w,flush}=app(t);enable(w);let errors=0,ended=0;w.speakNative('native','en',{onerror:()=>errors++,onend:()=>ended++},w._audioGeneration);const first=w.synth.utterance;first.onerror({error:'network'});assert.equal(errors,1);first.onend();assert.equal(ended,0);w.speakNative('replacement native','en',{onerror:()=>errors++,onend:()=>ended++},w._audioGeneration);const second=w.synth.utterance;w.playRecordedClips(['fresh.mp3'],'fresh','en',{});await flush();second.onstart();second.onerror({error:'late'});second.onend();assert.equal(errors,1);assert.equal(ended,0);assert.equal(w.audioPlayback.url,'fresh.mp3');
});

test('recording rejection falls back to native speech and completes through native onend',async t=>{
  const {w,flush}=app(t,{audioError:true});enable(w);let ended=0;w.playRecordedClips(['bad.mp3'],'fallback phrase','en',{onend:()=>ended++});await flush();assert.equal(w._audioEl.paused,true);assert.equal(w.synth.utterance.text,'fallback phrase');assert.equal(w.audioPlayback.status,'playing');w.synth.utterance.onend();assert.equal(ended,1);assert.equal(w.audioPlayback.reason,'ended');
});

test('recording failure without fallback reports once, including missing speech text and synthesis',async t=>{
  const {w,flush}=app(t,{audioError:true});enable(w);const errors=[];w.playRecordedClips(['bad.mp3'],'recording only','en',{noNativeFallback:true,onerror:e=>errors.push(e.message)});await flush();assert.equal(errors.length,1);assert.equal(w.audioPlayback.status,'error');w.playRecordedClips(['bad.mp3'],'','en',{onerror:()=>errors.push('empty')});await flush();assert.equal(errors.at(-1),'empty');w.synth=null;w.playRecordedClips(['bad.mp3'],'no synth','en',{onerror:()=>errors.push('no synth')});await flush();assert.equal(errors.at(-1),'no synth');
});

test('recording constructors and synchronous media errors use the same failure path',t=>{
  const {w}=app(t);enable(w);let count=0;w.Audio=function(){throw Error('no audio host');};w.playRecordedClips(['clip.mp3'],'text','en',{noNativeFallback:true,onerror:()=>count++});assert.equal(count,1);w.Audio=class{pause(){}play(){throw Error('play failed');}};w.playRecordedClips(['clip.mp3'],'text','en',{noNativeFallback:true,onerror:()=>count++});assert.equal(count,2);w.audioFailure();assert.equal(w.audioPlayback.status,'error');
});

test('recording watchdog handles stalled media and ignores a stopped or aborted attempt',t=>{
  const {w,advance}=app(t);enable(w);let errors=0;w.Audio=class{pause(){}play(){}};w.playRecordedClips(['stall.mp3'],'stall','en',{noNativeFallback:true,onerror:()=>errors++});const stale=w._audioEl.onerror;advance(7999);assert.equal(errors,0);advance(1);assert.equal(errors,1);w.playRecordedClips(['next.mp3'],'next','en',{noNativeFallback:true,onerror:()=>errors++});w._audioEl.onerror({name:'AbortError'});assert.equal(errors,1);const stoppedEnd=w._audioEl.onended,stoppedPlay=w._audioEl.onplaying;w.stopSpeak();stale({error:'late'});stoppedEnd();stoppedPlay();advance(9000);assert.equal(errors,1);assert.equal(w.audioPlayback.reason,'stopped');
});

test('praise plays only recorded clips once per modal and skips hidden or muted pages',async t=>{
  const {w,flush}=app(t);enable(w);w.RECORDED_SPEECH={'zh|great':'great.mp3'};w.showModal('question');w.playPraise('not recorded');assert.equal(w._audioEl,null);w.playPraise('great');await flush();const generation=w._audioGeneration;w.playPraise('great');assert.equal(w._audioGeneration,generation);w.showModal('another');w.state.audio.muted=true;w.playPraise('great');assert.equal(w.audioPlayback.status,'idle');w.state.audio.muted=false;w.state.audio.volume=0;w.playPraise('great');assert.equal(w.audioPlayback.status,'idle');w.state.audio.volume=.5;Object.defineProperty(w.document,'hidden',{value:true,configurable:true});w.playPraise('great');assert.equal(w.audioPlayback.status,'idle');Object.defineProperty(w.document,'hidden',{value:false,configurable:true});w.playPraise('great');await flush();assert.equal(w.audioPlayback.status,'playing');
});

test('stop and pagehide discard queued native speech, media callbacks and reader state',async t=>{
  const {w,document,flush}=app(t);enable(w);w.showModal('<button id="readBtn" style="background:red">朗读中</button>');let cancels=0;w.synth.cancel=()=>cancels++;w.playRecordedClips(['clip.mp3'],'clip','en',{});await flush();const audio=w._audioEl;w.dispatchEvent(new w.Event('pagehide'));assert.equal(audio.paused,true);assert.equal(audio.onended,null);assert.equal(audio.onerror,null);assert.equal(audio.onplaying,null);assert.equal(w._speechWatchdog,null);assert.ok(cancels>=2);assert.equal(document.getElementById('readBtn').textContent,'🔊 朗读');assert.equal(document.getElementById('readBtn').style.background,'');w.synth.cancel=()=>{throw Error('cancel failed');};assert.doesNotThrow(()=>w.stopSpeak());
});

for(const elapsed of [500,12000])test('auto-next waits for '+elapsed+'ms narration and advances immediately at its real end',async t=>{
  const {w,advance,flush}=app(t);enable(w);let moved=0;const button=nextButton(w,()=>moved++);w.playRecordedClips(['clip.mp3'],'prompt','en',{});w.armNextButton(button);await flush();assert.equal(button.dataset.autoNext,'audio');advance(elapsed);assert.equal(moved,0);w._audioEl.end();await flush();assert.equal(moved,1);assert.equal(button.disabled,true);advance(4000);assert.equal(moved,1);
});

test('auto-next waits for every recorded fragment, not just the first clip',async t=>{
  const {w,advance,flush}=app(t);enable(w);let moved=0;const button=nextButton(w,()=>moved++);w.playRecordedClips(['first.mp3','last.mp3'],'two fragments','en',{});w.armNextButton(button);await flush();w._audioEl.end();await flush();advance(5000);assert.equal(moved,0);assert.equal(w._audioEl.src,'last.mp3');w._audioEl.end();await flush();assert.equal(moved,1);
});

test('native narration ends the wait without an extra three-second delay',async t=>{
  const {w,advance,flush}=app(t);enable(w);w.RECORDED_SPEECH={};let moved=0;const button=nextButton(w,()=>moved++);w.speak('native prompt','en');w.armNextButton(button);advance(9000);assert.equal(moved,0);w.synth.utterance.onend();await flush();assert.equal(moved,1);
});

test('muted auto-next counts three seconds, arms once and manual continuation cancels its timer',t=>{
  const {w,advance}=app(t);let moved=0;const button=nextButton(w,()=>moved++);w.armNextButton();w.armNextButton(button);assert.equal(button.dataset.autoNext,'3');advance(1000);assert.equal(button.dataset.autoNext,'2');advance(1000);assert.equal(button.dataset.autoNext,'1');advance(999);assert.equal(moved,0);advance(1);assert.equal(moved,1);advance(3000);assert.equal(moved,1);
  const second=nextButton(w,()=>moved++);w.armNextButton(second);advance(500);second.click();advance(5000);assert.equal(moved,2);
});

test('failed audio starts a fresh three-second fallback after the failure',async t=>{
  const {w,advance,flush}=app(t);enable(w);let moved=0;const button=nextButton(w,()=>moved++);w.playRecordedClips(['clip.mp3'],'prompt','en',{noNativeFallback:true});w.armNextButton(button);await flush();advance(5000);assert.equal(moved,0);w._audioEl.onerror({error:'network'});assert.equal(button.dataset.autoNext,'3');w.setPlaybackStatus('error','same error again');advance(2999);assert.equal(moved,0);advance(1);assert.equal(moved,1);
});

test('starting narration cancels the silent countdown and muting returns to a three-second pause',async t=>{
  const {w,advance,flush}=app(t);let moved=0;const button=nextButton(w,()=>moved++);w.armNextButton(button);advance(1000);enable(w);w.playRecordedClips(['clip.mp3'],'prompt','en',{});await flush();advance(4000);assert.equal(moved,0);w.toggleMute();advance(2999);assert.equal(moved,0);advance(1);assert.equal(moved,1);
});

test('manual advance, closing and detached buttons cannot trigger stale narration continuations',async t=>{
  const {w,advance,flush}=app(t);enable(w);let moved=0;let button=nextButton(w,()=>moved++);w.playRecordedClips(['clip.mp3'],'prompt','en',{});w.armNextButton(button);await flush();const oldEnd=w._audioEl.onended;button.click();oldEnd();await flush();advance(4000);assert.equal(moved,1);
  button=nextButton(w,()=>moved++);w.playRecordedClips(['next.mp3'],'prompt','en',{});w.armNextButton(button);await flush();const canceledEnd=w._audioEl.onended;w.closeModal();canceledEnd();await flush();advance(10000);assert.equal(moved,1);assert.equal(w._playbackListeners.size,0);
  w.state.audio.muted=true;button=nextButton(w,()=>moved++);w.armNextButton(button);button.remove();advance(4000);assert.equal(moved,1);
});

test('replacement narration invalidates an old end event and only the replacement may advance',async t=>{
  const {w,flush,advance}=app(t);enable(w);let moved=0;const button=nextButton(w,()=>moved++);w.playRecordedClips(['old.mp3'],'old','en',{});w.armNextButton(button);await flush();const staleEnd=w._audioEl.onended;w._audioEl.end();w.playRecordedClips(['new.mp3'],'new','en',{});staleEnd();await flush();advance(6000);assert.equal(moved,0);assert.equal(w.audioPlayback.url,'new.mp3');w._audioEl.end();await flush();assert.equal(moved,1);
});

test('offerAutoNext can require explicit input, and absent or actionless buttons are safe',t=>{
  const {w,document,advance}=app(t);let moved=0;w.showModal('question');w.armNextButton();w.offerAutoNext(()=>moved++,false);let button=document.querySelector('#modal .modal-actions button');assert.equal(button.dataset.autoNext,undefined);advance(5000);assert.equal(moved,0);button.click();assert.equal(moved,1);w.showModal('new');w.offerAutoNext(()=>moved++);advance(3000);assert.equal(moved,2);w.showModal('<div id="learningNext"><button>no action</button></div>');button=document.querySelector('#learningNext button');w.armNextButton(button);assert.doesNotThrow(()=>advance(3000));assert.equal(button.disabled,true);
});

test('practice counters are saved, restored and recorded only once per question',t=>{
  const {w,document,json}=app(t);w._practiceCurrent=null;w.practiceAttach();assert.equal(w.practiceRecord(),false);let calls=0;w.practiceContinue(()=>calls++);assert.equal(calls,1);w.restartPractice();assert.equal(w.practiceStart('test_round','<img>练习'),0);w.showModal('question');w.practiceAttach();w.practiceAttach();assert.equal(document.querySelectorAll('#practiceProgress').length,1);assert.equal(document.querySelector('#practiceProgress img'),null);assert.match(document.getElementById('practiceProgress').textContent,/第 1 \/ 10/);assert.equal(w.practiceRecord(),true);assert.equal(w.practiceRecord(),false);assert.equal(w.state.practice.progress.test_round,1);assert.match(document.getElementById('practiceProgress').textContent,/已完成 1/);w.closeModal();w.loadState();assert.equal(w.practiceStart('test_round','practice'),1);assert.equal(w.state.stars,0);assert.deepEqual(json(w.state.practice.rounds),{});
});

test('ten practice questions complete one round and restarting resets progress without repeating completion',t=>{
  const {w,document}=app(t);let advanced=0;const next=()=>{advanced++;w.practiceStart('unit_round','Round');w.showModal('next');w.practiceAttach();};next();for(let i=1;i<=10;i++){assert.equal(w.practiceRecord(),true);assert.equal(w.practiceRecord(),false);w.practiceContinue(next);assert.equal(w.state.practice.progress.unit_round,i);}assert.equal(advanced,10);assert.equal(w.state.practice.rounds.unit_round,1);assert.match(document.getElementById('modal').textContent,/10 \/ 10/);w.restartPractice();assert.equal(advanced,11);assert.equal(w.state.practice.progress.unit_round,0);assert.equal(w._practiceCurrent.restarted,true);w.restartPractice();assert.equal(advanced,11);assert.equal(w.state.practice.rounds.unit_round,1);
});

test('actual math round resumes and awards its completion stars once after ten answers',t=>{
  const {w}=app(t);w.startChallenge('combine');for(let i=0;i<4;i++){w.answerChallenge(w._challenge.question.options.indexOf(w._challenge.question.answer));w.nextChallenge();}w.closeModal();w.loadState();w.startChallenge('combine');assert.equal(w._challenge.index,4);for(let i=4;i<10;i++){const answer=w._challenge.question.options.indexOf(w._challenge.question.answer);w.answerChallenge(answer);w.answerChallenge(answer);w.nextChallenge();}assert.equal(w.state.practice.progress.math_combine,10);assert.equal(w.state.practice.rounds.math_combine,1);assert.equal(w.state.numbers.challengeDone,1);assert.equal(w.state.stars,3);w.restartPractice();assert.equal(w.state.practice.progress.math_combine,0);assert.equal(w.state.stars,3);
});
