const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM,VirtualConsole}=require('jsdom');
const {createInstrumenter}=require('istanbul-lib-instrument');
const root=path.resolve(__dirname,'..');
const files=['speech-player.js','practice.js','learning.js','logic-play.js','enrichment.js','logic-hub.js','life-play.js','play-hub.js'];
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const main=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('var POEMS='));
const prefix='\n'.repeat(html.slice(0,main.index+main[0].indexOf('>')+1).split('\n').length-1);
const sources=new Map([[path.join(root,'index.html'),prefix+main[1]],...files.map(f=>[path.join(root,f),fs.readFileSync(path.join(root,f),'utf8')])]);
const instrumented=[...sources].map(([file,source])=>[file,createInstrumenter({compact:false,produceSourceMap:false}).instrumentSync(source,file)]);
function createApp(t,options={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;let now=0,serial=0;const timers=new Map();
 w.setTimeout=(fn,delay=0)=>{const id=++serial;timers.set(id,{fn,at:now+delay});return id;};w.clearTimeout=id=>timers.delete(id);
 w.setInterval=(fn,delay)=>w.setTimeout(fn,delay);w.clearInterval=w.clearTimeout;
 w.requestAnimationFrame=fn=>w.setTimeout(fn,16);w.cancelAnimationFrame=w.clearTimeout;
 w.__advance=ms=>{const until=now+ms;let turns=0;while(true){const next=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;if(++turns>10000)throw Error('Runaway timer');now=next[1].at;timers.delete(next[0]);next[1].fn();}now=until;};
 w.__timers=timers;w.scrollTo=()=>{};w.confirm=()=>true;w.alert=()=>{};
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class AudioContext{constructor(){this.state='running';this.currentTime=0;this.destination={};}resume(){return Promise.resolve();}createOscillator(){return {frequency:param(),connect(){},start(){},stop(){}};}createGain(){return {gain:param(),connect(){}};}}
 w.AudioContext=AudioContext;w.webkitAudioContext=AudioContext;
 class Audio{constructor(){this.paused=true;this.currentTime=0;this.duration=2;this.volume=1;this.muted=false;}play(){this.paused=false;if(options.audioError)return Promise.reject(Error('audio failure'));this.currentTime=.1;return Promise.resolve().then(()=>this.onplaying?.());}pause(){this.paused=true;}end(){this.paused=true;this.currentTime=this.duration;this.onended?.();}}
 w.Audio=Audio;w.SpeechSynthesisUtterance=function(text){this.text=text;};
 w.speechSynthesis={speaking:false,pending:false,getVoices:()=>[{name:'Chinese',lang:'zh-CN',localService:true},{name:'English',lang:'en-US',localService:true}],cancel(){this.speaking=false;},speak(u){this.utterance=u;this.speaking=true;u.onstart?.();}};
 w.SpeechRecognition=function(){this.start=()=>{};this.abort=()=>{};};
 w.URL.createObjectURL=()=> 'blob:unit-backup';w.URL.revokeObjectURL=()=>{};
 // Compile inline handlers lazily, including handlers captured by auto-next before a click.
 const onclick=Object.getOwnPropertyDescriptor(w.HTMLElement.prototype,'onclick');
 Object.defineProperty(w.HTMLElement.prototype,'onclick',{configurable:true,get(){let fn=onclick.get.call(this);const source=this.getAttribute('onclick');if(!fn&&source){fn=w.Function('event',source);onclick.set.call(this,fn);}return fn;},set(fn){onclick.set.call(this,fn);}});
 // Enable inline handlers exactly as browser click handlers, while keeping resource loading offline.
 const click=w.HTMLElement.prototype.click;w.HTMLElement.prototype.click=function(){const source=this.getAttribute('onclick');if(source&&!this.onclick)this.onclick=w.Function('event',source);return click.call(this);};
 for(const [file,code] of instrumented){if(file.endsWith('speech-player.js'))w.eval(fs.readFileSync(path.join(root,'speech-catalog.js'),'utf8'));w.eval(code);}
 w.state.firstVisit=false;w.state.audio.muted=true;w.BADGES_DEF.forEach(b=>w.state.badges[b.id]=1);
 if(options.init!==false)w.init();
 let closed=false;function close(){if(closed)return;closed=true;if(process.env.COVERAGE_DIR){fs.mkdirSync(process.env.COVERAGE_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.COVERAGE_DIR,crypto.randomUUID()+'.json'),JSON.stringify(w.__coverage__));}dom.window.close();}
 if(t)t.after(close);
 return {w,document:w.document,advance:w.__advance,errors,close,json:v=>JSON.parse(JSON.stringify(v)),flush:async()=>{for(let i=0;i<4;i++)await Promise.resolve();}};
}
module.exports={createApp,sources,root};
