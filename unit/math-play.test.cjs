const {test}=require('node:test'),assert=require('node:assert/strict'),{createApp}=require('./harness.cjs');

test('small baskets cycle through three, four and five slots including resumed rounds',t=>{
  const {w}=createApp(t);
  const totals=[];
  for(let i=0;i<10;i++)totals.push(w.makeChallengeQuestion('make',0,i).scene.total);
  assert.deepEqual(totals,[3,4,5,3,4,5,3,4,5,3]);
  assert.equal(w.makeChallengeQuestion('make',0).scene.total,3);
  w.state.practice.progress.math_make=4;w.startChallenge('make');assert.equal(w._challenge.question.scene.total,4);
  w.state.numbers.difficulty=1;for(let i=0;i<30;i++){const q=w.makeChallengeQuestion('make',1,i);assert.ok(q.scene.total>=6&&q.scene.total<=10);assert.equal(q.answer,q.scene.total-q.scene.start);}
});

test('addition and subtraction drawings preserve the narrated quantities and result',t=>{
  const {w,document}=createApp(t);let seed=31;w.Math.random=()=>((seed=seed*16807%2147483647)/2147483647);const modes=new Set();
  for(let i=0;i<70;i++){
    w.startChallenge('combine');const q=w._challenge.question,s=q.scene;modes.add(s.mode);
    assert.equal(document.querySelectorAll('.math-apple-slot').length,s.total);
    assert.equal(document.querySelectorAll('.math-apple-slot.is-change').length,s.change);
    assert.equal(q.answer,s.mode==='add'?s.total:s.start);
    assert.equal(document.querySelectorAll('.math-taken-fruit').length,s.mode==='take'?s.change:0);
    assert.ok(q.explain.includes(String(q.answer)));
    assert.equal(document.querySelectorAll('.math-apple-slot:not(.is-change)').length,s.start);
  }
  assert.deepEqual([...modes].sort(),['add','take']);
});

test('empty basket slots are clearly marked and filling can replay without changing answers or progress',t=>{
  const {w,document}=createApp(t);w.startChallenge('make');const q=w._challenge.question;
  assert.equal(document.querySelectorAll('.math-apple-slot.is-change').length,q.answer);
  assert.ok(document.querySelector('#mathIllustration').classList.contains('math-motion'));
  const html=document.querySelector('#mathIllustration').innerHTML;
  document.querySelector('#mathReplay').click();w.replayMathIllustration();
  assert.equal(w._challenge.question,q);assert.equal(q.solved,false);assert.equal(document.querySelector('#mathIllustration').innerHTML,html);
  assert.equal(w.state.practice.progress.math_make||0,0);
  w.answerChallenge(q.options.indexOf(q.answer));assert.equal(w.state.practice.progress.math_make,1);
  w.replayMathIllustration();assert.equal(w.state.practice.progress.math_make,1);
});

test('answers can be given during motion; retries and ten-question rounds do not require replay',t=>{
  const {w,document}=createApp(t);w.startChallenge('make');
  for(let i=0;i<10;i++){
    const q=w._challenge.question;
    w.answerChallenge(q.options.findIndex(v=>v!==q.answer));assert.equal(w.state.practice.progress.math_make||0,i);
    w.answerChallenge(q.options.indexOf(q.answer));w.answerChallenge(q.options.indexOf(q.answer));
    assert.equal(w.state.practice.progress.math_make,i+1);w.nextChallenge();
  }
  assert.equal(w.state.numbers.challengeDone,1);assert.equal(w.state.stars,3);assert.match(document.getElementById('modal').textContent,/这一轮完成啦/);
});

test('replay is unavailable for non-quantity puzzles or closed/replaced questions',t=>{
  const {w,document}=createApp(t);w.replayMathIllustration();
  w.startChallenge('compare');assert.equal(document.getElementById('mathReplay'),null);w.replayMathIllustration();
  w.startChallenge('pattern');assert.equal(document.getElementById('mathIllustration'),null);w.replayMathIllustration();
  w.startChallenge('combine');w.closeModal();w.replayMathIllustration();assert.equal(w.state.numbers.quizDone,0);
  w.showModal('another activity');w.replayMathIllustration();assert.equal(document.getElementById('modal').textContent,'another activity');
});
