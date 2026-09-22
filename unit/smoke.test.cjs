const {test}=require('node:test'),assert=require('node:assert/strict'),{createApp}=require('./harness.cjs');
test('application boots and every module renders',t=>{const {w,document,errors}=createApp(t);for(const tab of w.TABS){w.switchTab(tab.id);assert.ok(document.querySelector('#main .section-title'));}assert.deepEqual(errors,[]);});
