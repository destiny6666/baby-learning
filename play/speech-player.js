// One cancellable playback channel shared by lessons, stories and recorded speech.
var _audioEl=null;
var _audioGeneration=0;
var _speechWatchdog=null;
var _audioHintTimer=null;
var _praiseGeneration=-1;
var _playbackListeners=new Set();
function watchPlayback(listener){_playbackListeners.add(listener);return function(){_playbackListeners.delete(listener);};}
var audioPlayback={status:'idle',text:'',url:''};
function speechKey(text,mode){return (mode==='en'?'en':'zh')+'|'+String(text).trim().replace(/\s+/g,' ');}
function chineseNumber(n,leading){
  var digits='零一二三四五六七八九';if(n<10)return digits[n];
  var units=[[100000000,'亿'],[10000,'万'],[1000,'千'],[100,'百'],[10,'十']];
  for(var i=0;i<units.length;i++){var unit=units[i][0];if(n>=unit){var high=Math.floor(n/unit),rest=n%unit;return (unit===10&&high===1&&leading?'':chineseNumber(high,true))+units[i][1]+(rest?(unit>10&&rest<unit/10?'零':'')+chineseNumber(rest,false):'');}}
}
function recordedSpeechClips(text,mode){
  var catalog=typeof RECORDED_SPEECH==='undefined'?{}:RECORDED_SPEECH,url=catalog[speechKey(text,mode)];if(url)return [url];
  var match=mode!=='en'&&String(text).match(/^你有(\d+)颗星星$/);
  if(match&&Number.isSafeInteger(Number(match[1]))){var words=['你有'].concat(chineseNumber(Number(match[1]),true).split(''),['颗星星']),clips=words.map(function(t){return catalog[speechKey(t,'child')];});if(clips.every(Boolean))return clips;}
  return null;
}
function setPlaybackStatus(status,text,url,reason){
  audioPlayback={status:status,text:text||'',url:url||'',generation:_audioGeneration,reason:reason||''};
  _playbackListeners.forEach(function(listener){listener(audioPlayback);});
  var el=document.getElementById('audioStatus');if(!el)return;
  clearTimeout(_audioHintTimer);el.hidden=status==='idle'||status==='playing';el.textContent=el.hidden?'':status==='loading'?'正在准备声音…':text||'';
  if(status==='muted'||status==='error')_audioHintTimer=setTimeout(function(){el.hidden=true;},2500);
}
function audioFailure(extra,error){setPlaybackStatus('error','声音暂时无法播放，请再点一次。');if(extra&&extra.onerror)extra.onerror(error||{error:'audio-unavailable'});}
function speak(text,mode,extra){
  if(!text)return;mode=mode||'child';extra=extra||{};
  var clips=recordedSpeechClips(text,mode);
  if(clips)return playRecordedClips(clips,text,mode,extra);
  stopSpeak();if(!audioEnabled())return;speakNative(text,mode,extra,_audioGeneration);
}
function playPraise(text){
  if(document.hidden||_praiseGeneration===_modalGeneration||state.audio.muted||state.audio.volume===0)return;
  var clips=recordedSpeechClips(text,'child');if(!clips)return;
  _praiseGeneration=_modalGeneration;
  playRecordedClips(clips,text,'child',{noNativeFallback:true});
}
function audioEnabled(){if(state.audio.muted||state.audio.volume===0){setPlaybackStatus('muted','🔇 已静音，请打开顶部声音或调高音量。');return false;}return true;}
function speakNative(text,mode,extra,generation){
  if(!synth||typeof SpeechSynthesisUtterance==='undefined'){audioFailure(extra,{error:'synthesis-unavailable'});return;}
  var settled=false,started=false,cfg=VOICE_MODES[mode]||VOICE_MODES.child;
  function fail(e){if(generation!==_audioGeneration||settled)return;settled=true;clearTimeout(_speechWatchdog);audioFailure(extra,e);}
  try{
    var utterance=new SpeechSynthesisUtterance(text),voice=pickVoice(cfg.lang);utterance.lang=cfg.lang;if(voice)utterance.voice=voice;
    utterance.rate=extra.rate||cfg.rate;utterance.pitch=extra.pitch||cfg.pitch;utterance.volume=state.audio.volume;
    utterance.onstart=function(){if(generation!==_audioGeneration||settled)return;started=true;clearTimeout(_speechWatchdog);setPlaybackStatus('playing',text);if(extra.onstart)extra.onstart();};
    utterance.onend=function(){if(generation!==_audioGeneration||settled)return;settled=true;clearTimeout(_speechWatchdog);setPlaybackStatus('idle','','','ended');if(extra.onend)extra.onend();};
    utterance.onerror=fail;setPlaybackStatus('loading',text);synth.speak(utterance);
    _speechWatchdog=setTimeout(function(){if(!started){fail({error:'synthesis-timeout'});try{synth.cancel();}catch(e){}}},5000);
  }catch(e){fail(e);}
}
function playAudio(url,fallbackText,mode,extra){
  // Text lookup also keeps corrected poem recordings aligned with their displayed text.
  return playRecordedClips(recordedSpeechClips(fallbackText||'',mode||'child')||[url],fallbackText,mode||'child',extra||{});
}
function playRecordedClips(clips,text,mode,extra){
  stopSpeak();if(!audioEnabled())return false;
  var generation=_audioGeneration,failed=false,started=false,index=0;
  function fallback(error){
    if(generation!==_audioGeneration||failed||(error&&error.name==='AbortError'))return;failed=true;clearTimeout(_speechWatchdog);
    if(_audioEl){_audioEl.onended=null;_audioEl.onerror=null;_audioEl.onplaying=null;_audioEl.pause();}
    if(text&&synth&&!extra.noNativeFallback)speakNative(text,mode,extra,generation);else audioFailure(extra,error);
  }
  function playNext(){
    if(generation!==_audioGeneration)return;
    try{
      if(!_audioEl){_audioEl=new Audio();_audioEl.preload='auto';}
      var a=_audioEl;a.volume=state.audio.volume;a.muted=state.audio.muted;
      a.onplaying=function(){if(generation!==_audioGeneration||failed)return;clearTimeout(_speechWatchdog);setPlaybackStatus('playing',text,clips[index]);if(!started){started=true;if(extra.onstart)extra.onstart();}};
      a.onended=function(){if(generation!==_audioGeneration||failed)return;if(++index<clips.length){playNext();return;}setPlaybackStatus('idle','','','ended');if(extra.onend)extra.onend();};
      a.onerror=fallback;a.src=clips[index];setPlaybackStatus('loading',text,clips[index]);
      _speechWatchdog=setTimeout(function(){fallback({error:'audio-timeout'});},8000);
      var promise=a.play();if(promise&&promise.catch)promise.catch(fallback);
    }catch(e){fallback(e);}
  }
  playNext();return true;
}
function stopSpeak(){
  _audioGeneration++;clearTimeout(_speechWatchdog);_speechWatchdog=null;
  if(_audioEl){_audioEl.onended=null;_audioEl.onerror=null;_audioEl.onplaying=null;_audioEl.pause();}
  // Some hosts report false while utterances are still queued; always cancel.
  if(synth)try{synth.cancel();}catch(e){}
  setPlaybackStatus('idle','','','stopped');var b=document.getElementById('readBtn');if(b){b.textContent='🔊 朗读';b.style.background='';}
}
window.addEventListener('pagehide',stopSpeak);
// Discard any speech left queued by the previous page version on refresh.
stopSpeak();
