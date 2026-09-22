// Everyday choices and feelings: two large pictures, with a listening button for each.
// The first source option is the answer; the displayed order is shuffled each time.
var GROWTH_ACTIVITIES={
  life:[
    {e:'🖐️ 🫧',prompt:'小手玩得脏脏的，要吃饭啦，先做什么？',options:[{e:'🧼',cn:'洗洗小手'},{e:'⚽',cn:'继续踢球'}],hint:'慢慢想，小手干净了，再来吃饭。',success:'对啦，吃饭前洗洗小手，手心手背都洗到。'},
    {e:'🦷 ✨',prompt:'小牙齿要洗澡啦，用哪个小帮手？',options:[{e:'🪥',cn:'小牙刷'},{e:'🖍️',cn:'小蜡笔'}],hint:'小牙齿有自己的刷子，找找小牙刷。',success:'找到小牙刷啦！和大人一起，轻轻刷牙。'},
    {e:'🧸 🧩',prompt:'玩具玩好了，送它们回哪里？',options:[{e:'🧺',cn:'玩具篮子'},{e:'🚽',cn:'马桶里面'}],hint:'玩具也有小家，看看哪个地方能收好玩具。',success:'送回玩具篮子，下一次就容易找到啦。'},
    {e:'🌧️ 🏡',prompt:'外面下雨了，和大人出门要带什么挡雨？',options:[{e:'☂️',cn:'小雨伞'},{e:'🧸',cn:'玩具熊'}],hint:'雨滴落下来，撑开哪一样可以挡雨呢？',success:'雨伞可以挡雨，和大人一起慢慢走。'},
    {e:'😋 💧',prompt:'小兔口渴了，找一找它的喝水杯。',options:[{e:'🥤',cn:'喝水杯'},{e:'👟',cn:'运动鞋'}],hint:'看看哪个有杯口，可以装水来喝。',success:'找到水杯啦，坐稳了，慢慢喝水。'},
    {e:'👣 🏞️',prompt:'准备出去散步，脚上穿什么？',options:[{e:'👟',cn:'运动鞋'},{e:'🧤',cn:'小手套'}],hint:'小脚有自己的衣服，找找鞋子。',success:'鞋子穿在脚上，请大人帮忙看看穿稳了没有。'},
    {e:'🤧 🐰',prompt:'小兔流鼻涕了，可以拿什么擦一擦？',options:[{e:'🧻',cn:'干净纸巾'},{e:'📚',cn:'故事书'}],hint:'找柔软的纸巾，请大人帮忙轻轻擦。',success:'用干净纸巾轻轻擦，擦好丢进垃圾桶，再洗手。'},
    {e:'🥱 🌙',prompt:'天黑了，小熊困得打哈欠，去哪里休息？',options:[{e:'🛏️',cn:'小床'},{e:'🛝',cn:'滑梯'}],hint:'想一想，家里哪个地方可以舒服地睡觉？',success:'躺到小床上，安静休息，晚安小熊。'},
    {e:'🍌 🗑️',prompt:'香蕉吃完了，香蕉皮放哪里？',options:[{e:'🗑️',cn:'垃圾桶'},{e:'🛏️',cn:'枕头上'}],hint:'香蕉皮已经不吃了，找找装垃圾的小桶。',success:'请大人帮忙把香蕉皮放进合适的垃圾桶，收拾好啦。'},
    {e:'🧦 🫧',prompt:'袜子穿脏了，要洗一洗，放到哪里等着洗？',options:[{e:'🧺',cn:'脏衣篮'},{e:'🍽️',cn:'饭盘里'}],hint:'衣服和袜子要一起洗，找找放脏衣服的篮子。',success:'脏袜子放进脏衣篮，也可以请大人一起帮忙。'}
  ],
  emotions:[
    {e:'🐻 😄',prompt:'小熊笑眯眯的，说今天玩得真开心。找找开心的脸。',options:[{e:'😄',cn:'开心的脸'},{e:'😢',cn:'难过的脸'}],hint:'看看嘴角，哪张脸笑起来了？',success:'这是开心的脸。开心的时候，可以笑一笑，说给家人听。'},
    {e:'🐰 😢',prompt:'小兔的气球飞走了，它说我好难过。找找难过的脸。',options:[{e:'😢',cn:'难过的脸'},{e:'😄',cn:'开心的脸'}],hint:'听听小兔说了什么，它现在有点想哭。',success:'这是难过的脸。难过、想哭都可以，我们可以陪着它。'},
    {e:'🐻 😠',prompt:'小熊说我现在有点生气。找找生气的脸。',options:[{e:'😠',cn:'生气的脸'},{e:'😴',cn:'困困的脸'}],hint:'找找皱着眉头的脸，也听听小熊说的心情。',success:'这是生气的脸。生气也可以，先停一停，保护自己和别人。'},
    {e:'🐰 😨',prompt:'雷声好响，小兔说我有点害怕。找找害怕的脸。',options:[{e:'😨',cn:'害怕的脸'},{e:'😄',cn:'开心的脸'}],hint:'小兔听见大声音有点紧张，哪张脸看起来有点怕？',success:'这是害怕的脸。害怕时，可以告诉大人，请他们陪一陪。'},
    {e:'🐻 🥱',prompt:'小熊打着哈欠说我困了。找找困困的脸。',options:[{e:'😴',cn:'困困的脸'},{e:'😠',cn:'生气的脸'}],hint:'眼睛快闭上了，找找想睡觉的小脸。',success:'这是困困的脸。身体想休息了，可以告诉大人。'},
    {e:'😠 🌬️',prompt:'有点生气，想让身体慢下来。找找轻轻呼气的小嘴。',options:[{e:'😮‍💨',cn:'轻轻呼气'},{e:'🦶',cn:'用脚踢东西'}],hint:'试着和大人一起，慢慢吸气，轻轻呼出来。',success:'轻轻呼气，慢慢来。生气的感觉可以在，大人会陪着你。'},
    {e:'😢 🧑',prompt:'小兔难过了，想请家人陪一陪。点点陪伴的大人。',options:[{e:'🧑',cn:'陪伴的大人'},{e:'🚗',cn:'小汽车'}],hint:'想有人听你说，可以找身边照顾你的大人。',success:'可以说，我有点难过，请陪陪我。想不想抱抱，都可以告诉大人。'},
    {e:'🐰 💧',prompt:'朋友哭了，说想要一张纸巾。我们递给它什么？',options:[{e:'🧻',cn:'干净纸巾'},{e:'🥁',cn:'小鼓'}],hint:'听听朋友需要什么，它想用纸巾擦擦眼泪。',success:'递一张纸巾，轻轻陪一陪。朋友可以慢慢说，也可以安静一会儿。'},
    {e:'🧸 🙅',prompt:'小熊说现在不想抱抱。我们怎么回应它？',options:[{e:'👋',cn:'挥挥手，先不抱'},{e:'🫂',cn:'马上抱住它'}],hint:'小熊说了不想抱，听一听它的想法。',success:'先不抱，挥挥手也很好。每个人都可以说自己想不想抱抱。'},
    {e:'🐰 🧩',prompt:'拼图有点难，小兔想请大人帮忙。可以点哪张图？',options:[{e:'🙋',cn:'举手请帮忙'},{e:'🦶',cn:'用脚踢拼图'}],hint:'遇到有点难的事情，可以说，请帮帮我。',success:'举手请帮忙，或者说，请帮帮我。可以慢慢试，也可以先休息。'}
  ]
};
var GROWTH_MODULES=[
  {id:'life',e:'🧺',title:'生活小能手',desc:'洗小手、收玩具，发现自己能做的小事情。',preview:'🧼 🪥 🧸',note:'生活里的小练习 · 可以请大人帮忙'},
  {id:'emotions',e:'🌈',title:'情绪小伙伴',desc:'认识小心情，练习表达需要、温柔地陪伴。',preview:'😄 😢 🫶',note:'每种心情都可以说 · 慢慢来就很好'}
];
var GROWTH_PROMPTS=Object.keys(GROWTH_ACTIVITIES).reduce(function(all,kind){
  GROWTH_ACTIVITIES[kind].forEach(function(q){all.push(q.prompt,q.hint,q.success);q.options.forEach(function(o){all.push(o.cn);});});return all;
},[]).filter(function(text,index,all){return all.indexOf(text)===index;});

