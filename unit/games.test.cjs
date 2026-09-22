const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createApp}=require('./harness.cjs');

function choiceBoard(document,prefix){return document.querySelector('[id^="'+prefix+'"]:not([id$="_answer"]):not([id$="_seq"]):not([id$="_status"])');}
function answerFrom(button){return button.getAttribute('onclick').match(/,'([^']+)'\)$/)?.[1];}

test('letters matching retries, records each answer once, and starts a new round',t=>{
 const {w,document,advance}=createApp(t);w.startLetterMatch();
 for(let round=0;round<10;round++){
  const buttons=[...document.querySelectorAll('#letterOptions button')],parts=buttons[0].getAttribute('onclick').match(/'([^']+)'/g).map(s=>s.slice(1,-1));
  const correct=parts[1],upper=parts[2],wrong=buttons.find(b=>b.dataset.lower!==correct);
  if(round===0){wrong.click();assert.equal(w.state.letters.quizDone,0);assert.ok(wrong.classList.contains('wrong'));advance(800);assert.equal(document.querySelector('#letterOptions').dataset.locked,undefined);}
  w.checkLetterMatch(correct,correct,upper);w.checkLetterMatch(correct,correct,upper);
  assert.equal(w.state.letters.quizDone,round+1);advance(3000);
 }
 assert.equal(w.state.practice.rounds.letters_match,1);assert.match(document.querySelector('#modal').textContent,/这一轮完成/);
 w.restartPractice();assert.equal(w.state.practice.progress.letters_match,0);
 w.state.letters.matched=w.LETTERS_DATA.map(l=>l.upper);w.startLetterMatch();assert.equal(document.querySelectorAll('#letterOptions button').length,3);assert.match(w.renderLetters(),/字母也有小伙伴/);
});

for(const kind of ['listen','words'])test('letter enrichment '+kind+' completes ten questions with retry and resume guards',t=>{
 const {w,document}=createApp(t);w.speakLetterPlay();w.answerLetterPlay(0);w.nextLetterPlay();w.startLetterPlay('bad');assert.equal(w._letterPlay,null);
 w.startLetterPlay(kind);
 for(let i=0;i<10;i++){
  const q=w._letterPlay;assert.equal(q.index,i);w.nextLetterPlay();assert.equal(w._letterPlay,q);
  w.answerLetterPlay(-1);w.answerLetterPlay((q.answer+1)%3);assert.equal(q.solved,false);assert.match(document.querySelector('#learningFeedback').textContent,/再听/);
  w.answerLetterPlay(q.answer);w.answerLetterPlay(q.answer);assert.equal(w.state.practice.progress['letters_'+kind],i+1);w.nextLetterPlay();
 }
 assert.equal(w.state.practice.rounds['letters_'+kind],1);assert.equal(w.state.stars,3);assert.match(document.querySelector('#modal').textContent,/这一轮完成/);
 w.restartPractice();assert.equal(w._letterPlay.index,0);if(kind==='listen')assert.match(document.querySelector('#modal').textContent,/26个字母/);
 w.closeModal();w.answerLetterPlay(w._letterPlay.answer);w.nextLetterPlay();assert.equal(w.state.practice.progress['letters_'+kind],0);
});

test('poems can be filtered, favorited, read and recited without duplicate reading rewards',t=>{
 const {w,document}=createApp(t);w.switchTab('poems');assert.equal(document.querySelectorAll('.poem-card').length,20);
 w.filterPoems('fav',document.querySelectorAll('#poemFilters .pill')[1]);assert.equal(document.querySelectorAll('.poem-card').length,0);
 w.toggleFavPoem(1);assert.ok(w.state.poems.favorites.includes(1));assert.match(w.renderPoemList('fav'),/静夜思/);
 w.filterPoems('李白',document.querySelectorAll('#poemFilters .pill')[2]);assert.equal(document.querySelectorAll('.poem-card').length,w.POEMS.filter(p=>p.a==='李白').length);
 w.showPoem(1);w.showPoem(1);assert.equal(w.state.stars,1);assert.match(document.querySelector('#modal').textContent,/已收藏/);assert.match(w.renderPoemList('all'),/✓/);
 w.toggleFavPoem(1);assert.equal(w.state.poems.favorites.length,0);w.showPoem(8);assert.match(document.querySelector('#modal').textContent,/节选/);
 const spoken=[];w.playAudio=(...args)=>spoken.push(args);w.recitePoem(1);w.recitePoem(-1);assert.equal(spoken.length,1);assert.equal(spoken[0][0],'audio/poem_1.mp3');assert.match(spoken[0][1],/李白/);
 w.learningSpeak=text=>spoken.push(text);w.recitePoemLine(1,0);w.recitePoemLine(1,99);w.recitePoemLine(-1,0);assert.equal(spoken[1],w.POEMS[0].l[0]);
});

