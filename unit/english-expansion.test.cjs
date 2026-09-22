const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createApp}=require('./harness.cjs');
const originals={
 animals:'cat|dog|fish|bird|rabbit|bear|lion|tiger|elephant|monkey|duck|pig|cow|sheep|horse',
 colors:'red|blue|green|yellow|orange|purple|pink|white|black|brown|gray|gold|silver|rainbow|colorful',
 fruits:'apple|banana|orange|grape|strawberry|watermelon|pear|peach|cherry|lemon|mango|kiwi|pineapple|coconut|blueberry',
 body:'head|eye|nose|mouth|ear|hand|foot|arm|leg|finger|tooth|hair|face|shoulder|knee',
 food:'bread|milk|egg|rice|cake|cookie|candy|ice cream|pizza|hamburger|noodle|soup|cheese|juice|chocolate',
 toys:'ball|doll|car|train|blocks|puzzle|teddy|robot|kite|drum|balloon|book|crayon|bubble|swing'
};
const encode=indices=>10000+indices.reduce((total,i)=>total*25+i,0);

test('six 25-card themes preserve old word/audio positions and offer usable new pictures and sentences',t=>{
 const {w,json,document}=createApp(t);assert.equal(w.ENGLISH.themes.length,6);
 for(const theme of w.ENGLISH.themes){
  assert.equal(theme.words.length,25);assert.equal(new Set(theme.words.map(v=>v.w)).size,25);
  assert.deepEqual(json(theme.words.slice(0,15).map(v=>v.w)),originals[theme.id].split('|'));
  for(const word of theme.words){const picture=w.wordPicture(word),phrase=w.lessonPhrase(theme.id,word);assert.ok(picture);assert.ok(!picture.includes('undefined'));assert.ok(phrase.en);assert.ok(phrase.cn.includes(word.cn));}
  document.getElementById('main').innerHTML=w.renderEnglishTheme(theme.id);assert.equal(document.querySelectorAll('.word-card').length,25);
 }
 assert.equal(w.lessonPhrase('fruits',{w:'raspberry',cn:'树莓'}).en,'I like raspberries.');
 assert.equal(w.lessonPhrase('food',{w:'sandwich',cn:'三明治'}).en,'A sandwich, please.');
 assert.equal(w.lessonPhrase('toys',{w:'yo-yo',cn:'悠悠球'}).en,'A yo-yo, please.');
 assert.equal(w.wordPicture({e:'<img onerror=x>',cn:'test'}),'&lt;img onerror=x&gt;');
});

test('all legacy decks retain their precise three words, and new deck ranges reject malformed imports',t=>{
 const {w,json}=createApp(t);
 for(let a=0;a<15;a++)for(let b=0;b<15;b++)for(let c=0;c<15;c++){
  const code=a*225+b*15+c;assert.deepEqual(json(w.decodeLessonDeck(code)),[a,b,c]);assert.equal(w.validLessonDeck(0,code),new Set([a,b,c]).size===3);
 }
 for(const indices of [[0,15,24],[24,23,22],[1,2,3]]){const code=encode(indices);assert.deepEqual(json(w.decodeLessonDeck(code)),indices);assert.equal(w.validLessonDeck(0,code),true);assert.equal(w.validReviewKey('0:8:'+code),true);const normalized=w.normalizeState({english:{lessonDecks:{0:code},review:{['0:8:'+code]:1}}});assert.equal(normalized.english.lessonDecks[0],code);}
 for(const code of [-1,3375,9999,10000,25625,26000,Infinity,NaN,10200.5,'10027']){assert.equal(w.validLessonDeck(0,code),false);assert.throws(()=>w.normalizeState({english:{lessonDecks:{0:code}}}));}
 assert.equal(w.validLessonDeck(6,encode([1,2,3])),false);
});

test('each of all 25 words can be drawn and fresh decks exclude every previous word',t=>{
 const {w,json}=createApp(t);let seed=579;w.Math.random=()=>((seed=seed*16807%2147483647)/2147483647);
 for(let id=0;id<6;id++){
  const seen=new Set();let previous=[];
  for(let round=0;round<120;round++){
   const code=w.chooseLessonDeck(id,true),indices=json(w.decodeLessonDeck(code));assert.ok(code>=10000);assert.equal(w.validLessonDeck(id,code),true);assert.equal(w.chooseLessonDeck(id,false),code);assert.equal(new Set(indices).size,3);assert.ok(indices.every(i=>!previous.includes(i)));indices.forEach(i=>seen.add(i));previous=indices;
  }
  assert.equal(seen.size,25);
 }
});

