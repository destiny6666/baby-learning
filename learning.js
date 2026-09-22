// Short, parent-assisted activities for children around three and a half.
function learningEscape(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function learningButton(text,action,color){return '<button class="btn '+(color||'btn-purple')+'" onclick="'+action+'">'+text+'</button>';}
function learningSteps(labels,current){return '<div class="lesson-steps">'+labels.map(function(label,i){return '<span class="lesson-step'+(i===current?' current':'')+'">'+(i<current?'✓ ':i+1+' ')+label+'</span>';}).join('')+'</div>';}
function learningFeedback(text,success){var el=document.getElementById('learningFeedback');if(el){el.textContent=text;el.classList.toggle('success',!!success);}}
function learningSpeak(text,english){var session=_modalGeneration;speak(text,english?'en':'child',{onerror:function(e){if(session===_modalGeneration&&e.error!=='canceled'&&e.error!=='interrupted')learningFeedback('暂时无法朗读，请重试，或请家长打开文字提示。');}});}
function learningFooter(){return learningButton('先休息一下','closeModal()','btn-blue');}
function learningDots(n){return n?new Array(n+1).join('●'):'空空的';}
function learningOptions(options,action,pictures){return '<div class="picture-options" id="learningOptions">'+options.map(function(o,i){var icon=o==='小兔这边'?'🐰':o==='小熊这边'?'🐻':o==='一样多'?'＝':'';return '<button class="option-btn" onclick="'+action+'('+i+')">'+(pictures?'<span class="picture">'+wordPicture(o)+'</span><strong>'+learningEscape(o.cn)+'</strong>':(icon?'<span class="picture">'+icon+'</span>':'')+'<strong>'+learningEscape(o)+'</strong>'+(typeof o==='number'?'<span class="quantity-dots">'+learningDots(o)+'</span>':''))+'</button>';}).join('')+'</div>';}
function learningLock(){document.querySelectorAll('#learningOptions button').forEach(function(b){b.disabled=true;});}
function learningMark(index,correct){var el=document.querySelectorAll('#learningOptions button')[index];if(el)el.classList.add(correct?'correct':'wrong');}

// ==================== GENTLE MATH ====================
var MATH_PLAY=[
  {id:'combine',e:'🍎',title:'合起来与拿走',desc:'小动物分水果，看图做加减。'},
  {id:'make',e:'🧺',title:'还差几个',desc:'给小篮子装满水果，试试凑数。'},
  {id:'compare',e:'🐰',title:'谁的多一点',desc:'比一比两组小动物，找更多，也找一样多。'},
  {id:'pattern',e:'🔴',title:'接着排一排',desc:'红黄轮流来，找到下一个。'}
];
var _challenge=null;
function renderNumberPlay(){
  return '<div class="section-title">🔢 数字王国</div><div class="subtitle">会认数字了，来玩一点点新挑战！</div>'+
    '<div class="learning-hero"><span class="learning-tag">3岁半亲子数学 · 每轮10题</span><h2>动动小脑筋，摆摆小手指</h2><p>先从5以内开始。可以数图片，也可以拿积木摆一摆，随时休息，下次接着玩。</p><div class="learning-controls">'+
    [0,1].map(function(n){return '<button class="btn btn-blue" aria-pressed="'+(state.numbers.difficulty===n)+'" onclick="setMathDifficulty('+n+')">'+(n?'试一试 · 10以内':'轻松玩 · 5以内')+'</button>';}).join('')+'</div></div>'+
    '<div class="learning-report">🌱 已完成 <strong>'+state.numbers.challengeDone+'</strong> 轮小游戏 · 每轮慢慢想，不计时</div><div class="learning-grid">'+MATH_PLAY.map(function(m){return '<div class="learning-card"><span class="learning-icon">'+m.e+'</span><h3>'+m.title+'</h3><p>'+m.desc+'</p><span class="learning-meta">已玩 '+(state.numbers.skills[m.id]||0)+' 轮</span>'+learningButton('开始'+m.title,"startChallenge('"+m.id+"')",'btn-blue')+'</div>';}).join('')+'</div>';
}
function setMathDifficulty(n){if(n!==0&&n!==1)return;state.numbers.difficulty=n;saveState();renderModule();}
function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1));}
function numberChoices(answer,cap){var pool=[];for(var i=0;i<=cap;i++)if(i!==answer)pool.push(i);return shuffle([answer].concat(shuffle(pool).slice(0,2)));}
function fruitGroup(n){return '<span class="object-group">'+(n?new Array(n+1).join('🍎 '):'空篮子')+'</span>';}
function makeChallengeQuestion(kind,level,index){
  var cap=level?10:5,a,b,answer,q={quantities:[],firstTry:true,solved:false};
  if(kind==='combine'){
    a=randomInt(1,cap-1);b=randomInt(1,cap-a);var plus=Math.random()<.5;
    q.quantities=[a,b,a+b];answer=plus?a+b:a;
    q.scene={mode:plus?'add':'take',start:a,change:b,total:a+b};
    q.prompt=plus?'有'+a+'个苹果，又来了'+b+'个。一共有几个？':'有'+(a+b)+'个苹果，拿走'+b+'个。还剩几个？';
    q.visual=plus?fruitGroup(a)+'<span>＋</span>'+fruitGroup(b):fruitGroup(a+b)+'<span>拿走 '+b+' 个</span>';
    q.hint=plus?'把两组苹果放在一起，从1开始慢慢数。':'用手遮住要拿走的苹果，再数一数剩下的。';
    q.explain=plus?a+' 加 '+b+'，一共 '+answer+' 个。':(a+b)+' 拿走 '+b+'，还剩 '+answer+' 个。';
  }else if(kind==='make'){
    var total=level?randomInt(6,10):3+(Number.isInteger(index)?index%3:0);a=randomInt(1,total-1);answer=total-a;q.quantities=[total,a,answer];
    q.scene={mode:'fill',start:a,change:answer,total:total};
    q.prompt='篮子要装'+total+'个苹果，已经有'+a+'个，还差几个？';
    q.visual=fruitGroup(a)+'<span>＋</span><span class="object-group">'+new Array(answer+1).join('◯ ')+'</span>';
    q.hint='一个空位放一个苹果，数一数还有几个空位。';q.explain=a+' 个苹果，再放 '+answer+' 个，就有 '+total+' 个。';
  }else if(kind==='compare'){
    var equal=Math.random()<1/3;a=randomInt(1,equal?cap:cap-1);b=equal?a:a+1;answer=equal?'一样多':Math.random()<.5?'小兔这边':'小熊这边';
    var left=answer==='小兔这边'?b:a,right=answer==='小熊这边'?b:a;q.quantities=[left,right];
    q.prompt='哪一边的小动物更多？如果两边相同，就选“一样多”。';q.visual='<span class="object-group">'+new Array(left+1).join('🐰 ')+'</span><span class="object-group">'+new Array(right+1).join('🐻 ')+'</span>';
    q.options=shuffle(['小兔这边','小熊这边','一样多']);q.hint='一只小兔配一只小熊，看看有没有多出来的；都能配成对，就是一样多。';q.explain=equal?'两边都是 '+a+' 只，一样多。':answer+'有 '+b+' 只，比另一边多 1 只。';
  }else{
    var colors=shuffle([{e:'🔴',cn:'红色'},{e:'🟡',cn:'黄色'},{e:'🔵',cn:'蓝色'}]),cycle=level?[colors[0],colors[0],colors[1]]:[colors[0],colors[1]],extra=randomInt(0,cycle.length-1);
    answer=cycle[extra].e;q.prompt='找找规律，下一个应该放哪个？';q.visual=cycle.concat(cycle,cycle.slice(0,extra)).map(function(c){return c.e;}).join(' ')+' ❔';
    q.options=shuffle(['🔴','🟡','🔵']);q.hint=(level?'两个':'一个')+colors[0].cn+'、一个'+colors[1].cn+'，照着这个顺序继续排。';q.explain='下一颗是'+cycle[extra].cn+'。'+q.hint;q.quantities=[cycle.length];
  }
  q.answer=answer;q.options=q.options||numberChoices(answer,cap);return q;
}
function mathIllustration(q){
  var s=q.scene,slots='';
  for(var i=0;i<s.total;i++){
    var changed=i>=s.start,delay=changed?Math.min(i-s.start,4)*100:0;
    slots+='<span class="math-apple-slot'+(changed?' is-change':'')+'" style="--fruit-delay:'+delay+'ms"><span class="math-apple" aria-hidden="true">🍎</span>'+(changed&&s.mode!=='take'?'<span class="math-new-mark" aria-hidden="true">＋</span>':'')+'</span>';
  }
  var taken=s.mode==='take'?'<div class="math-taken"><span>🖐️ 拿走的</span><span class="math-taken-pile">'+new Array(s.change+1).join('<span class="math-taken-fruit" aria-hidden="true">🍎</span>')+'</span></div>':'';
  return '<div id="mathIllustration" class="math-illustration math-'+s.mode+' math-motion" role="img" aria-label="'+learningEscape(q.prompt)+'"><div class="math-basket"><span class="math-basket-label">'+(s.mode==='take'?'🧺 留在篮子里':s.mode==='fill'?'🧺 一个空位，放一个':'🧺 苹果来集合')+'</span><div class="math-apple-grid">'+slots+'</div></div>'+taken+(s.mode==='fill'?'<div class="math-visual-note">虚线格里，是还要补上的苹果</div>':'')+'</div>';
}
function replayMathIllustration(){
  var illustration=document.getElementById('mathIllustration');
  if(!_challenge||!illustration||!document.getElementById('modal-overlay').classList.contains('show'))return;
  illustration.classList.remove('math-motion');void illustration.offsetWidth;illustration.classList.add('math-motion');
}
function startChallenge(kind){if(!MATH_PLAY.some(function(m){return m.id===kind;}))return;var index=practiceStart('math_'+kind,'数学小挑战');_challenge={kind:kind,level:state.numbers.difficulty,index:index,score:0,finished:false};renderChallenge();}
function renderChallenge(){
  practiceStart('math_'+_challenge.kind,'数学小挑战');
  _challenge.question=makeChallengeQuestion(_challenge.kind,_challenge.level,_challenge.index);var q=_challenge.question;
  showModal('<div id="mathChallenge"><p class="learning-meta">'+(_challenge.level?'10':'5')+'以内 · 想好了再选</p><h2 class="learning-question">'+q.prompt+'</h2>'+(q.scene?mathIllustration(q):'<div class="learning-visual">'+q.visual+'</div>')+learningOptions(q.options,'answerChallenge',false)+'<div class="learning-actions math-tools">'+learningButton('🔊 听题目','speakChallenge()','btn-blue')+learningButton('💡 小提示','hintChallenge()','btn-yellow')+(q.scene?'<button class="btn btn-purple" id="mathReplay" onclick="replayMathIllustration()">↻ 再看一遍</button>':'')+'</div><div class="learning-feedback" id="learningFeedback" aria-live="polite"></div><div class="learning-actions" id="learningNext"></div></div>',learningFooter());practiceAttach();
  speakChallenge();
}
function speakChallenge(){if(_challenge)learningSpeak(_challenge.question.prompt);}
function hintChallenge(){if(!_challenge)return;learningFeedback(_challenge.question.hint);learningSpeak(_challenge.question.hint);}
function answerChallenge(index){
  if(!_challenge||!document.getElementById('mathChallenge'))return;var q=_challenge.question;if(q.solved||index<0||index>=q.options.length)return;
  if(q.options[index]!==q.answer){q.firstTry=false;learningMark(index,false);learningFeedback('没关系，数一数再试试。'+q.hint);learningSpeak(q.hint);return;}
  q.solved=true;if(q.firstTry)_challenge.score++;learningMark(index,true);learningLock();learningFeedback('选对啦！'+q.explain,true);learningSpeak(q.explain);playSFX('correct');
  practiceRecord();state.numbers.quizDone++;if(_challenge.index===PRACTICE_LENGTH-1){state.numbers.challengeDone++;state.numbers.skills[_challenge.kind]=(state.numbers.skills[_challenge.kind]||0)+1;addStars(3);}saveState();
  document.getElementById('learningNext').innerHTML=learningButton(_challenge.index===PRACTICE_LENGTH-1?'查看结果':'下一题','nextChallenge()','btn-green');armNextButton();
}
function nextChallenge(){
  if(!_challenge||!_challenge.question.solved||_challenge.finished||!document.getElementById('mathChallenge'))return;
  if(++_challenge.index<PRACTICE_LENGTH){renderChallenge();return;}
  _challenge.finished=true;var kind=_challenge.kind;practiceContinue(function(){startChallenge(kind);});
}