test('poem practice follows parent repetition, missing words and picture comprehension for ten items',t=>{
 const {w,document}=createApp(t);w.startPoemPlay(-1);w.speakPoemPlay();w.speakPoemOption(0);w.creditPoemPlay();w.confirmPoemLine();w.answerPoemPlay(0);w.nextPoemPlay();assert.equal(w._poemPlay,null);
 w.startPoemPlay(16);
 for(let i=0;i<10;i++){
  const q=w._poemPlay;assert.equal(q.index,i);w.nextPoemPlay();assert.equal(w._poemPlay,q);
  if(i<4){w.answerPoemPlay(0);assert.equal(q.solved,false);w.confirmPoemLine();w.confirmPoemLine();}
  else{w.confirmPoemLine();assert.equal(q.solved,false);w.speakPoemOption(-1);w.speakPoemOption(0);w.answerPoemPlay(-1);w.answerPoemPlay((q.answer+1)%3);assert.equal(q.solved,false);if(i===8)assert.ok(document.querySelector('svg[aria-label="蜻蜓"]'));w.answerPoemPlay(q.answer);w.answerPoemPlay(q.answer);}
  assert.equal(w.state.practice.progress.poem_16,i+1);w.nextPoemPlay();
 }
 assert.equal(w.state.stars,3);assert.equal(w.state.practice.rounds.poem_16,1);assert.match(document.querySelector('#modal').textContent,/这一轮完成/);w.creditPoemPlay();
 w.restartPractice();w.closeModal();w.creditPoemPlay();assert.equal(w.state.practice.progress.poem_16,0);
});

test('logic hub keeps difficulty independent and renders start, resume and completed states',t=>{
 const {w,document}=createApp(t);w.switchTab('logic');assert.equal(document.querySelectorAll('.logic-activity').length,3);
 w.setLogicActivityLevel('bad',1);w.setLogicActivityLevel('pattern',-1);w.setLogicActivityLevel('pattern',1.5);w.setLogicActivityLevel('sort',2);
 w.setLogicActivityLevel('pattern',2);w.setLogicActivityLevel('sort',1);w.setLogicActivityLevel('memory',2);
 assert.equal(w.state.logic.patternLevel,2);assert.equal(w.state.logic.sortLevel,1);assert.equal(w.state.logic.memoryLevel,2);
 w.state.practice.progress.logic_pattern_mixed=4;w.state.practice.rounds.logic_sort_mixed=2;w.renderModule();assert.match(document.querySelector('[data-activity="pattern"]').textContent,/继续找规律/);assert.match(document.querySelector('[data-activity="sort"]').textContent,/已完成 2 轮/);
 w.startLogicActivity('bad');for(const [kind,level,selector]of [['pattern',2,'#logicPattern'],['sort',1,'#logicSort'],['memory',2,'[data-shape]']]){w.startLogicActivity(kind);assert.equal(w.state.logic.level,level);assert.ok(document.querySelector(selector));}
 w.setLogicLevel(-1);assert.equal(w.state.logic.level,2);w.setLogicLevel(0);assert.equal(w.state.logic.level,0);assert.match(w.renderLogic(),/逻辑挑战/);
});

