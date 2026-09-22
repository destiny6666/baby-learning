const {test}=require('node:test'),assert=require('node:assert/strict'),{createApp}=require('./harness.cjs');

test('learning UI escapes content, reports missing audio only for the current modal, and tolerates absent controls',t=>{
 const {w,document}=createApp(t);assert.equal(w.learningEscape('<&>"\''),'&lt;&amp;&gt;&quot;&#39;');assert.match(w.learningSteps(['a','b'],1),/✓ a/);assert.equal(w.learningDots(0),'空空的');assert.equal(w.learningDots(3),'●●●');
 w.learningMark(10,true);w.learningFeedback('no element');w.showModal('<div id="learningFeedback"></div>');let pending;
 w.speak=(text,mode,extra)=>{pending=extra;};w.learningSpeak('test');pending.onerror({error:'canceled'});assert.equal(document.getElementById('learningFeedback').textContent,'');pending.onerror({error:'failure'});assert.match(document.getElementById('learningFeedback').textContent,/无法朗读/);
 w.learningSpeak('old');w.showModal('new');pending.onerror({error:'failure'});assert.equal(document.getElementById('modal').textContent.includes('无法朗读'),false);
});

test('math questions respect 5/10 limits, include addition/subtraction and equal quantities',t=>{
 const {w}=createApp(t);let seed=93;w.Math.random=()=>((seed=seed*16807%2147483647)/2147483647);const kinds=new Set(),comparisons=new Set();
 for(const level of [0,1])for(const kind of ['combine','make','compare','pattern'])for(let i=0;i<100;i++){
  const q=w.makeChallengeQuestion(kind,level);assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(q.options.includes(q.answer));assert.ok(q.quantities.every(n=>n>=0&&n<=(level?10:5)));if(kind==='compare'){comparisons.add(q.answer);assert.equal(q.answer==='一样多',q.quantities[0]===q.quantities[1]);}if(kind==='combine')kinds.add(q.prompt.includes('拿走')?'minus':'plus');
 }assert.equal(kinds.size,2);assert.equal(comparisons.size,3);assert.match(w.fruitGroup(0),/空篮子/);
});

for(const kind of ['combine','make','compare','pattern'])test('math '+kind+' completes ten activities, retries and resumes without duplicate credit',t=>{
 const {w,document}=createApp(t);w.startChallenge('invalid');assert.equal(w._challenge,null);w.speakChallenge();w.hintChallenge();w.answerChallenge(0);w.nextChallenge();
 w.startChallenge(kind);w.nextChallenge();assert.equal(w._challenge.index,0);w.hintChallenge();assert.ok(document.getElementById('learningFeedback').textContent);
 for(let i=0;i<10;i++){
  const q=w._challenge.question;w.answerChallenge(-1);w.answerChallenge(99);if(i===0){w.answerChallenge(q.options.findIndex(v=>v!==q.answer));assert.equal(q.firstTry,false);assert.equal(q.solved,false);}
  w.answerChallenge(q.options.indexOf(q.answer));w.answerChallenge(q.options.indexOf(q.answer));assert.equal(w.state.practice.progress['math_'+kind],i+1);
  w.nextChallenge();if(i===3){w.closeModal();w.startChallenge(kind);assert.equal(w._challenge.index,4);}
 }assert.equal(w.state.numbers.challengeDone,1);assert.equal(w.state.numbers.quizDone,10);assert.equal(w.state.numbers.skills[kind],1);assert.match(document.getElementById('modal').textContent,/10 \/ 10/);w.nextChallenge();assert.equal(w.state.numbers.quizDone,10);
});

