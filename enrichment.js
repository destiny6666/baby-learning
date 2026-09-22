// Small listening and parent-assisted activities; no reading prerequisite.
var LETTER_FRIENDS=[{upper:'A',w:'apple',e:'🍎',cn:'苹果'},{upper:'B',w:'ball',e:'⚽',cn:'球'},{upper:'C',w:'cat',e:'🐱',cn:'小猫'},{upper:'D',w:'dog',e:'🐶',cn:'小狗'},{upper:'E',w:'egg',e:'🥚',cn:'鸡蛋'},{upper:'F',w:'fish',e:'🐟',cn:'小鱼'}];
var _letterPlay=null;
var _renderLettersBase=renderLetters;
renderLetters=function(){return _renderLettersBase().replace('<div class="backup-row">','<div class="learning-hero"><span class="learning-tag">每轮10题 · 3岁半亲子陪玩</span><h2>字母也有小伙伴</h2><p>先听字母名，再找大小写和熟悉的小图片。不要求拼写，也不考自然拼读。</p><div class="learning-actions">'+learningButton('👂 听音找字母',"startLetterPlay('listen')",'btn-blue')+learningButton('🍎 字母找朋友',"startLetterPlay('words')",'btn-pink')+'</div></div><div class="backup-row">');};
function startLetterPlay(kind){if(kind!=='listen'&&kind!=='words')return;var index=practiceStart('letters_'+kind,kind==='listen'?'听音找字母':'字母找朋友');var round=state.practice.rounds['letters_'+kind]||0;
  var pool=kind==='words'?LETTER_FRIENDS:LETTERS_DATA.slice(0,round?26:6),target=pool[(index+round*10)%pool.length];
  var options=shuffle([target].concat(shuffle(pool.filter(function(l){return l.upper!==target.upper;})).slice(0,2)));
  _letterPlay={kind:kind,index:index,target:target,options:options,answer:options.indexOf(target),solved:false};
  var prompt=kind==='listen'?'听一听，刚才是哪一个字母？':'听听小伙伴，找到它的图片。';
  showModal('<div id="letterPlay"><h2 class="learning-question">'+prompt+'</h2>'+(kind==='words'?'<div class="phrase-card"><strong>'+target.upper+' '+target.upper.toLowerCase()+'</strong><p>字母 '+target.upper+' 的单词朋友</p></div>':'<p class="learning-meta">'+(round?'26个字母轮流练':'先玩 A 到 F，完成一轮再扩展')+'</p>')+'<div class="learning-actions">'+learningButton('🔊 再听一次','speakLetterPlay()','btn-blue')+'</div><div class="picture-options" id="learningOptions">'+options.map(function(o,i){return '<button class="option-btn" onclick="answerLetterPlay('+i+')"><span class="picture">'+(kind==='words'?o.e:o.upper)+'</span>'+(kind==='words'?o.cn:o.lower)+'</button>';}).join('')+'</div><div id="learningFeedback" class="learning-feedback" aria-live="polite"></div><div id="learningNext" class="learning-actions"></div></div>',learningFooter());practiceAttach();speakLetterPlay();
}
function speakLetterPlay(){if(!_letterPlay)return;learningSpeak(_letterPlay.kind==='listen'?_letterPlay.target.upper:_letterPlay.target.w,true);}
function answerLetterPlay(index){var q=_letterPlay;if(!q||q.solved||!document.getElementById('letterPlay')||!q.options[index])return;if(index!==q.answer){learningMark(index,false);learningFeedback('再听一遍，慢慢找。');speakLetterPlay();return;}q.solved=true;practiceRecord();learningMark(index,true);learningLock();learningFeedback(q.kind==='words'?q.target.upper+' · '+q.target.w+' · '+q.target.cn:'找到啦！'+q.target.upper+' 和 '+q.target.lower,true);if(q.index===9)addStars(3);document.getElementById('learningNext').innerHTML=learningButton(q.index===9?'本轮结果':'下一题','nextLetterPlay()','btn-green');armNextButton();}
function nextLetterPlay(){if(!_letterPlay||!_letterPlay.solved||!document.getElementById('letterPlay'))return;var kind=_letterPlay.kind;practiceContinue(function(){startLetterPlay(kind);});}

