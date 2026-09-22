const {test,before,after}=require('node:test');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
let browser;
before(async()=>{browser=await pw.chromium.launch({headless:true,args:['--mute-audio'],channel:'msedge'});});
after(async()=>browser?.close());
async function setup(t){
 const c=await browser.newContext({viewport:{width:375,height:667}}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.TEST_URL||'http://127.0.0.1:5173/');
 await p.waitForFunction(()=>typeof quickPlayCurrent==='function');await p.evaluate(()=>{closeModal();state.firstVisit=false;state.audio.muted=true;BADGES_DEF.forEach(b=>state.badges[b.id]=1);saveState();});
 t.after(async()=>{await c.close();assert.deepEqual(errors,[]);});return p;
}
test('375px phone shows four complete destinations, all eight menu cards and first-screen play buttons',async t=>{
 const p=await setup(t);
 assert.equal(await p.locator('#bottomNav button').count(),4);
 for(const button of await p.locator('#bottomNav button').all()){const box=await button.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=375&&box.y+box.height<=667);}
 await p.getByRole('button',{name:'🎈 游戏大全'}).click();assert.equal(await p.locator('.game-entry').count(),8);
 assert.ok(await p.locator('#modal').evaluate(e=>e.scrollHeight<=e.clientHeight+2));
 await p.screenshot({path:'tmp/phone-game-menu.png'});
 const tabs=await p.evaluate(()=>TABS.map(t=>t.id));
 for(const id of tabs){await p.evaluate(id=>{switchTab(id);window.scrollTo(0,0);},id);const box=await p.locator('#quickPlay button').boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<580,id+' play above fold');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' fits width');}
 await p.evaluate(()=>switchTab('english'));await p.screenshot({path:'tmp/phone-english-home.png',fullPage:true});
});
test('English library is open, report follows every theme and all 150 word cards have real recordings',async t=>{
 const p=await setup(t);await p.evaluate(()=>switchTab('english'));
 assert.equal(await p.locator('details.learning-library').count(),0);assert.equal(await p.locator('.theme-card').count(),6);
 assert.ok(await p.locator('.learning-library').evaluate(e=>e.nextElementSibling.textContent.includes('学习报告')));
 const words=await p.evaluate(()=>ENGLISH.themes.map(t=>({id:t.id,words:t.words.map(w=>({word:w.w,url:recordedSpeechClips(w.w,'en')?.[0],phrase:recordedSpeechClips(lessonPhrase(t.id,w).en,'en')?.[0]}))})));
 for(const theme of words){assert.equal(theme.words.length,25);for(const w of theme.words){assert.ok(w.url&&w.phrase,w.word);assert.ok(fs.existsSync(path.join(__dirname,w.url)));assert.ok(fs.existsSync(path.join(__dirname,w.phrase)));}await p.evaluate(id=>enterEnglishTheme(id),theme.id);assert.equal(await p.locator('.word-card').count(),25);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme.id+' cards width');}
 await p.evaluate(()=>{state.audio.muted=false;synth=null;playEnWord('butterfly');});await p.waitForFunction(()=>audioPlayback.status==='playing'&&_audioEl.currentTime>.02);assert.ok(await p.evaluate(()=>_audioEl.duration>0));
});
test('adventure starts real narration on each of ten questions and stops on close',async t=>{
 const p=await setup(t);await p.evaluate(()=>{state.audio.muted=false;synth=null;startLevel(1);});
 for(let i=0;i<10;i++){
  await p.waitForFunction(()=>audioPlayback.status==='playing'&&audioPlayback.text===_levelData.questions[_levelData.current].q&&_audioEl.currentTime>.02);
  assert.ok(await p.evaluate(()=>_audioEl.duration>0));
  await p.evaluate(()=>{const board=document.querySelector('#modal [id^="lv"]'),answer=_levelData.questions[_levelData.current].answer;checkLevelAnswer(board.id,answer,answer);});
  await p.getByRole('button',{name:'下一题',exact:true}).click();
 }
 assert.equal(await p.evaluate(()=>_levelData.settled),true);
 await p.evaluate(()=>startLevel(1,true));await p.waitForFunction(()=>audioPlayback.status==='playing');await p.evaluate(()=>closeModal());assert.equal(await p.evaluate(()=>_audioEl.paused),true);
});
test('new color flashcards and listening options show distinct colors within a phone card',async t=>{
 const p=await setup(t);await p.evaluate(()=>{startFlashcard('colors');_flashcard.index=15;renderFlashcard();});
 assert.equal(await p.locator('.fc-en').innerText(),'light blue');assert.equal(await p.locator('.fc-emoji [role="img"]').count(),1);
 const light=await p.locator('.fc-emoji [role="img"]').evaluate(e=>getComputedStyle(e).backgroundColor);await p.evaluate(()=>moveFlashcard(1));
 assert.notEqual(await p.locator('.fc-emoji [role="img"]').evaluate(e=>getComputedStyle(e).backgroundColor),light);
 assert.ok(await p.locator('#modal').evaluate(e=>e.scrollHeight<=e.clientHeight+2));
 await p.screenshot({path:'tmp/phone-color-flashcard.png'});
 await p.evaluate(()=>startListenPick('colors'));assert.equal(await p.locator('#modal .option-btn').count(),4);
 assert.ok(await p.locator('#modal').evaluate(e=>e.scrollHeight<=e.clientHeight+2));
});
