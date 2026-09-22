// Four visible phone destinations, with all learning modules one tap away.
function renderMobileNav(){
  return [{e:'🎈',text:'游戏大全',action:'showGameMenu()',active:!['stories','growth'].includes(state.currentTab)},{e:'📚',text:'故事屋',action:"switchTab('stories')",active:state.currentTab==='stories'},{e:'🌱',text:'成长乐园',action:"switchTab('growth')",active:state.currentTab==='growth'},{e:'⚙️',text:'家长',action:'openParentTools()',active:false}].map(function(item){return '<button class="bottom-nav-item '+(item.active?'active':'')+'" onclick="'+item.action+'"><span class="nav-emoji">'+item.e+'</span><span>'+item.text+'</span></button>';}).join('');
}
function showGameMenu(){
  showModal('<h2 class="game-menu-title">🎈 今天想玩什么？</h2><p class="game-menu-note">点一张大图，就能出发啦</p><div class="game-menu">'+TABS.map(function(tab){return '<button data-tab="'+tab.id+'" class="game-entry" style="--tile-color:'+tab.color+'" onclick="switchTab(\''+tab.id+'\')"><span aria-hidden="true">'+tab.emoji+'</span><strong>'+tab.name+'</strong></button>';}).join('')+'</div>',learningButton('回到刚才','closeModal()','btn-blue'));
}
function openParentTools(){
  showModal('<h2 class="game-menu-title">⚙️ 家长工具</h2><p class="game-menu-note">更换设备前，可以导出学习记录，再到新设备导入。</p><div class="parent-actions">'+learningButton('💾 导出备份','exportData()','btn-purple')+learningButton('📂 导入恢复',"document.getElementById('importFile').click()",'btn-green')+learningButton('🗑️ 清空数据','clearData()','btn-pink')+'</div>',learningFooter());
}
function quickActivity(){
  function unfinished(key){var n=state.practice.progress[key]||0;return n>0&&n<10;}
  var candidates=[];
  if(state.currentTab==='english')candidates=ENGLISH_LESSONS.map(function(l,i){return {title:l.title,key:'english_lesson_'+i,run:function(){startEnglishLesson(i);}};});
  if(state.currentTab==='numbers')candidates=MATH_PLAY.map(function(m){return {title:m.title,key:'math_'+m.id,run:function(){startChallenge(m.id);}};});
  if(state.currentTab==='logic')candidates=LOGIC_ACTIVITIES.map(function(m){return {title:m.title,key:m.key,run:function(){startLogicActivity(m.id);}};});
  if(state.currentTab==='growth')candidates=GROWTH_MODULES.map(function(m){return {title:m.title,key:'growth-'+m.id,run:function(){startGrowthPlay(m.id);}};});
  if(state.currentTab==='letters')candidates=['listen','words'].map(function(kind){return {title:kind==='listen'?'听音找字母':'字母找朋友',key:'letters_'+kind,run:function(){startLetterPlay(kind);}};});
  if(state.currentTab==='poems'){var p=POEMS.find(function(p){return unfinished('poem_'+p.id);})||POEMS.find(function(p){return state.poems.favorites.includes(p.id);})||POEMS[0];candidates=[{title:p.t,key:'poem_'+p.id,run:function(){startPoemPlay(p.id);}}];}
  if(state.currentTab==='stories'){var s=STORIES.find(function(s){return unfinished('story_'+s.id+'_'+state.stories.readingLevel);})||STORIES.find(function(s){return s.id===state.stories.currentStory;})||STORIES[0],storyKey='story_'+s.id+'_'+state.stories.readingLevel;candidates=[{title:s.t,key:storyKey,run:function(){if(unfinished(storyKey))showStoryQuiz(s.id);else showStory(s.id);}}];}
  if(state.currentTab==='levels'){var n=Math.min(10,state.levels.completed.length+1);candidates=[{title:'第'+n+'关的小冒险',key:'adventure',run:function(){startLevel(n);}}];}
  var choice=candidates.find(function(c){return unfinished(c.key);})||candidates[0];if(choice)choice.continuing=unfinished(choice.key);return choice;
}
function addQuickStart(){
  var main=document.getElementById('main'),heading=main&&main.querySelector('.section-title'),choice=quickActivity();if(!heading||!choice||state.currentTab==='english'&&_englishMode!=='themes'||document.getElementById('quickPlay'))return;
  var tab=TABS.find(function(t){return t.id===state.currentTab;}),card=document.createElement('div');card.id='quickPlay';card.className='quick-play';
  card.innerHTML='<span class="quick-icon" aria-hidden="true">'+tab.emoji+'</span><div><small>'+(choice.continuing?'继续未完成的小任务':'小小任务，马上出发')+'</small><strong>'+learningEscape(choice.title)+'</strong></div>'+learningButton(choice.continuing?'继续玩 ▶':'一起玩 ▶','quickPlayCurrent()','btn-purple');
  heading.insertAdjacentElement('afterend',card);
}
function quickPlayCurrent(){var choice=quickActivity();if(choice)choice.run();}