test('pattern rounds exercise all visual features and difficulty cycles, hints and retries',t=>{
 const {w,document}=createApp(t);w.speakLogicPattern();w.hintLogicPattern();w.answerLogicPattern(0);w.startLogicPattern('bad');assert.equal(w._logicPattern,null);
 for(let i=0;i<10;i++){
  w.state.logic.level=i%3;if(i===0)w.startPattern();else w.startLogicPattern();const q=w._logicPattern;
  assert.equal(q.dimension,['color','shape','size'][i%3]);assert.equal(q.cycle.length,i%3===0?2:3);
  w.hintLogicPattern();assert.ok(document.querySelector('.pattern-track').classList.contains('show-groups'));
  w.answerLogicPattern(99);w.checkPattern('logicPatternChoices',q.options.find(v=>v!==q.answer),q.answer);assert.equal(q.solved,false);assert.ok(document.querySelector('#logicPatternChoices .wrong'));
  w.answerLogicPattern(q.answer);w.answerLogicPattern(q.answer);assert.equal(w.state.logic.stars,(i+1)*2);assert.ok([...document.querySelectorAll('#logicPatternChoices button')].every(b=>b.disabled));w.continueLogicPattern();
 }
 assert.equal(w.state.practice.rounds.logic_pattern_mixed,1);assert.match(document.querySelector('#modal').textContent,/这一轮完成/);w.restartPractice();assert.equal(w._logicPattern.dimension,'shape');w.closeModal();w.hintLogicPattern();w.answerLogicPattern(w._logicPattern.answer);
});

test('sort rounds compare all dimensions, reject incomplete and wrong order, allow reset, then reward once',t=>{
 const {w,document}=createApp(t);w.speakLogicSort();w.pickLogicSort(1);w.resetLogicSort();w.checkLogicSort();w.startLogicSort('bad');assert.equal(w._logicSort,null);
 for(let i=0;i<10;i++){
  w.state.logic.level=i%2;if(i===0)w.startSizeSort();else w.startLogicSort();const q=w._logicSort;
  assert.equal(q.dimension,['size','length','height','quantity'][i%4]);assert.equal(q.values.length,i%2===0?2:3);
  w.checkLogicSort();assert.match(document.querySelector('#learningFeedback').textContent,/每张/);w.pickLogicSort(99);w.pickLogicSort(q.values.at(-1));w.pickLogicSort(q.values.at(-1));assert.equal(q.sequence.length,1);
  q.values.slice(0,-1).reverse().forEach(v=>w.pickLogicSort(v));assert.equal(q.solved,false);assert.match(document.querySelector('#learningFeedback').textContent,/再试一次/);
  w.resetLogicSort();assert.equal(q.sequence.length,0);q.values.forEach(v=>w.pickLogicSort(v));assert.equal(q.solved,true);w.checkLogicSort();w.resetLogicSort();w.pickLogicSort(q.values[0]);assert.equal(w.state.logic.stars,(i+1)*3);w.continueLogicSort();
 }
 assert.equal(w.state.practice.rounds.logic_sort_mixed,1);assert.match(document.querySelector('#modal').textContent,/这一轮完成/);w.restartPractice();assert.equal(w._logicSort.dimension,'height');w.closeModal();w.resetLogicSort();w.pickLogicSort(1);w.checkLogicSort();
});

