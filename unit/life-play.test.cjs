const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createApp}=require('./harness.cjs');

function solve(w){const q=w._practiceCurrent.growth;w.answerGrowth(q.options.findIndex(o=>o===q.activity.options[0]));}

test('growth offers two picture and listening paths with ten distinct activities each',t=>{
  const {w}=createApp(t);
  assert.match(w.renderGrowth(),/生活小能手/);
  assert.match(w.renderGrowth(),/情绪小伙伴/);
  for(const kind of ['life','emotions']){
    const rows=w.GROWTH_ACTIVITIES[kind];
    assert.equal(rows.length,10);
    assert.equal(new Set(rows.map(q=>q.prompt)).size,10);
    rows.forEach(q=>{
      assert.equal(q.options.length,2);
      assert.ok(q.options.every(o=>o.e&&o.cn));
      for(const line of [q.prompt,q.hint,q.success,...q.options.map(o=>o.cn)])assert.ok(w.GROWTH_PROMPTS.includes(line));
    });
  }
});

test('hearing a choice does not submit it; retry stays on the same activity',t=>{
  const {w,document}=createApp(t),spoken=[];w.learningSpeak=text=>spoken.push(text);
  w.startGrowthPlay('life');const q=w._practiceCurrent.growth;
  document.querySelector('[data-growth-listen="0"]').click();
  assert.equal(spoken.at(-1),q.options[0].cn);
  assert.equal(w.state.practice.progress['growth-life']||0,0);
  const wrong=q.options.findIndex(o=>o!==q.activity.options[0]);
  w.answerGrowth(wrong);
  assert.equal(w.state.practice.progress['growth-life']||0,0);
  assert.equal(w._practiceCurrent.growth,q);
  assert.equal(spoken.at(-1),q.activity.hint);
  assert.equal(document.querySelectorAll('#learningOptions .correct').length,0);
  assert.equal(document.querySelector('#learningNext button'),null);
});

test('successful answer is credited only once and muted play advances after three seconds',t=>{
  const {w,document,advance}=createApp(t);w.startGrowthPlay('life');
  solve(w);solve(w);
  assert.equal(w.state.practice.progress['growth-life'],1);
  assert.ok([...document.querySelectorAll('#learningOptions .option-btn')].every(b=>b.disabled));
  advance(2999);assert.equal(w._practiceCurrent.growth.index,0);
  advance(1);assert.equal(w._practiceCurrent.growth.index,1);
  assert.equal(w.state.practice.progress['growth-life'],1);
});

test('pausing cancels auto advance and each path resumes its own next unsolved activity',t=>{
  const {w,advance}=createApp(t);
  w.startGrowthPlay('life');solve(w);w.closeModal();advance(4000);
  assert.equal(w.state.practice.progress['growth-life'],1);
  w.startGrowthPlay('emotions');assert.equal(w._practiceCurrent.growth.index,0);
  w.closeModal();w.startGrowthPlay('life');assert.equal(w._practiceCurrent.growth.index,1);
  const prompt=w._practiceCurrent.growth.activity.prompt;
  w.closeModal();w.startGrowthPlay('life');assert.equal(w._practiceCurrent.growth.activity.prompt,prompt);
});

test('audible success explanation finishes before the next activity starts',async t=>{
  const {w,advance,flush}=createApp(t);w.state.audio.muted=false;
  w.learningSpeak=text=>{w._audioGeneration++;w.setPlaybackStatus('playing',text);};
  w.startGrowthPlay('life');solve(w);advance(5000);
  assert.equal(w._practiceCurrent.growth.index,0);
  w.setPlaybackStatus('idle','','','ended');await flush();
  assert.equal(w._practiceCurrent.growth.index,1);
});

test('saved growth progress survives normalizing and resuming a later session',t=>{
  const {w}=createApp(t);w.startGrowthPlay('life');solve(w);w.nextGrowth();solve(w);w.closeModal();
  const snapshot=JSON.parse(JSON.stringify(w.state));
  w.state=w.normalizeState(snapshot);w._practiceCurrent=null;
  w.startGrowthPlay('life');assert.equal(w._practiceCurrent.growth.index,2);
  assert.equal(w._practiceCurrent.growth.activity.prompt,w.GROWTH_ACTIVITIES.life[2].prompt);
  w.closeModal();w.startGrowthPlay('emotions');assert.equal(w._practiceCurrent.growth.index,0);
});

test('ten activities finish one round, award once, and a new round starts from question one',t=>{
  const {w,document}=createApp(t);const stars=w.state.stars;
  w.startGrowthPlay('emotions');const seen=new Set();
  for(let i=0;i<10;i++){
    assert.equal(w._practiceCurrent.growth.index,i);
    seen.add(w._practiceCurrent.growth.activity.prompt);solve(w);w.nextGrowth();
  }
  assert.equal(seen.size,10);
  assert.equal(w.state.practice.progress['growth-emotions'],10);
  assert.equal(w.state.practice.rounds['growth-emotions'],1);
  assert.equal(w.state.stars,stars+3);
  assert.match(document.getElementById('modal').textContent,/这一轮完成啦/);
  w.answerGrowth(0);w.nextGrowth();
  assert.equal(w.state.practice.rounds['growth-emotions'],1);
  w.restartPractice();assert.equal(w._practiceCurrent.growth.index,0);
  assert.equal(w.state.practice.progress['growth-emotions'],0);
});

test('invalid or stale interactions cannot award progress or leave the active lesson',t=>{
  const {w,document}=createApp(t);
  w.startGrowthPlay('unknown');assert.equal(w._practiceCurrent,null);
  w.startGrowthPlay('life');const before=document.getElementById('modal').innerHTML;
  w.answerGrowth(-1);w.answerGrowth(0.5);w.answerGrowth(99);w.nextGrowth();
  assert.equal(document.getElementById('modal').innerHTML,before);
  w.closeModal();w.answerGrowth(0);w.nextGrowth();
  assert.equal(w.state.practice.progress['growth-life']||0,0);
});

test('emotion activities affirm feelings and give a concrete friendly next step',t=>{
  const {w}=createApp(t);
  const all=w.GROWTH_ACTIVITIES.emotions.map(q=>q.success).join('');
  assert.match(all,/难过/);assert.match(all,/生气/);assert.match(all,/害怕/);
  assert.match(all,/都可以/);assert.doesNotMatch(all,/不许哭|羞羞|坏孩子|必须开心/);
});