// ==================== ENGLISH MINI LESSONS ====================
// Pictures stay recognizable without relying on written English or platform emoji shades.
function wordPicture(word){
  var colors={'red':'#e73535','blue':'#2471e8','green':'#29a64a','yellow':'#ffe03b','orange':'#ff8b22','purple':'#9845cb','pink':'#ef82bc','white':'#fff','black':'#161616','brown':'#88502d','gray':'#8b929c','gold':'linear-gradient(135deg,#a97709,#ffe78c,#bd8a11)','silver':'linear-gradient(135deg,#77818c,#f4f7fb,#9aa5b1)','light blue':'#a5dcff','dark blue':'#173775','light green':'#b9efaa','dark green':'#165831','light pink':'#ffd0e7','dark pink':'#b91c68','light purple':'#dbbafa','dark purple':'#542078','black and white':'linear-gradient(90deg,#161616 50%,#fff 50%)','red and yellow':'linear-gradient(90deg,#e73535 50%,#ffe03b 50%)'};
  if(colors[word.w]&&(/色|相间/.test(word.cn)))return '<span role="img" aria-label="'+learningEscape(word.cn)+'" style="display:inline-block;width:1em;height:1em;min-width:42px;min-height:42px;border:2px solid #667085;border-radius:22%;background:'+colors[word.w]+'"></span>';
  var fruit={mandarin:['#ff921d','round'],plum:['#773b85','round'],apricot:['#ffbd74','round'],raspberry:['#dd3355','berry'],blackberry:['#33263e','berry'],papaya:['#ff962e','slice'],'dragon fruit':['#f9f5f3','slice']};
  var part={eyebrow:[32,30],eyelashes:[32,40],cheek:[23,57],chin:[50,79],belly:[50,58],back:[50,49],elbow:[22,49],toe:[40,91]};
  var art='',spec=fruit[word.w],point=part[word.w];
  if(spec){
    if(spec[1]==='berry')art='<g fill="'+spec[0]+'" stroke="#fff" stroke-width="1">'+[[40,32],[58,32],[30,47],[49,47],[67,47],[39,63],[58,63],[49,76]].map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="13"/>';}).join('')+'</g>';
    else if(spec[1]==='slice')art='<ellipse cx="50" cy="54" rx="30" ry="42" fill="'+(word.w==='papaya'?'#669f40':'#e53c85')+'"/><ellipse cx="50" cy="54" rx="24" ry="36" fill="'+spec[0]+'"/>'+[30,42,54,66,78].map(function(y){return '<circle cx="46" cy="'+y+'" r="2" fill="#312b27"/><circle cx="55" cy="'+(y+4)+'" r="2" fill="#312b27"/>';}).join('');
    else art='<ellipse cx="50" cy="57" rx="36" ry="30" fill="'+spec[0]+'"/><path d="M50 29 Q64 54 50 84" fill="none" stroke="#ffffff80" stroke-width="3"/>';
    art+='<path d="M49 27 Q36 6 64 15 Q60 28 49 27" fill="#3b8c42"/>';
  }else if(point){
    if(['eyebrow','eyelashes','cheek','chin'].includes(word.w))art='<ellipse cx="50" cy="47" rx="32" ry="35" fill="#ffdab7"/><path d="M24 32 Q32 26 41 31 M59 31 Q68 26 76 32" fill="none" stroke="#68442f" stroke-width="4"/><path d="M25 40 Q32 47 40 40 M60 40 Q68 47 75 40 M38 64 Q50 72 62 64" fill="none" stroke="#68442f" stroke-width="3"/><path d="M26 42 L23 38 M31 44 L30 39 M36 43 L38 38" stroke="#68442f" stroke-width="2"/>';
    else art='<circle cx="50" cy="16" r="12" fill="#ffdab7"/><path d="M50 34 L50 63 M50 38 L24 49 L18 36 M50 38 L76 54 M50 63 L38 89 M50 63 L65 89" fill="none" stroke="'+(word.w==='back'?'#8177b8':'#4797ce')+'" stroke-width="13" stroke-linecap="round"/>'+(word.w==='back'?'<path d="M50 34 L50 60" stroke="#fff" stroke-width="2"/>':'<circle cx="46" cy="15" r="1.5"/><circle cx="54" cy="15" r="1.5"/>');
    art+='<circle cx="'+point[0]+'" cy="'+point[1]+'" r="8" fill="none" stroke="#e32845" stroke-width="3"/><path d="M'+(point[0]+10)+' '+point[1]+' h16" stroke="#e32845" stroke-width="3"/>';
  }
  return art?'<svg viewBox="0 0 100 100" role="img" aria-label="'+learningEscape(word.cn)+'" style="display:inline-block;width:1.2em;height:1.2em;min-width:56px;min-height:56px;vertical-align:middle">'+art+'</svg>':learningEscape(word.e);
}
var ENGLISH_LESSONS=[
  {theme:'animals',e:'🐶',title:'和小动物打招呼',words:[{w:'cat',e:'🐱',cn:'小猫'},{w:'dog',e:'🐶',cn:'小狗'},{w:'rabbit',e:'🐰',cn:'小兔'}],phrase:'Hello, dog!',cn:'小狗，你好！',tip:'拿起小狗玩偶，一起挥挥手说 Hello, dog!'},
  {theme:'fruits',e:'🍌',title:'水果野餐会',words:[{w:'apple',e:'🍎',cn:'苹果'},{w:'banana',e:'🍌',cn:'香蕉'},{w:'orange',e:'🍊',cn:'橙子'}],phrase:'I like bananas.',cn:'我喜欢香蕉。',tip:'指一指香蕉，说 I like bananas. 也可以先说 banana。'},
  {theme:'colors',e:'🟡',title:'找找身边的颜色',words:[{w:'red',e:'🔴',cn:'红色'},{w:'yellow',e:'🟡',cn:'黄色'},{w:'blue',e:'🔵',cn:'蓝色'}],phrase:'It is yellow.',cn:'它是黄色的。',tip:'找一个黄色的东西，指给家长看，再说 yellow 或 It is yellow.'},
  {theme:'body',e:'👃',title:'小手指一指',words:[{w:'eye',e:'👁️',cn:'眼睛'},{w:'nose',e:'👃',cn:'鼻子'},{w:'mouth',e:'👄',cn:'嘴巴'}],phrase:'Touch your nose.',cn:'摸摸你的鼻子。',tip:'家长说 Touch your nose. 孩子摸鼻子，再交换角色玩。'},
  {theme:'food',e:'🥛',title:'早餐准备好啦',words:[{w:'bread',e:'🍞',cn:'面包'},{w:'milk',e:'🥛',cn:'牛奶'},{w:'egg',e:'🥚',cn:'鸡蛋'}],phrase:'Milk, please.',cn:'请给我牛奶。',tip:'和家长玩早餐店，说 Milk, please. 也可以先说 milk。'},
  {theme:'toys',e:'🚗',title:'玩具来做客',words:[{w:'ball',e:'⚽',cn:'球'},{w:'car',e:'🚗',cn:'小汽车'},{w:'teddy',e:'🧸',cn:'小熊'}],phrase:'A car, please.',cn:'请给我一辆小汽车。',tip:'把玩具放在桌上，家长扮演店员，孩子说 A car, please.'}
];
var _lesson=null;
function lessonTheme(id){return ENGLISH.themes.find(function(t){return t.id===ENGLISH_LESSONS[id].theme;});}
function decodeLessonDeck(code){var base=code>=10000?25:15,n=code>=10000?code-10000:code;return [Math.floor(n/(base*base)),Math.floor(n/base)%base,n%base];}
function validLessonDeck(id,code){return !!ENGLISH_LESSONS[id]&&Number.isInteger(code)&&(code>=0&&code<3375||code>=10000&&code<25625)&&new Set(decodeLessonDeck(code)).size===3&&decodeLessonDeck(code).every(function(i){return i>=0&&i<lessonTheme(id).words.length;});}
function chooseLessonDeck(id,renew){
  var previous=state.english.lessonDecks[id];if(!renew&&validLessonDeck(id,previous))return previous;
  var old=validLessonDeck(id,previous)?decodeLessonDeck(previous):[],pool=lessonTheme(id).words.map(function(_,i){return i;}).filter(function(i){return !old.includes(i);}),indices=shuffle(pool).slice(0,3);
  var code=10000+indices.reduce(function(total,i){return total*25+i;},0);state.english.lessonDecks[id]=code;saveState();return code;
}
function lessonPhrase(theme,word){
  var w=word.w,capital=w.charAt(0).toUpperCase()+w.slice(1);
  if(theme==='animals')return {en:'Hello, '+w+'!',cn:word.cn+'，你好！'};
  if(theme==='fruits'){var plural=w.endsWith('y')?w.slice(0,-1)+'ies':w==='mango'?'mangoes':w==='peach'?'peaches':w+'s';return {en:'I like '+plural+'.',cn:'我喜欢'+word.cn+'。'};}
  if(theme==='colors')return {en:w==='rainbow'?'A rainbow!':'It is '+w+'.',cn:w==='rainbow'?'一道彩虹！':'它是'+word.cn+'的。'};
  if(theme==='body')return {en:'Point to your '+w+'.',cn:'指一指你的'+word.cn+'。'};
  if(theme==='food')return {en:(w==='egg'?'An egg':['cookie','hamburger','carrot','potato','tomato','cucumber','sandwich','pancake','dumpling'].includes(w)?'A '+w:w==='noodle'?'Noodles':capital)+', please.',cn:'请给我'+word.cn+'。'};
  return {en:(w==='blocks'?'Blocks':'A '+w)+', please.',cn:'请给我'+word.cn+'。'};
}
function lessonData(id,code){
  var base=ENGLISH_LESSONS[id],words=validLessonDeck(id,code)?decodeLessonDeck(code).map(function(i){return lessonTheme(id).words[i];}):base.words;
  var phrases=words.map(function(w){return lessonPhrase(base.theme,w);});
  if(!validLessonDeck(id,code))return Object.assign({},base,{phrases:ENGLISH_SENTENCE_SETS[id].slice()});
  return Object.assign({},base,{words:words,phrases:phrases.map(function(p){return p.en;}),phrase:phrases[1].en,cn:phrases[1].cn,tip:'和家长指一指'+words[1].cn+'，试着说 '+phrases[1].en+' 也可以先说 '+words[1].w+'。'});
}
var ENGLISH_SENTENCE_SETS=[
  ['Hello, cat!','Hello, dog!','Hello, rabbit!'],
  ['I like apples.','I like bananas.','I like oranges.'],
  ['It is red.','It is yellow.','It is blue.'],
  ['Touch your eye.','Touch your nose.','Touch your mouth.'],
  ['Bread, please.','Milk, please.','An egg, please.'],
  ['A ball, please.','A car, please.','A teddy, please.']
];
function renderEnglishPath(){
  var completed=ENGLISH_LESSONS.filter(function(_,i){return state.english.lessons[i]===4;}).length;
  var review=Object.keys(state.english.review).filter(validReviewKey);
  return '<div class="learning-hero"><span class="learning-tag">3岁半亲子英语 · 每轮10个小练习</span><h2>今天，开口说一句</h2><p>每轮随机3个小词和对应短句，共10个小练习。新一轮换新词，休息后继续本轮。听一听 → 选图片 → 听短句 → 亲子说，不用认字也能玩。</p></div><div class="learning-report">🌱 已完成 <strong>'+completed+' / 6</strong> 节小课堂 · '+review.length+' 个听力练习可以再听一次</div>'+(review.length?'<div class="learning-actions">'+learningButton('👂 再听一次 · 复习','startEnglishReview()','btn-yellow')+'</div>':'')+'<div class="learning-grid">'+ENGLISH_LESSONS.map(function(l,i){var step=state.english.lessons[i]||0;return '<div class="learning-card"><span class="learning-icon">'+l.e+'</span><h3>'+l.title+'</h3><p>'+(state.practice.progress['english_lesson_'+i]>0&&state.practice.progress['english_lesson_'+i]<10?lessonData(i,state.english.lessonDecks[i]).words.map(function(w){return w.cn;}).join(' · '):'每轮随机 3 个词 · 再玩换新词')+'</p><span class="learning-meta">'+(step===4?'✓ 已完成 · 可以再玩':step?'已完成 '+step+' / 4 步':'听、看、说，一起玩')+'</span>'+learningButton(step===4?'再玩一次':step?'继续小课堂':'开始小课堂','startEnglishLesson('+i+')','btn-pink')+'</div>';}).join('')+'</div>';
}
function startEnglishLessonForTheme(theme){var i=ENGLISH_LESSONS.findIndex(function(l){return l.theme===theme;});startEnglishLesson(i<0?0:i);}
function validReviewKey(key){var parts=key.split(':'),id=Number(parts[0]),index=Number(parts[1]);return (parts.length===2||parts.length===3&&String(Number(parts[2]))===parts[2]&&validLessonDeck(id,Number(parts[2])))&&String(id)===parts[0]&&Number.isInteger(id)&&id>=0&&id<ENGLISH_LESSONS.length&&String(index)===parts[1]&&Number.isInteger(index)&&index>=0&&index<9;}
function startEnglishReview(){var key=Object.keys(state.english.review).filter(validReviewKey)[0];if(!key){showToast('已经复习完啦！');return;}var parts=key.split(':'),index=+parts[1],code=parts.length===3?+parts[2]:null;_lesson={id:+parts[0],index:index,step:index<6?1:2,deckCode:code,data:lessonData(+parts[0],code),reviewKey:key,reviewOnly:true};renderLesson();}
function startEnglishLesson(id){if(!ENGLISH_LESSONS[id])return;var index=practiceStart('english_lesson_'+id,ENGLISH_LESSONS[id].title),code=chooseLessonDeck(id,_practiceCurrent.restarted),warmup=index===0&&(!state.english.lessons[id]||state.english.lessons[id]===4);_lesson={id:id,index:index,step:warmup?0:index<6?1:index<9?2:3,deckCode:code,data:lessonData(id,code),reviewOnly:false};renderLesson();}
function lessonWord(index){if(_lesson&&_lesson.data.words[index])playEnWord(_lesson.data.words[index].w);}
function lessonAudio(){if(!_lesson)return;var l=_lesson.data;if(_lesson.step===1)playEnWord(_lesson.question.options[_lesson.question.answer].w);else learningSpeak(_lesson.step===2?l.phrases[_lesson.index-6]:l.phrase,true);}
function renderLesson(){
  if(!_lesson.reviewOnly)practiceStart('english_lesson_'+_lesson.id,ENGLISH_LESSONS[_lesson.id].title);
  var l=_lesson.data,step=_lesson.step,html=learningSteps(['听一听','选图片','听短句','亲子说'],step)+'<div id="englishLesson"><h2 class="learning-question">'+l.e+' '+l.title+'</h2>';
  if(step===0){
    html+='<p class="learning-meta">点一张图，听一个词。一起用手指一指。</p><div class="picture-options">'+l.words.map(function(w,i){return '<button class="option-btn" onclick="lessonWord('+i+')"><span class="picture">'+wordPicture(w)+'</span>'+w.cn+'<small style="display:block">'+w.w+'</small></button>';}).join('')+'</div><p class="reading-prompt">家长陪玩：一次听一个词，再请孩子找一找图片。</p><div class="learning-actions">'+learningButton('听好了，选一选','advanceLesson()','btn-green')+'</div>';
  }else if(step===1||step===2){
    var wordIndex=step===1?[0,1,2,2,0,1][_lesson.index]:_lesson.index-6;
    var options=shuffle(l.words.slice()),target=l.words[wordIndex];_lesson.question={options:options,answer:options.indexOf(target),solved:false};
    html+='<p class="learning-question">'+(step===1?'听到的是哪一位朋友？':'这句话说的是哪张图？')+'</p><div class="learning-actions">'+learningButton('🔊 再听一次','lessonAudio()','btn-blue')+'</div>'+learningOptions(options,'answerLesson',true)+'<details class="reading-prompt"><summary>家长提示 · 看文字</summary><p>'+learningEscape(step===1?target.w:l.phrases[_lesson.index-6])+'</p><p>'+learningEscape(target.cn)+'</p></details><div class="learning-feedback" id="learningFeedback" aria-live="polite"></div><div class="learning-actions" id="learningNext"></div>';
  }else{
    html+='<div class="phrase-card"><span class="learning-icon">'+wordPicture(l.words[1])+'</span><strong>'+l.phrase+'</strong><p>'+l.cn+'</p></div><div class="learning-actions">'+learningButton('🔊 听一遍','lessonAudio()','btn-blue')+'</div><p class="reading-prompt">'+l.tip+'<br>先说一个词也很好，愿意开口就值得鼓励。</p><p class="learning-meta">亲子跟读由家长确认，进度不代表发音评分。</p><div class="learning-feedback" id="learningFeedback" aria-live="polite"></div><div class="learning-actions">'+learningButton('孩子说过了 · 家长确认','finishLesson()','btn-green')+'</div>';
  }
  showModal(html+'</div>',learningFooter());if(!_lesson.reviewOnly)practiceAttach();if(step===1||step===2)lessonAudio();
}
function touchEnglishDay(){var today=todayStr();if(state.english.lastStudy===today)return;var d=new Date();d.setDate(d.getDate()-1);var yesterday=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();state.english.streak=state.english.lastStudy===yesterday?state.english.streak+1:1;state.english.lastStudy=today;}
function answerLesson(index){
  if(!_lesson||!document.getElementById('englishLesson')||!_lesson.question)return;var q=_lesson.question;if(q.solved||!q.options[index])return;var key=_lesson.reviewKey||_lesson.id+':'+_lesson.index+':'+_lesson.deckCode;
  if(index!==q.answer){state.english.review[key]=1;saveState();learningMark(index,false);learningFeedback('再听一次，慢慢找。也可以请家长一起指图片。');lessonAudio();return;}
  q.solved=true;delete state.english.review[key];if(!_lesson.reviewOnly)practiceRecord();touchEnglishDay();saveState();learningMark(index,true);learningLock();learningFeedback('找到啦！'+q.options[index].w+'，'+q.options[index].cn+'。',true);
  document.getElementById('learningNext').innerHTML=learningButton(_lesson.reviewOnly?'完成复习':'下一步',_lesson.reviewOnly?'finishEnglishReview()':'advanceLesson()','btn-green');armNextButton();
}
function finishEnglishReview(){if(!_lesson||!_lesson.reviewOnly||!_lesson.question.solved)return;closeModal();_lesson=null;showToast('又记住了一点点！');}
function advanceLesson(){if(!_lesson||!document.getElementById('englishLesson')||_lesson.step>=3)return;if(_lesson.step>0&&!_lesson.question.solved)return;_lesson.index=state.practice.progress['english_lesson_'+_lesson.id]||0;_lesson.step=_lesson.index<6?1:_lesson.index<9?2:3;state.english.lessons[_lesson.id]=Math.max(state.english.lessons[_lesson.id]||0,_lesson.step);touchEnglishDay();saveState();renderLesson();}
function finishLesson(){
  if(!_lesson||_lesson.step!==3||!document.getElementById('englishLesson')||state.practice.progress['english_lesson_'+_lesson.id]!==9)return;var id=_lesson.id,first=state.english.lessons[id]!==4;practiceRecord();state.english.lessons[id]=4;touchEnglishDay();if(first)addStars(3);saveState();_lesson=null;
  showModal('<div class="phrase-card"><span class="learning-icon">🌈</span><h2>今天也开口说英语啦！</h2><p>10 / 10 题：听过、选过、说过，这一轮完成了。</p><p>'+ (first?'获得 3 颗星星 ⭐':'复习完成，奖励已经领过啦。')+'</p><p>生活中再遇到它，试着说给家长听。</p></div>',learningFooter());
}