test('memory board locks during mismatches, preserves matches and completes ten pairs',t=>{
 const {w,document,advance}=createApp(t);let completed=0;
 for(let i=0;completed<10;i++){
  w.state.logic.level=i%3;w.startShapeMatch();const board=choiceBoard(document,'sm'),buttons=[...board.querySelectorAll('button')],pairs=Math.min(i%3+3,10-completed);
  assert.equal(buttons.length,pairs*2);w.flipCard(document.createElement('button'),board.id,pairs);w.flipCard(buttons[0],'missing',pairs);
  const first=buttons[0],wrong=buttons.find(b=>b.dataset.shape!==first.dataset.shape);first.click();first.click();wrong.click();assert.equal(board.dataset.busy,'1');const third=buttons.find(b=>b!==first&&b!==wrong);w.flipCard(third,board.id,pairs);assert.notEqual(third.dataset.flipped,'1');advance(800);assert.equal(first.textContent,'❓');assert.ok(buttons.every(b=>!b.disabled));
  const groups=Map.groupBy(buttons,b=>b.dataset.shape);for(const [a,b]of groups.values()){a.click();b.click();completed++;assert.equal(a.dataset.matched,'1');assert.equal(w.state.practice.progress.logic_memory_pairs,completed);}
  assert.equal(w.state.logic.stars,completed===10?3:0);assert.equal(board.dataset.solved,'1');w.flipCard(first,board.id,pairs);assert.equal(w.state.practice.progress.logic_memory_pairs,completed);advance(3000);
 }
 assert.equal(w.state.practice.rounds.logic_memory_pairs,1);assert.match(document.querySelector('#modal').textContent,/这一轮完成/);
});

test('legacy math and counting choices support retry and automatic follow-up',t=>{
 const {w,document,advance}=createApp(t);
 for(const [start,check,prefix,stat]of [['startMathQuiz','checkMath','mq','quizDone'],['startCountGame','checkCount','cq','countDone']]){
  w[start]();let board=choiceBoard(document,prefix);const buttons=[...board.querySelectorAll('button')],answer=Number(buttons[0].getAttribute('onclick').match(/,(-?\d+)\)$/)[1]),wrong=buttons.find(b=>+b.dataset.val!==answer);
  wrong.click();assert.equal(w.state.numbers[stat],0);advance(800);assert.equal(board.dataset.locked,undefined);w[check](board.id,answer,answer);w[check](board.id,answer,answer);assert.equal(w.state.numbers[stat],1);advance(2000);assert.ok(choiceBoard(document,prefix));w.closeModal();
 }
 assert.equal(w.state.stars,4);assert.equal(new Set(w.generateWrongAnswers(3,4,0,10)).size,4);
});

test('math demonstrations navigate both operations and return to a quiz',t=>{
 const {w,document}=createApp(t);w.showMathDemo();
 for(const op of ['+','-']){w._mathQ={a:3,b:2,op,answer:op==='+'?5:1};w.showMathDemo();assert.match(document.querySelector('#modal').textContent,/3 个/);w.mathDemoPrev();assert.equal(w._demoIdx,0);w.mathDemoNext();assert.equal(w._demoIdx,1);w.mathDemoPrev();w.mathDemoNext();w.mathDemoNext();assert.match(document.querySelector('#modal').textContent,op==='+'?/合起来一共 5/:/还剩下 1/);w.mathDemoNext();assert.ok(choiceBoard(document,'mq'));}
 w.startMathDemo();assert.equal(w._demoIdx,0);assert.equal(w._demoSteps.length,3);
});

test('number order game clears a wrong attempt and awards a correct ascending sequence',t=>{
 const {w,document,advance}=createApp(t);w.startOrderGame();const board=choiceBoard(document,'oq'),buttons=[...board.querySelectorAll('button')],values=buttons.map(b=>+b.dataset.val).sort((a,b)=>a-b),answer=values.join(',');
 values.slice().reverse().forEach(v=>w.pickOrder(board.id,v,answer));assert.equal(w.state.numbers.orderDone,0);advance(1000);assert.equal(w._orderSeq.length,0);assert.equal(document.getElementById(board.id+'_seq').textContent,'');values.forEach(v=>w.pickOrder(board.id,v,answer));assert.equal(w.state.numbers.orderDone,1);assert.equal(w.state.stars,3);advance(2300);assert.ok(choiceBoard(document,'oq'));
});