function renderGrowth(){
  return '<div class="growth-hub"><div class="section-title">🌱 成长乐园</div><div class="subtitle">小小的自己，也有大大的成长</div><div class="growth-welcome"><span aria-hidden="true">🏡</span><div><h2>今天，陪小伙伴玩什么？</h2><p>听一听，点图片。每轮10个小活动，随时休息，下次接着玩。</p></div></div><div class="growth-cards">'+GROWTH_MODULES.map(function(m){
    var done=state.practice.progress['growth-'+m.id]||0,rounds=state.practice.rounds['growth-'+m.id]||0;
    return '<article class="growth-card growth-'+m.id+'"><div class="growth-preview" aria-hidden="true">'+m.preview+'</div><h2>'+m.e+' '+m.title+'</h2><p>'+m.desc+'</p><p class="growth-note">'+m.note+'</p><div class="growth-progress"><span>'+(done===10?'这一轮完成啦':done?'已完成 '+done+' / 10 个活动':'每轮 10 个小活动')+'</span><span>完成 '+rounds+' 轮</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+(done*10)+'%"></div></div>'+learningButton(done>0&&done<10?'继续玩 · 第 '+(done+1)+' 题':'一起玩',"startGrowthPlay('"+m.id+"')",m.id==='life'?'btn-green':'btn-pink')+'</article>';
  }).join('')+'</div><p class="growth-parent-note">🫶 家长陪玩：点图片下面的小喇叭，可以听每个选项。答对后，听完解释再继续；生活中也一起试一试。</p></div>';
}