test('English fresh rounds choose three distinct entirely new words and resume exactly the saved deck',t=>{
 const {w,json}=createApp(t);for(let id=0;id<6;id++){
  w.startEnglishLesson(id);const initial=w._lesson.deckCode,words=json(w._lesson.data.words).map(v=>v.w);assert.equal(new Set(words).size,3);w.advanceLesson();w.answerLesson(w._lesson.question.answer);w.advanceLesson();w.closeModal();w.startEnglishLesson(id);assert.equal(w._lesson.deckCode,initial);assert.equal(w._lesson.index,1);
  const saved=w.normalizeState(json(w.state));assert.equal(saved.english.lessonDecks[id],initial);w.state.practice.progress['english_lesson_'+id]=10;w.startEnglishLesson(id);assert.ok(w._lesson.data.words.every(v=>!words.includes(v.w)));assert.notEqual(w._lesson.deckCode,initial);
 }for(const code of [-1,0,3375,1.5,NaN])assert.equal(w.validLessonDeck(0,code),false);assert.equal(w.validLessonDeck(6,17),false);assert.throws(()=>w.normalizeState({english:{lessonDecks:{0:0}}}));
});

test('English phrases match every theme word and legacy lesson text remains stable',t=>{
 const {w}=createApp(t);for(const theme of w.ENGLISH.themes)for(const word of theme.words){const phrase=w.lessonPhrase(theme.id,word);assert.ok(phrase.en);assert.ok(phrase.cn.includes(word.cn));}
 assert.equal(w.lessonPhrase('fruits',{w:'peach',cn:'桃子'}).en,'I like peaches.');
 assert.equal(w.lessonPhrase('fruits',{w:'strawberry',cn:'草莓'}).en,'I like strawberries.');assert.equal(w.lessonPhrase('fruits',{w:'mango',cn:'芒果'}).en,'I like mangoes.');assert.equal(w.lessonPhrase('food',{w:'egg',cn:'鸡蛋'}).en,'An egg, please.');assert.equal(w.lessonPhrase('toys',{w:'blocks',cn:'积木'}).en,'Blocks, please.');
 for(let i=0;i<6;i++)assert.equal(w.lessonData(i,null).phrase,w.ENGLISH_LESSONS[i].phrase);
});

test('all English themes complete 10 questions, guard skips, retain review words across deck changes and award once',t=>{
 const {w,document}=createApp(t);w.startEnglishLesson(-1);w.lessonWord(0);w.lessonAudio();w.answerLesson(0);w.advanceLesson();w.finishLesson();w.finishEnglishReview();
 for(let run=0;run<2;run++)for(let id=0;id<6;id++){
  w.startEnglishLessonForTheme(w.ENGLISH_LESSONS[id].theme);assert.equal(w._lesson.id,id);w.lessonWord(0);w.lessonWord(999);w.lessonAudio();w.finishLesson();w.advanceLesson();
  for(let i=0;i<9;i++){w.advanceLesson();assert.equal(w._lesson.index,i);const q=w._lesson.question;w.answerLesson(99);w.answerLesson((q.answer+1)%3);assert.equal(Object.keys(w.state.english.review).length,1);w.answerLesson(q.answer);w.answerLesson(q.answer);assert.equal(Object.keys(w.state.english.review).length,0);w.advanceLesson();}
  assert.equal(w._lesson.step,3);w.lessonAudio();w.advanceLesson();w.finishEnglishReview();w.finishLesson();w.finishLesson();assert.equal(w.state.practice.progress['english_lesson_'+id],10);assert.equal(w.state.english.lessons[id],4);assert.match(document.getElementById('modal').textContent,/10 \/ 10/);
 }assert.equal(w.state.stars,18);assert.match(w.renderEnglishPath(),/6 \/ 6/);w.startEnglishLessonForTheme('unknown');assert.equal(w._lesson.id,0);
});

test('English review preserves original word choices after a new deck and supports old backup review keys',t=>{
 const {w,json}=createApp(t);w.startEnglishReview();assert.equal(w._lesson,null);w.startEnglishLesson(0);w.advanceLesson();const original=json(w._lesson.data.words);w.answerLesson((w._lesson.question.answer+1)%3);const key=Object.keys(w.state.english.review)[0];assert.equal(w.validReviewKey(key),true);w.chooseLessonDeck(0,true);w.startEnglishReview();assert.deepEqual(json(w._lesson.data.words),original);assert.match(w.renderEnglishPath(),/复习/);w.finishEnglishReview();assert.ok(w._lesson);w.answerLesson(w._lesson.question.answer);w.finishEnglishReview();assert.equal(w._lesson,null);assert.deepEqual(json(w.state.english.review),{});assert.equal(w.state.practice.progress.english_lesson_0||0,0);
 w.state.english.review['0:7']=1;w.startEnglishReview();assert.equal(w._lesson.step,2);assert.equal(w._lesson.data.phrases[1],'Hello, dog!');w.answerLesson(w._lesson.question.answer);w.finishEnglishReview();assert.deepEqual(json(w.state.english.review),{});
 for(const bad of ['0:1:000','0:1:0','0:9','6:0','01:0','0:1:99999','length:1'])assert.equal(w.validReviewKey(bad),false);
});