test('old saved round and old review deck survive expansion while the next round uses the new format',t=>{
 const {w,json}=createApp(t),oldCode=0*225+1*15+14,oldWords=['cat','dog','horse'];
 w.state.english.lessonDecks[0]=oldCode;w.state.practice.progress.english_lesson_0=3;w.state.english.lessons[0]=1;
 w.startEnglishLesson(0);assert.equal(w._lesson.deckCode,oldCode);assert.equal(w._lesson.index,3);assert.deepEqual(json(w._lesson.data.words.map(v=>v.w)),oldWords);
 w.closeModal();w.state=w.normalizeState(json(w.state));w.startEnglishLesson(0);assert.equal(w._lesson.deckCode,oldCode);assert.equal(w._lesson.index,3);
 w.state.practice.progress.english_lesson_0=10;w.startEnglishLesson(0);const newCode=w._lesson.deckCode;assert.ok(newCode>=10000);assert.ok(w._lesson.data.words.every(v=>!oldWords.includes(v.w)));
 w.closeModal();w.state.english.review['0:0:'+oldCode]=1;w.startEnglishReview();assert.deepEqual(json(w._lesson.data.words.map(v=>v.w)),oldWords);w.answerLesson(w._lesson.question.answer);w.finishEnglishReview();assert.equal(w.state.english.lessonDecks[0],newCode);assert.equal(w.state.practice.progress.english_lesson_0,0);
});

test('color shades are different visible swatches in warmup, listening options and oral practice',t=>{
 const {w,document}=createApp(t),theme=w.ENGLISH.themes.find(v=>v.id==='colors');
 const shades=theme.words.slice(15);assert.equal(new Set(shades.map(v=>w.wordPicture(v))).size,10);
 for(const word of shades){const host=document.createElement('div');host.innerHTML=w.wordPicture(word);assert.ok(host.firstElementChild.style.background);assert.equal(host.firstElementChild.getAttribute('aria-label'),word.cn);}
 assert.notEqual(w.wordPicture(theme.words[15]),w.wordPicture(theme.words[16]));
 const id=w.ENGLISH_LESSONS.findIndex(v=>v.theme==='colors');w.state.english.lessonDecks[id]=encode([15,16,23]);w.startEnglishLesson(id);assert.equal(document.querySelectorAll('#englishLesson [role="img"]').length,3);
 w.advanceLesson();assert.equal(document.querySelectorAll('#learningOptions [role="img"]').length,3);
 w.state.practice.progress['english_lesson_'+id]=9;w.startEnglishLesson(id);assert.equal(document.querySelectorAll('.phrase-card [role="img"]').length,1);
});

test('English library is immediately visible, report comes last, and all-card badge counts repeated words correctly',t=>{
 const {w,document}=createApp(t);w.switchTab('english');assert.equal(document.querySelector('details.learning-library'),null);assert.ok(document.querySelector('section.learning-library'));assert.equal(document.querySelectorAll('.theme-card').length,6);assert.match(document.querySelector('.stats-row').textContent,/0\/150/);
 const titles=[...document.querySelectorAll('.card-title')].map(v=>v.textContent);assert.equal(titles.at(-1),'📊 学习报告');
 const badge=w.BADGES_DEF.find(v=>v.id==='english_90');w.state.english.learned={};assert.equal(badge.check(),false);
 for(const theme of w.ENGLISH.themes)for(const word of theme.words)w.state.english.learned[word.w]=true;
 assert.equal(Object.keys(w.state.english.learned).length,148);assert.equal(badge.check(),true);w.renderModule();assert.match(document.querySelector('.stats-row').textContent,/150\/150/);
 delete w.state.english.learned.orange;assert.equal(badge.check(),false);w.renderModule();assert.match(document.querySelector('.stats-row').textContent,/148\/150/);
});
