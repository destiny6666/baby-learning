var LOGIC_ACTIVITIES=[
  {id:'pattern',title:'找规律',category:'观察规律',icon:'🔍',key:'logic_pattern_mixed',setting:'patternLevel',description:'看清重复的小队伍，找出接下来是哪一个。',detail:'颜色、形状、大小轮流练习',levels:['两种交替','简单重复','三种轮换'],color:'lavender'},
  {id:'sort',title:'排一排',category:'比较顺序',icon:'📏',key:'logic_sort_mixed',setting:'sortLevel',description:'按题目要求，把图片依次排好。选完自动检查。',detail:'大小、长短、高矮、数量交替出现',levels:['排两张','排三张'],color:'peach'},
  {id:'memory',title:'记忆配对',category:'记住位置',icon:'🧠',key:'logic_memory_pairs',setting:'memoryLevel',description:'一次翻两张，找出相同的图形小伙伴。',detail:'每轮配好10对；随时休息，成功对数会保存',levels:['每盘3对','每盘4对','每盘5对'],color:'mint'}
];
function logicActivityPreview(kind){
  if(kind==='pattern')return '<div class="logic-preview pattern-preview" aria-hidden="true">'+[0,1,0,1].map(function(v){return patternToken('color',v);}).join('')+'<span class="preview-question">?</span></div>';
  if(kind==='sort')return '<div class="logic-preview sort-preview" aria-hidden="true"><span style="height:25px"></span><span style="height:43px"></span><span style="height:62px"></span><b>↗</b></div>';
  return '<div class="logic-preview memory-preview" aria-hidden="true"><span>★</span><span>?</span><span>★</span><span>?</span></div>';
}
renderLogicPlay=function(){
  return '<section class="logic-hub"><div class="logic-hub-heading"><div><div class="section-title">🧩 逻辑挑战</div><p class="subtitle">观察、比较、记一记。今天想玩哪一个？</p></div><span class="logic-earned">⭐ '+state.logic.stars+' 颗逻辑星星</span></div>'+
    '<div class="logic-guide"><span>每轮 <strong>10题 / 配对10对</strong></span><span>答题不限时</span><span>提示播完自动继续，无语音时等3秒</span><span>随时休息，进度保留</span></div>'+
    '<div class="logic-activities">'+LOGIC_ACTIVITIES.map(function(game){
      var done=state.practice.progress[game.key]||0,rounds=state.practice.rounds[game.key]||0,continuing=done>0&&done<10,unit=game.id==='memory'?'对':'题';
      return '<article class="logic-activity '+game.color+'" data-activity="'+game.id+'"><div class="logic-category">'+game.icon+' '+game.category+'</div>'+logicActivityPreview(game.id)+'<h2>'+game.title+'</h2><p class="logic-description">'+game.description+'</p><p class="logic-detail">'+game.detail+'</p><div class="logic-difficulty"><span>选择难度</span><div role="group" aria-label="'+game.title+'难度">'+game.levels.map(function(label,i){return '<button class="logic-level" aria-pressed="'+(state.logic[game.setting]===i)+'" onclick="setLogicActivityLevel(\''+game.id+'\','+i+')">'+label+'</button>';}).join('')+'</div></div><div class="logic-card-progress"><span>'+ (continuing?'本轮已完成 '+done+' / 10 '+unit:rounds?'已完成 '+rounds+' 轮':game.id==='memory'?'从第一对开始，慢慢来':'从第一题开始，慢慢来')+'</span><div class="progress-bar"><div class="progress-fill" style="width:'+(done*10)+'%"></div></div></div>'+learningButton((continuing?'继续':'开始')+game.title,"startLogicActivity('"+game.id+"')",'logic-start')+'</article>';
    }).join('')+'</div><p class="logic-parent-note">🌱 陪玩小提示：先听清题目，再动手。不确定时可以重听，排错了也能重新试。</p></section>';
};
function setLogicActivityLevel(kind,level){var game=LOGIC_ACTIVITIES.find(function(g){return g.id===kind;});if(!game||!Number.isInteger(level)||level<0||level>=game.levels.length)return;state.logic[game.setting]=level;saveState();renderModule();}
function startLogicActivity(kind){var game=LOGIC_ACTIVITIES.find(function(g){return g.id===kind;});if(!game)return;state.logic.level=state.logic[game.setting];saveState();if(kind==='pattern')startLogicPattern();else if(kind==='sort')startLogicSort();else startShapeMatch();}
