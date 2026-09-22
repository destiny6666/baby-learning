const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {createCoverageMap}=require('istanbul-lib-coverage'),{createContext}=require('istanbul-lib-report'),reports=require('istanbul-reports');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'baby-learning-coverage-'));
const tests=fs.readdirSync(path.join(root,'unit')).filter(f=>f.endsWith('.test.cjs')).map(f=>path.join(root,'unit',f));
const result=cp.spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit',env:{...process.env,COVERAGE_DIR:dir}});
const map=createCoverageMap({});for(const file of fs.readdirSync(dir))map.merge(JSON.parse(fs.readFileSync(path.join(dir,file),'utf8')));
const context=createContext({dir:path.join(root,'coverage'),coverageMap:map});for(const type of ['text','html','json','json-summary','lcovonly'])reports.create(type).execute(context);
const summary=map.getCoverageSummary().toJSON();console.log('Unit coverage:',JSON.stringify(summary));
if(result.status!==0||!summary.lines.total||!Number.isFinite(summary.lines.pct)||summary.lines.pct<95){console.error('Coverage gate: unit tests must pass and business JavaScript line coverage must be >=95%.');process.exitCode=1;}