// Each pair asks about a concrete detail actually present in the poem.
var POEM_PICTURES={
  1:[['诗人抬头看到了什么？','🌙','月亮','🌈','彩虹','🪁','风筝'],['诗人在想念哪里？','🏡','家乡','🚂','火车站','🎡','游乐园']],
  2:[['诗人听见什么动物的叫声？','🐦','小鸟','🐱','小猫','🐶','小狗'],['夜里传来了什么声音？','🌧️','风雨声','🥁','鼓声','🚗','汽车声']],
  3:[['诗里说的是哪种动物？','🦢','鹅','🐰','兔子','🐱','小猫'],['鹅的羽毛是什么颜色？','⚪','白色','🔴','红色','🔵','蓝色']],
  4:[['是谁在辛苦种粮食？','🧑‍🌾','农民','🧑‍🚀','宇航员','🧑‍🚒','消防员'],['我们应该珍惜什么？','🍚','粮食','🧸','玩具熊','🎈','气球']],
  5:[['黄河的水流向哪里？','🌊','大海','🌙','月亮','☁️','白云'],['想看得更远，可以怎么做？','🪜','再上一层楼','😴','睡觉','🙈','闭眼睛']],
  6:[['诗里写到哪一种豆子？','🔴','红豆','🟢','绿豆','🟡','黄豆'],['红豆在什么季节长新枝？','🌱','春天','☃️','冬天','🍂','秋天']],
  7:[['老爷爷正在做什么？','🎣','钓鱼','🪁','放风筝','⚽','踢球'],['江上是什么天气？','❄️','下雪','🌈','雨后彩虹','☀️','烈日炎炎']],
  8:[['春风吹来，什么又长出来？','🌱','小草','🍄','蘑菇','🎈','气球'],['小草长在哪里？','🏞️','原野上','🛏️','床上','🚗','汽车里']],
  9:[['诗人看见了什么？','🌊','瀑布','🏜️','沙漠','🛝','滑梯'],['瀑布的水往哪边流？','⬇️','往下','⬆️','往上','⏸️','停住不动']],
  10:[['两只黄鹂在哪里叫？','🌳','柳树间','🏠','屋子里','🌊','海里面'],['白鹭飞向哪里？','☁️','蓝天','🕳️','地洞','🛏️','床底下']],
  11:[['诗人听见了什么？','🗣️','说话声','🚗','汽车声','🥁','鼓声'],['夕阳的光照进了哪里？','🌲','树林','🚇','地铁','🧊','冰箱']],
  12:[['妈妈在为孩子做什么？','🧵','缝衣服','⚽','踢球','🎣','钓鱼'],['妈妈手中拿着什么？','🪡','针线','🪁','风筝','🎈','气球']],
  13:[['江边的花像火一样是什么颜色？','🔴','红色','🔵','蓝色','⚪','白色'],['春天的江水是什么颜色？','🟢','绿色','🟣','紫色','⚫','黑色']],
  14:[['小孩正在学什么？','🎣','钓鱼','🚲','骑车','🏊','游泳'],['小孩不说话，是怕吓到谁？','🐟','鱼儿','🐰','兔子','🐱','小猫']],
  15:[['小娃撑着什么？','🛶','小船','☂️','雨伞','🪁','风筝'],['小娃采了什么回来？','🪷','白莲','🍎','苹果','🍇','葡萄']],
  16:[['停在小荷上的是谁？','🦟','蜻蜓','🦋','蝴蝶','🐞','瓢虫'],['小荷刚露出的角是什么样的？','🔺','尖尖的','⚪','圆圆的','⬜','方方的']],
  17:[['人来了，画里的鸟怎么样？','🐦','不飞走','🪽','飞走了','🏃','跑走了'],['走近画里的水，能听见水声吗？','🤫','听不见','🔊','很大声','🎵','在唱歌']],
  18:[['诗里看见了什么地方？','🏡','小村庄','🚀','太空','🚇','地铁站'],['诗里有哪些漂亮的植物？','🌸','花','🌵','仙人掌','🍌','香蕉树']],
  19:[['墙角开着什么花？','🌸','梅花','🌻','向日葵','🪷','荷花'],['怎么知道看到的是梅花？','👃','闻到香气','👂','听见唱歌','✋','摸到羽毛']],
  20:[['师傅上山做什么去了？','🌿','采药','⚽','踢球','🧸','买玩具'],['山里什么很浓，看不清在哪里？','☁️','云雾','🌈','彩虹','🌟','星星']]
};
// A tiny SVG dragonfly avoids using the mosquito emoji for a different insect.
function poemPicture(icon){return icon==='🦟'?'<svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="蜻蜓"><g fill="#9cdbed" stroke="#43859a"><ellipse cx="14" cy="18" rx="12" ry="5" transform="rotate(22 14 18)"/><ellipse cx="34" cy="18" rx="12" ry="5" transform="rotate(-22 34 18)"/><ellipse cx="14" cy="28" rx="11" ry="4" transform="rotate(-16 14 28)"/><ellipse cx="34" cy="28" rx="11" ry="4" transform="rotate(16 34 28)"/></g><path d="M24 15V43" stroke="#48845d" stroke-width="4"/><circle cx="24" cy="11" r="6" fill="#48845d"/></svg>':icon;}
var _poemPlay=null;
function startPoemPlay(id){var poem=POEMS.find(function(p){return p.id===id;});if(!poem)return;var index=practiceStart('poem_'+id,poem.t+' · 亲子小练习');_poemPlay={id:id,index:index,solved:false};renderPoemPlay();}
function renderPoemPlay(){var q=_poemPlay,p=POEMS.find(function(p){return p.id===q.id;}),line=p.l[q.index%4];var html='<div id="poemPlay"><h2 class="learning-question">'+p.t+'</h2>';
  if(q.index<4){q.prompt=line;html+='<p class="learning-meta">听一句、跟一句 · 说几个字也很棒</p><div class="phrase-card"><p>'+p.py[q.index]+'</p><strong>'+line+'</strong></div><div class="learning-actions">'+learningButton('🔊 听这一句','speakPoemPlay()','btn-blue')+learningButton('孩子跟读了 · 家长确认','confirmPoemLine()','btn-green')+'</div><p class="learning-meta">由家长确认参与，不做发音评分。</p>';
  }else{var options;if(q.index<8){q.prompt='听一听，这句最后一个字是什么？';q.line=line;var end=line.slice(-1),others=['山','水','花','月','人','天'].filter(function(c){return c!==end;});options=shuffle([{cn:end,e:'🔊'}].concat(shuffle(others).slice(0,2).map(function(c){return {cn:c,e:'🔊'};})));q.answer=options.findIndex(function(o){return o.cn===end;});html+='<div class="phrase-card"><strong>'+line.slice(0,-1)+' ❔</strong></div><p class="learning-meta">可以反复听原句和选项，不用认字。</p>';}else{var data=POEM_PICTURES[p.id][q.index-8];q.prompt=data[0];options=shuffle([{e:data[1],cn:data[2]},{e:data[3],cn:data[4]},{e:data[5],cn:data[6]}]);q.answer=options.findIndex(function(o){return o.cn===data[2];});}q.options=options;html+='<p class="learning-question">'+q.prompt+'</p><div class="learning-actions">'+learningButton(q.index<8?'🔊 听原句':'🔊 听题目','speakPoemPlay()','btn-blue')+'</div><div class="picture-options" id="learningOptions">'+options.map(function(o,i){return '<button class="option-btn" onclick="answerPoemPlay('+i+')"><span class="picture">'+poemPicture(o.e)+'</span>'+o.cn+'</button>';}).join('')+'</div><div class="learning-actions">'+options.map(function(o,i){return learningButton('🔊 听选项'+(i+1),'speakPoemOption('+i+')','btn-blue');}).join('')+'</div>';}
  showModal(html+'<div id="learningFeedback" class="learning-feedback" aria-live="polite"></div><div id="learningNext" class="learning-actions"></div></div>',learningFooter());practiceAttach();speakPoemPlay();
}
function speakPoemPlay(){if(_poemPlay)learningSpeak(_poemPlay.line||_poemPlay.prompt);}
function speakPoemOption(index){if(_poemPlay&&_poemPlay.options&&_poemPlay.options[index])learningSpeak(_poemPlay.options[index].cn);}
function creditPoemPlay(){var q=_poemPlay;if(!q||q.solved||!document.getElementById('poemPlay'))return;q.solved=true;practiceRecord();learningLock();learningFeedback(q.index<4?'跟读过啦，真好！':'找对啦！',true);if(q.index===9)addStars(3);document.getElementById('learningNext').innerHTML=learningButton(q.index===9?'本轮结果':'下一题','nextPoemPlay()','btn-green');armNextButton();}
function confirmPoemLine(){if(_poemPlay&&_poemPlay.index<4)creditPoemPlay();}
function answerPoemPlay(index){var q=_poemPlay;if(!q||q.index<4||q.solved||!q.options[index]||!document.getElementById('poemPlay'))return;if(index!==q.answer){learningMark(index,false);learningFeedback('再听一遍，和家长一起想一想。');speakPoemPlay();return;}learningMark(index,true);creditPoemPlay();}
function nextPoemPlay(){if(!_poemPlay||!_poemPlay.solved||!document.getElementById('poemPlay'))return;var id=_poemPlay.id;practiceContinue(function(){startPoemPlay(id);});}
function recitePoemLine(id,index){var p=POEMS.find(function(p){return p.id===id;});if(p&&p.l[index])learningSpeak(p.l[index]);}