test('English library records streaks, independent words and complete theme badges',t=>{
 const {w,document}=createApp(t);w.switchTab('english');const theme=w.ENGLISH.themes[0];w.enterEnglishTheme(theme.id);assert.equal(w.state.english.streak,1);assert.equal(document.querySelectorAll('.word-card').length,theme.words.length);w.enterEnglishTheme(theme.id);assert.equal(w.state.english.streak,1);
 const yesterday=new Date(Date.now()-86400000);w.state.english.lastStudy=yesterday.getFullYear()+'-'+(yesterday.getMonth()+1)+'-'+yesterday.getDate();w.enterEnglishTheme(theme.id);assert.equal(w.state.english.streak,2);
 w.markLearned(theme.words[0].w);w.markLearned(theme.words[0].w);assert.equal(w.state.stars,1);theme.words.slice(1).forEach(word=>w.markLearned(word.w));assert.ok(w.state.english.themeStars[theme.id]);assert.equal(w.updateEnglishThemeStars(),false);assert.match(w.renderEnglishTheme(theme.id),/word-card learned/);
 w.backToEnglishThemes();assert.equal(w._englishCurrentTheme,null);assert.match(w.renderEnglish(),/主题勋章/);w._englishMode='sentences';w.renderModule();assert.equal(document.querySelectorAll('.word-card').length,w.SENTENCES.length);
 assert.deepEqual(Array.from(w.pickFromWords(['a','b','c'],'a',10)).sort(),['b','c']);
});

test('flashcards cover every card once, respect navigation bounds and restart after completion',t=>{
 const {w,document}=createApp(t);w.renderFlashcard();w.moveFlashcard(1);w.finishFlashcard();w.startFlashcard('bad');assert.equal(w._flashcard,null);const theme=w.ENGLISH.themes[0];w.startFlashcard(theme.id);assert.ok(document.querySelector('#fcPrevious').disabled);w.finishFlashcard();w.moveFlashcard(-1);w.moveFlashcard(2);assert.equal(w._flashcard.index,0);
 w.moveFlashcard(1);w.moveFlashcard(-1);for(let i=1;i<theme.words.length;i++){w.moveFlashcard(1);assert.equal(document.querySelector('.fc-en').textContent,theme.words[i].w);}
 w.moveFlashcard(1);assert.equal(w._flashcard.finished,true);assert.match(document.querySelector('#modal').textContent,/这一组看完/);w.moveFlashcard(1);w.finishFlashcard();w.renderFlashcard();w.startFlashcard(theme.id);assert.equal(w._flashcard.index,0);w.closeModal();w.moveFlashcard(1);assert.equal(w._flashcard.index,0);
});

test('English listen and sentence choices retry without reward and advance after a correct answer',t=>{
 const {w,document,advance}=createApp(t);const id=w.ENGLISH.themes[0].id;
 for(const [start,arg,prefix,check,key]of [['startListenPick',id,'lp','checkListenPick','english_listen_'+id],['startSentenceFill',2,'sf','checkSentenceFill','english_sentence_fill']]){
  w[start](arg);advance(300);const board=choiceBoard(document,prefix),buttons=[...board.querySelectorAll('button')],answer=answerFrom(buttons[0]),wrong=buttons.find(b=>(b.dataset.w||b.dataset.val)!==answer);wrong.click();assert.equal(w.state.practice.progress[key]||0,0);advance(800);assert.equal(board.dataset.locked,undefined);w[check](board.id,answer,answer);w[check](board.id,answer,answer);assert.equal(w.state.practice.progress[key],1);advance(3000);assert.ok(choiceBoard(document,prefix));w.closeModal();
 }
 assert.equal(w.state.stars,4);
});

