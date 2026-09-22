var PRACTICE_LENGTH=10;
var _practiceCurrent=null;
var _practiceRestart=null;
function practiceStart(key,title){
  var completed=state.practice.progress[key]||0,restarted=completed>=PRACTICE_LENGTH;
  if(restarted){state.practice.progress[key]=0;completed=0;saveState();}
  _practiceCurrent={key:key,title:title,recorded:false,restarted:restarted};return completed;
}
function practiceAttach(){
  if(!_practiceCurrent)return;var modal=document.getElementById('modal'),bar=document.getElementById('practiceProgress');
  if(!bar){bar=document.createElement('div');bar.id='practiceProgress';bar.className='practice-progress';modal.insertBefore(bar,modal.firstChild);}
  var done=state.practice.progress[_practiceCurrent.key]||0;
  bar.innerHTML='<span>'+learningEscape(_practiceCurrent.title)+'</span><strong>'+(_practiceCurrent.recorded||_practiceCurrent.countCompleted?'已完成 '+done:'第 '+Math.min(done+1,PRACTICE_LENGTH))+' / '+PRACTICE_LENGTH+' '+learningEscape(_practiceCurrent.unit||'题')+'</strong><div class="progress-bar"><div class="progress-fill" style="width:'+(done/PRACTICE_LENGTH*100)+'%"></div></div>';
}
function practiceRecord(){
  if(!_practiceCurrent||_practiceCurrent.recorded)return false;_practiceCurrent.recorded=true;
  var key=_practiceCurrent.key,done=Math.min((state.practice.progress[key]||0)+1,PRACTICE_LENGTH);state.practice.progress[key]=done;
  if(done===PRACTICE_LENGTH)state.practice.rounds[key]=(state.practice.rounds[key]||0)+1;
  saveState();practiceAttach();return true;
}
function practiceContinue(next){
  if(!_practiceCurrent)return next();
  var done=state.practice.progress[_practiceCurrent.key]||0;
  if(done<PRACTICE_LENGTH){next();return;}
  _practiceRestart=next;
  showModal('<div class="phrase-card"><span class="learning-icon">🌟</span><h2>这一轮完成啦！</h2><p>'+learningEscape(_practiceCurrent.title)+' · '+PRACTICE_LENGTH+' / '+PRACTICE_LENGTH+' '+learningEscape(_practiceCurrent.unit||'题')+'</p><p>动脑筋也需要休息，和家长拍拍手吧。</p></div>',learningFooter()+learningButton('再来一轮','restartPractice()','btn-green'));
}
function restartPractice(){if(_practiceRestart){var next=_practiceRestart;_practiceRestart=null;next();}}

// Wait for the active narration to finish; silent activities keep a three-second pause.
function armNextButton(button,next){
  button=button||document.querySelector('#learningNext button');if(!button||button.dataset.autoNext)return;
  var label=button.textContent,action=next||button.onclick,generation=_modalGeneration,finished=false,timers=[],unwatch=null,waiting=null;
  button.dataset.autoNext='3';button.setAttribute('aria-label',label);
  function paint(seconds){button.dataset.autoNext=String(seconds);button.textContent=label+' · '+seconds+'s';}
  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function cleanup(){finished=true;clearTimers();if(unwatch)unwatch();}
  function run(event){if(finished||generation!==_modalGeneration||!button.isConnected)return;cleanup();button.disabled=true;if(action)action.call(button,event);}
  function fallback(){if(timers.length)return;waiting=null;paint(3);timers.push(modalTimeout(run,3000));[1,2].forEach(function(elapsed){var timer=setTimeout(function(){if(!finished&&generation===_modalGeneration)paint(3-elapsed);},elapsed*1000);timers.push(timer);_modalTimers.push(timer);});}
  function observe(playback){
    if(finished||generation!==_modalGeneration)return;
    if(!state.audio.muted&&state.audio.volume>0&&(playback.status==='loading'||playback.status==='playing')){
      clearTimers();waiting=playback.generation;button.dataset.autoNext='audio';button.textContent=label+' · 提示播完后继续';return;
    }
    if(playback.reason==='ended'&&waiting!==null&&waiting===playback.generation){
      var ended=waiting;Promise.resolve().then(function(){if(!finished&&generation===_modalGeneration&&audioPlayback.generation===ended&&audioPlayback.reason==='ended')run();});return;
    }
    fallback();
  }
  button.onclick=run;unwatch=watchPlayback(observe);_modalCleanups.push(cleanup);observe(audioPlayback);
}
function offerAutoNext(next,automatic){
  var host=document.querySelector('#modal .modal-actions'),button=document.createElement('button');button.className='btn btn-green';button.textContent='下一题';button.onclick=next;host.prepend(button);if(automatic!==false)armNextButton(button,next);
}
