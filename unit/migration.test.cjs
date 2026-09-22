const {test}=require('node:test'),assert=require('node:assert/strict'),{createApp}=require('./harness.cjs');
test('new site migrates legacy progress once without rewriting the old site data',t=>{
 const {w,json}=createApp(t),legacy=JSON.stringify({stars:12,currentTab:'english',english:{learned:{cat:true}}});
 w.localStorage.clear();w.localStorage.setItem(w.LEGACY_STORAGE_KEY,legacy);w.loadState();assert.equal(w.state.stars,12);assert.equal(w.state.english.learned.cat,true);assert.deepEqual(json(w.state.practice.progress),{});assert.equal(w.localStorage.getItem(w.LEGACY_STORAGE_KEY),legacy);assert.ok(w.localStorage.getItem(w.STORAGE_KEY));
 w.state.currentTab='growth';w.state.practice.progress['growth-life']=4;w.saveState();assert.equal(w.localStorage.getItem(w.LEGACY_STORAGE_KEY),legacy);
 w.localStorage.setItem(w.LEGACY_STORAGE_KEY,JSON.stringify({stars:99,currentTab:'letters'}));w.loadState();assert.equal(w.state.currentTab,'growth');assert.equal(w.state.stars,12);assert.equal(w.state.practice.progress['growth-life'],4);
});
test('invalid legacy data cannot break startup or overwrite another stored copy',t=>{
 const {w}=createApp(t);w.localStorage.clear();w.localStorage.setItem(w.LEGACY_STORAGE_KEY,'bad json');w.loadState();assert.equal(w.state.stars,0);assert.equal(w.localStorage.getItem(w.STORAGE_KEY),null);assert.equal(w.localStorage.getItem(w.LEGACY_STORAGE_KEY),'bad json');
});
