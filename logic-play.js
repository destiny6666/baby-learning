// Observe one feature at a time. All order comparisons use measurable drawings.
var LOGIC_SORTS={
  size:{name:'大小',title:'从小到大',e:'⚪',hint:'先找最小的圆，再找大一点的圆。',result:'圆一个比一个大。'},
  length:{name:'长短',title:'从短到长',e:'📏',hint:'小棒的左边已经对齐，先找最短的一根。',result:'小棒一根比一根长。'},
  height:{name:'高矮',title:'从矮到高',e:'🧱',hint:'积木都站在同一条线上，先找最矮的一座。',result:'积木一座比一座高。'},
  quantity:{name:'多少',title:'从少到多',e:'🔵',hint:'每颗圆点一样大，数一数，先选圆点最少的一张。',result:'圆点一组比一组多。'}
};
var LOGIC_FEATURES={color:'颜色',shape:'形状',size:'大小'};
var _logicPattern=null,_logicSort=null;
function renderLogicPlay(){
  return '<div class="section-title">🧩 逻辑挑战</div><div class="subtitle">仔细看一点点，发现相同与不同</div><div class="learning-hero"><span class="learning-tag">3岁半观察小游戏 · 答题不限时</span><h2>找出小规律，排好小队伍</h2><p>每次只观察一种特征。先排两张，熟练后再试三张。</p><div class="learning-controls">'+['轻松玩 · 排两张','试一试 · 排三张','亲子一起 · 三种重复'].map(function(name,i){return '<button class="btn btn-green" aria-pressed="'+(state.logic.level===i)+'" onclick="setLogicLevel('+i+')">'+name+'</button>';}).join('')+'</div></div><div class="learning-report">🌱 已完成 '+state.logic.completed.length+' 个小游戏 · 获得 '+state.logic.stars+' 颗逻辑星星</div><div class="card"><h3>🔍 找规律 · 看看谁在重复</h3><p class="learning-meta">颜色、形状、大小分开观察。需要帮助时，圈出重复的一组。</p><div class="learning-controls">'+Object.keys(LOGIC_FEATURES).map(function(key){return learningButton(LOGIC_FEATURES[key]+'规律',"startLogicPattern('"+key+"')",'btn-blue');}).join('')+'</div></div>'+
    '<div class="card"><h3>📏 排一排</h3><p class="learning-meta">大小、长短、高矮、数量交替出现，每轮10题。选完自动检查，答对3秒后进入下一题。</p><div class="learning-actions">'+learningButton('开始排一排','startLogicSort()','btn-yellow')+'</div></div>'+
    '<div class="card"><h3>🎯 记忆配对</h3><p class="learning-meta">翻一翻，找到两张相同的图片。</p><div class="learning-actions">'+learningButton('开始图形配对','startShapeMatch()','btn-green')+'</div></div>';
}
function patternLabel(dimension,value){return {color:['红圆','黄圆','蓝圆'],shape:['圆形','方形','三角形'],size:['小圆','中圆','大圆']}[dimension][value];}
function patternToken(dimension,value){var color=dimension==='color'?['#e66777','#efbe3b','#589bd6'][value]:'#9c7acc',size=dimension==='size'?[16,26,36][value]:28,shape=dimension==='shape'?['circle','square','triangle'][value]:'circle';return '<span class="logic-token" role="img" aria-label="'+patternLabel(dimension,value)+'"><span class="logic-shape '+shape+'" style="width:'+size+'px;height:'+size+'px;background:'+color+'"></span></span>';}
function startLogicPattern(dimension){
  if(dimension&&!LOGIC_FEATURES[dimension])return;
  var index=practiceStart('logic_pattern_mixed','找规律'),round=state.practice.rounds.logic_pattern_mixed||0;
  dimension=dimension||Object.keys(LOGIC_FEATURES)[(round*PRACTICE_LENGTH+index)%3];
  var pool=shuffle([0,1,2]),level=state.logic.level,cycle=level===0?[pool[0],pool[1]]:level===1?(Math.random()<.5?[pool[0],pool[0],pool[1]]:[pool[0],pool[1],pool[1]]):pool.slice(),prefix=randomInt(0,cycle.length-1),sequence=cycle.concat(cycle,cycle.slice(0,prefix));
  _logicPattern={dimension:dimension,cycle:cycle,sequence:sequence,answer:cycle[prefix],options:shuffle(pool),solved:false,level:level};
  var groups='';for(var i=0;i<sequence.length;i+=cycle.length){var group=sequence.slice(i,i+cycle.length);groups+='<span class="pattern-group'+(group.length<cycle.length?' incomplete':'')+'">'+group.map(function(v){return patternToken(dimension,v);}).join('')+'</span>';}
  showModal('<div id="logicPattern"><p class="learning-tag">只观察'+LOGIC_FEATURES[dimension]+' · 重复的小队伍</p><h2 class="learning-question">接下来，轮到谁？</h2><div class="pattern-track quiz-visual">'+groups+'<span class="pattern-blank">?</span></div><div class="picture-options" id="logicPatternChoices">'+_logicPattern.options.map(function(v){return '<button class="option-btn" data-val="'+v+'" aria-label="'+patternLabel(dimension,v)+'" onclick="checkPattern(\'logicPatternChoices\','+v+','+_logicPattern.answer+')">'+patternToken(dimension,v)+'</button>';}).join('')+'</div><div class="learning-actions">'+learningButton('🔊 听题目','speakLogicPattern()','btn-blue')+learningButton('💡 看看重复的一组','hintLogicPattern()','btn-yellow')+'</div><div id="learningFeedback" class="learning-feedback" aria-live="polite"></div><div id="learningNext" class="learning-actions"></div></div>',learningFooter());practiceAttach();speakLogicPattern();
}
function speakLogicPattern(){if(_logicPattern)learningSpeak('看看'+LOGIC_FEATURES[_logicPattern.dimension]+'的规律，接下来轮到谁？');}
function hintLogicPattern(){if(!_logicPattern||!document.getElementById('logicPattern'))return;document.querySelector('#logicPattern .pattern-track').classList.add('show-groups');var text='圈起来的是重复的一组：'+_logicPattern.cycle.map(function(v){return patternLabel(_logicPattern.dimension,v);}).join('、')+'。再照着排一遍。';learningFeedback(text);learningSpeak(text);}
function awardLogicPlay(stars){var last=state.logic.completed[state.logic.completed.length-1]||0;state.logic.completed.push(Math.max(Date.now(),last+1));state.logic.stars+=stars;addStars(stars);saveState();}
function answerLogicPattern(value){
  if(!_logicPattern||_logicPattern.solved||!document.getElementById('logicPattern')||!_logicPattern.options.includes(value))return;var button=document.querySelector('#logicPatternChoices [data-val="'+value+'"]');
  if(value!==_logicPattern.answer){button.classList.add('wrong');learningFeedback('再看一看，前面哪一小组在重复？可以点小提示。');learningSpeak('再看一看，前面哪一小组在重复？');return;}
  _logicPattern.solved=true;document.querySelectorAll('#logicPatternChoices button').forEach(function(b){b.disabled=true;});button.classList.remove('wrong');button.classList.add('correct');awardLogicPlay(2);practiceRecord();var text='找到啦！接下来是'+patternLabel(_logicPattern.dimension,value)+'。获得2颗星星。';learningFeedback(text,true);learningSpeak(text);document.getElementById('learningNext').innerHTML=learningButton('下一题 / 本轮结果',"continueLogicPattern()",'btn-green');armNextButton();
}
function continueLogicPattern(){practiceContinue(function(){startLogicPattern();});}
function showSortMenu(){startLogicSort();}
function sortDrawing(dimension,value){
  if(dimension==='size')return '<span class="sort-stage"><span class="sort-circle" style="width:'+(16+value*10)+'px;height:'+(16+value*10)+'px"></span></span>';
  if(dimension==='length')return '<span class="sort-stage sort-length"><span class="sort-stick" style="width:'+((20+value*19)/132*100)+'%"></span></span>';
  if(dimension==='height')return '<span class="sort-stage sort-height"><span class="sort-tower" style="height:'+(14+value*15)+'px"></span></span>';
  return '<span class="sort-stage sort-quantity">'+new Array(value+1).join('<span class="sort-dot"></span>')+'</span>';
}
function startLogicSort(dimension){
  if(dimension&&!LOGIC_SORTS[dimension])return;
  var index=practiceStart('logic_sort_mixed','排一排'),round=state.practice.rounds.logic_sort_mixed||0;
  dimension=dimension||Object.keys(LOGIC_SORTS)[(round*PRACTICE_LENGTH+index)%4];
  var level=state.logic.level,values=shuffle([1,2,3,4,5]).slice(0,level===0?2:3).sort(function(a,b){return a-b;}),items=shuffle(values.slice());if(items.every(function(v,i){return v===values[i];}))items.reverse();
  _logicSort={dimension:dimension,index:index,values:values,sequence:[],solved:false};var d=LOGIC_SORTS[dimension];
  showModal('<div id="logicSort"><p class="learning-tag">比较'+d.name+' · 排'+values.length+'张图片</p><h2 class="learning-question">'+d.title+'</h2><p class="learning-meta">按顺序点图片，选完自动检查。</p><div class="sort-cards">'+items.map(function(v,i){return '<button class="option-btn sort-card" data-sort-value="'+v+'" aria-label="图片'+(i+1)+'" onclick="pickLogicSort('+v+')">'+sortDrawing(dimension,v)+'<span class="sort-card-label">图片 '+(i+1)+'</span></button>';}).join('')+'</div><div class="sort-picked" id="sortPicked">我选的顺序会出现在这里</div><div class="learning-actions">'+learningButton('🔊 听题目','speakLogicSort()','btn-blue')+learningButton('重新排','resetLogicSort()','btn-yellow')+'</div><div id="learningFeedback" class="learning-feedback" aria-live="polite"></div><div id="learningNext" class="learning-actions"></div></div>',learningFooter());practiceAttach();speakLogicSort();
}
function speakLogicSort(){if(_logicSort){var d=LOGIC_SORTS[_logicSort.dimension];learningSpeak(d.title+'。'+d.hint);}}
function pickLogicSort(value){if(!_logicSort||_logicSort.solved||!document.getElementById('logicSort')||!_logicSort.values.includes(value)||_logicSort.sequence.includes(value))return;_logicSort.sequence.push(value);document.querySelector('[data-sort-value="'+value+'"]').disabled=true;document.getElementById('sortPicked').innerHTML=_logicSort.sequence.map(function(v,i){return '<span class="sort-picked-card"><strong>'+(i+1)+'</strong>'+sortDrawing(_logicSort.dimension,v)+'</span>';}).join('<span>→</span>');if(_logicSort.sequence.length===_logicSort.values.length)checkLogicSort();}
function resetLogicSort(){if(!_logicSort||_logicSort.solved||!document.getElementById('logicSort'))return;_logicSort.sequence=[];document.querySelectorAll('[data-sort-value]').forEach(function(b){b.disabled=false;b.classList.remove('wrong');});document.getElementById('sortPicked').textContent='我选的顺序会出现在这里';learningFeedback('');}
function checkLogicSort(){
  if(!_logicSort||_logicSort.solved||!document.getElementById('logicSort'))return;var s=_logicSort,d=LOGIC_SORTS[s.dimension];
  if(s.sequence.length!==s.values.length){learningFeedback('把每张图片都排上，再检查吧。');return;}
  if(!s.sequence.every(function(v,i){return v===s.values[i];})){learningFeedback('再试一次。'+d.hint+' 点“重新排”就能再来。');learningSpeak(d.hint);return;}
  s.solved=true;awardLogicPlay(3);practiceRecord();learningFeedback('排好啦！'+d.result+' 获得3颗星星。',true);learningSpeak('排好啦！'+d.result);document.getElementById('learningNext').innerHTML=learningButton('下一题 / 本轮结果','continueLogicSort()','btn-green');armNextButton();
}
function continueLogicSort(){practiceContinue(function(){startLogicSort();});}