test('spelling uses duplicate tiles, resets failed attempts and prevents duplicate credits',t=>{
 const {w,document,advance}=createApp(t);const theme=w.ENGLISH.themes.find(t=>t.words.some(x=>x.w==='apple'));
 const originalRandom=w.Math.random;let initial=true;w.Math.random=()=>{if(initial){initial=false;return theme.words.findIndex(x=>x.w==='apple')/theme.words.length;}return originalRandom();};w.startSpellChallenge(theme.id);w.Math.random=originalRandom;
 const board=choiceBoard(document,'sp'),buttons=[...board.querySelectorAll('button')];assert.equal(w._spellTarget,'apple');assert.equal(buttons.filter(b=>b.dataset.l==='p').length,2);w.pickLetter(document.createElement('button'),board.id);w.pickLetter(buttons[0],'missing');
 const wrong=buttons.find(b=>b.dataset.l!=='a');w.pickLetter(wrong,board.id);w.pickLetter(wrong,board.id);assert.equal(w._spellPicked.length,1);for(const b of buttons.filter(b=>b!==wrong).slice(0,4))w.pickLetter(b,board.id);assert.equal(board.dataset.locked,'1');assert.equal(w.state.practice.progress['english_spell_'+theme.id]||0,0);
 w.resetSpelling(board.id);assert.equal(w._spellPicked.length,0);assert.equal(board._retryTimer,null);advance(1000);assert.equal(w._spellPicked.length,0);
 for(const tile of [wrong,...buttons.filter(b=>b!==wrong).slice(0,4)])w.pickLetter(tile,board.id);assert.equal(board.dataset.locked,'1');advance(1000);assert.equal(w._spellPicked.length,0);assert.equal(document.getElementById(board.id+'_answer').textContent,'');assert.ok(buttons.every(b=>b.style.visibility==='visible'));
 for(const letter of 'apple'){const tile=buttons.find(b=>b.dataset.l===letter&&b.style.visibility!=='hidden');w.pickLetter(tile,board.id);}assert.equal(board.dataset.solved,'1');assert.equal(w.state.english.learned.apple,true);assert.equal(w.state.stars,3);w.resetSpelling(board.id);w.pickLetter(buttons[0],board.id);assert.equal(w.state.stars,3);advance(3000);assert.ok(choiceBoard(document,'sp'));w.resetSpelling('missing');
});

test('read-along compares recognized text, retries gently and rewards only once',t=>{
 const {w,document,advance}=createApp(t);const theme=w.ENGLISH.themes[0];let heard='nonsense';w.startRecognition=callback=>callback(heard);
 w.startReadAlong(theme.id);let word=theme.words[0].w;w.doReadAlong(word);assert.match(document.querySelector('#readResult').textContent,/还不太一样/);assert.equal(w.state.stars,0);heard=word;w.doReadAlong(word);w.doReadAlong(word);assert.equal(w.state.stars,2);assert.equal(w.state.english.learned[word],true);assert.match(document.querySelector('#readResult').textContent,/已经领过/);w.creditReadPractice('word');advance(3000);assert.equal(w.state.practice.progress['english_read_'+theme.id],1);
 w.startSentenceRead(11);heard='wrong';w.doSentenceRead(11);assert.match(document.querySelector('#srResult').textContent,/还不太一样/);heard='bye bye';w.doSentenceRead(11);w.doSentenceRead(11);assert.equal(w.state.stars,4);advance(3000);assert.match(document.querySelector('#modal').textContent,/Hello/);
 assert.equal(w.calcSimilarity('', 'a'),0);assert.equal(w.calcSimilarity('!!!','abc'),0);assert.equal(w.calcSimilarity('Hello!','hello'),1);assert.ok(w.calcSimilarity('cot','cat')>.6);assert.equal(w.calcSimilarity('dog','cat'),0);
});

test('parent confirmations credit sentence and word participation once',t=>{
 const {w,document,advance}=createApp(t);w.confirmParentRead('word','apple');const theme=w.ENGLISH.themes[0];w.startReadAlong(theme.id);w.confirmParentRead('word',theme.words[0].w);w.confirmParentRead('word',theme.words[0].w);assert.equal(w.state.stars,2);assert.match(document.querySelector('#readResult').textContent,/已经记录/);advance(3000);assert.ok(document.querySelector('#readStatus'));w.startSentenceRead(0);w.confirmParentRead('sentence',0);w.confirmParentRead('sentence',0);assert.equal(w.state.stars,4);advance(3000);assert.match(document.querySelector('#modal').textContent,/Thank you/);
});