// ==================== GUIDED STORY PLAY ====================
var READING_GUIDES={
  1:{prompt:'小马遇到了谁？最后有没有过河？',q:'是谁要去帮妈妈送麦子？',options:[{e:'🐎',cn:'小马'},{e:'🐰',cn:'小兔'},{e:'🐱',cn:'小猫'}],events:[{e:'🌾',cn:'小马去送麦子'},{e:'🌊',cn:'小河挡住了去路'},{e:'🐎',cn:'小马小心地过了河'}],say:'小马先去____，后来遇到____，最后____。',word:'小心',meaning:'慢一点，留意周围，不着急。'},
  2:{prompt:'兔子去做什么了？谁先到了终点？',q:'谁先到达了终点？',options:[{e:'🐢',cn:'乌龟'},{e:'🐰',cn:'兔子'},{e:'🐻',cn:'小熊'}],events:[{e:'🏁',cn:'兔子和乌龟开始比赛'},{e:'😴',cn:'兔子在树下睡着了'},{e:'🐢',cn:'乌龟先到了终点'}],say:'兔子在____，乌龟一直____，最后____。',word:'坚持',meaning:'愿意继续做，一点一点向前。'},
  4:{prompt:'乌鸦想喝水，它用什么想办法？',q:'乌鸦往瓶子里放了什么？',options:[{e:'🪨',cn:'小石子'},{e:'🍃',cn:'树叶'},{e:'🍎',cn:'苹果'}],events:[{e:'🐦',cn:'乌鸦口渴，找水喝'},{e:'🪨',cn:'把小石子放进瓶子'},{e:'💧',cn:'水升高，喝到水了'}],say:'乌鸦想喝____，它放进____，最后____。',word:'办法',meaning:'试着解决问题的好主意。'},
  9:{prompt:'大萝卜拔得动吗？后来谁来帮忙？',q:'大家一起拔的是什么？',options:[{e:'🥕',cn:'大萝卜'},{e:'🌳',cn:'大树'},{e:'🌷',cn:'小花'}],events:[{e:'👴',cn:'老爷爷一个人拔不动'},{e:'🐭',cn:'大家都来帮忙了'},{e:'🥕',cn:'一起拔出了大萝卜'}],say:'一个人拔____，大家一起____，终于____。',word:'一起',meaning:'你和我、大家共同做一件事。'},
  10:{prompt:'小猫为什么一开始没钓到鱼？',q:'小猫最后钓到了什么？',options:[{e:'🐟',cn:'一条鱼'},{e:'🦋',cn:'蝴蝶'},{e:'🍎',cn:'苹果'}],events:[{e:'🎣',cn:'小猫和妈妈去钓鱼'},{e:'🦋',cn:'小猫跑去追蝴蝶'},{e:'🐟',cn:'专心钓鱼，钓到了鱼'}],say:'小猫先去____，后来追____，最后专心____。',word:'专心',meaning:'眼睛和小脑袋都关注正在做的事。'},
  11:{prompt:'小蝌蚪的妈妈是谁？',q:'小蝌蚪找到的妈妈是谁？',options:[{e:'🐸',cn:'青蛙'},{e:'🐢',cn:'乌龟'},{e:'🐔',cn:'母鸡'}],events:[{e:'💧',cn:'小蝌蚪想找妈妈'},{e:'🐢',cn:'向其他动物问一问'},{e:'🐸',cn:'找到了青蛙妈妈'}],say:'小蝌蚪要找____，问了____，最后找到了____。',word:'寻找',meaning:'仔细看看、问问，找到想找的人或东西。'}
};
var _reading=null;
function readingGuide(s){if(READING_GUIDES[s.id])return READING_GUIDES[s.id];var others=STORIES.filter(function(o){return o.id!==s.id&&o.e!==s.e;});return {prompt:'听一听，故事先发生了什么，最后怎么样了？',q:'哪个故事是我们刚刚听过的？',options:[{e:s.e,cn:s.t},{e:others[0].e,cn:others[0].t},{e:others[1].e,cn:others[1].t}],events:[{e:s.e,cn:s.p[0]},{e:'💭',cn:s.p[Math.floor(s.p.length/2)]},{e:'🌟',cn:s.p[s.p.length-1]}],say:'故事里有____。我记得____。我最喜欢____。'};}
function readingPrompt(id){var s=STORIES.find(function(s){return s.id===id;});return s?readingGuide(s).prompt:'';}
function renderReadingPath(){
  var ids=[1,2,4,9,10,11],count=Object.keys(state.stories.training).length;
  return '<div class="learning-hero"><span class="learning-tag">3岁半亲子阅读 · 听懂一点，说出一点</span><h2>小耳朵听，小嘴巴讲</h2><p>先听故事，再找一找、排一排。最后对家长讲一句，自己的说法也很好。</p><div class="learning-controls">'+[0,1].map(function(n){return '<button class="btn btn-green" aria-pressed="'+(state.stories.readingLevel===n)+'" onclick="setReadingLevel('+n+')">'+(n?'试一试 · 排三步':'轻松玩 · 排两步')+'</button>';}).join('')+'</div></div><div class="learning-report">📖 完成 '+count+' 个故事的听说练习 · 口头表达由家长陪伴确认</div><h3 style="margin:16px 0">🌱 今天读这些 · 六个亲子小故事</h3><div class="learning-grid">'+ids.map(function(id){var s=STORIES.find(function(s){return s.id===id;});return '<div class="learning-card"><span class="learning-icon">'+s.e+'</span><h3>'+s.t+'</h3><p>'+READING_GUIDES[id].prompt+'</p><span class="learning-meta">'+(state.stories.training[id]?'✓ 已完成听说练习':'听故事 → 找一找 → 排一排 → 讲一句')+'</span>'+learningButton(state.stories.currentStory===id?'继续读故事':'一起读故事','showStory('+id+')','btn-green')+'</div>';}).join('')+'</div><h3 style="margin:20px 0 12px">📚 故事书架 · 更多亲子共读</h3>';
}
function setReadingLevel(n){if(n!==0&&n!==1)return;state.stories.readingLevel=n;saveState();renderModule();}
function completeStoryReading(id){
  if(state.stories.read.indexOf(id)<0){state.stories.read.push(id);addStars(2);}var today=todayStr();if(state.stories.readDates.indexOf(today)<0)state.stories.readDates.push(today);state.stories.lastRead=today;saveState();
}
function showStoryQuiz(id){
  var s=STORIES.find(function(s){return s.id===id;});if(!s)return;
  if(state.stories.currentStory===id&&state.stories.currentPage===s.p.length-1)completeStoryReading(id);
  var level=state.stories.readingLevel,key=id+':'+level;
  var index=practiceStart('story_'+id+'_'+level,s.t+'听说练习');
  _reading={id:id,level:level,index:index,step:index<4?0:index<7?1:2,key:key,guide:readingGuide(s),story:s};renderReading();
}
function renderReading(){
  practiceStart('story_'+_reading.id+'_'+_reading.level,_reading.story.t+'听说练习');
  var r=_reading,g=r.guide,html='<div id="readingLesson">'+learningSteps(['找一找','排一排','讲一句'],r.step)+'<h2 class="learning-question">'+r.story.e+' '+r.story.t+'</h2>';
  if(r.step===0){
    var source=g.options.slice();r.prompt=g.q;
    if(r.index===1){r.prompt='故事一开始发生了什么？';source=g.events.slice();}
    if(r.index===2){r.prompt='故事最后发生了什么？';source=[g.events[2],g.events[0],g.events[1]];}
    if(r.index===3){r.prompt='哪件事在这个故事里发生过？';var others=STORIES.filter(function(s){return s.id!==r.id;}).slice(0,2);source=[{e:r.story.e,cn:r.story.p[1]}].concat(others.map(function(s){return {e:s.e,cn:s.p[1]};}));}
    var options=shuffle(source.slice());r.question={options:options,answer:options.indexOf(source[0]),solved:false};
    html+='<p class="learning-question">'+r.prompt+'</p>'+learningOptions(options,'answerReading',true)+'<div class="learning-actions">'+options.map(function(_,i){return learningButton('听图'+(i+1),'speakReadingOption('+i+')','btn-blue');}).join('')+learningButton('🔊 听问题','speakReading()','btn-blue')+'</div>';
  }else if(r.step===1){
    var pairSets=[[0,1],[1,2],[0,2]],pageSets=[[0,1,2],[1,2,3],[0,2,3]],variant=r.index-4;
    r.events=r.level?pageSets[variant].map(function(i,n){return {e:[r.story.e,'💭','🌟'][n],cn:r.story.p[i]};}):pairSets[variant].map(function(i){return g.events[i];});r.sequence=[];r.ordered=false;
    var shuffled=shuffle(r.events.map(function(_,i){return i;}));if(shuffled.every(function(v,i){return v===i;}))shuffled.reverse();
    html+='<p class="learning-question">先发生什么？再发生什么？</p><p class="learning-meta">按故事的顺序点图片。家长可以帮忙读一读。</p><div class="event-list">'+shuffled.map(function(i){return '<div class="event-choice"><button class="btn btn-sm btn-blue" aria-label="听情节 '+(i+1)+'" onclick="speakStoryEvent('+i+')">🔊</button><button class="event-choice" style="flex:1;border:0;padding:0" data-event="'+i+'" onclick="pickStoryEvent('+i+')"><span class="picture">'+r.events[i].e+'</span><span>'+r.events[i].cn+'</span></button></div>';}).join('')+'</div><div class="event-sequence" id="storySequence">我选的顺序会出现在这里</div><div class="learning-actions">'+learningButton('重新排','resetStoryOrder()','btn-blue')+learningButton('检查顺序','checkStoryOrder()','btn-green')+'</div>';
  }else{
    var prompts=['故事里有谁？告诉家长一个角色。','你最喜欢故事里的谁？说一句自己的想法。',g.say];
    html+='<div class="phrase-card"><span class="learning-icon">🗣️</span><h3>把故事讲给我听吧</h3><p>'+prompts[r.index-7]+'</p></div>'+(g.word&&r.index===9?'<div class="reading-prompt">🌱 今天的小词：<strong>'+g.word+'</strong><br>'+g.meaning+'</div>':'')+'<p class="reading-prompt">家长提示：可以指着图片问“后来呢？”说出一个人物、一件事或一句自己的话，都值得鼓励。</p><div class="learning-actions">'+learningButton('🔊 听一听提示','speakReading()','btn-blue')+learningButton('孩子讲过了 · 家长确认','finishReading()','btn-green')+'</div>';
  }
  showModal(html+'<div class="learning-feedback" id="learningFeedback" aria-live="polite"></div><div class="learning-actions" id="learningNext"></div></div>',learningFooter()+learningButton('再看故事','showStory('+r.id+')','btn-yellow'));practiceAttach();if(r.step<2)speakReading();
}
function speakReading(){if(!_reading)return;var r=_reading;learningSpeak(r.step===0?r.prompt:r.step===1?'先发生什么？再发生什么？请按顺序点图片。':r.index===7?'故事里有谁？告诉家长一个角色。':r.index===8?'你最喜欢故事里的谁？说一句自己的想法。':'把故事讲给家长听吧。说一句自己的话就很好。');}
function speakReadingOption(index){if(_reading&&_reading.question&&_reading.question.options[index])learningSpeak(_reading.question.options[index].cn);}
function answerReading(index){
  if(!_reading||_reading.step!==0||!document.getElementById('readingLesson'))return;var q=_reading.question;if(q.solved||!q.options[index])return;
  if(index!==q.answer){learningMark(index,false);learningFeedback('再想一想，也可以点“再看故事”找找线索。');learningSpeak('再想一想，也可以再听一遍故事。');return;}
  q.solved=true;practiceRecord();learningMark(index,true);learningLock();learningFeedback('找对啦！'+q.options[index].cn,true);learningSpeak('找对啦！');document.getElementById('learningNext').innerHTML=learningButton('下一步','advanceReading()','btn-green');armNextButton();
}
function speakStoryEvent(index){if(_reading&&_reading.events&&_reading.events[index])learningSpeak(_reading.events[index].cn);}
function pickStoryEvent(index){
  if(!_reading||_reading.step!==1||!document.getElementById('readingLesson')||_reading.ordered||_reading.sequence.includes(index)||!_reading.events[index])return;
  _reading.sequence.push(index);var button=document.querySelector('[data-event="'+index+'"]');button.disabled=true;button.dataset.order=_reading.sequence.length;document.getElementById('storySequence').textContent=_reading.sequence.map(function(i,n){return '第'+(n+1)+'步 '+_reading.events[i].e;}).join(' → ');
}
function resetStoryOrder(){if(!_reading||_reading.ordered||!document.getElementById('storySequence'))return;_reading.sequence=[];document.querySelectorAll('[data-event]').forEach(function(b){b.disabled=false;delete b.dataset.order;});document.getElementById('storySequence').textContent='我选的顺序会出现在这里';learningFeedback('');}
function checkStoryOrder(){
  if(!_reading||_reading.step!==1||_reading.ordered||!document.getElementById('storySequence'))return;
  if(_reading.sequence.length!==_reading.events.length){learningFeedback('把每张图片都选上，再检查吧。');return;}
  if(!_reading.sequence.every(function(v,i){return v===i;})){resetStoryOrder();learningFeedback('没关系，再试一次。想想故事最先发生了什么。');learningSpeak('再试一次，想想最先发生了什么。');return;}
  _reading.ordered=true;document.getElementById('readingLesson').classList.add('ordered');practiceRecord();learningFeedback('顺序排好啦！继续下一题。',true);document.getElementById('learningNext').innerHTML=learningButton('下一步','advanceReading()','btn-green');armNextButton();
}
function advanceReading(){if(!_reading||!document.getElementById('readingLesson')||_reading.step>=2)return;if(_reading.step===0&&!_reading.question.solved||_reading.step===1&&!_reading.ordered)return;_reading.index=state.practice.progress['story_'+_reading.id+'_'+_reading.level]||0;_reading.step=_reading.index<4?0:_reading.index<7?1:2;state.stories.readingSteps[_reading.key]=_reading.step;saveState();renderReading();}
function finishReading(){
  if(!_reading||_reading.step!==2||!document.getElementById('readingLesson'))return;var r=_reading;practiceRecord();r.index=state.practice.progress['story_'+r.id+'_'+r.level];if(r.index<10){renderReading();return;}var first=!state.stories.training[r.id];state.stories.training[r.id]=Math.max(state.stories.training[r.id]||0,r.level+1);delete state.stories.readingSteps[r.key];if(first)addStars(3);saveState();_reading=null;
  showModal('<div class="phrase-card"><span class="learning-icon">📖</span><h2>我也会讲故事啦！</h2><p>10 / 10 题：找到了线索，排好了顺序，还讲了自己的话。</p><p>'+ (first?'获得 3 颗星星 ⭐':'又讲了一遍，故事记得更清楚啦。')+'</p></div>',learningFooter());
}