function startGrowthPlay(kind){
  var module=GROWTH_MODULES.find(function(m){return m.id===kind;});if(!module)return;
  var index=practiceStart('growth-'+kind,module.title),activity=GROWTH_ACTIVITIES[kind][index];
  var q={kind:kind,index:index,activity:activity,options:shuffle(activity.options.slice()),solved:false};
  _practiceCurrent.growth=q;
  showModal('<div id="growthPlay" class="growth-play growth-'+kind+'"><div class="growth-scene" aria-hidden="true">'+activity.e+'</div><h2 class="learning-question">'+learningEscape(activity.prompt)+'</h2><div class="learning-actions">'+learningButton('🔊 再听题目','speakGrowth()','btn-blue')+'</div><div id="learningOptions" class="growth-options">'+q.options.map(function(o,i){return '<div class="growth-choice"><button class="option-btn growth-answer" onclick="answerGrowth('+i+')" aria-label="'+learningEscape(o.cn)+'"><span class="picture" aria-hidden="true">'+o.e+'</span><span>'+learningEscape(o.cn)+'</span></button><button class="btn growth-listen" data-growth-listen="'+i+'" aria-label="听选项：'+learningEscape(o.cn)+'" onclick="speakGrowthOption('+i+')">🔊 听一听</button></div>';}).join('')+'</div><div class="learning-feedback" id="learningFeedback" aria-live="polite"></div><div class="learning-actions" id="learningNext"></div></div>',learningFooter());
  q.generation=_modalGeneration;practiceAttach();speakGrowth();
}
function growthActive(){var q=_practiceCurrent&&_practiceCurrent.growth;return q&&q.generation===_modalGeneration&&document.getElementById('growthPlay')&&document.getElementById('modal-overlay').classList.contains('show')?q:null;}
function speakGrowth(){var q=growthActive();if(q)learningSpeak(q.solved?q.activity.success:q.activity.prompt);}
function speakGrowthOption(index){var q=growthActive();if(q&&Number.isInteger(index)&&q.options[index])learningSpeak(q.options[index].cn);}
function answerGrowth(index){
  var q=growthActive();if(!q||q.solved||!Number.isInteger(index)||!q.options[index])return;
  var button=document.querySelectorAll('#growthPlay .growth-answer')[index];
  if(q.options[index]!==q.activity.options[0]){button.classList.add('wrong');learningFeedback(q.activity.hint);learningSpeak(q.activity.hint);return;}
  q.solved=true;button.classList.remove('wrong');button.classList.add('correct');learningLock();
  practiceRecord();if(q.index===PRACTICE_LENGTH-1)addStars(3);
  learningFeedback(q.activity.success,true);learningSpeak(q.activity.success);
  document.getElementById('learningNext').innerHTML=learningButton(q.index===PRACTICE_LENGTH-1?'这一轮完成啦':'下一题','nextGrowth()','btn-green');armNextButton();
}
function nextGrowth(){var q=growthActive();if(!q||!q.solved)return;var kind=q.kind;practiceContinue(function(){startGrowthPlay(kind);});}