test('story library filters and favorites, preserves current page and changes visual reading options',t=>{
 const {w,document}=createApp(t);w.switchTab('stories');assert.equal(document.querySelectorAll('.story-card').length,w.STORIES.length);w.filterStories('fav',document.querySelectorAll('#storyFilters .pill')[3]);assert.equal(document.querySelectorAll('.story-card').length,0);
 w.toggleFavStory(1);assert.ok(w.state.stories.favorites.includes(1));assert.match(w.renderStoryList('fav'),new RegExp(w.STORIES[0].t));w.filterStories('中国经典',document.querySelectorAll('#storyFilters .pill')[1]);assert.equal(document.querySelectorAll('.story-card').length,w.STORIES.filter(s=>s.c==='中国经典').length);
 w.state.stories.read.push(1);assert.match(w.renderStoryList('all'),/✓/);w.showStory(-1);w.showStory(1);assert.equal(w.state.stories.currentPage,0);assert.match(document.querySelector('#modal').textContent,/已收藏/);w.nextStoryPage();assert.equal(w.state.stories.currentPage,1);w.showStory(1);assert.equal(w.state.stories.currentPage,1);w.prevStoryPage();assert.equal(w.state.stories.currentPage,0);w.showStory(2);assert.equal(w.state.stories.currentPage,0);
 w.toggleFavStory(1);assert.equal(w.state.stories.favorites.length,0);w.toggleNightMode();assert.ok(document.body.classList.contains('night'));w.toggleNightMode();assert.ok(!document.body.classList.contains('night'));w.toggleAutoRead();assert.equal(w.state.stories.autoRead,true);w.toggleAutoRead();assert.equal(w.state.stories.autoRead,false);
 w.state.stories.read=w.STORIES.map(s=>s.id);w.randomStory();assert.ok(w.STORIES.some(s=>s.id===w.state.stories.currentStory));w.state.stories.read=[];w.randomStory();assert.ok(document.querySelector('#storyReader'));
 w.state.stories.currentStory=-1;w.renderStoryPage();assert.ok(!document.querySelector('#modal-overlay').classList.contains('show'));w.speakStoryPage();
});

test('story playback callbacks advance only the active visible story and stop on its last page',t=>{
 const {w,document,advance}=createApp(t);let callbacks;w.playAudio=(url,text,mode,cb)=>{callbacks=cb;};w.switchTab('stories');w.showStory(1);w.speakStoryPage();callbacks.onstart();assert.match(document.querySelector('#readBtn').textContent,/朗读中/);callbacks.onerror();assert.equal(document.querySelector('#readBtn').textContent,'🔊 朗读');callbacks.onend();assert.equal(w.state.stories.currentPage,0);
 w.toggleAutoPlay();assert.equal(w.state.stories.autoPlay,true);callbacks.onend();advance(900);assert.equal(w.state.stories.currentPage,1);w.toggleAutoPlay();assert.equal(w.state.stories.autoPlay,false);assert.match(document.querySelector('#autoPlayBtn').textContent,/关/);
 w.toggleAutoPlay();callbacks.onend();w.state.currentTab='poems';advance(900);assert.equal(w.state.stories.currentPage,1);w.state.currentTab='stories';w.state.stories.currentPage=w.STORIES[0].p.length-1;w.renderStoryPage();callbacks.onend();assert.equal(w.state.stories.autoPlay,false);assert.match(document.querySelector('#autoPlayBtn').textContent,/关/);assert.match(document.querySelector('#modal').textContent,/读完啦/);
 w.closeModal();w.toggleAutoPlay();w.toggleAutoPlay();assert.equal(w.state.stories.autoPlay,false);
});

test('legacy story answer control locks reward and distinguishes a wrong answer',t=>{
 const {w,document}=createApp(t);const content='<div id="storyTest"><button class="option-btn" data-t="yes">yes</button><button class="option-btn" data-t="no">no</button></div>';
 w.showModal(content,'');w.checkStoryQuiz('storyTest','no','yes');assert.equal(w.state.stars,0);assert.ok(document.querySelector('[data-t="no"]').classList.contains('wrong'));w.showModal(content,'');w.checkStoryQuiz('storyTest','yes','yes');w.checkStoryQuiz('storyTest','yes','yes');assert.equal(w.state.stars,1);
});