test('English day streak increments yesterday, stays today, and resets after a gap',t=>{
 const {w}=createApp(t);const d=new Date();d.setDate(d.getDate()-1);w.state.english.lastStudy=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();w.state.english.streak=4;w.touchEnglishDay();assert.equal(w.state.english.streak,5);w.touchEnglishDay();assert.equal(w.state.english.streak,5);w.state.english.lastStudy='2000-1-1';w.touchEnglishDay();assert.equal(w.state.english.streak,1);
});

test('story guides cover all titles, levels, retries, ordered scenes, oral prompts and repeated rewards',t=>{
 const {w,json,document}=createApp(t);w.showStoryQuiz(-1);assert.equal(w._reading,null);w.speakReading();w.speakReadingOption(0);w.answerReading(0);w.speakStoryEvent(0);w.pickStoryEvent(0);w.resetStoryOrder();w.checkStoryOrder();w.advanceReading();w.finishReading();assert.equal(w.readingPrompt(-1),'');
 for(const level of [0,1])for(const s of w.STORIES){
  w.state.stories.readingLevel=level;w.state.stories.currentStory=s.id;w.state.stories.currentPage=s.p.length-1;w.showStoryQuiz(s.id);assert.ok(w.readingPrompt(s.id));w.completeStoryReading(s.id);
  for(let i=0;i<4;i++){w.advanceReading();assert.equal(w._reading.index,i);w.speakReadingOption(0);w.speakReadingOption(99);w.answerReading(99);w.answerReading((w._reading.question.answer+1)%3);assert.equal(w._reading.question.solved,false);w.answerReading(w._reading.question.answer);w.answerReading(w._reading.question.answer);w.advanceReading();}
  for(let i=0;i<3;i++){w.checkStoryOrder();assert.match(document.getElementById('learningFeedback').textContent,/每张图片/);w.pickStoryEvent(99);w.speakStoryEvent(0);w.speakStoryEvent(99);w.pickStoryEvent(w._reading.events.length-1);w.pickStoryEvent(w._reading.events.length-1);assert.equal(w._reading.sequence.length,1);for(let j=w._reading.events.length-2;j>=0;j--)w.pickStoryEvent(j);w.checkStoryOrder();assert.deepEqual(json(w._reading.sequence),[]);w._reading.events.forEach((_,j)=>w.pickStoryEvent(j));w.checkStoryOrder();w.checkStoryOrder();w.resetStoryOrder();assert.equal(w._reading.ordered,true);w.advanceReading();}
  for(let i=0;i<3;i++){w.speakReading();w.finishReading();}w.finishReading();assert.equal(w._reading,null);assert.equal(w.state.stories.training[s.id],level+1);
 }assert.equal(w.state.stories.read.length,50);assert.equal(w.state.stars,250);assert.ok(Object.values(w.state.stories.training).every(v=>v===2));
});

test('closing a lesson disables stale answer and next handlers',t=>{
 const {w}=createApp(t);w.startChallenge('make');w.closeModal();w.answerChallenge(0);w.nextChallenge();assert.equal(w.state.numbers.quizDone,0);w.startEnglishLesson(0);w.advanceLesson();w.closeModal();w.answerLesson(w._lesson.question.answer);w.advanceLesson();assert.equal(w.state.practice.progress.english_lesson_0||0,0);w.showStoryQuiz(1);w.closeModal();w.answerReading(w._reading.question.answer);w.advanceReading();assert.equal(w.state.practice.progress.story_1_0||0,0);
});