// Adventure uses the same gentle curriculum and selected math difficulty.
generateLevelQuestions=function(n){var questions=[],cap=state.numbers.difficulty?10:5;
  for(var batch=0;batch<2;batch++){
    var letters=LETTERS_DATA.slice(0,Math.min(26,4+n*2)),letter=letters[randomInt(0,letters.length-1)];
    questions.push({type:'letter',q:'大写 '+letter.upper+' 的小写是？',visual:letter.upper,answer:letter.lower,options:shuffle([letter.lower].concat(shuffle(letters.filter(function(l){return l!==letter;})).slice(0,2).map(function(l){return l.lower;})))});
    var math=makeChallengeQuestion('combine',state.numbers.difficulty);questions.push({type:'math',q:math.prompt,visual:math.visual.replace(/<[^>]*>/g,' '),answer:String(math.answer),options:math.options});
    var count=randomInt(1,cap);questions.push({type:'count',q:'数一数有几个？',visual:new Array(count+1).join('🍎 '),answer:String(count),options:numberChoices(count,cap)});
    var pattern=makeChallengeQuestion('pattern',n>5?1:0);questions.push({type:'pattern',q:pattern.prompt,visual:pattern.visual,answer:pattern.answer,options:pattern.options});
    var poem=POEMS[randomInt(0,POEMS.length-1)],row=POEM_PICTURES[poem.id][batch],answers=[row[1]+' '+row[2],row[3]+' '+row[4],row[5]+' '+row[6]];
    questions.push({type:'poem',q:poem.t+'。'+row[0],visual:poem.e,answer:answers[0],options:shuffle(answers)});
  }return questions;
};
var _showLevelQuestionBase=showLevelQuestion;
showLevelQuestion=function(){
  _showLevelQuestionBase();var d=window._levelData;
  if(d&&d.current<d.questions.length){
    document.querySelector('#modal .modal-actions').insertAdjacentHTML('afterbegin',learningButton('🔊 听题目','speakLevelQuestion()','btn-blue'));
    document.querySelectorAll('#modal .option-btn').forEach(function(button){if(button.textContent==='🦟 蜻蜓')button.innerHTML=poemPicture('🦟')+' '+learningEscape('蜻蜓');});
  }
};
function speakLevelQuestion(){var d=window._levelData;if(d&&d.questions[d.current])learningSpeak(d.questions[d.current].q);}
